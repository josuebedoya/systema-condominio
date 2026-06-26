import { NextResponse } from 'next/server'
import { getVisitantesActivos, buscarVisitante, createVisitante } from '@/supabase/helpers/acceso'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const termino = searchParams.get('busqueda')

  if (termino) {
    const { data, error } = await buscarVisitante(termino)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  const { data, error } = await getVisitantesActivos()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request) {
  const body = await request.json()
  const { nombre, documento, motivo, id_unidad_destino } = body

  if (!nombre || !documento) {
    return NextResponse.json({ error: 'nombre y documento son requeridos' }, { status: 400 })
  }

  const { data, error } = await createVisitante({
    nombre,
    documento,
    motivo: motivo ?? null,
    id_unidad_destino: id_unidad_destino ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data, { status: 201 })
}
