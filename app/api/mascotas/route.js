import { NextResponse } from 'next/server'
import { getItems, insertItem } from '@/supabase/helpers/base'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const propietarioId = searchParams.get('propietario_id')
  const unidadId = searchParams.get('unidad_id')

  const filters = []
  if (propietarioId) filters.push({ op: 'eq', column: 'propietario_id', value: propietarioId })
  if (unidadId) filters.push({ op: 'eq', column: 'unidad_id', value: unidadId })

  let { data, error } = await getItems('mascotas', {
    select: 'id, nombre, especie, raza, color, propietario_id, unidad_id, created_at',
    filters,
    order: [{ column: 'nombre', ascending: true }],
  })

  if (error?.code === '42703') {
    const result = await getItems('mascotas', {
      select: 'id, nombre, especie, raza, color, id_propietario, id_unidad, created_at',
      filters: propietarioId
        ? [{ op: 'eq', column: 'id_propietario', value: propietarioId }]
        : unidadId
          ? [{ op: 'eq', column: 'id_unidad', value: unidadId }]
          : [],
      order: [{ column: 'nombre', ascending: true }],
    })
    data = result.data
    error = result.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request) {
  const body = await request.json()
  const { nombre, especie, raza, color, propietario_id, unidad_id } = body

  if (!nombre || !especie) {
    return NextResponse.json({ error: 'nombre y especie son requeridos' }, { status: 400 })
  }

  const payload = { nombre, especie, raza, color, propietario_id, unidad_id }
  let { data, error } = await insertItem('mascotas', payload)

  if (error?.code === '42703') {
    const result = await insertItem('mascotas', { nombre, especie, raza, color, id_propietario: propietario_id, id_unidad: unidad_id })
    data = result.data
    error = result.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data, { status: 201 })
}
