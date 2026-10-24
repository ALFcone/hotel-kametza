-- COMPROBANTE_RESERVAS: una boleta o factura puede cubrir varias reservas
-- (por ejemplo, un solo pago por las habitaciones 301 y 302).
-- Reemplaza a comprobantes.booking_id, que deja de usarse (se conserva para la marcha atras).
-- Ejecutar en Supabase > SQL Editor despues de comprobantes.sql (una sola transaccion).

begin;

create table if not exists public.comprobante_reservas (
  comprobante_id bigint not null references public.comprobantes(id) on delete cascade,
  booking_id bigint not null references public.bookings(id) on delete cascade,
  primary key (comprobante_id, booking_id)
);

create index if not exists comprobante_reservas_booking_id_idx on public.comprobante_reservas (booking_id);

-- Pasar los enlaces que ya existen
insert into public.comprobante_reservas (comprobante_id, booking_id)
select id, booking_id from public.comprobantes where booking_id is not null
on conflict do nothing;

comment on column public.comprobantes.booking_id is 'Obsoleto: los enlaces estan en comprobante_reservas.';

alter table public.comprobante_reservas enable row level security;

-- Personal: ver, enlazar y cambiar los enlaces (no borra el comprobante, solo a que reservas corresponde).
drop policy if exists comprobante_reservas_select_personal on public.comprobante_reservas;
create policy comprobante_reservas_select_personal on public.comprobante_reservas
  for select to authenticated
  using (public.is_admin());

drop policy if exists comprobante_reservas_insert_personal on public.comprobante_reservas;
create policy comprobante_reservas_insert_personal on public.comprobante_reservas
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists comprobante_reservas_delete_personal on public.comprobante_reservas;
create policy comprobante_reservas_delete_personal on public.comprobante_reservas
  for delete to authenticated
  using (public.is_admin());

revoke all on public.comprobante_reservas from anon;
revoke update, truncate, references, trigger on public.comprobante_reservas from authenticated;

commit;

-- MARCHA ATRAS (los comprobantes quedan; se pierden los enlaces a mas de una reserva):
--   drop table if exists public.comprobante_reservas;
