import { NextResponse } from 'next/server'
import { getItems, insertItem } from '@/supabase/helpers/base'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const estado = searchParams.get('estado')
  const busqueda = searchParams.get('busqueda')

  const filters = []
  if (tipo) filters.push({ op: 'eq', column: 'tipo', value: tipo })
  if (estado) filters.push({ op: 'eq', column: 'estado', value: estado })
  if (busqueda) filters.push({ op: 'ilike', column: 'numero', value: `%${busqueda}%` })

  const { data, error } = await getItems('unidades', {
    select: 'id, numero, tipo, estado, piso, area_m2, created_at',
    filters,
    order: [{ column: 'numero', ascending: true }],
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  const body = await request.json()
  const { numero, tipo, estado, piso, area_m2 } = body

  if (!numero || !tipo) {
    return NextResponse.json({ error: 'numero y tipo son requeridos' }, { status: 400 })
  }

  const { data, error } = await insertItem('unidades', {
    numero,
    tipo,
    estado: estado ?? 'activa',
    piso,
    area_m2,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data, { status: 201 })
}
