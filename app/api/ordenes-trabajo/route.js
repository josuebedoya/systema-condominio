import { NextResponse } from 'next/server'
import { getOrdenesTrabajo, createOrdenTrabajo } from '@/supabase/helpers/mantenimiento'

export async function GET() {
  const { data, error } = await getOrdenesTrabajo()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request) {
  const body = await request.json()
  const { descripcion, area, prioridad, id_reportado_por } = body

  if (!descripcion) {
    return NextResponse.json({ error: 'descripcion es requerida' }, { status: 400 })
  }

  const { data, error } = await createOrdenTrabajo({
    descripcion,
    area: area ?? null,
    prioridad: prioridad ?? 'media',
    estado: 'creada',
    id_reportado_por: id_reportado_por ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data, { status: 201 })
}
