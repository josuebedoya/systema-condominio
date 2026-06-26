import { NextResponse } from 'next/server'
import { getItems, insertItem } from '@/supabase/helpers/base'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const rol = searchParams.get('rol')
  const busqueda = searchParams.get('busqueda')

  const filters = []
  if (rol) filters.push({ op: 'eq', column: 'rol', value: rol })
  if (busqueda) filters.push({ op: 'ilike', column: 'nombre', value: `%${busqueda}%` })

  const { data, error } = await getItems('usuarios', {
    select: 'id, nombre, email, rol, telefono, documento, created_at',
    filters,
    order: [{ column: 'nombre', ascending: true }],
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  const body = await request.json()
  const { nombre, email, rol, telefono, documento } = body

  if (!nombre || !email || !rol) {
    return NextResponse.json({ error: 'nombre, email y rol son requeridos' }, { status: 400 })
  }

  const { data, error } = await insertItem('usuarios', { nombre, email, rol, telefono, documento })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data, { status: 201 })
}
