-- =====================================================================
--  AHORRAULIN · Actualización 4
--  Perfil de prueba «Demo» (p4): oculto en el menú, solo el administrador
--  entra en él con su propio código para ver la app como Sara y Marta.
--  Se puede ejecutar varias veces sin romper nada.
-- =====================================================================

insert into public.perfiles (id, nombre, emoji, color) values ('p4','Demo','🧪','menta')
on conflict (id) do nothing;

-- El menú de inicio ya no enseña el perfil de prueba
create or replace function public.perfiles_menu()
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'nombre',nombre,'emoji',emoji,'color',color,
                                               'tiene_pin', pin_hash is not null) order by id), '[]'::jsonb)
  from public.perfiles where id <> 'p4'
$$;
grant execute on function public.perfiles_menu() to anon;

-- La lista de «restablecer código» tampoco lo enseña
create or replace function public.admin_estado(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok('p1', p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  return jsonb_build_object('ok',true,'perfiles', coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'nombre',nombre,'emoji',emoji,'tiene_pin',pin_hash is not null,
      'bloqueado', bloqueado_hasta is not null and bloqueado_hasta > now()) order by id)
    from public.perfiles where id not in ('p1','p4')), '[]'::jsonb));
end $$;
grant execute on function public.admin_estado(text) to anon;

-- Solo el administrador: el perfil de prueba usa su mismo código
create or replace function public.admin_entrar_demo(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok('p1', p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  update public.perfiles set pin_hash = (select pin_hash from public.perfiles where id = 'p1'), fallos = 0, bloqueado_hasta = null where id = 'p4';
  return jsonb_build_object('ok',true);
end $$;
grant execute on function public.admin_entrar_demo(text) to anon;

-- Solo el administrador: vaciar el perfil de prueba para empezar de cero
create or replace function public.admin_vaciar_demo(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e text := public._pin_ok('p1', p_pin);
begin
  if e <> 'OK' then return jsonb_build_object('error',e); end if;
  delete from public.movs where persona = 'p4';
  delete from public.recurrentes where persona = 'p4';
  delete from public.metas where persona = 'p4';
  delete from public.presupuestos where persona = 'p4';
  delete from public.premios where persona = 'p4';
  delete from public.avisos where persona = 'p4';
  update public.perfiles set nombre = 'Demo', emoji = '🧪', color = 'menta', oscuro = false where id = 'p4';
  return jsonb_build_object('ok',true);
end $$;
grant execute on function public.admin_vaciar_demo(text) to anon;
