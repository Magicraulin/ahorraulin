-- =====================================================================
--  AHORRAULIN · Actualización 6
--  Sara y Marta pasan a ser cuentas como las de los clientes (con
--  renovación anual, acceso nuevo, echar de móviles, desactivar…).
--  Sus apuntes NO se tocan. En sus móviles siguen viendo su tarjeta
--  hasta que entran una vez: desde ahí el móvil queda recordado.
--  Ya no se pueden borrar apuntes desde el panel; eliminar una cuenta
--  exige escribir el código del administrador.
--  Se puede ejecutar varias veces sin romper nada.
-- =====================================================================

alter table public.perfiles add column if not exists legado boolean not null default false;

update public.perfiles
   set cliente = true, legado = true, activo = true,
       alta = coalesce(alta, now()), caduca = coalesce(caduca, now() + interval '1 year')
 where id in ('p2','p3');

-- Su código de acceso (para entrar en un móvil nuevo con «Ya tengo cuenta»)
do $$
declare r record; c text;
begin
  for r in select id, nombre from public.perfiles where id in ('p2','p3') loop
    if not exists (select 1 from public.codigos where usado_por = r.id and tipo = 'alta') then
      c := public._codigo_nuevo();
      insert into public.codigos (codigo, tipo, nombre, usado, usado_por) values (c, 'alta', r.nombre, now(), r.id);
    end if;
  end loop;
end $$;

-- El menú de la familia sigue enseñando a Sara y Marta (solo se ve en móviles de la familia)
create or replace function public.perfiles_menu()
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'nombre',nombre,'emoji',emoji,'color',color,
                                               'tiene_pin', pin_hash is not null) order by id), '[]'::jsonb)
  from public.perfiles where id <> 'p4' and (not cliente or legado)
$$;
grant execute on function public.perfiles_menu() to anon;

-- Al entrar con su código de 4 cifras, el móvil recibe su llave y queda recordado
create or replace function public.nueva_llave(p_id text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text;
begin
  if coalesce(p_pin,'') !~ '^\d{4}$' then return jsonb_build_object('error','PIN_MAL'); end if;
  e := public._pin_ok(p_id, p_pin);
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  if not exists (select 1 from public.perfiles where id = p_id and cliente) then return jsonb_build_object('error','DATOS'); end if;
  return jsonb_build_object('ok',true,'llave',public._nueva_llave(p_id),
    'codigo',(select codigo from public.codigos where usado_por = p_id and tipo = 'alta' limit 1));
end $$;
grant execute on function public.nueva_llave(text,text) to anon;

-- Acciones del panel. Ya no existe «vaciar» (borrar apuntes).
-- «eliminar» solo funciona si p_pin es el código de 4 cifras del administrador (no vale la sesión).
create or replace function public.admin_cliente(p_pin text, p_id text, p_accion text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text; c text; n text;
begin
  if p_accion = 'eliminar' and coalesce(p_pin,'') !~ '^\d{4}$' then return jsonb_build_object('error','PIN_MAL'); end if;
  e := public._pin_ok('p1', p_pin);
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
  elsif p_accion = 'eliminar' then
    delete from public.perfiles where id = p_id and cliente;
  else
    return jsonb_build_object('error','DATOS');
  end if;
  return jsonb_build_object('ok',true);
end $$;
grant execute on function public.admin_cliente(text,text,text) to anon;
