import { getItems, insertItem } from './base'

export async function getUsuarios({ roles = [], busqueda = '', filtroRol = '' } = {}) {
  const filters = []

  if (filtroRol) {
    filters.push({ op: 'eq', column: 'rol', value: filtroRol })
  } else if (roles.length) {
    filters.push({ op: 'in', column: 'rol', value: roles })
  }

  if (busqueda) {
    filters.push({ op: 'or', value: `nombre.ilike.%${busqueda}%,email.ilike.%${busqueda}%` })
  }

  let { data, error } = await getItems('usuarios', {
    select: 'id, nombre, email, rol, telefono, documento, created_at',
    filters,
    order: [{ column: 'nombre', ascending: true }],
  })

  if (error?.code === '42703') {
    const result = await getItems('usuarios', {
      select: 'id, nombre, email, rol, created_at',
      filters,
      order: [{ column: 'nombre', ascending: true }],
    })
    data  = result.data
    error = result.error
  }

  return { data, error }
}

export async function getUsuariosByRol(roles) {
  const rolesArr = Array.isArray(roles) ? roles : [roles]
  return getItems('usuarios', {
    select: 'id, nombre, email, rol',
    filters: [{ op: 'in', column: 'rol', value: rolesArr }],
    order: [{ column: 'nombre', ascending: true }],
  })
}

export async function getVehiculosByPropietario(propietarioId, unidadesIds = []) {
  const filters = []

  if (propietarioId) {
    filters.push({ op: 'eq', column: 'propietario_id', value: propietarioId })
  } else if (unidadesIds.length) {
    filters.push({ op: 'in', column: 'unidad_id', value: unidadesIds })
  }

  let { data, error } = await getItems('vehiculos', {
    select: 'id, placa, marca, modelo, color, tipo',
    filters,
  })

  if (error?.code === '42703') {
    const altFilters = []
    if (propietarioId) altFilters.push({ op: 'eq', column: 'id_propietario', value: propietarioId })
    else if (unidadesIds.length) altFilters.push({ op: 'in', column: 'id_unidad', value: unidadesIds })

    const result = await getItems('vehiculos', {
      select: 'id, placa, marca, modelo, color, tipo',
      filters: altFilters,
    })
    data  = result.data
    error = result.error
  }

  return { data, error }
}

export async function createUsuario(payload) {
  return insertItem('usuarios', payload)
}
