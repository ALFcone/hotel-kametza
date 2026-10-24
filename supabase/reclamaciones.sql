-- LIBRO DE RECLAMACIONES VIRTUAL (Indecopi, D.S. 011-2011-PCM y modificatorias).
-- El publico registra su hoja con la funcion registrar_reclamacion() (no puede leer la tabla);
-- el personal la ve y anota la respuesta. Las hojas no se borran: son registro legal.
-- Ejecutar en Supabase > SQL Editor (una sola transaccion).

begin;

create table if not exists public.reclamaciones (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  tipo text not null check (tipo in ('reclamo', 'queja')),
  -- Consumidor
  consumidor_nombre text not null check (length(consumidor_nombre) between 3 and 150),
  consumidor_tipo_doc text not null check (consumidor_tipo_doc in ('DNI', 'CE', 'PASAPORTE', 'RUC')),
  consumidor_num_doc text not null check (length(consumidor_num_doc) between 5 and 20),
  consumidor_domicilio text not null check (length(consumidor_domicilio) between 5 and 250),
  consumidor_telefono text check (length(consumidor_telefono) <= 20),
  consumidor_email text check (length(consumidor_email) <= 150),
  menor_de_edad boolean not null default false,
  apoderado_nombre text check (length(apoderado_nombre) <= 150), -- padre o madre, si es menor de edad
  -- Bien contratado
  bien_tipo text not null check (bien_tipo in ('producto', 'servicio')),
  bien_descripcion text not null check (length(bien_descripcion) between 3 and 500),
  monto numeric(12, 2) check (monto >= 0),
  codigo_reserva text check (length(codigo_reserva) <= 20),
  -- Detalle
  detalle text not null check (length(detalle) between 10 and 3000),
  pedido text not null check (length(pedido) between 3 and 2000),
  -- Respuesta del proveedor
  respuesta text check (length(respuesta) <= 5000),
  fecha_respuesta date,
  respondido_por uuid,
  constraint reclamaciones_apoderado check (not menor_de_edad or apoderado_nombre is not null)
);

create index if not exists reclamaciones_created_at_idx on public.reclamaciones (created_at desc);

alter table public.reclamaciones enable row level security;

-- Personal: ver y responder. Nadie inserta directo (solo la funcion) ni borra.
drop policy if exists reclamaciones_select_personal on public.reclamaciones;
create policy reclamaciones_select_personal on public.reclamaciones
  for select to authenticated
  using (public.is_admin());

drop policy if exists reclamaciones_update_personal on public.reclamaciones;
create policy reclamaciones_update_personal on public.reclamaciones
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.reclamaciones from anon;
revoke insert, delete, truncate, references, trigger on public.reclamaciones from authenticated;

-- Registro publico de una hoja. Devuelve el numero y la fecha para la constancia.
create or replace function public.registrar_reclamacion(datos jsonb)
returns table (id bigint, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  doc text := upper(trim(datos->>'consumidor_num_doc'));
  nuevo_id bigint;
  nueva_fecha timestamptz;
begin
  -- Freno contra envios repetidos: maximo 5 hojas por documento en una hora
  if (select count(*) from public.reclamaciones r
      where r.consumidor_num_doc = doc and r.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Demasiadas hojas seguidas con el mismo documento. Intenta mas tarde.';
  end if;

  insert into public.reclamaciones (
    tipo, consumidor_nombre, consumidor_tipo_doc, consumidor_num_doc, consumidor_domicilio,
    consumidor_telefono, consumidor_email, menor_de_edad, apoderado_nombre,
    bien_tipo, bien_descripcion, monto, codigo_reserva, detalle, pedido
  ) values (
    datos->>'tipo',
    trim(datos->>'consumidor_nombre'),
    datos->>'consumidor_tipo_doc',
    doc,
    trim(datos->>'consumidor_domicilio'),
    nullif(trim(datos->>'consumidor_telefono'), ''),
    nullif(lower(trim(datos->>'consumidor_email')), ''),
    coalesce((datos->>'menor_de_edad')::boolean, false),
    nullif(trim(datos->>'apoderado_nombre'), ''),
    datos->>'bien_tipo',
    trim(datos->>'bien_descripcion'),
    nullif(datos->>'monto', '')::numeric,
    nullif(upper(trim(datos->>'codigo_reserva')), ''),
    trim(datos->>'detalle'),
    trim(datos->>'pedido')
  )
  returning reclamaciones.id, reclamaciones.created_at into nuevo_id, nueva_fecha;

  return query select nuevo_id, nueva_fecha;
end;
$$;

revoke execute on function public.registrar_reclamacion(jsonb) from public;
grant execute on function public.registrar_reclamacion(jsonb) to anon, authenticated;

commit;

-- MARCHA ATRAS (borra todas las hojas registradas; solo si aun no hay reclamos reales):
--   drop function if exists public.registrar_reclamacion(jsonb);
--   drop table if exists public.reclamaciones;
