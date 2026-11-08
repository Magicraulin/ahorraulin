-- =====================================================================
--  AHORRAULIN · Base de datos para Supabase
--  Cópialo entero en Supabase → SQL Editor → New query → Run
--  Se puede ejecutar varias veces sin romper nada.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- Tablas ----------
create table if not exists public.perfiles (
  id              text primary key,
  nombre          text not null,
  emoji           text not null default '🙂',
  color           text not null default 'violeta',
  oscuro          boolean not null default false,
  provincia       text not null default '28',
  combustible     text not null default '1',
  pin_hash        text,
  fallos          int not null default 0,
  bloqueado_hasta timestamptz
);

create table if not exists public.movs (
  id       uuid primary key default gen_random_uuid(),
  persona  text not null references public.perfiles(id) on delete cascade,
  tipo     text not null check (tipo in ('gasto','ingreso')),
  cat      text not null,
  importe  numeric(10,2) not null check (importe > 0 and importe < 1000000),
  fecha    date not null,
  nota     text not null default '' check (char_length(nota) <= 80),
  creado   timestamptz not null default now()
);
create index if not exists movs_persona_fecha on public.movs (persona, fecha);

insert into public.perfiles (id, nombre, emoji, color) values
  ('p1','Raúl','🎩','violeta'),
  ('p2','Sara','📚','rosa'),
  ('p3','Marta','✏️','azul')
on conflict (id) do nothing;

-- Nadie puede leer ni escribir las tablas directamente:
-- todo pasa por las funciones de abajo, que comprueban el código.
alter table public.perfiles enable row level security;
alter table public.movs     enable row level security;
revoke all on public.perfiles, public.movs from anon, authenticated;

-- ---------- Ayudantes internos ----------
create or replace function public._pin_ok(p_id text, p_pin text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare r public.perfiles;
begin
  select * into r from public.perfiles where id = p_id for update;
  if not found then return 'NO_EXISTE'; end if;
  if r.pin_hash is null then return 'SIN_PIN'; end if;
  if r.bloqueado_hasta is not null and r.bloqueado_hasta > now() then return 'BLOQUEADO'; end if;
  if crypt(coalesce(p_pin,''), r.pin_hash) = r.pin_hash then
    update public.perfiles set fallos = 0, bloqueado_hasta = null where id = p_id;
    return 'OK';
  end if;
  if r.fallos + 1 >= 5 then
    update public.perfiles set fallos = 0, bloqueado_hasta = now() + interval '5 minutes' where id = p_id;
    return 'BLOQUEADO';
  end if;
  update public.perfiles set fallos = r.fallos + 1 where id = p_id;
  return 'PIN_MAL';
end $$;
revoke all on function public._pin_ok(text,text) from public, anon, authenticated;

create or replace function public._perfil_json(p_id text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object('id',id,'nombre',nombre,'emoji',emoji,'color',color,'oscuro',oscuro,
                            'provincia',provincia,'combustible',combustible)
  from public.perfiles where id = p_id
$$;
revoke all on function public._perfil_json(text) from public, anon, authenticated;

-- ---------- Funciones que usa la app ----------
-- Menú: solo nombre, emoji, color y si tiene código (nunca el código).
create or replace function public.perfiles_menu()
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'nombre',nombre,'emoji',emoji,'color',color,
                                               'tiene_pin', pin_hash is not null) order by id), '[]'::jsonb)
  from public.perfiles
$$;

