import { NextResponse } from 'next/server'
import { getItems, updateItem } from '@/supabase/helpers/base'

export async function GET(request, { params }) {
  const { id } = params

  const { data, error } = await getItems('unidades', {
    select: 'id, numero, tipo, estado, piso, area_m2, created_at',
    filters: [{ op: 'eq', column: 'id', value: id }],
    single: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request, { params }) {
  const { id } = params
  const body = await request.json()
  const { numero, tipo, estado, piso, area_m2 } = body

  const payload = {}
  if (numero !== undefined) payload.numero = numero
  if (tipo !== undefined) payload.tipo = tipo
  if (estado !== undefined) payload.estado = estado
  if (piso !== undefined) payload.piso = piso
  if (area_m2 !== undefined) payload.area_m2 = area_m2

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
  }

  const { data, error } = await updateItem('unidades', id, payload)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data)
}
