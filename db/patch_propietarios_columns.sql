-- Parche incremental para error 42703 en /propietarios
-- Agrega columnas faltantes en usuarios y vehiculos sin borrar datos.

BEGIN;

ALTER TABLE IF EXISTS usuarios
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(30);

ALTER TABLE IF EXISTS usuarios
  ADD COLUMN IF NOT EXISTS documento VARCHAR(30);

ALTER TABLE IF EXISTS vehiculos
  ADD COLUMN IF NOT EXISTS propietario_id UUID;

ALTER TABLE IF EXISTS vehiculos
  ADD COLUMN IF NOT EXISTS marca VARCHAR(50);

ALTER TABLE IF EXISTS vehiculos
  ADD COLUMN IF NOT EXISTS modelo VARCHAR(50);

ALTER TABLE IF EXISTS vehiculos
  ADD COLUMN IF NOT EXISTS color VARCHAR(30);

-- Completar propietario_id desde unidades cuando sea posible
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unidades' AND column_name='propietario_id') THEN
    EXECUTE 'UPDATE vehiculos v SET propietario_id = u.propietario_id FROM unidades u WHERE v.id_unidad = u.id AND v.propietario_id IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unidades' AND column_name='id_propietario') THEN
    EXECUTE 'UPDATE vehiculos v SET propietario_id = u.id_propietario FROM unidades u WHERE v.id_unidad = u.id AND v.propietario_id IS NULL';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'vehiculos' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'propietario_id'
  ) THEN
    ALTER TABLE vehiculos
      ADD CONSTRAINT fk_vehiculos_propietario FOREIGN KEY (propietario_id) REFERENCES usuarios(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Migrar datos de prueba para telefono y documento (solo cuando estén vacíos)
UPDATE usuarios
SET
  telefono = CASE
    WHEN telefono IS NULL OR btrim(telefono) = '' THEN
      CASE
        WHEN email = 'admin@condo.com' THEN '3001000001'
        WHEN email = 'prop@condo.com' THEN '3001000002'
        WHEN email = 'residente@condo.com' THEN '3001000003'
        WHEN email = 'portero@condo.com' THEN '3001000004'
        ELSE '3009999999'
      END
    ELSE telefono
  END,
  documento = CASE
    WHEN documento IS NULL OR btrim(documento) = '' THEN
      CASE
        WHEN email = 'admin@condo.com' THEN 'CC100000001'
        WHEN email = 'prop@condo.com' THEN 'CC100000002'
        WHEN email = 'residente@condo.com' THEN 'CC100000003'
        WHEN email = 'portero@condo.com' THEN 'CC100000004'
        ELSE 'CC999999999'
      END
    ELSE documento
  END;

COMMIT;

