import { getItems, insertItem, updateItem } from './base'

export async function getPqrs({ usuarioId, esAdmin, filtroTipo = '', filtroEstado = '' } = {}) {
  const filters = []
  if (!esAdmin && usuarioId) filters.push({ op: 'eq', column: 'usuario_id', value: usuarioId })
  if (filtroTipo)   filters.push({ op: 'eq', column: 'tipo', value: filtroTipo })
  if (filtroEstado) filters.push({ op: 'eq', column: 'estado', value: filtroEstado })

  return getItems('pqrs', {
    select: 'id, tipo, categoria, asunto, descripcion, estado, created_at, usuario_id, usuarios:usuario_id(id, nombre, email)',
    filters,
    order: [{ column: 'created_at', ascending: false }],
  })
}

export async function getPqrsCount({ excluirEstado = '' } = {}) {
  const filters = excluirEstado
    ? [{ op: 'neq', column: 'estado', value: excluirEstado }]
    : []
  const { count, error } = await getItems('pqrs', { filters, count: true, head: true })
  return { count: count ?? 0, error }
}

export async function getPqrsRecientes(limit = 5) {
  return getItems('pqrs', {
    select: 'id, tipo, asunto, estado, created_at',
    order: [{ column: 'created_at', ascending: false }],
    limit,
  })
}

export async function getPqrsRecientesByUsuario(usuarioId, limit = 5) {
  return getItems('pqrs', {
    select: 'id, tipo, asunto, estado, created_at',
    filters: [{ op: 'eq', column: 'usuario_id', value: usuarioId }],
    order: [{ column: 'created_at', ascending: false }],
    limit,
  })
}

export async function getRespuestasByPqr(pqrId) {
  return getItems('pqrs_respuestas', {
    select: 'id, texto, created_at, es_admin, usuario_id, usuarios:usuario_id(nombre)',
    filters: [{ op: 'eq', column: 'pqr_id', value: pqrId }],
    order: [{ column: 'created_at', ascending: true }],
  })
}

export async function createPqr(payload) {
  return insertItem('pqrs', payload)
}

export async function updatePqrEstado(id, estado) {
  return updateItem('pqrs', id, { estado })
}

export async function createRespuesta(payload) {
  return insertItem('pqrs_respuestas', payload)
}
