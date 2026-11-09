-- =====================================================================
--  AHORRAULIN · Actualización 8
--  Se acaba la lista de perfiles en la pantalla de inicio: todo el mundo
--  entra con su código de acceso. El administrador entra por
--  «Acceso trabajadores» con su propio código.
--  Se puede ejecutar varias veces sin romper nada.
-- =====================================================================

-- La pantalla de inicio ya no enseña a nadie
create or replace function public.perfiles_menu()
returns jsonb language sql security definer set search_path = public as $$ select '[]'::jsonb $$;
grant execute on function public.perfiles_menu() to anon;

-- Nadie puede «crear código» de un perfil sin código desde fuera
revoke execute on function public.crear_pin(text,text) from public, anon;

-- Código de acceso del administrador (p1)
do $$
begin
  if not exists (select 1 from public.codigos where usado_por = 'p1' and tipo = 'alta') then
    insert into public.codigos (codigo, tipo, nombre, usado, usado_por) values (public._codigo_nuevo(), 'alta', 'Raúl (administrador)', now(), 'p1');
  end if;
end $$;

-- Perfil de prueba: el administrador entra con una llave propia del perfil de prueba
create or replace function public.admin_entrar_demo(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok('p1', p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  update public.perfiles set pin_hash = (select pin_hash from public.perfiles where id = 'p1'), fallos = 0, bloqueado_hasta = null where id = 'p4';
  delete from public.dispositivos where persona = 'p4';
  return jsonb_build_object('ok',true,'llave',public._nueva_llave('p4'));
end $$;
grant execute on function public.admin_entrar_demo(text) to anon;

-- Sara y Marta ya no salen en ninguna lista de la familia
update public.perfiles set legado = false where id in ('p2','p3');
