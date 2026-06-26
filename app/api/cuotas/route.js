import { NextResponse } from 'next/server'
import { getItems, insertItem } from '@/supabase/helpers/base'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mes      = searchParams.get('mes')
  const estado   = searchParams.get('estado')
  const unidadId = searchParams.get('unidad_id')

  const filters = []
  if (mes)      filters.push({ op: 'eq', column: 'mes',       value: mes })
  if (estado)   filters.push({ op: 'eq', column: 'estado',    value: estado })
  if (unidadId) filters.push({ op: 'eq', column: 'id_unidad', value: unidadId })

  const { data, error } = await getItems('cuotas', {
    select: 'id, id_unidad, mes, monto_base, interes_mora, estado, created_at',
    filters,
    order: [{ column: 'mes', ascending: false }],
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request) {
  const body = await request.json()
  const { id_unidad, mes, monto_base, estado } = body

  if (!id_unidad || !mes || monto_base === undefined) {
    return NextResponse.json({ error: 'id_unidad, mes y monto_base son requeridos' }, { status: 400 })
  }

  const { data, error } = await insertItem('cuotas', {
    id_unidad,
    mes,
    monto_base: Number(monto_base),
    estado: estado ?? 'pendiente',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data, { status: 201 })
}
