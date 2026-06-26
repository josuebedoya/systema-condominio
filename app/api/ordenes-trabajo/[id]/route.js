import { NextResponse } from 'next/server'
import { updateOrdenEstado, asignarTecnico } from '@/supabase/helpers/mantenimiento'

const ESTADOS_VALIDOS = ['creada', 'asignada', 'en_proceso', 'terminada']

export async function PATCH(request, { params }) {
  const { id } = params
  const body = await request.json()
  const { estado, id_tecnico } = body

  if (!estado && id_tecnico === undefined) {
    return NextResponse.json({ error: 'Se requiere estado o id_tecnico' }, { status: 400 })
  }

  if (estado) {
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` }, { status: 400 })
    }
    const { data, error } = await updateOrdenEstado(id, estado)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (id_tecnico !== undefined) {
      const { error: errA } = await asignarTecnico(id, id_tecnico)
      if (errA) return NextResponse.json({ error: errA.message }, { status: 500 })
    }
    return NextResponse.json(data?.[0] ?? data)
  }

  const { data, error } = await asignarTecnico(id, id_tecnico)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data)
}
