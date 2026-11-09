-- =====================================================================
--  AHORRAULIN · Actualización 5
--  Cuentas para clientes: código de acceso de un solo uso, móviles
--  recordados (sin meter el código cada vez), caducidad de 1 año y
--  panel «Usuarios» del administrador.
--  Los perfiles de Raúl, Sara, Marta y Demo no cambian.
--  Se puede ejecutar varias veces sin romper nada.
-- =====================================================================

alter table public.perfiles add column if not exists cliente boolean not null default false;
alter table public.perfiles add column if not exists tipo    text;
alter table public.perfiles add column if not exists activo  boolean not null default true;
alter table public.perfiles add column if not exists alta    timestamptz;
alter table public.perfiles add column if not exists caduca  timestamptz;

-- Códigos que vende el administrador (alta) o que da para recuperar una cuenta (recuperar)
create table if not exists public.codigos (
  codigo    text primary key,
  tipo      text not null default 'alta' check (tipo in ('alta','recuperar')),
  nombre    text not null default '',
  para      text references public.perfiles(id) on delete cascade,
  dias      int  not null default 365,
  creado    timestamptz not null default now(),
  usado     timestamptz,
  usado_por text references public.perfiles(id) on delete cascade
);
alter table public.codigos enable row level security;
revoke all on public.codigos from anon, authenticated;

-- Móviles recordados: se guarda solo la huella de la llave, nunca la llave
create table if not exists public.dispositivos (
  token_hash text primary key,
  persona    text not null references public.perfiles(id) on delete cascade,
  creado     timestamptz not null default now(),
  ultimo     timestamptz not null default now()
);
create index if not exists dispositivos_persona on public.dispositivos(persona);
alter table public.dispositivos enable row level security;
revoke all on public.dispositivos from anon, authenticated;

-- Comprobación de acceso: vale el código de 4 cifras o la llave del móvil.
-- Las cuentas de clientes desactivadas o caducadas no pueden entrar.
create or replace function public._pin_ok(p_id text, p_pin text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare r public.perfiles;
begin
  select * into r from public.perfiles where id = p_id for update;
  if not found then return 'NO_EXISTE'; end if;
  if r.cliente and not r.activo then return 'DESACTIVADA'; end if;
  if r.cliente and r.caduca is not null and r.caduca < now() then return 'CADUCADA'; end if;
  if coalesce(p_pin,'') like 'T%' and length(p_pin) > 30 then
    update public.dispositivos set ultimo = now()
     where persona = p_id and token_hash = encode(digest(p_pin, 'sha256'), 'hex');
    if found then return 'OK'; end if;
    return 'SESION';
  end if;
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
                            'provincia',provincia,'combustible',combustible,
                            'cliente',cliente,'tipo',tipo,'caduca',extract(epoch from caduca)*1000)
  from public.perfiles where id = p_id
$$;
revoke all on function public._perfil_json(text) from public, anon, authenticated;

-- Llave nueva para un móvil
create or replace function public._nueva_llave(p_id text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare t text := 'T' || encode(gen_random_bytes(24), 'hex');
begin
  insert into public.dispositivos (token_hash, persona) values (encode(digest(t, 'sha256'), 'hex'), p_id);
  return t;
end $$;
revoke all on function public._nueva_llave(text) from public, anon, authenticated;

create or replace function public._codigo_nuevo()
returns text language plpgsql security definer set search_path = public as $$
declare letras text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := 'AHR-';
    for i in 1..8 loop
      c := c || substr(letras, 1 + floor(random() * length(letras))::int, 1);
      if i = 4 then c := c || '-'; end if;
    end loop;
    exit when not exists (select 1 from public.codigos where codigo = c);
  end loop;
  return c;
end $$;
revoke all on function public._codigo_nuevo() from public, anon, authenticated;

create or replace function public._limpiar_codigo(p text)
returns text language sql immutable as $$
  select case when length(x) = 11 then 'AHR-' || substr(x,4,4) || '-' || substr(x,8,4) else x end
  from (select regexp_replace(upper(coalesce(p,'')), '[^A-Z0-9]', '', 'g') as x) s
$$;

-- El menú de inicio y la lista de «restablecer código» no enseñan a los clientes
create or replace function public.perfiles_menu()
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'nombre',nombre,'emoji',emoji,'color',color,
                                               'tiene_pin', pin_hash is not null) order by id), '[]'::jsonb)
  from public.perfiles where id <> 'p4' and not cliente
