-- =====================================================================
--  AHORRAULIN · Actualización 3
--  Premios de la temporada (vales con código que Raúl marca como usados)
--  Cópialo entero en Supabase → SQL Editor → New query → Run
--  Se puede ejecutar varias veces sin romper nada.
-- =====================================================================

create table if not exists public.premios (
  id        bigserial primary key,
  persona   text not null references public.perfiles(id) on delete cascade,
  temporada int  not null,
  tipo      text not null,
  codigo    text not null unique,
  creado    timestamptz not null default now(),
  usado     timestamptz,
  unique (persona, temporada, tipo)
);
alter table public.premios drop constraint if exists premios_tipo_check;
alter table public.premios add constraint premios_tipo_check check (tipo in ('teatro','guia','show','recetario','oro'));
alter table public.premios enable row level security;
revoke all on public.premios from anon, authenticated;

-- Pide (o recupera) el vale de un premio ganado. Si ya existe, devuelve el mismo.
create or replace function public.reclamar_premio(p_id text, p_pin text, p_tipo text, p_temporada int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin); c text; letras text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int; intento int := 0;
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  if p_tipo not in ('teatro','guia','show','recetario','oro') then return jsonb_build_object('error','DATOS'); end if;
  if p_temporada not between extract(year from now())::int - 1 and extract(year from now())::int then return jsonb_build_object('error','DATOS'); end if;
  select codigo into c from public.premios where persona = p_id and temporada = p_temporada and tipo = p_tipo;
  if c is null then
    loop
      c := 'AHR-';
      for i in 1..5 loop c := c || substr(letras, 1 + floor(random() * length(letras))::int, 1); end loop;
      begin
        insert into public.premios (persona, temporada, tipo, codigo) values (p_id, p_temporada, p_tipo, c);
        exit;
      exception when unique_violation then
        select codigo into c from public.premios where persona = p_id and temporada = p_temporada and tipo = p_tipo;
        if c is not null then exit; end if;
        intento := intento + 1; if intento > 10 then raise; end if;
      end;
    end loop;
  end if;
  return jsonb_build_object('ok',true,'premios',(select coalesce(jsonb_agg(jsonb_build_object('tipo',tipo,'temporada',temporada,'codigo',codigo,
           'creado',extract(epoch from creado)*1000,'usado',extract(epoch from usado)*1000) order by creado), '[]'::jsonb) from public.premios where persona = p_id));
end $$;

create or replace function public.mis_premios(p_id text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  return jsonb_build_object('ok',true,'premios',(select coalesce(jsonb_agg(jsonb_build_object('tipo',tipo,'temporada',temporada,'codigo',codigo,
           'creado',extract(epoch from creado)*1000,'usado',extract(epoch from usado)*1000) order by creado), '[]'::jsonb) from public.premios where persona = p_id));
end $$;

-- Solo Raúl (p1): ver todos los vales y marcarlos como usados
create or replace function public.admin_premios(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok('p1', p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  return jsonb_build_object('ok',true,'premios',(select coalesce(jsonb_agg(jsonb_build_object('persona',p.persona,'nombre',f.nombre,'emoji',f.emoji,
           'tipo',p.tipo,'temporada',p.temporada,'codigo',p.codigo,'creado',extract(epoch from p.creado)*1000,'usado',extract(epoch from p.usado)*1000)
           order by p.usado nulls first, p.creado desc), '[]'::jsonb) from public.premios p join public.perfiles f on f.id = p.persona));
end $$;

create or replace function public.admin_usar_premio(p_pin text, p_codigo text, p_usado boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok('p1', p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  update public.premios set usado = case when p_usado then now() else null end where codigo = upper(trim(p_codigo));
  if not found then return jsonb_build_object('error','NO_EXISTE'); end if;
  return jsonb_build_object('ok',true);
end $$;

grant execute on function public.reclamar_premio(text,text,text,int) to anon;
grant execute on function public.mis_premios(text,text) to anon;
grant execute on function public.admin_premios(text) to anon;
grant execute on function public.admin_usar_premio(text,text,boolean) to anon;
