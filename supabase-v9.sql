-- =====================================================================
--  AHORRAULIN · Actualización 9 (seguridad)
--  Las cuentas de usuarios ya NO pueden entrar solo con sus 4 cifras:
--  hace falta un móvil autorizado (su llave) o su código de acceso.
--  Así, si el administrador le echa de sus móviles o le da un acceso
--  nuevo, ese móvil queda fuera aunque tenga «pedir código al abrir».
--  Se puede ejecutar varias veces sin romper nada.
-- =====================================================================

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
  -- Usuarios: las 4 cifras solas no abren la cuenta (solo junto al código de acceso o a un móvil autorizado)
  if r.cliente and coalesce(current_setting('ahorraulin.pin_directo', true), '') <> '1' then return 'SESION'; end if;
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

-- Móvil nuevo: código de acceso + 4 cifras
create or replace function public.entrar_cuenta(p_codigo text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pid text; e text;
begin
  if coalesce(p_pin,'') !~ '^\d{4}$' then return jsonb_build_object('error','PIN_MAL'); end if;
  select usado_por into pid from public.codigos where codigo = public._limpiar_codigo(p_codigo) and usado_por is not null;
  if pid is null then return jsonb_build_object('error','CODIGO_MAL'); end if;
  perform set_config('ahorraulin.pin_directo', '1', true);
  e := public._pin_ok(pid, p_pin);
  perform set_config('ahorraulin.pin_directo', '', true);
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  return jsonb_build_object('ok',true,'id',pid,'llave',public._nueva_llave(pid));
end $$;
grant execute on function public.entrar_cuenta(text,text) to anon;

-- «Pedir código al abrir»: hace falta que el móvil siga autorizado Y las 4 cifras
create or replace function public.desbloquear(p_id text, p_llave text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text;
begin
  if coalesce(p_llave,'') not like 'T%' then return jsonb_build_object('error','SESION'); end if;
  e := public._pin_ok(p_id, p_llave);
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  if coalesce(p_pin,'') !~ '^\d{4}$' then return jsonb_build_object('error','PIN_MAL'); end if;
  perform set_config('ahorraulin.pin_directo', '1', true);
  e := public._pin_ok(p_id, p_pin);
  perform set_config('ahorraulin.pin_directo', '', true);
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  return jsonb_build_object('ok',true);
end $$;
grant execute on function public.desbloquear(text,text,text) to anon;

-- Ya no se usa (era para pasar de la lista de la familia a móvil recordado)
revoke execute on function public.nueva_llave(text,text) from public, anon;
