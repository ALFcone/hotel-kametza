-- COMPROBANTES SUNAT: boletas, facturas y notas emitidas en el portal SEE-SOL.
-- Recepcion sube el XML que descarga de SUNAT y el sistema guarda aqui los datos oficiales
-- para imprimir el ticket de 80 mm con la serie, el numero y el QR reales.
-- Ejecutar en Supabase > SQL Editor (una sola transaccion).

begin;

create table if not exists public.comprobantes (
  id bigint generated always as identity primary key,
  booking_id bigint references public.bookings(id) on delete set null,
  tipo text not null check (tipo in ('01', '03', '07', '08')), -- 01 factura, 03 boleta, 07 nota de credito, 08 nota de debito
  serie text not null,
  numero integer not null,
  fecha_emision date not null,
  emisor_ruc text not null,
  cliente_tipo_doc text,
  cliente_num_doc text,
  cliente_nombre text,
  moneda text not null default 'PEN',
  total_gravado numeric(12, 2),
  igv numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  hash text,
  items jsonb not null default '[]'::jsonb,
  xml text not null,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (tipo, serie, numero)
);

create index if not exists comprobantes_booking_id_idx on public.comprobantes (booking_id);

alter table public.comprobantes enable row level security;

-- Personal: ver y registrar. Borrar (por un XML equivocado): solo dueno o admin.
drop policy if exists comprobantes_select_personal on public.comprobantes;
create policy comprobantes_select_personal on public.comprobantes
  for select to authenticated
  using (public.is_admin());

drop policy if exists comprobantes_insert_personal on public.comprobantes;
create policy comprobantes_insert_personal on public.comprobantes
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists comprobantes_delete_dueno on public.comprobantes;
create policy comprobantes_delete_dueno on public.comprobantes
  for delete to authenticated
  using (public.is_owner());

revoke all on public.comprobantes from anon;
revoke truncate, references, trigger on public.comprobantes from authenticated;

commit;

-- MARCHA ATRAS (borra la tabla y todos los comprobantes registrados):
--   drop table if exists public.comprobantes;
