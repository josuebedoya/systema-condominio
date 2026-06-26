import { NextResponse } from 'next/server'
import { updateItem, deleteItem } from '@/supabase/helpers/base'

export async function PATCH(request, { params }) {
  const { id } = params
  const body = await request.json()
  const { placa, marca, modelo, color, tipo } = body

  const payload = {}
  if (placa !== undefined) payload.placa = placa
  if (marca !== undefined) payload.marca = marca
  if (modelo !== undefined) payload.modelo = modelo
  if (color !== undefined) payload.color = color
  if (tipo !== undefined) payload.tipo = tipo

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
  }

  const { data, error } = await updateItem('vehiculos', id, payload)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data)
}

export async function DELETE(request, { params }) {
  const { id } = params
  const { error } = await deleteItem('vehiculos', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
