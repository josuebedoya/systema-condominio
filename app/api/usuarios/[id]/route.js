import { NextResponse } from 'next/server'
import { getItems, updateItem } from '@/supabase/helpers/base'

export async function GET(request, { params }) {
  const { id } = params

  const { data, error } = await getItems('usuarios', {
    select: 'id, nombre, email, rol, telefono, documento, created_at',
    filters: [{ op: 'eq', column: 'id', value: id }],
    single: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request, { params }) {
  const { id } = params
  const body = await request.json()
  const { nombre, email, rol, telefono, documento } = body

  const payload = {}
  if (nombre !== undefined) payload.nombre = nombre
  if (email !== undefined) payload.email = email
  if (rol !== undefined) payload.rol = rol
  if (telefono !== undefined) payload.telefono = telefono
  if (documento !== undefined) payload.documento = documento

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
  }

  const { data, error } = await updateItem('usuarios', id, payload)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data)
}
