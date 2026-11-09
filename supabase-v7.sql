-- =====================================================================
--  AHORRAULIN · Actualización 7
--  Panel de cuentas: TODAS las acciones exigen escribir el código de
--  4 cifras del administrador. Renovar: 1 mes, 6 meses, 1 año o ilimitado.
--  Se puede ejecutar varias veces sin romper nada.
-- =====================================================================
create or replace function public.admin_cliente(p_pin text, p_id text, p_accion text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text; c text; n text; cad timestamptz; plazo interval;
begin
  if coalesce(p_pin,'') !~ '^\d{4}$' then return jsonb_build_object('error','PIN_MAL'); end if;
  e := public._pin_ok('p1', p_pin);
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  select nombre, caduca into n, cad from public.perfiles where id = p_id and cliente;
  if not found then return jsonb_build_object('error','NO_EXISTE'); end if;
  plazo := case p_accion when 'renovar_1m' then interval '1 month' when 'renovar_6m' then interval '6 months'
                         when 'renovar_1a' then interval '1 year'  when 'renovar' then interval '1 year' end;
  if plazo is not null then
    -- Se suma a lo que le quede; si ya había caducado, cuenta desde hoy
    update public.perfiles set caduca = greatest(coalesce(caduca, now()), now()) + plazo, activo = true where id = p_id;
  elsif p_accion = 'ilimitado' then
    update public.perfiles set caduca = null, activo = true where id = p_id;
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
  return jsonb_build_object('ok',true,'caduca',(select extract(epoch from caduca)*1000 from public.perfiles where id = p_id));
end $$;
grant execute on function public.admin_cliente(text,text,text) to anon;
