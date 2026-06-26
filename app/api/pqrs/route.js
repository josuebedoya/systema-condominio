import { NextResponse } from 'next/server'
import { getPqrs, createPqr } from '@/supabase/helpers/pqrs'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const usuarioId = searchParams.get('usuario_id')
  const esAdmin = searchParams.get('admin') === 'true'
  const filtroTipo = searchParams.get('tipo')
  const filtroEstado = searchParams.get('estado')

  const { data, error } = await getPqrs({ usuarioId, esAdmin, filtroTipo, filtroEstado })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request) {
  const body = await request.json()
  const { tipo, descripcion, usuario_id } = body

  if (!tipo || !descripcion) {
    return NextResponse.json({ error: 'tipo y descripcion son requeridos' }, { status: 400 })
  }

  const TIPOS_VALIDOS = ['peticion', 'queja', 'reclamo', 'sugerencia']
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return NextResponse.json({ error: `tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}` }, { status: 400 })
  }

  const { data, error } = await createPqr({
    tipo,
    descripcion,
    usuario_id: usuario_id ?? null,
    estado: 'abierta',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data, { status: 201 })
}
