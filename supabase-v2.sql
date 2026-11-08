-- =====================================================================
--  AHORRAULIN · Actualización 2
--  Editar movimientos · Presupuestos · Metas de ahorro · Recordatorio diario
--  Cópialo entero en Supabase → SQL Editor → New query → Run
--  Se puede ejecutar varias veces sin romper nada.
-- =====================================================================

create extension if not exists pg_net;

-- ---------- 1. EDITAR MOVIMIENTOS ----------
create or replace function public.editar_mov(p_id text, p_pin text, p_mov uuid, p_cat text,
                                             p_importe numeric, p_fecha date, p_nota text, p_meta uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  update public.movs set cat = left(p_cat,40), importe = round(p_importe,2), fecha = p_fecha,
         nota = left(coalesce(p_nota,''),80), meta = p_meta
   where id = p_mov and persona = p_id;
  if not found then return jsonb_build_object('error','NO_EXISTE'); end if;
  return jsonb_build_object('ok',true);
end $$;

-- ---------- 2. PRESUPUESTOS POR CATEGORÍA ----------
create table if not exists public.presupuestos (
  persona text not null references public.perfiles(id) on delete cascade,
  cat     text not null,
  limite  numeric(10,2) not null check (limite > 0),
  primary key (persona, cat)
);
alter table public.presupuestos enable row level security;
revoke all on public.presupuestos from anon, authenticated;

create or replace function public.guardar_presupuesto(p_id text, p_pin text, p_cat text, p_limite numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  if coalesce(p_limite,0) <= 0 then
    delete from public.presupuestos where persona = p_id and cat = p_cat;
  else
    insert into public.presupuestos (persona, cat, limite) values (p_id, left(p_cat,40), round(p_limite,2))
    on conflict (persona, cat) do update set limite = excluded.limite;
  end if;
  return jsonb_build_object('ok',true);
end $$;

-- ---------- 3. METAS DE AHORRO ----------
create table if not exists public.metas (
  id       uuid primary key default gen_random_uuid(),
  persona  text not null references public.perfiles(id) on delete cascade,
  nombre   text not null check (char_length(nombre) between 1 and 40),
  emoji    text not null default '🎯',
  objetivo numeric(10,2) not null check (objetivo > 0),
  fecha    date,
  activa   boolean not null default true,
  creado   timestamptz not null default now()
);
alter table public.metas enable row level security;
revoke all on public.metas from anon, authenticated;
alter table public.movs add column if not exists meta uuid references public.metas(id) on delete set null;

create or replace function public.guardar_meta(p_id text, p_pin text, p_meta uuid, p_nombre text, p_emoji text,
                                               p_objetivo numeric, p_fecha date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin); nueva uuid;
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  if p_meta is null then
    insert into public.metas (persona, nombre, emoji, objetivo, fecha)
    values (p_id, left(trim(p_nombre),40), left(coalesce(nullif(p_emoji,''),'🎯'),16), round(p_objetivo,2), p_fecha)
    returning id into nueva;
    return jsonb_build_object('ok',true,'id',nueva);
  end if;
  update public.metas set nombre = left(trim(p_nombre),40), emoji = left(coalesce(nullif(p_emoji,''),'🎯'),16),
         objetivo = round(p_objetivo,2), fecha = p_fecha
   where id = p_meta and persona = p_id;
  return jsonb_build_object('ok',true,'id',p_meta);
end $$;

-- Borrar meta: lo ahorrado se queda como ahorro normal
create or replace function public.borrar_meta(p_id text, p_pin text, p_meta uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  update public.movs set meta = null where meta = p_meta and persona = p_id;
  delete from public.metas where id = p_meta and persona = p_id;
  return jsonb_build_object('ok',true);
end $$;

-- guardar_mov ahora acepta una meta (opcional)
drop function if exists public.guardar_mov(text,text,text,text,numeric,date,text);
create or replace function public.guardar_mov(p_id text, p_pin text, p_tipo text, p_cat text,
                                              p_importe numeric, p_fecha date, p_nota text, p_meta uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin); nuevo uuid;
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  insert into public.movs (persona, tipo, cat, importe, fecha, nota, meta)
  values (p_id, p_tipo, left(p_cat,40), round(p_importe,2), p_fecha, left(coalesce(p_nota,''),80),
          (select id from public.metas where id = p_meta and persona = p_id))
  returning id into nuevo;
  return jsonb_build_object('ok',true,'id',nuevo,'creado',extract(epoch from now())*1000);
end $$;

-- ---------- 4. RECORDATORIO DIARIO (notificaciones) ----------
create table if not exists public.avisos (
  endpoint text primary key,
  persona  text not null references public.perfiles(id) on delete cascade,
  p256dh   text not null,
  auth     text not null,
  hora     text not null default '21:00' check (hora ~ '^\d{2}:\d{2}$'),
  ultimo   date,
  creado   timestamptz not null default now()
);
alter table public.avisos enable row level security;
revoke all on public.avisos from anon, authenticated;

create or replace function public.guardar_aviso(p_id text, p_pin text, p_endpoint text, p_p256dh text, p_auth text, p_hora text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  if p_endpoint !~ '^https://' or p_hora !~ '^\d{2}:\d{2}$' then return jsonb_build_object('error','DATOS'); end if;
  insert into public.avisos (endpoint, persona, p256dh, auth, hora)
  values (left(p_endpoint,1000), p_id, left(p_p256dh,200), left(p_auth,100), p_hora)
  on conflict (endpoint) do update set persona = excluded.persona, p256dh = excluded.p256dh, auth = excluded.auth, hora = excluded.hora;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.quitar_aviso(p_id text, p_pin text, p_endpoint text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  delete from public.avisos where endpoint = p_endpoint and persona = p_id;
  return jsonb_build_object('ok',true);
end $$;

-- Solo la usa el servicio de notificaciones (con su clave interna, nunca la app):
-- devuelve los avisos que tocan ahora y los marca como enviados hoy.
-- Si esa persona ya ha apuntado algo hoy, no la molesta.
create or replace function public.avisos_pendientes()
returns jsonb language plpgsql security definer set search_path = public as $$
declare ahora timestamp := now() at time zone 'Europe/Madrid'; r jsonb;
begin
  with toca as (
    update public.avisos a set ultimo = ahora::date
     where to_char(ahora, 'HH24:MI') >= a.hora
       and (a.ultimo is null or a.ultimo < ahora::date)
    returning a.endpoint, a.p256dh, a.auth, a.persona
  )
  select coalesce(jsonb_agg(jsonb_build_object('endpoint',t.endpoint,'p256dh',t.p256dh,'auth',t.auth)), '[]'::jsonb) into r
    from toca t
   where not exists (select 1 from public.movs m where m.persona = t.persona
                       and (m.creado at time zone 'Europe/Madrid')::date = ahora::date and m.recurrente is null);
  return r;
end $$;
revoke all on function public.avisos_pendientes() from public, anon, authenticated;
grant execute on function public.avisos_pendientes() to service_role;

create or replace function public.quitar_aviso_caducado(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from public.avisos where endpoint = p_endpoint
$$;
revoke all on function public.quitar_aviso_caducado(text) from public, anon, authenticated;
grant execute on function public.quitar_aviso_caducado(text) to service_role;

-- ---------- entrar devuelve también presupuestos, metas y si tienes aviso ----------
create or replace function public.entrar(p_id text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  perform public.generar_recurrentes(p_id);
  return jsonb_build_object('ok',true,'perfil',public._perfil_json(p_id),
    'movs', coalesce((select jsonb_agg(jsonb_build_object('id',id,'tipo',tipo,'cat',cat,'importe',importe,
                      'fecha',fecha,'nota',nota,'creado',extract(epoch from creado)*1000,'rec',recurrente,'meta',meta) order by fecha, creado)
                      from public.movs where persona = p_id), '[]'::jsonb),
    'recurrentes', coalesce((select jsonb_agg(jsonb_build_object('id',id,'tipo',tipo,'cat',cat,'importe',importe,'dia',dia,'nota',nota) order by dia)
                      from public.recurrentes where persona = p_id and activo), '[]'::jsonb),
    'presupuestos', coalesce((select jsonb_object_agg(cat, limite) from public.presupuestos where persona = p_id), '{}'::jsonb),
    'metas', coalesce((select jsonb_agg(jsonb_build_object('id',id,'nombre',nombre,'emoji',emoji,'objetivo',objetivo,'fecha',fecha,
                      'creado',extract(epoch from creado)*1000) order by creado) from public.metas where persona = p_id and activa), '[]'::jsonb),
    'avisos', coalesce((select jsonb_agg(jsonb_build_object('endpoint',endpoint,'hora',hora)) from public.avisos where persona = p_id), '[]'::jsonb));
end $$;

grant execute on function public.editar_mov(text,text,uuid,text,numeric,date,text,uuid) to anon;
grant execute on function public.guardar_presupuesto(text,text,text,numeric) to anon;
grant execute on function public.guardar_meta(text,text,uuid,text,text,numeric,date) to anon;
grant execute on function public.borrar_meta(text,text,uuid) to anon;
grant execute on function public.guardar_mov(text,text,text,text,numeric,date,text,uuid) to anon;
grant execute on function public.guardar_aviso(text,text,text,text,text,text) to anon;
grant execute on function public.quitar_aviso(text,text,text) to anon;

-- Cada 5 minutos se revisa si a alguien le toca su recordatorio
select cron.schedule('ahorraulin-avisos', '*/5 * * * *',
  $$ select net.http_post(url := 'https://fbjwnfvmrfaqyvvproyv.supabase.co/functions/v1/avisos',
                          headers := '{"Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb) $$);
