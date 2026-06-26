import { getItems, insertItem, updateItem } from './base'

export async function getVisitantesActivos() {
  return getItems('registros_acceso', {
    select: 'id, hora_ingreso, visitantes:id_visitante(id, nombre, documento, unidades:id_unidad_destino(numero, torre))',
    filters: [
      { op: 'is',  column: 'hora_salida',  value: null },
      { op: 'not', column: 'id_visitante', value: null },
    ],
    order: [{ column: 'hora_ingreso', ascending: false }],
  })
}

export async function getLogAccesoHoy(fechaInicio, fechaFin) {
  return getItems('registros_acceso', {
    select: 'id, hora_ingreso, hora_salida, visitantes:id_visitante(nombre, documento, unidades:id_unidad_destino(numero, torre))',
    filters: [
      { op: 'gte', column: 'hora_ingreso', value: fechaInicio },
      { op: 'lte', column: 'hora_ingreso', value: fechaFin },
      { op: 'not', column: 'id_visitante', value: null },
    ],
    order: [{ column: 'hora_ingreso', ascending: false }],
  })
}

export async function getNovedadesHoy(fechaInicio, fechaFin) {
  return getItems('registros_acceso', {
    select: 'id, hora_ingreso, novedad, usuarios:id_portero(nombre)',
    filters: [
      { op: 'gte', column: 'hora_ingreso', value: fechaInicio },
      { op: 'lte', column: 'hora_ingreso', value: fechaFin },
      { op: 'is',  column: 'id_visitante', value: null },
    ],
    order: [{ column: 'hora_ingreso', ascending: false }],
  })
}

export async function buscarVisitante(termino) {
  return getItems('visitantes', {
    select: 'id, nombre, documento',
    filters: [{ op: 'or', value: `nombre.ilike.%${termino}%,documento.ilike.%${termino}%` }],
    limit: 1,
    single: true,
  })
}

export async function createVisitante(payload) {
  return insertItem('visitantes', payload)
}

export async function createRegistroAcceso(payload) {
  return insertItem('registros_acceso', payload)
}

export async function registrarSalida(accesoId, horaSalida) {
  return updateItem('registros_acceso', accesoId, { hora_salida: horaSalida })
}

export async function createNovedad(payload) {
  return insertItem('registros_acceso', payload)
}
