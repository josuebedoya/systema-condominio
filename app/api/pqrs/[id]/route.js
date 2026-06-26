import { NextResponse } from 'next/server'
import { getItems } from '@/supabase/helpers/base'
import { getRespuestasByPqr, updatePqrEstado, createRespuesta } from '@/supabase/helpers/pqrs'

export async function GET(request, { params }) {
  const { id } = params

  const { data: pqr, error } = await getItems('pqrs', {
    select: 'id, tipo, categoria, asunto, descripcion, estado, usuario_id, created_at, usuarios:usuario_id(nombre, email)',
    filters: [{ op: 'eq', column: 'id', value: id }],
    single: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!pqr) return NextResponse.json({ error: 'PQR no encontrado' }, { status: 404 })

  const { data: respuestas } = await getRespuestasByPqr(id)

  return NextResponse.json({ ...pqr, respuestas: respuestas ?? [] })
}

export async function PATCH(request, { params }) {
  const { id } = params
  const body = await request.json()
  const { estado, respuesta, usuario_id } = body

  const ESTADOS_VALIDOS = ['abierta', 'en_proceso', 'resuelta', 'cerrada']

  if (estado) {
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` }, { status: 400 })
    }
    const { error } = await updatePqrEstado(id, estado)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (respuesta) {
    const { error } = await createRespuesta({
      pqr_id: id,
      texto: respuesta,
      usuario_id: usuario_id ?? null,
      es_admin: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data, error: errGet } = await getItems('pqrs', {
    select: 'id, tipo, asunto, descripcion, estado, usuario_id, created_at',
    filters: [{ op: 'eq', column: 'id', value: id }],
    single: true,
  })

  if (errGet) return NextResponse.json({ error: errGet.message }, { status: 500 })
  return NextResponse.json(data)
}
