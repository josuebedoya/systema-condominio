import { NextResponse } from 'next/server'
import { registrarSalida } from '@/supabase/helpers/acceso'

export async function PATCH(request, { params }) {
  const { id } = params
  const body = await request.json().catch(() => ({}))
  const hora_salida = body.hora_salida ?? new Date().toISOString()

  const { data, error } = await registrarSalida(id, hora_salida)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data)
}
