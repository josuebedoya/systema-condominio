-- Políticas y ajustes recomendados para desarrollo
-- Ejecuta este archivo DESPUÉS de aplicar `sync_schema.sql` o `reset_schema.sql`.
-- Este archivo deshabilita RLS en tablas principales para evitar problemas de permisos
-- durante el desarrollo. En producción debes reemplazar estas políticas
-- por reglas concretas y seguras.

-- Deshabilitar RLS en tablas principales (desarrollo)
ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS unidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cuotas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS zonas_comunes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reservas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ordenes_trabajo DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pqrs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pqrs_respuestas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS visitantes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS registros_acceso DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mascotas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tarifas DISABLE ROW LEVEL SECURITY;

-- Conceder permisos explícitos a roles de Supabase (evita 42501)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Asegurar que tablas/secuencias nuevas hereden permisos en desarrollo
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- Opcional: recargar caché de PostgREST para que tome cambios de esquema/policies
-- NOTIFY pgrst, 'reload schema';

-- Opcional: políticas de ejemplo (más restrictivas) si prefieres habilitar RLS
-- Ejemplo: permitir SELECT público pero solo permitir INSERT para usuarios autenticados
-- (Descomenta y adapta si decides habilitar RLS)

-- -- Ejemplo: permitir SELECT en unidades a cualquier usuario
-- CREATE POLICY "units_select_public" ON unidades FOR SELECT USING (true);

-- -- Ejemplo: permitir INSERT en pqrs solo si auth.uid() = usuario_id
-- ALTER TABLE pqrs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "pqrs_insert_auth" ON pqrs FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Nota: para usar auth.uid() las funciones de autenticación deben estar disponibles
-- y la conexión debe provenir de una sesión autenticada (Supabase client).

-- Fin

