-- RESERVAS PENDIENTES: vencimiento y tope por huesped.
-- Ejecutar en Supabase > SQL Editor (una sola transaccion).
--
-- Problema: una reserva "pendiente" bloquea la habitacion para siempre y un huesped
-- podia crear todas las que quisiera sin pagar, dejando el hotel "lleno".
--
-- Reglas nuevas:
--  1. Reserva pendiente con Yape sin constancia: deja de bloquear la habitacion a las 24 h.
--     (La reserva sigue existiendo; recepcion la ve y puede cancelarla o confirmarla.)
--  2. Reserva pendiente "Pagar en recepcion": NO vence (se paga al llegar), pero cuenta para el tope.
--  3. Tope: un huesped no puede tener mas de 3 reservas pendientes vigentes.
--     "Vigente" = pendiente, con salida de hoy en adelante, y sin vencer (regla 1).
--
-- Reservas de recepcion (pagado / parcial) y canceladas no cambian.

begin;

-- Cuenta las pendientes vigentes del usuario que llama (usa auth.uid(); no acepta otro usuario).
create or replace function public.reservas_pendientes()
returns integer
language sql
stable
security definer
set search_path = public
as $function$
  select count(*)::integer
  from public.bookings
  where user_id = auth.uid()
    and status = 'pendiente'
    and check_out >= current_date
    and (coalesce(payment_method, '') <> 'yape' or created_at >= now() - interval '24 hours');
$function$;

revoke execute on function public.reservas_pendientes() from public, anon;
grant execute on function public.reservas_pendientes() to authenticated, service_role;

-- check_availability: igual que antes, pero una pendiente de Yape vencida ya no bloquea.
create or replace function public.check_availability(room_id_input bigint, check_in_input date, check_out_input date)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
declare
  is_available boolean;
begin
  select not exists (
    select 1 from public.bookings
    where room_id = room_id_input
      and status not in ('cancelada', 'cancelled')
      and not (
        status = 'pendiente'
        and coalesce(payment_method, '') = 'yape'
        and created_at < now() - interval '24 hours'
      )
      and (
        (check_in <= check_in_input and check_out > check_in_input)
        or (check_in < check_out_input and check_out >= check_out_input)
        or (check_in >= check_in_input and check_out <= check_out_input)
      )
  ) into is_available;
  return is_available;
end;
$function$;

revoke execute on function public.check_availability(bigint, date, date) from public, anon;
grant execute on function public.check_availability(bigint, date, date) to authenticated, service_role;

-- El tope tambien se aplica en la base, por si alguien llama a la API sin pasar por la web.
-- (El numero 3 debe coincidir con MAX_RESERVAS_PENDIENTES en app/actions.ts.)
drop policy if exists bookings_insert_huesped on public.bookings;
create policy bookings_insert_huesped on public.bookings
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pendiente'
    and coalesce(amount_paid, 0) = 0
    and cancelled_at is null
    and public.reservas_pendientes() < 3
  );

commit;

-- MARCHA ATRAS (ejecutar solo si hace falta):
--   begin;
--   drop policy if exists bookings_insert_huesped on public.bookings;
--   create policy bookings_insert_huesped on public.bookings for insert to authenticated
--     with check (user_id = auth.uid() and status = 'pendiente' and coalesce(amount_paid, 0) = 0 and cancelled_at is null);
--   drop function if exists public.reservas_pendientes();
--   -- check_availability: volver a la version de supabase/seguridad.sql (sin la condicion de vencimiento)
--   commit;
