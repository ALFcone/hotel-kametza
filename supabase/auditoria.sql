-- AUDITORIA DE SEGURIDAD (solo lectura). Ejecutar en Supabase > SQL Editor.
-- No modifica nada: solo muestra como estan hoy las tablas, politicas y funciones.

-- 1) Tablas del esquema public y si tienen RLS activado
select c.relname as tabla,
       c.relrowsecurity as rls_activo,
       c.relforcerowsecurity as rls_forzado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- 2) Politicas existentes
select tablename as tabla, policyname as politica, cmd as operacion,
       roles, permissive, qual as usando, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 3) Permisos directos de los roles anon y authenticated sobre las tablas
select table_name as tabla, grantee, string_agg(privilege_type, ', ' order by privilege_type) as permisos
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;

-- 4) Funciones del esquema public (para ver check_availability y si es SECURITY DEFINER)
select p.proname as funcion,
       p.prosecdef as security_definer,
       pg_get_function_identity_arguments(p.oid) as argumentos,
       pg_get_functiondef(p.oid) as definicion
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- 5) Buckets de storage y sus politicas
select id, name, public from storage.buckets;
select policyname as politica, cmd as operacion, roles, qual as usando, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- 6) Triggers (por si alguno escribe datos al registrar usuarios o reservas)
select event_object_table as tabla, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;
