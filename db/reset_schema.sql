-- WARNING: Este script ES DESTRUCTIVO. Borra el esquema público y lo recrea.
-- Úsalo SOLO si entiendes que perderás todos los datos actuales.

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla usuarios
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefono VARCHAR(30),
  documento VARCHAR(30),
  rol VARCHAR(20) CHECK (rol IN ('administrador','propietario','residente','portero')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla unidades
CREATE TABLE unidades (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(20) UNIQUE NOT NULL,
  torre VARCHAR(20),
  piso INT,
  tipo VARCHAR(20) CHECK (tipo IN ('residencial','comercial','apartamento','local','oficina','parqueadero','bodega')),
  area_m2 NUMERIC(10,2),
  coeficiente DECIMAL(10,4) DEFAULT 0.0100,
  estado VARCHAR(20) DEFAULT 'desocupada' CHECK (estado IN ('ocupada','desocupada','mora','activo','inactivo','venta','arriendo')),
  propietario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla vehiculos
CREATE TABLE vehiculos (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(20) UNIQUE NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('carro','moto','bicicleta')),
  marca VARCHAR(50),
  modelo VARCHAR(50),
  color VARCHAR(30),
  parqueadero VARCHAR(20),
  id_unidad INT REFERENCES unidades(id) ON DELETE CASCADE,
  propietario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla mascotas
CREATE TABLE mascotas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  especie VARCHAR(50),
  raza VARCHAR(50),
  id_unidad INT REFERENCES unidades(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla tarifas
CREATE TABLE tarifas (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) CHECK (tipo IN ('residencial','comercial')),
  monto_base DECIMAL(10,2) NOT NULL,
  fecha_vigencia DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla cuotas
CREATE TABLE cuotas (
  id SERIAL PRIMARY KEY,
  id_unidad INT REFERENCES unidades(id) ON DELETE CASCADE,
  mes DATE NOT NULL,
  monto_base DECIMAL(10,2),
  interes_mora DECIMAL(10,2) DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagada','mora')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla pagos
CREATE TABLE pagos (
  id SERIAL PRIMARY KEY,
  id_cuota INT REFERENCES cuotas(id) ON DELETE CASCADE,
  id_propietario UUID REFERENCES usuarios(id),
  fecha DATE DEFAULT NOW(),
  monto DECIMAL(10,2),
  metodo_pago VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla zonas_comunes
CREATE TABLE zonas_comunes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  capacidad INT,
  horario_inicio TIME,
  horario_fin TIME,
  costo DECIMAL(10,2) DEFAULT 0,
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla reservas
CREATE TABLE reservas (
  id SERIAL PRIMARY KEY,
  id_zona INT REFERENCES zonas_comunes(id) ON DELETE CASCADE,
  id_usuario UUID REFERENCES usuarios(id),
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada','rechazada','cancelada')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla ordenes_trabajo
CREATE TABLE ordenes_trabajo (
  id SERIAL PRIMARY KEY,
  descripcion TEXT NOT NULL,
  area VARCHAR(100),
  prioridad VARCHAR(20) DEFAULT 'media' CHECK (prioridad IN ('baja','media','alta','urgente')),
  estado VARCHAR(20) DEFAULT 'creada' CHECK (estado IN ('creada','asignada','en_proceso','terminada')),
  id_reportado_por UUID REFERENCES usuarios(id),
  id_tecnico UUID REFERENCES usuarios(id),
  fecha_creacion DATE DEFAULT NOW(),
  fecha_cierre DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla pqrs
CREATE TABLE pqrs (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  tipo VARCHAR(20) CHECK (tipo IN ('peticion','queja','reclamo','sugerencia')),
  categoria VARCHAR(50),
  asunto VARCHAR(255),
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'radicada' CHECK (estado IN ('radicada','revision','gestion','resuelta','cerrada','abierta','en_proceso')),
  foto_url VARCHAR(255),
  fecha_radicado TIMESTAMP DEFAULT NOW(),
  fecha_cierre TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla pqrs_respuestas
CREATE TABLE pqrs_respuestas (
  id SERIAL PRIMARY KEY,
  pqr_id INT REFERENCES pqrs(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  texto TEXT,
  es_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla visitantes
CREATE TABLE visitantes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  documento VARCHAR(50) NOT NULL,
  id_unidad_destino INT REFERENCES unidades(id),
  autorizado BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla registros_acceso
CREATE TABLE registros_acceso (
  id SERIAL PRIMARY KEY,
  id_visitante INT REFERENCES visitantes(id),
  id_portero UUID REFERENCES usuarios(id),
  hora_ingreso TIMESTAMP DEFAULT NOW(),
  hora_salida TIMESTAMP,
  novedad TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seeds: tarifas
INSERT INTO tarifas (tipo, monto_base, fecha_vigencia) VALUES
('residencial', 280000, '2025-01-01'),
('comercial', 420000, '2025-01-01');

-- Seeds: zonas_comunes
INSERT INTO zonas_comunes (nombre, capacidad, horario_inicio, horario_fin, costo) VALUES
('Salón Comunal', 50, '08:00', '22:00', 50000),
('Piscina', 30, '07:00', '20:00', 0),
('Gimnasio', 20, '05:00', '23:00', 0),
('Cancha Múltiple', 22, '06:00', '22:00', 0);

-- Seeds: usuarios
INSERT INTO usuarios (id, nombre, email, telefono, documento, rol) VALUES
('00000000-0000-0000-0000-000000000001', 'Carlos Ramírez', 'admin@condo.com', '3001000001', 'CC100000001', 'administrador'),
('00000000-0000-0000-0000-000000000002', 'María González', 'prop@condo.com', '3001000002', 'CC100000002', 'propietario'),
('00000000-0000-0000-0000-000000000003', 'Juan Peña', 'residente@condo.com', '3001000003', 'CC100000003', 'residente'),
('00000000-0000-0000-0000-000000000004', 'Pedro Vargas', 'portero@condo.com', '3001000004', 'CC100000004', 'portero');

-- Seeds: unidades
INSERT INTO unidades (numero, torre, piso, tipo, area_m2, coeficiente, estado, propietario_id) VALUES
('101', 'A', 1, 'apartamento', 75.5, 0.0120, 'activo', '00000000-0000-0000-0000-000000000002'),
('102', 'A', 1, 'apartamento', 68.0, 0.0110, 'inactivo', null),
('201', 'A', 2, 'apartamento', 80.0, 0.0130, 'mora', '00000000-0000-0000-0000-000000000002'),
('L01', 'B', 1, 'local', 120.0, 0.0200, 'activo', '00000000-0000-0000-0000-000000000002');

-- Deshabilitar RLS para desarrollo (opcional)
-- ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE unidades DISABLE ROW LEVEL SECURITY;

-- Fin

