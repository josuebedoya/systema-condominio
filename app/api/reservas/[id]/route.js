import { NextResponse } from 'next/server'
import { updateReservaEstado } from '@/supabase/helpers/reservas'

const ESTADOS_VALIDOS = ['pendiente', 'aprobada', 'rechazada', 'cancelada']

export async function PATCH(request, { params }) {
  const { id } = params
  const body = await request.json()
  const { estado } = body

  if (!estado) {
    return NextResponse.json({ error: 'estado es requerido' }, { status: 400 })
  }
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return NextResponse.json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` }, { status: 400 })
  }

  const { data, error } = await updateReservaEstado(id, estado)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data)
}
