import { getItems, insertItem, updateItem } from './base'

export async function getOrdenesTrabajo() {
  return getItems('ordenes_trabajo', {
    select: 'id, descripcion, area, prioridad, estado, id_reportado_por, id_tecnico, created_at, usuarios!id_reportado_por(nombre), tecnicos:usuarios!id_tecnico(nombre)',
    order: [
      { column: 'estado', ascending: true },
      { column: 'prioridad', ascending: true },
      { column: 'created_at', ascending: false },
    ],
  })
}

export async function getTecnicos() {
  return getItems('usuarios', {
    select: 'id, nombre',
    filters: [{ op: 'eq', column: 'rol', value: 'tecnico' }],
    order: [{ column: 'nombre', ascending: true }],
  })
}

export async function createOrdenTrabajo(payload) {
  return insertItem('ordenes_trabajo', payload)
}

export async function updateOrdenEstado(id, estado) {
  return updateItem('ordenes_trabajo', id, { estado })
}

export async function asignarTecnico(id, tecnicoId) {
  return updateItem('ordenes_trabajo', id, { id_tecnico: tecnicoId, estado: 'asignada' })
}
