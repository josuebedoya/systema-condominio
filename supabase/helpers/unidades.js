import { supabase } from '@/services/supabaseClient'
import { getItems, insertItem, updateItem, deleteItem } from './base'

const POR_PAGINA_DEFAULT = 10

export async function getUnidades({ busqueda = '', filtroTipo = '', filtroEstado = '', pagina = 1, porPagina = POR_PAGINA_DEFAULT } = {}) {
  const desde = (pagina - 1) * porPagina
  const hasta  = desde + porPagina - 1

  const makeQuery = (ownerCol) => {
    let q = supabase
      .from('unidades')
      .select(`id, numero, torre, piso, tipo, estado, area_m2, coeficiente, ${ownerCol}`, { count: 'exact' })

    if (busqueda)     q = q.or(`numero.ilike.%${busqueda}%,torre.ilike.%${busqueda}%`)
    if (filtroTipo)   q = q.eq('tipo', filtroTipo)
    if (filtroEstado) q = q.eq('estado', filtroEstado)

    return q.order('torre', { nullsFirst: true }).order('numero').range(desde, hasta)
  }

  let { data, count, error } = await makeQuery('propietario_id')
  if (error?.code === '42703') {
    const fallback = await makeQuery('id_propietario')
    data  = fallback.data
    count = fallback.count
    error = fallback.error
  }
  if (error) return { data: null, error, count: 0 }

  const base = (data ?? []).map((u) => ({
    ...u,
    propietario_id: u.propietario_id ?? u.id_propietario ?? null,
  }))

  const ownerIds = [...new Set(base.map((u) => u.propietario_id).filter(Boolean))]
  let ownersMap = new Map()

  if (ownerIds.length) {
    const { data: owners, error: errO } = await supabase
      .from('usuarios')
      .select('id, nombre, email')
      .in('id', ownerIds)
    if (errO) return { data: null, error: errO, count: 0 }
    ownersMap = new Map((owners ?? []).map((o) => [o.id, o]))
  }

  const enriched = base.map((u) => ({
    ...u,
    usuarios: u.propietario_id ? (ownersMap.get(u.propietario_id) ?? null) : null,
  }))

  return { data: enriched, error: null, count: count ?? 0 }
}

export async function getUnidadesActivas() {
  return getItems('unidades', {
    select: 'id, numero, torre',
    filters: [{ op: 'eq', column: 'estado', value: 'activo' }],
    order: [{ column: 'numero', ascending: true }],
  })
}

export async function getUnidadesByPropietario(propietarioId) {
  let result = await getItems('unidades', {
    select: 'id, numero, torre, tipo, estado',
    filters: [{ op: 'eq', column: 'propietario_id', value: propietarioId }],
  })

  if (result.error?.code === '42703') {
    result = await getItems('unidades', {
      select: 'id, numero, torre, tipo, estado',
      filters: [{ op: 'eq', column: 'id_propietario', value: propietarioId }],
    })
  }

  return result
}

export async function getUnidadesCount() {
  const { count, error } = await getItems('unidades', { count: true, head: true })
  return { count: count ?? 0, error }
}

export async function getUnidadesCountByEstado(estado) {
  const { count, error } = await getItems('unidades', {
    filters: [{ op: 'eq', column: 'estado', value: estado }],
    count: true,
    head: true,
  })
  return { count: count ?? 0, error }
}

export async function createUnidad(payload) {
  return insertItem('unidades', payload)
}

export async function updateUnidad(id, payload) {
  return updateItem('unidades', id, payload)
}

export async function deleteUnidad(id) {
  return deleteItem('unidades', id)
}
