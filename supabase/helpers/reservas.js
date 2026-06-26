import { supabase } from '@/services/supabaseClient'
import { getItems, insertItem, updateItem } from './base'

export async function getReservas({ usuarioId, esAdmin, zonaId } = {}) {
  const filters = []
  if (!esAdmin && usuarioId) filters.push({ op: 'eq', column: 'id_usuario', value: usuarioId })
  if (zonaId) filters.push({ op: 'eq', column: 'id_zona', value: zonaId })

  return getItems('reservas', {
    select: 'id, fecha, hora_inicio, hora_fin, estado, id_usuario, id_zona, zonas_comunes:id_zona(id, nombre), usuarios:id_usuario(id, nombre, email)',
    filters,
    order: [{ column: 'fecha', ascending: false }, { column: 'hora_inicio', ascending: true }],
  })
}

export async function getReservasDeHoy(fecha) {
  return getItems('reservas', {
    select: 'id, hora_inicio, hora_fin, estado, id_zona, zonas_comunes:id_zona(nombre), usuarios:id_usuario(nombre)',
    filters: [{ op: 'eq', column: 'fecha', value: fecha }],
    order: [{ column: 'hora_inicio', ascending: true }],
  })
}

export async function getReservasCountHoy(fecha) {
  const { count, error } = await getItems('reservas', {
    filters: [{ op: 'eq', column: 'fecha', value: fecha }],
    count: true,
    head: true,
  })
  return { count: count ?? 0, error }
}

export async function getReservasProximasByUsuario(usuarioId, fechaDesde, limit = 5) {
  return getItems('reservas', {
    select: 'id, fecha, hora_inicio, hora_fin, estado, zonas_comunes:id_zona(nombre)',
    filters: [
      { op: 'eq',  column: 'id_usuario', value: usuarioId },
      { op: 'gte', column: 'fecha',      value: fechaDesde },
      { op: 'neq', column: 'estado',     value: 'rechazada' },
    ],
    order: [{ column: 'fecha', ascending: true }],
    limit,
  })
}

export async function getZonaPorNombre(nombre) {
  return getItems('zonas_comunes', {
    select: 'id, nombre',
    filters: [{ op: 'ilike', column: 'nombre', value: `%${nombre}%` }],
    single: true,
  })
}

export async function getZonaPorNombreExacto(nombre) {
  return getItems('zonas_comunes', {
    select: 'id, nombre',
    filters: [{ op: 'eq', column: 'nombre', value: nombre }],
    single: true,
  })
}

export async function createZona(payload) {
  const { data, error } = await insertItem('zonas_comunes', payload)
  return { data: data?.[0] ?? data, error }
}

export async function checkSolapamiento(zonaId, fecha, horaInicio, horaFin) {
  const { data } = await supabase
    .from('reservas')
    .select('id')
    .eq('id_zona', zonaId)
    .eq('fecha', fecha)
    .not('estado', 'eq', 'rechazada')
    .not('estado', 'eq', 'cancelada')
    .lt('hora_inicio', horaFin)
    .gt('hora_fin', horaInicio)

  return (data ?? []).length > 0
}

export async function createReserva(payload) {
  return insertItem('reservas', payload)
}

export async function updateReservaEstado(id, estado) {
  return updateItem('reservas', id, { estado })
}
