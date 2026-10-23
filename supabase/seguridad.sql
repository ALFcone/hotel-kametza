-- ARREGLO DE SEGURIDAD (RLS, funciones, storage y permisos).
-- Se ejecuta en Supabase > SQL Editor, en una sola transaccion: si algo falla, no se aplica nada.
-- Marcha atras: supabase/seguridad_rollback.sql
--
-- Que corrige (hallado con supabase/auditoria.sql):
--  1. bookings: cualquiera, sin sesion, podia leer todas las reservas y crear reservas falsas.
--  2. bookings: un huesped podia editar su propia reserva (precio, pagado, estado).
--  3. hotel_staff: cualquier usuario con sesion podia leer y escribir la tabla (hacerse admin).
--  4. booking_extras: cualquier usuario con sesion podia ver, editar y borrar todos los extras.
--  5. storage: el bucket room-images permitia subir, editar y borrar archivos sin sesion.
--  6. products y profiles: lectura publica sin necesidad.
--  7. Permisos de tabla del rol anon (incluido TRUNCATE) y funciones SECURITY DEFINER sin search_path.

begin;

-- ---------------------------------------------------------------------------
-- A) Funciones
-- ---------------------------------------------------------------------------

-- check_availability debe ver TODAS las reservas aunque quien pregunta sea un huesped.
-- Antes funcionaba solo porque bookings se podia leer sin restriccion.
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

alter function public.is_admin() set search_path = public;
alter function public.is_owner() set search_path = public;
alter function public.handle_new_user() set search_path = public;

-- Funciones de trigger: nadie debe poder llamarlas desde la API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- B) bookings
-- ---------------------------------------------------------------------------
drop policy if exists "Admin All Bookings" on public.bookings;
drop policy if exists "User Own Bookings" on public.bookings;
drop policy if exists "Admin principal puede borrar reservas" on public.bookings;
drop policy if exists "Permitir crear reservas" on public.bookings;
drop policy if exists "Publico reserva" on public.bookings;
drop policy if exists "Admin ve reservas" on public.bookings;
drop policy if exists "Huespedes y Staff pueden ver reservas" on public.bookings;

create policy bookings_select on public.bookings
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Huesped: solo su propia reserva, pendiente y sin pagos registrados.
create policy bookings_insert_huesped on public.bookings
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pendiente'
    and coalesce(amount_paid, 0) = 0
    and cancelled_at is null
  );

create policy bookings_insert_personal on public.bookings
  for insert to authenticated
  with check (public.is_admin());

create policy bookings_update_personal on public.bookings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Huesped: solo puede cancelar la suya (la regla de 24 h la aplica la accion del servidor).
create policy bookings_cancelar_huesped on public.bookings
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status = 'cancelled');

-- Borrar reservas: solo dueno o admin (antes: un correo escrito a mano en la politica).
create policy bookings_delete_dueno on public.bookings
  for delete to authenticated
  using (public.is_owner());

-- ---------------------------------------------------------------------------
-- C) hotel_staff
-- ---------------------------------------------------------------------------
drop policy if exists "Permitir lectura y escritura autenticada" on public.hotel_staff;
drop policy if exists "Owner Manage Staff" on public.hotel_staff;
drop policy if exists "Staff Read Staff" on public.hotel_staff;

create policy staff_select on public.hotel_staff
  for select to authenticated
  using (public.is_admin() or lower(email) = lower(auth.jwt() ->> 'email'));

create policy staff_gestion on public.hotel_staff
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- D) booking_extras (quedan: staff gestiona, huesped ve los suyos)
-- ---------------------------------------------------------------------------
drop policy if exists "User Own Booking Extras" on public.booking_extras;

-- ---------------------------------------------------------------------------
-- E) products y profiles
-- ---------------------------------------------------------------------------
drop policy if exists "Public Read Products" on public.products;
drop policy if exists "Permitir lectura a usuarios autenticados" on public.products;

drop policy if exists "Ver perfiles" on public.profiles;
create policy profiles_propio on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- F) Storage: el bucket room-images era escribible por cualquiera
-- ---------------------------------------------------------------------------
drop policy if exists "Permiso Total 1ied7ze_0" on storage.objects;
drop policy if exists "Permiso Total 1ied7ze_1" on storage.objects;
drop policy if exists "Permiso Total 1ied7ze_2" on storage.objects;
drop policy if exists "Permiso Total 1ied7ze_3" on storage.objects;

-- ---------------------------------------------------------------------------
-- G) Permisos de tabla
-- ---------------------------------------------------------------------------
revoke all on public.bookings, public.booking_extras, public.clients,
              public.hotel_staff, public.profiles, public.products from anon;
revoke all on public.rooms from anon;
grant select on public.rooms to anon;

revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

commit;