$$;
grant execute on function public.perfiles_menu() to anon;

create or replace function public.admin_estado(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok('p1', p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  return jsonb_build_object('ok',true,'perfiles', coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'nombre',nombre,'emoji',emoji,'tiene_pin',pin_hash is not null,
      'bloqueado', bloqueado_hasta is not null and bloqueado_hasta > now()) order by id)
    from public.perfiles where id not in ('p1','p4') and not cliente), '[]'::jsonb));
end $$;
grant execute on function public.admin_estado(text) to anon;

-- ---------- Lo que usa el cliente ----------
-- ¿Qué es este código? (para saber qué pantalla enseñar)
create or replace function public.ver_codigo(p_codigo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.codigos;
begin
  select * into c from public.codigos where codigo = public._limpiar_codigo(p_codigo);
  if not found then return jsonb_build_object('error','CODIGO_MAL'); end if;
  if c.usado is not null then return jsonb_build_object('error','CODIGO_USADO'); end if;
  return jsonb_build_object('ok',true,'tipo',c.tipo,'nombre',c.nombre);
end $$;
grant execute on function public.ver_codigo(text) to anon;

-- Activar un código: alta de cuenta nueva o recuperar una cuenta (código nuevo de 4 cifras)
create or replace function public.activar_codigo(p_codigo text, p_nombre text, p_emoji text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c public.codigos; nid text;
begin
  if coalesce(p_pin,'') !~ '^\d{4}$' then return jsonb_build_object('error','PIN_FORMATO'); end if;
  select * into c from public.codigos where codigo = public._limpiar_codigo(p_codigo) for update;
  if not found then return jsonb_build_object('error','CODIGO_MAL'); end if;
  if c.usado is not null then return jsonb_build_object('error','CODIGO_USADO'); end if;
  if c.tipo = 'alta' then
    if coalesce(trim(p_nombre),'') = '' then return jsonb_build_object('error','DATOS'); end if;
    nid := 'c' || substr(md5(random()::text || clock_timestamp()::text), 1, 10);
    insert into public.perfiles (id, nombre, emoji, color, pin_hash, cliente, tipo, activo, alta, caduca)
    values (nid, left(trim(p_nombre),20), coalesce(nullif(left(p_emoji,16),''),'🙂'), 'violeta',
            crypt(p_pin, gen_salt('bf')), true, 'general', true, now(), now() + make_interval(days => c.dias));
  else
    nid := c.para;
    update public.perfiles set pin_hash = crypt(p_pin, gen_salt('bf')), fallos = 0, bloqueado_hasta = null where id = nid;
    if not found then return jsonb_build_object('error','NO_EXISTE'); end if;
    delete from public.dispositivos where persona = nid;
    if exists (select 1 from public.perfiles where id = nid and (not activo or caduca < now())) then
      update public.codigos set usado = now(), usado_por = nid where codigo = c.codigo;
      return jsonb_build_object('error', (select case when not activo then 'DESACTIVADA' else 'CADUCADA' end from public.perfiles where id = nid));
    end if;
  end if;
  update public.codigos set usado = now(), usado_por = nid where codigo = c.codigo;
  return jsonb_build_object('ok',true,'id',nid,'llave',public._nueva_llave(nid));
end $$;
grant execute on function public.activar_codigo(text,text,text,text) to anon;

-- Ya tengo cuenta (móvil nuevo): código de acceso + código de 4 cifras
create or replace function public.entrar_cuenta(p_codigo text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pid text; e text;
begin
  if coalesce(p_pin,'') !~ '^\d{4}$' then return jsonb_build_object('error','PIN_MAL'); end if;
  select usado_por into pid from public.codigos where codigo = public._limpiar_codigo(p_codigo) and usado_por is not null;
  if pid is null then return jsonb_build_object('error','CODIGO_MAL'); end if;
  e := public._pin_ok(pid, p_pin);
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  return jsonb_build_object('ok',true,'id',pid,'llave',public._nueva_llave(pid));
end $$;
grant execute on function public.entrar_cuenta(text,text) to anon;

-- Olvidar este móvil
create or replace function public.salir_movil(p_id text, p_llave text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from public.dispositivos where persona = p_id and token_hash = encode(digest(coalesce(p_llave,''), 'sha256'), 'hex');
  return jsonb_build_object('ok',true);
end $$;
grant execute on function public.salir_movil(text,text) to anon;

-- ---------- Panel «Usuarios» del administrador ----------
create or replace function public.admin_usuarios(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok('p1', p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  return jsonb_build_object('ok',true,
    'usuarios', coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nombre',p.nombre,'emoji',p.emoji,'activo',p.activo,
        'alta',extract(epoch from p.alta)*1000,'caduca',extract(epoch from p.caduca)*1000,
        'moviles',(select count(*) from public.dispositivos d where d.persona = p.id),
        'ultimo',(select extract(epoch from max(d.ultimo))*1000 from public.dispositivos d where d.persona = p.id),
        'codigo',(select c.codigo from public.codigos c where c.usado_por = p.id and c.tipo = 'alta' limit 1)) order by p.alta desc)
      from public.perfiles p where p.cliente), '[]'::jsonb),
    'codigos', coalesce((select jsonb_agg(jsonb_build_object('codigo',c.codigo,'tipo',c.tipo,'nombre',c.nombre,
        'creado',extract(epoch from c.creado)*1000) order by c.creado desc)
      from public.codigos c where c.usado is null), '[]'::jsonb));
end $$;
grant execute on function public.admin_usuarios(text) to anon;

create or replace function public.admin_crear_codigo(p_pin text, p_nombre text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok('p1', p_pin); c text;
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  if coalesce(trim(p_nombre),'') = '' then return jsonb_build_object('error','DATOS'); end if;
  c := public._codigo_nuevo();
  insert into public.codigos (codigo, tipo, nombre) values (c, 'alta', left(trim(p_nombre),20));
  return jsonb_build_object('ok',true,'codigo',c);
end $$;
grant execute on function public.admin_crear_codigo(text,text) to anon;

create or replace function public.admin_anular_codigo(p_pin text, p_codigo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok('p1', p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  delete from public.codigos where codigo = p_codigo and usado is null;
  return jsonb_build_object('ok',true);
end $$;
grant execute on function public.admin_anular_codigo(text,text) to anon;

-- Acciones sobre un cliente: renovar, activar, desactivar, echar, nuevo_acceso, vaciar, eliminar
create or replace function public.admin_cliente(p_pin text, p_id text, p_accion text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok('p1', p_pin); c text; n text;
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  select nombre into n from public.perfiles where id = p_id and cliente;
  if not found then return jsonb_build_object('error','NO_EXISTE'); end if;
  if p_accion = 'renovar' then
    update public.perfiles set caduca = greatest(coalesce(caduca, now()), now()) + interval '1 year', activo = true where id = p_id;
  elsif p_accion = 'activar' then
    update public.perfiles set activo = true where id = p_id;
  elsif p_accion = 'desactivar' then
    update public.perfiles set activo = false where id = p_id;
  elsif p_accion = 'echar' then
    delete from public.dispositivos where persona = p_id;
  elsif p_accion = 'nuevo_acceso' then
    delete from public.dispositivos where persona = p_id;
    delete from public.codigos where para = p_id and usado is null;
    c := public._codigo_nuevo();
    insert into public.codigos (codigo, tipo, nombre, para) values (c, 'recuperar', n, p_id);
    return jsonb_build_object('ok',true,'codigo',c,'nombre',n);
  elsif p_accion = 'vaciar' then
    delete from public.movs where persona = p_id;
    delete from public.recurrentes where persona = p_id;
    delete from public.metas where persona = p_id;
    delete from public.presupuestos where persona = p_id;
  elsif p_accion = 'eliminar' then
    delete from public.perfiles where id = p_id and cliente;
  else
    return jsonb_build_object('error','DATOS');
  end if;
  return jsonb_build_object('ok',true);
end $$;
grant execute on function public.admin_cliente(text,text,text) to anon;
