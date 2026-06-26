import { NextResponse } from 'next/server'

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Sistema Condominio API',
    version: '1.0.0',
    description:
      'API para la gestión integral de condominios: propietarios, unidades, pagos, reservas, PQRS, mantenimiento y control de acceso.',
    contact: { email: 'admin@condo.com' },
  },
  servers: [{ url: '/api', description: 'Servidor local' }],
  tags: [
    { name: 'Usuarios', description: 'Propietarios, residentes y personal' },
    { name: 'Unidades', description: 'Apartamentos, locales y parqueaderos' },
    { name: 'Vehículos', description: 'Vehículos registrados' },
    { name: 'Mascotas', description: 'Mascotas registradas' },
    { name: 'Tarifas', description: 'Tarifas de administración' },
    { name: 'Cuotas', description: 'Cuotas mensuales de administración' },
    { name: 'Pagos', description: 'Registro de pagos de cuotas' },
    { name: 'Zonas Comunes', description: 'Áreas comunes del condominio' },
    { name: 'Reservas', description: 'Reservas de zonas comunes' },
    { name: 'Mantenimiento', description: 'Órdenes de trabajo y mantenimiento' },
    { name: 'PQRS', description: 'Peticiones, quejas, reclamos y sugerencias' },
    { name: 'Acceso', description: 'Visitantes y registros de acceso' },
  ],
  components: {
    securitySchemes: {
      SupabaseAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT emitido por Supabase Auth',
      },
    },
    schemas: {
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '00000000-0000-0000-0000-000000000001' },
          nombre: { type: 'string', example: 'Carlos Ramírez' },
          email: { type: 'string', format: 'email', example: 'admin@condo.com' },
          telefono: { type: 'string', nullable: true, example: '3001000001' },
          documento: { type: 'string', nullable: true, example: 'CC100000001' },
          rol: { type: 'string', enum: ['administrador', 'propietario', 'residente', 'portero'] },
          activo: { type: 'boolean', default: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      UsuarioInput: {
        type: 'object',
        required: ['nombre', 'email', 'rol'],
        properties: {
          nombre: { type: 'string', example: 'Juan García' },
          email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
          telefono: { type: 'string', example: '3001234567' },
          documento: { type: 'string', example: 'CC987654321' },
          rol: { type: 'string', enum: ['administrador', 'propietario', 'residente', 'portero'] },
        },
      },
      Unidad: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          numero: { type: 'string', example: '101' },
          torre: { type: 'string', nullable: true, example: 'A' },
          piso: { type: 'integer', nullable: true, example: 1 },
          tipo: {
            type: 'string',
            enum: ['residencial', 'comercial', 'apartamento', 'local', 'oficina', 'parqueadero', 'bodega'],
          },
          area_m2: { type: 'number', format: 'float', nullable: true, example: 75.5 },
          coeficiente: { type: 'number', format: 'float', example: 0.012 },
          estado: {
            type: 'string',
            enum: ['ocupada', 'desocupada', 'mora', 'activo', 'inactivo', 'venta', 'arriendo'],
          },
          propietario_id: { type: 'string', format: 'uuid', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      UnidadInput: {
        type: 'object',
        required: ['numero', 'tipo'],
        properties: {
          numero: { type: 'string', example: '202' },
          torre: { type: 'string', example: 'B' },
          piso: { type: 'integer', example: 2 },
          tipo: {
            type: 'string',
            enum: ['residencial', 'comercial', 'apartamento', 'local', 'oficina', 'parqueadero', 'bodega'],
          },
          area_m2: { type: 'number', format: 'float', example: 68.0 },
          coeficiente: { type: 'number', format: 'float', example: 0.011 },
          estado: {
            type: 'string',
            enum: ['ocupada', 'desocupada', 'mora', 'activo', 'inactivo', 'venta', 'arriendo'],
          },
          propietario_id: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      Vehiculo: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          placa: { type: 'string', example: 'ABC123' },
          tipo: { type: 'string', enum: ['carro', 'moto', 'bicicleta'] },
          marca: { type: 'string', nullable: true, example: 'Chevrolet' },
          modelo: { type: 'string', nullable: true, example: 'Spark' },
          color: { type: 'string', nullable: true, example: 'Rojo' },
          parqueadero: { type: 'string', nullable: true, example: 'P-01' },
          id_unidad: { type: 'integer', nullable: true },
          propietario_id: { type: 'string', format: 'uuid', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      VehiculoInput: {
        type: 'object',
        required: ['placa', 'tipo'],
        properties: {
          placa: { type: 'string', example: 'XYZ789' },
          tipo: { type: 'string', enum: ['carro', 'moto', 'bicicleta'] },
          marca: { type: 'string', example: 'Renault' },
          modelo: { type: 'string', example: 'Logan' },
          color: { type: 'string', example: 'Azul' },
          parqueadero: { type: 'string', example: 'P-02' },
          id_unidad: { type: 'integer' },
          propietario_id: { type: 'string', format: 'uuid' },
        },
      },
      Mascota: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Firulais' },
          especie: { type: 'string', nullable: true, example: 'Perro' },
          raza: { type: 'string', nullable: true, example: 'Labrador' },
          id_unidad: { type: 'integer', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      MascotaInput: {
        type: 'object',
        required: ['nombre'],
        properties: {
          nombre: { type: 'string', example: 'Max' },
          especie: { type: 'string', example: 'Gato' },
          raza: { type: 'string', example: 'Siamés' },
          id_unidad: { type: 'integer', example: 1 },
        },
      },
      Tarifa: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          tipo: { type: 'string', enum: ['residencial', 'comercial'] },
          monto_base: { type: 'number', format: 'float', example: 280000 },
          fecha_vigencia: { type: 'string', format: 'date', example: '2025-01-01' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Cuota: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          id_unidad: { type: 'integer', example: 1 },
          mes: { type: 'string', format: 'date', example: '2025-06-01' },
          monto_base: { type: 'number', format: 'float', example: 280000 },
          interes_mora: { type: 'number', format: 'float', example: 0 },
          estado: { type: 'string', enum: ['pendiente', 'pagada', 'mora'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CuotaInput: {
        type: 'object',
        required: ['id_unidad', 'mes', 'monto_base'],
        properties: {
          id_unidad: { type: 'integer', example: 1 },
          mes: { type: 'string', format: 'date', example: '2025-07-01' },
          monto_base: { type: 'number', format: 'float', example: 280000 },
          estado: { type: 'string', enum: ['pendiente', 'pagada', 'mora'], default: 'pendiente' },
        },
      },
      Pago: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          id_cuota: { type: 'integer', example: 1 },
          id_propietario: { type: 'string', format: 'uuid', nullable: true },
          fecha: { type: 'string', format: 'date', example: '2025-06-15' },
          monto: { type: 'number', format: 'float', example: 280000 },
          metodo_pago: {
            type: 'string',
            enum: ['efectivo', 'transferencia', 'nequi', 'daviplata', 'pse'],
            example: 'nequi',
          },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      PagoInput: {
        type: 'object',
        required: ['id_cuota', 'monto', 'metodo_pago'],
        properties: {
          id_cuota: { type: 'integer', example: 1 },
          id_propietario: { type: 'string', format: 'uuid' },
          fecha: { type: 'string', format: 'date', example: '2025-06-25' },
          monto: { type: 'number', format: 'float', example: 280000 },
          metodo_pago: {
            type: 'string',
            enum: ['efectivo', 'transferencia', 'nequi', 'daviplata', 'pse'],
          },
        },
      },
      ZonaComun: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Salón Comunal' },
          capacidad: { type: 'integer', nullable: true, example: 50 },
          horario_inicio: { type: 'string', format: 'time', nullable: true, example: '08:00' },
          horario_fin: { type: 'string', format: 'time', nullable: true, example: '22:00' },
          costo: { type: 'number', format: 'float', example: 50000 },
          disponible: { type: 'boolean', default: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Reserva: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          id_zona: { type: 'integer', example: 1 },
          id_usuario: { type: 'string', format: 'uuid' },
          fecha: { type: 'string', format: 'date', example: '2025-07-10' },
          hora_inicio: { type: 'string', format: 'time', example: '10:00' },
          hora_fin: { type: 'string', format: 'time', example: '14:00' },
          estado: { type: 'string', enum: ['pendiente', 'aprobada', 'rechazada', 'cancelada'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ReservaInput: {
        type: 'object',
        required: ['id_zona', 'fecha', 'hora_inicio', 'hora_fin'],
        properties: {
          id_zona: { type: 'integer', example: 1 },
          id_usuario: { type: 'string', format: 'uuid' },
          fecha: { type: 'string', format: 'date', example: '2025-07-10' },
          hora_inicio: { type: 'string', format: 'time', example: '10:00' },
          hora_fin: { type: 'string', format: 'time', example: '14:00' },
          estado: { type: 'string', enum: ['pendiente', 'aprobada', 'rechazada', 'cancelada'], default: 'pendiente' },
        },
      },
      OrdenTrabajo: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          descripcion: { type: 'string', example: 'Fuga de agua en piso 2' },
          area: { type: 'string', nullable: true, example: 'Zona húmeda' },
          prioridad: { type: 'string', enum: ['baja', 'media', 'alta', 'urgente'] },
          estado: { type: 'string', enum: ['creada', 'asignada', 'en_proceso', 'terminada'] },
          id_reportado_por: { type: 'string', format: 'uuid', nullable: true },
          id_tecnico: { type: 'string', format: 'uuid', nullable: true },
          fecha_creacion: { type: 'string', format: 'date' },
          fecha_cierre: { type: 'string', format: 'date', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      OrdenTrabajoInput: {
        type: 'object',
        required: ['descripcion'],
        properties: {
          descripcion: { type: 'string', example: 'Daño en ascensor' },
          area: { type: 'string', example: 'Lobby' },
          prioridad: { type: 'string', enum: ['baja', 'media', 'alta', 'urgente'], default: 'media' },
          id_reportado_por: { type: 'string', format: 'uuid' },
          id_tecnico: { type: 'string', format: 'uuid' },
        },
      },
      Pqrs: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          usuario_id: { type: 'string', format: 'uuid', nullable: true },
          tipo: { type: 'string', enum: ['peticion', 'queja', 'reclamo', 'sugerencia'] },
          categoria: { type: 'string', nullable: true, example: 'Ruido' },
          asunto: { type: 'string', nullable: true, example: 'Ruido excesivo en apartamento 302' },
          descripcion: { type: 'string', nullable: true },
          estado: {
            type: 'string',
            enum: ['radicada', 'revision', 'gestion', 'resuelta', 'cerrada', 'abierta', 'en_proceso'],
          },
          foto_url: { type: 'string', format: 'uri', nullable: true },
          fecha_radicado: { type: 'string', format: 'date-time' },
          fecha_cierre: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      PqrsInput: {
        type: 'object',
        required: ['tipo'],
        properties: {
          usuario_id: { type: 'string', format: 'uuid' },
          tipo: { type: 'string', enum: ['peticion', 'queja', 'reclamo', 'sugerencia'] },
          categoria: { type: 'string', example: 'Infraestructura' },
          asunto: { type: 'string', example: 'Daño en la fachada' },
          descripcion: { type: 'string', example: 'Se observa humedad en la fachada norte del edificio' },
          foto_url: { type: 'string', format: 'uri' },
        },
      },
      Visitante: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Pedro López' },
          documento: { type: 'string', example: 'CC987654321' },
          id_unidad_destino: { type: 'integer', nullable: true },
          autorizado: { type: 'boolean', default: false },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      VisitanteInput: {
        type: 'object',
        required: ['nombre', 'documento'],
        properties: {
          nombre: { type: 'string', example: 'Ana Martínez' },
          documento: { type: 'string', example: 'CC111222333' },
          id_unidad_destino: { type: 'integer', example: 1 },
          autorizado: { type: 'boolean', default: false },
        },
      },
      RegistroAcceso: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          id_visitante: { type: 'integer', nullable: true },
          id_portero: { type: 'string', format: 'uuid', nullable: true },
          hora_ingreso: { type: 'string', format: 'date-time' },
          hora_salida: { type: 'string', format: 'date-time', nullable: true },
          novedad: { type: 'string', nullable: true, example: 'Visita sin novedad' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Registro no encontrado' },
          code: { type: 'string', example: 'NOT_FOUND' },
        },
      },
    },
  },
  security: [{ SupabaseAuth: [] }],
  paths: {
    '/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar usuarios',
        description: 'Retorna todos los usuarios. Se puede filtrar por rol, nombre o email.',
        parameters: [
          { name: 'rol', in: 'query', schema: { type: 'string', enum: ['administrador', 'propietario', 'residente', 'portero'] } },
          { name: 'busqueda', in: 'query', description: 'Buscar por nombre o email', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Lista de usuarios', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Usuario' } } } } },
          401: { description: 'No autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Usuarios'],
        summary: 'Crear usuario',
        description: 'Crea un nuevo propietario, residente u otro rol. Solo administradores.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UsuarioInput' } } } },
        responses: {
          201: { description: 'Usuario creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } },
          400: { description: 'Datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Sin permisos (requiere rol administrador)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/usuarios/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener usuario por ID',
        responses: {
          200: { description: 'Datos del usuario', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } },
          404: { description: 'No encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Usuarios'],
        summary: 'Actualizar usuario',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UsuarioInput' } } } },
        responses: {
          200: { description: 'Usuario actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } },
          404: { description: 'No encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/unidades': {
      get: {
        tags: ['Unidades'],
        summary: 'Listar unidades',
        parameters: [
          { name: 'estado', in: 'query', schema: { type: 'string', enum: ['ocupada', 'desocupada', 'mora', 'activo', 'inactivo', 'venta', 'arriendo'] } },
          { name: 'tipo', in: 'query', schema: { type: 'string', enum: ['residencial', 'comercial', 'apartamento', 'local', 'oficina', 'parqueadero', 'bodega'] } },
          { name: 'propietario_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Lista de unidades', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Unidad' } } } } },
        },
      },
      post: {
        tags: ['Unidades'],
        summary: 'Crear unidad',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UnidadInput' } } } },
        responses: {
          201: { description: 'Unidad creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Unidad' } } } },
          400: { description: 'Datos inválidos o número duplicado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/unidades/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: {
        tags: ['Unidades'],
        summary: 'Obtener unidad por ID',
        responses: {
          200: { description: 'Datos de la unidad', content: { 'application/json': { schema: { $ref: '#/components/schemas/Unidad' } } } },
          404: { description: 'No encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Unidades'],
        summary: 'Actualizar unidad',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UnidadInput' } } } },
        responses: {
          200: { description: 'Unidad actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Unidad' } } } },
        },
      },
    },
    '/vehiculos': {
      get: {
        tags: ['Vehículos'],
        summary: 'Listar vehículos',
        parameters: [
          { name: 'propietario_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'id_unidad', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Lista de vehículos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Vehiculo' } } } } },
        },
      },
      post: {
        tags: ['Vehículos'],
        summary: 'Registrar vehículo',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VehiculoInput' } } } },
        responses: {
          201: { description: 'Vehículo registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehiculo' } } } },
          400: { description: 'Placa duplicada o datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/vehiculos/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      patch: {
        tags: ['Vehículos'],
        summary: 'Actualizar vehículo',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VehiculoInput' } } } },
        responses: {
          200: { description: 'Vehículo actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehiculo' } } } },
        },
      },
      delete: {
        tags: ['Vehículos'],
        summary: 'Eliminar vehículo',
        responses: {
          204: { description: 'Eliminado correctamente' },
          404: { description: 'No encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/mascotas': {
      get: {
        tags: ['Mascotas'],
        summary: 'Listar mascotas',
        parameters: [{ name: 'id_unidad', in: 'query', schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Lista de mascotas', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Mascota' } } } } },
        },
      },
      post: {
        tags: ['Mascotas'],
        summary: 'Registrar mascota',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/MascotaInput' } } } },
        responses: {
          201: { description: 'Mascota registrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Mascota' } } } },
        },
      },
    },
    '/tarifas': {
      get: {
        tags: ['Tarifas'],
        summary: 'Listar tarifas vigentes',
        responses: {
          200: { description: 'Lista de tarifas', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Tarifa' } } } } },
        },
      },
    },
    '/cuotas': {
      get: {
        tags: ['Cuotas'],
        summary: 'Listar cuotas',
        parameters: [
          { name: 'mes', in: 'query', description: 'Formato YYYY-MM-01', schema: { type: 'string', format: 'date', example: '2025-06-01' } },
          { name: 'estado', in: 'query', schema: { type: 'string', enum: ['pendiente', 'pagada', 'mora'] } },
          { name: 'id_unidad', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Lista de cuotas', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Cuota' } } } } },
        },
      },
      post: {
        tags: ['Cuotas'],
        summary: 'Crear cuota manualmente',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CuotaInput' } } } },
        responses: {
          201: { description: 'Cuota creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Cuota' } } } },
        },
      },
    },
    '/cuotas/generar': {
      post: {
        tags: ['Cuotas'],
        summary: 'Generar cobros del mes',
        description: 'Genera automáticamente las cuotas para todas las unidades activas del mes indicado según la tarifa vigente. Solo administradores.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mes'],
                properties: {
                  mes: { type: 'string', format: 'date', example: '2025-07-01', description: 'Primer día del mes a generar' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Resultado de la generación',
            content: { 'application/json': { schema: { type: 'object', properties: { creadas: { type: 'integer', example: 12 }, mensaje: { type: 'string' } } } } },
          },
          403: { description: 'Sin permisos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/pagos': {
      get: {
        tags: ['Pagos'],
        summary: 'Listar pagos',
        parameters: [
          { name: 'id_cuota', in: 'query', schema: { type: 'integer' } },
          { name: 'id_propietario', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'fecha_desde', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'fecha_hasta', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: { description: 'Lista de pagos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Pago' } } } } },
        },
      },
      post: {
        tags: ['Pagos'],
        summary: 'Registrar pago de cuota',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PagoInput' } } } },
        responses: {
          201: { description: 'Pago registrado y cuota marcada como pagada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pago' } } } },
          400: { description: 'Cuota ya pagada o monto inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/zonas-comunes': {
      get: {
        tags: ['Zonas Comunes'],
        summary: 'Listar zonas comunes',
        parameters: [{ name: 'disponible', in: 'query', schema: { type: 'boolean' } }],
        responses: {
          200: { description: 'Lista de zonas comunes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ZonaComun' } } } } },
        },
      },
    },
    '/reservas': {
      get: {
        tags: ['Reservas'],
        summary: 'Listar reservas',
        parameters: [
          { name: 'id_zona', in: 'query', schema: { type: 'integer' } },
          { name: 'id_usuario', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'estado', in: 'query', schema: { type: 'string', enum: ['pendiente', 'aprobada', 'rechazada', 'cancelada'] } },
          { name: 'fecha', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: { description: 'Lista de reservas', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Reserva' } } } } },
        },
      },
      post: {
        tags: ['Reservas'],
        summary: 'Crear reserva',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReservaInput' } } } },
        responses: {
          201: { description: 'Reserva creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Reserva' } } } },
          409: { description: 'Conflicto de horario', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/reservas/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      patch: {
        tags: ['Reservas'],
        summary: 'Actualizar estado de reserva',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { estado: { type: 'string', enum: ['aprobada', 'rechazada', 'cancelada'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Reserva actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Reserva' } } } },
        },
      },
    },
    '/ordenes-trabajo': {
      get: {
        tags: ['Mantenimiento'],
        summary: 'Listar órdenes de trabajo',
        parameters: [
          { name: 'estado', in: 'query', schema: { type: 'string', enum: ['creada', 'asignada', 'en_proceso', 'terminada'] } },
          { name: 'prioridad', in: 'query', schema: { type: 'string', enum: ['baja', 'media', 'alta', 'urgente'] } },
          { name: 'id_tecnico', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Lista de órdenes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/OrdenTrabajo' } } } } },
        },
      },
      post: {
        tags: ['Mantenimiento'],
        summary: 'Crear orden de trabajo',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OrdenTrabajoInput' } } } },
        responses: {
          201: { description: 'Orden creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/OrdenTrabajo' } } } },
        },
      },
    },
    '/ordenes-trabajo/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      patch: {
        tags: ['Mantenimiento'],
        summary: 'Actualizar orden de trabajo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  estado: { type: 'string', enum: ['creada', 'asignada', 'en_proceso', 'terminada'] },
                  id_tecnico: { type: 'string', format: 'uuid' },
                  fecha_cierre: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Orden actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/OrdenTrabajo' } } } },
        },
      },
    },
    '/pqrs': {
      get: {
        tags: ['PQRS'],
        summary: 'Listar PQRS',
        parameters: [
          { name: 'tipo', in: 'query', schema: { type: 'string', enum: ['peticion', 'queja', 'reclamo', 'sugerencia'] } },
          { name: 'estado', in: 'query', schema: { type: 'string', enum: ['radicada', 'revision', 'gestion', 'resuelta', 'cerrada', 'abierta', 'en_proceso'] } },
          { name: 'usuario_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Lista de PQRS', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Pqrs' } } } } },
        },
      },
      post: {
        tags: ['PQRS'],
        summary: 'Radicar PQRS',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PqrsInput' } } } },
        responses: {
          201: { description: 'PQRS radicada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pqrs' } } } },
        },
      },
    },
    '/pqrs/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: {
        tags: ['PQRS'],
        summary: 'Obtener PQRS por ID',
        responses: {
          200: { description: 'PQRS con respuestas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pqrs' } } } },
          404: { description: 'No encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['PQRS'],
        summary: 'Actualizar estado de PQRS',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { estado: { type: 'string', enum: ['revision', 'gestion', 'resuelta', 'cerrada'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'PQRS actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pqrs' } } } },
        },
      },
    },
    '/visitantes': {
      get: {
        tags: ['Acceso'],
        summary: 'Listar visitantes',
        parameters: [
          { name: 'id_unidad_destino', in: 'query', schema: { type: 'integer' } },
          { name: 'autorizado', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: { description: 'Lista de visitantes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Visitante' } } } } },
        },
      },
      post: {
        tags: ['Acceso'],
        summary: 'Registrar visitante',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VisitanteInput' } } } },
        responses: {
          201: { description: 'Visitante registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Visitante' } } } },
        },
      },
    },
    '/registros-acceso': {
      get: {
        tags: ['Acceso'],
        summary: 'Listar registros de acceso',
        parameters: [
          { name: 'id_visitante', in: 'query', schema: { type: 'integer' } },
          { name: 'fecha_desde', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'fecha_hasta', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          200: { description: 'Registros de acceso', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RegistroAcceso' } } } } },
        },
      },
      post: {
        tags: ['Acceso'],
        summary: 'Registrar ingreso de visitante',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id_visitante'],
                properties: {
                  id_visitante: { type: 'integer' },
                  id_portero: { type: 'string', format: 'uuid' },
                  novedad: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Ingreso registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistroAcceso' } } } },
        },
      },
    },
    '/registros-acceso/{id}/salida': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      patch: {
        tags: ['Acceso'],
        summary: 'Registrar salida de visitante',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { novedad: { type: 'string' } } },
            },
          },
        },
        responses: {
          200: { description: 'Salida registrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistroAcceso' } } } },
        },
      },
    },
  },
}

export function GET() {
  return NextResponse.json(spec)
}