create or replace function public.crear_pin(p_id text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_pin !~ '^\d{4}$' then return jsonb_build_object('error','PIN_FORMATO'); end if;
  update public.perfiles set pin_hash = crypt(p_pin, gen_salt('bf')), fallos = 0, bloqueado_hasta = null
   where id = p_id and pin_hash is null;
  if not found then return jsonb_build_object('error','YA_TIENE_PIN'); end if;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.entrar(p_id text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  return jsonb_build_object('ok',true,'perfil',public._perfil_json(p_id),
    'movs', coalesce((select jsonb_agg(jsonb_build_object('id',id,'tipo',tipo,'cat',cat,'importe',importe,
                      'fecha',fecha,'nota',nota,'creado',extract(epoch from creado)*1000) order by fecha, creado)
                      from public.movs where persona = p_id), '[]'::jsonb));
end $$;

create or replace function public.cambiar_pin(p_id text, p_pin text, p_nuevo text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  if p_nuevo !~ '^\d{4}$' then return jsonb_build_object('error','PIN_FORMATO'); end if;
  update public.perfiles set pin_hash = crypt(p_nuevo, gen_salt('bf')) where id = p_id;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.guardar_mov(p_id text, p_pin text, p_tipo text, p_cat text,
                                              p_importe numeric, p_fecha date, p_nota text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin); nuevo uuid;
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  insert into public.movs (persona, tipo, cat, importe, fecha, nota)
  values (p_id, p_tipo, left(p_cat,40), round(p_importe,2), p_fecha, left(coalesce(p_nota,''),80))
  returning id into nuevo;
  return jsonb_build_object('ok',true,'id',nuevo,'creado',extract(epoch from now())*1000);
end $$;

create or replace function public.borrar_mov(p_id text, p_pin text, p_mov uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  delete from public.movs where id = p_mov and persona = p_id;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.guardar_ajustes(p_id text, p_pin text, p_nombre text, p_emoji text,
                                                  p_color text, p_oscuro boolean, p_provincia text, p_combustible text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  update public.perfiles set
    nombre = coalesce(nullif(left(trim(p_nombre),20),''), nombre),
    emoji = coalesce(nullif(left(p_emoji,16),''), emoji),
    color = coalesce(nullif(left(p_color,20),''), color),
    oscuro = coalesce(p_oscuro, oscuro),
    provincia = coalesce(nullif(left(p_provincia,2),''), provincia),
    combustible = coalesce(nullif(left(p_combustible,2),''), combustible)
  where id = p_id;
  return jsonb_build_object('ok',true,'perfil',public._perfil_json(p_id));
end $$;

grant execute on function public.perfiles_menu() to anon;
grant execute on function public.crear_pin(text,text) to anon;
grant execute on function public.entrar(text,text) to anon;
grant execute on function public.cambiar_pin(text,text,text) to anon;
grant execute on function public.guardar_mov(text,text,text,text,numeric,date,text) to anon;
grant execute on function public.borrar_mov(text,text,uuid) to anon;
grant execute on function public.guardar_ajustes(text,text,text,text,text,boolean,text,text) to anon;

-- =====================================================================
--  ¿Alguien ha olvidado su código? Ejecuta solo esta línea cambiando p2
--  (p1 = Raúl, p2 = Sara, p3 = Marta). Sus gastos NO se borran.
--
--  update public.perfiles set pin_hash = null, fallos = 0, bloqueado_hasta = null where id = 'p2';
-- =====================================================================

-- =====================================================================
--  COPIA DE SEGURIDAD AUTOMÁTICA · todas las noches a las 00:00 (hora de España)
--  Guarda una foto de todos los perfiles y movimientos. Se conservan 30 días.
-- =====================================================================
create extension if not exists pg_cron;

create table if not exists public.copias (
  id       bigserial primary key,
  hecha    timestamptz not null default now(),
  perfiles jsonb not null,
  movs     jsonb not null
);
alter table public.copias enable row level security;
revoke all on public.copias from anon, authenticated;

create or replace function public.hacer_copia()
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.copias (perfiles, movs)
  select (select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) from public.perfiles p),
         (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) from public.movs m);
  delete from public.copias where hecha < now() - interval '30 days';
end $$;
revoke all on function public.hacer_copia() from public, anon, authenticated;

-- El reloj del servidor va en hora UTC: se lanza a las 22:00 y a las 23:00 UTC
-- y solo copia cuando en España son las 00:00 (así vale en invierno y en verano).
create or replace function public.copia_si_medianoche()
returns void language plpgsql security definer set search_path = public as $$
begin
  if extract(hour from (now() at time zone 'Europe/Madrid')) = 0 then
    perform public.hacer_copia();
  end if;
end $$;
revoke all on function public.copia_si_medianoche() from public, anon, authenticated;

select cron.schedule('ahorraulin-copia-noche', '0 22,23 * * *', 'select public.copia_si_medianoche()');

-- La app solo puede preguntar CUÁNDO fue la última copia (nunca ver su contenido)
create or replace function public.ultima_copia()
returns timestamptz language sql security definer set search_path = public as $$
  select max(hecha) from public.copias
$$;
grant execute on function public.ultima_copia() to anon;

-- Primera copia ahora mismo
select public.hacer_copia();

-- =====================================================================
--  ¿Necesitas RECUPERAR la copia más reciente? (borra los movimientos
--  actuales y pone los de la copia). Quita los "--" de estas 4 líneas y ejecútalas:
--
--  delete from public.movs;
--  insert into public.movs
--    select * from jsonb_populate_recordset(null::public.movs,
--      (select movs from public.copias order by hecha desc limit 1));
--
--  Para ver las copias que hay:  select id, hecha from public.copias order by hecha desc;
-- =====================================================================

-- =====================================================================
--  COPIAS EN EXCEL DENTRO DE CADA PERFIL
--  Cada persona, con su código, ve solo SUS copias nocturnas y las
--  descarga como Excel desde Ajustes.
-- =====================================================================
create or replace function public.mis_copias(p_id text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  return jsonb_build_object('ok',true,'copias', coalesce((
    select jsonb_agg(jsonb_build_object('id',c.id,'hecha',extract(epoch from c.hecha)*1000,
             'n',(select count(*) from jsonb_array_elements(c.movs) m where m->>'persona' = p_id)) order by c.hecha desc)
    from public.copias c), '[]'::jsonb));
end $$;

create or replace function public.copia_excel(p_id text, p_pin text, p_copia bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin); c public.copias;
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  select * into c from public.copias where id = p_copia;
  if not found then return jsonb_build_object('error','NO_EXISTE'); end if;
  return jsonb_build_object('ok',true,'hecha',extract(epoch from c.hecha)*1000,
    'movs', coalesce((select jsonb_agg(jsonb_build_object('id',m->>'id','tipo',m->>'tipo','cat',m->>'cat','importe',(m->>'importe')::numeric,
                      'fecha',m->>'fecha','nota',m->>'nota','creado',extract(epoch from (m->>'creado')::timestamptz)*1000))
                      from jsonb_array_elements(c.movs) m where m->>'persona' = p_id), '[]'::jsonb));
end $$;

grant execute on function public.mis_copias(text,text) to anon;
grant execute on function public.copia_excel(text,text,bigint) to anon;

-- =====================================================================
--  PAGOS RECURRENTES (Netflix, gimnasio, alquiler, nómina…)
--  Se apuntan solos el mismo día de cada mes.
-- =====================================================================
create table if not exists public.recurrentes (
  id      uuid primary key default gen_random_uuid(),
  persona text not null references public.perfiles(id) on delete cascade,
  tipo    text not null check (tipo in ('gasto','ingreso')),
  cat     text not null,
  importe numeric(10,2) not null check (importe > 0 and importe < 1000000),
  dia     int  not null check (dia between 1 and 31),
  nota    text not null default '' check (char_length(nota) <= 80),
  activo  boolean not null default true,
  ultimo  date,
  creado  timestamptz not null default now()
);
alter table public.recurrentes enable row level security;
revoke all on public.recurrentes from anon, authenticated;
alter table public.movs add column if not exists recurrente uuid references public.recurrentes(id) on delete set null;

-- Apunta los recurrentes que tocan (de una persona o de todas si p_id es null).
-- Se puede llamar las veces que haga falta: nunca apunta dos veces el mismo mes.
create or replace function public.generar_recurrentes(p_id text)
returns int language plpgsql security definer set search_path = public as $$
declare
  hoy date := (now() at time zone 'Europe/Madrid')::date;
  r record; mes date; ult int; fecha date; n int := 0;
begin
  for r in select * from public.recurrentes where activo and (p_id is null or persona = p_id) for update loop
    -- empieza en el mes de creación (o el siguiente al último apuntado) y rellena hasta hoy
    mes := coalesce(date_trunc('month', r.ultimo) + interval '1 month', date_trunc('month', (r.creado at time zone 'Europe/Madrid')))::date;
    while mes <= hoy loop
      ult := extract(day from (mes + interval '1 month - 1 day'))::int;
      fecha := mes + (least(r.dia, ult) - 1);
      exit when fecha > hoy;
      insert into public.movs (persona, tipo, cat, importe, fecha, nota, recurrente)
      values (r.persona, r.tipo, r.cat, r.importe, fecha, r.nota, r.id);
      update public.recurrentes set ultimo = fecha where id = r.id;
      n := n + 1;
      mes := (mes + interval '1 month')::date;
    end loop;
  end loop;
  return n;
end $$;
revoke all on function public.generar_recurrentes(text) from public, anon, authenticated;

-- Revisión automática cada hora (no repite nada: solo apunta lo que falte)
select cron.schedule('ahorraulin-recurrentes', '7 * * * *', 'select public.generar_recurrentes(null)');

-- entrar ahora también apunta lo pendiente y devuelve los recurrentes
create or replace function public.entrar(p_id text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  perform public.generar_recurrentes(p_id);
  return jsonb_build_object('ok',true,'perfil',public._perfil_json(p_id),
    'movs', coalesce((select jsonb_agg(jsonb_build_object('id',id,'tipo',tipo,'cat',cat,'importe',importe,
                      'fecha',fecha,'nota',nota,'creado',extract(epoch from creado)*1000,'rec',recurrente) order by fecha, creado)
                      from public.movs where persona = p_id), '[]'::jsonb),
    'recurrentes', coalesce((select jsonb_agg(jsonb_build_object('id',id,'tipo',tipo,'cat',cat,'importe',importe,'dia',dia,'nota',nota) order by dia)
                      from public.recurrentes where persona = p_id and activo), '[]'::jsonb));
end $$;

create or replace function public.guardar_recurrente(p_id text, p_pin text, p_tipo text, p_cat text,
                                                     p_importe numeric, p_dia int, p_nota text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  insert into public.recurrentes (persona, tipo, cat, importe, dia, nota)
  values (p_id, p_tipo, left(p_cat,40), round(p_importe,2), greatest(1, least(31, p_dia)), left(coalesce(p_nota,''),80));
  perform public.generar_recurrentes(p_id);
  return jsonb_build_object('ok',true);
end $$;

-- Dejar de repetir: lo ya apuntado se queda, solo deja de apuntarse en el futuro
create or replace function public.parar_recurrente(p_id text, p_pin text, p_rec uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok(p_id, p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  update public.recurrentes set activo = false where id = p_rec and persona = p_id;
  return jsonb_build_object('ok',true);
end $$;

grant execute on function public.guardar_recurrente(text,text,text,text,numeric,int,text) to anon;
grant execute on function public.parar_recurrente(text,text,uuid) to anon;

-- =====================================================================
--  ADMINISTRADOR (Raúl, perfil p1)
--  Con su código puede restablecer el código de Sara o Marta si lo olvidan.
--  Sus gastos no se tocan: la próxima vez que entren crean uno nuevo.
-- =====================================================================
create or replace function public.admin_estado(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok('p1', p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  return jsonb_build_object('ok',true,'perfiles', coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'nombre',nombre,'emoji',emoji,'tiene_pin',pin_hash is not null,
      'bloqueado', bloqueado_hasta is not null and bloqueado_hasta > now()) order by id)
    from public.perfiles where id <> 'p1'), '[]'::jsonb));
end $$;

create or replace function public.admin_resetear_pin(p_pin text, p_objetivo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok('p1', p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  if p_objetivo = 'p1' then return jsonb_build_object('error','NO_PERMITIDO'); end if;
  update public.perfiles set pin_hash = null, fallos = 0, bloqueado_hasta = null where id = p_objetivo;
  if not found then return jsonb_build_object('error','NO_EXISTE'); end if;
  return jsonb_build_object('ok',true);
end $$;

grant execute on function public.admin_estado(text) to anon;
grant execute on function public.admin_resetear_pin(text,text) to anon;
