import { NextResponse } from 'next/server'
import { getLogAccesoHoy, createRegistroAcceso } from '@/supabase/helpers/acceso'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const hoy = new Date().toISOString().split('T')[0]
  const inicio = searchParams.get('fecha_inicio') ?? `${hoy}T00:00:00`
  const fin    = searchParams.get('fecha_fin')    ?? `${hoy}T23:59:59`

  const { data, error } = await getLogAccesoHoy(inicio, fin)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request) {
  const body = await request.json()
  const { id_visitante, id_portero, hora_ingreso, novedad } = body

  const payload = {
    id_visitante: id_visitante ?? null,
    id_portero: id_portero ?? null,
    hora_ingreso: hora_ingreso ?? new Date().toISOString(),
    novedad: novedad ?? null,
  }

  const { data, error } = await createRegistroAcceso(payload)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data, { status: 201 })
}
