import { supabase } from '@/services/supabaseClient'
import { getItems, insertItem, updateItem } from './base'

export async function getCuotas({ mesStr, filtroEstado, unidadIds, esAdmin } = {}) {
  let query = supabase
    .from('cuotas')
    .select('id, id_unidad, mes, monto_base, interes_mora, estado, pagos(fecha, monto, metodo_pago)')
    .order('created_at', { ascending: false })

  if (mesStr)       query = query.eq('mes', mesStr)
  if (filtroEstado) query = query.eq('estado', filtroEstado)
  if (!esAdmin && unidadIds?.length) query = query.in('id_unidad', unidadIds)

  const { data, error } = await query
  if (error) return { data: null, error }

  const enriched = await enrichCuotasConUnidades(data ?? [])
  return { data: enriched, error: null }
}

export async function getUnidadesByPropietarioId(propietarioId) {
  let { data, error } = await getItems('unidades', {
    select: 'id',
    filters: [{ op: 'eq', column: 'propietario_id', value: propietarioId }],
  })

  if (error?.code === '42703') {
    const result = await getItems('unidades', {
      select: 'id',
      filters: [{ op: 'eq', column: 'id_propietario', value: propietarioId }],
    })
    data  = result.data
    error = result.error
  }

  return { data, error }
}

export async function enrichCuotasConUnidades(cuotas) {
  if (!cuotas.length) return cuotas

  const unidadIds = [...new Set(cuotas.map((c) => c.id_unidad).filter(Boolean))]
  if (!unidadIds.length) return cuotas

  let { data: unidades, error: errU } = await getItems('unidades', {
    select: 'id, numero, torre, propietario_id',
    filters: [{ op: 'in', column: 'id', value: unidadIds }],
  })

  if (errU?.code === '42703') {
    const result = await getItems('unidades', {
      select: 'id, numero, torre, id_propietario',
      filters: [{ op: 'in', column: 'id', value: unidadIds }],
    })
    unidades = (result.data ?? []).map((u) => ({ ...u, propietario_id: u.id_propietario ?? null }))
  }

  const propIds = [...new Set((unidades ?? []).map((u) => u.propietario_id).filter(Boolean))]
  let propMap = {}
  if (propIds.length) {
    const { data: props } = await getItems('usuarios', {
      select: 'id, nombre, email',
      filters: [{ op: 'in', column: 'id', value: propIds }],
    })
    propMap = Object.fromEntries((props ?? []).map((p) => [p.id, p]))
  }

  const unidadMap = Object.fromEntries(
    (unidades ?? []).map((u) => [
      u.id,
      { ...u, propietario: propMap[u.propietario_id] ?? null },
    ])
  )

  return cuotas.map((c) => ({ ...c, unidades: unidadMap[c.id_unidad] ?? null }))
}

export async function getPagosByFecha(fechaInicio, fechaFin) {
  return getItems('pagos', {
    select: 'id, monto, fecha',
    filters: [
      { op: 'gte', column: 'fecha', value: fechaInicio },
      { op: 'lte', column: 'fecha', value: fechaFin },
    ],
    order: [{ column: 'fecha', ascending: false }],
  })
}

export async function getTarifas() {
  return getItems('tarifas', {
    select: 'id, tipo, monto_base',
    order: [{ column: 'tipo', ascending: true }],
  })
}

export async function getUnidadesParaCobro() {
  return getItems('unidades', {
    select: 'id, tipo',
    filters: [{ op: 'not', column: 'estado', op2: 'in', value: '(inactivo,desocupada)' }],
  })
}

export async function getCuotasExistentes(mesStr) {
  return getItems('cuotas', {
    select: 'id_unidad',
    filters: [{ op: 'eq', column: 'mes', value: mesStr }],
  })
}

export async function createCuotas(cuotas) {
  const { data, error } = await supabase.from('cuotas').insert(cuotas)
  return { data, error }
}

export async function createPago(payload) {
  return insertItem('pagos', payload)
}

export async function updateCuotaEstado(id, estado) {
  return updateItem('cuotas', id, { estado })
}
