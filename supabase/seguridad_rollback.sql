-- MARCHA ATRAS de supabase/seguridad.sql: deja las politicas como estaban antes (con sus fallos).
-- Usar solo si el arreglo rompe algo y no hay tiempo de corregirlo.

begin;

-- bookings
drop policy if exists bookings_select on public.bookings;
drop policy if exists bookings_insert_huesped on public.bookings;
drop policy if exists bookings_insert_personal on public.bookings;
drop policy if exists bookings_update_personal on public.bookings;
drop policy if exists bookings_cancelar_huesped on public.bookings;
drop policy if exists bookings_delete_dueno on public.bookings;

create policy "Admin All Bookings" on public.bookings for all to public using (is_admin());
create policy "User Own Bookings" on public.bookings for all to public
  using ((auth.role() = 'authenticated'::text) and (user_id = auth.uid()));
create policy "Admin principal puede borrar reservas" on public.bookings for delete to public
  using ((auth.jwt() ->> 'email'::text) = 'alfesco86@gmail.com'::text);
create policy "Permitir crear reservas" on public.bookings for insert to public with check (true);
create policy "Publico reserva" on public.bookings for insert to public with check (true);
create policy "Admin ve reservas" on public.bookings for select to public using (true);
create policy "Huespedes y Staff pueden ver reservas" on public.bookings for select to authenticated
  using ((auth.uid() = user_id)
    or (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'::text))
    or (exists (select 1 from hotel_staff where hotel_staff.email = (auth.jwt() ->> 'email'::text))));

-- hotel_staff
drop policy if exists staff_select on public.hotel_staff;
drop policy if exists staff_gestion on public.hotel_staff;
create policy "Owner Manage Staff" on public.hotel_staff for all to public using (is_owner());
create policy "Permitir lectura y escritura autenticada" on public.hotel_staff for all to authenticated
  using (true) with check (true);
create policy "Staff Read Staff" on public.hotel_staff for select to public using (is_admin());

-- booking_extras
create policy "User Own Booking Extras" on public.booking_extras for all to public
  using (auth.role() = 'authenticated'::text);

-- products y profiles
create policy "Public Read Products" on public.products for select to public using (true);
create policy "Permitir lectura a usuarios autenticados" on public.products for select to authenticated using (true);
drop policy if exists profiles_propio on public.profiles;
create policy "Ver perfiles" on public.profiles for select to public using (true);

-- storage
create policy "Permiso Total 1ied7ze_0" on storage.objects for select to anon, authenticated
  using (bucket_id = 'room-images'::text);
create policy "Permiso Total 1ied7ze_1" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'room-images'::text);
create policy "Permiso Total 1ied7ze_2" on storage.objects for update to anon, authenticated
  using (bucket_id = 'room-images'::text);
create policy "Permiso Total 1ied7ze_3" on storage.objects for delete to anon, authenticated
  using (bucket_id = 'room-images'::text);

-- permisos de tabla del rol anon
grant select, insert, update, delete on public.bookings, public.booking_extras, public.clients,
  public.hotel_staff, public.profiles, public.products, public.rooms to anon;

-- check_availability vuelve a ser accesible para todos
grant execute on function public.check_availability(bigint, date, date) to public, anon;

commit;
