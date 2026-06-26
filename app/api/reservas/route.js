import { NextResponse } from 'next/server'
import { getReservas, getZonaPorNombreExacto, createZona, checkSolapamiento, createReserva } from '@/supabase/helpers/reservas'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const usuarioId = searchParams.get('usuario_id')
  const zonaId = searchParams.get('zona_id')
  const esAdmin = searchParams.get('admin') === 'true'

  const { data, error } = await getReservas({ usuarioId, esAdmin, zonaId })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request) {
  const body = await request.json()
  const { zona_nombre, zona_id, usuario_id, fecha, hora_inicio, hora_fin, estado } = body

  if (!fecha || !hora_inicio || !hora_fin) {
    return NextResponse.json({ error: 'fecha, hora_inicio y hora_fin son requeridos' }, { status: 400 })
  }
  if (!zona_id && !zona_nombre) {
    return NextResponse.json({ error: 'zona_id o zona_nombre es requerido' }, { status: 400 })
  }
  if (hora_fin <= hora_inicio) {
    return NextResponse.json({ error: 'hora_fin debe ser mayor a hora_inicio' }, { status: 400 })
  }

  let zonaIdFinal = zona_id
  if (!zonaIdFinal) {
    let zonaData = (await getZonaPorNombreExacto(zona_nombre)).data
    if (!zonaData) {
      const { data: nueva, error: errZ } = await createZona({ nombre: zona_nombre })
      if (errZ) return NextResponse.json({ error: errZ.message }, { status: 500 })
      zonaData = nueva
    }
    zonaIdFinal = zonaData.id
  }

  const solapado = await checkSolapamiento(zonaIdFinal, fecha, hora_inicio, hora_fin)
  if (solapado) {
    return NextResponse.json({ error: 'Ya existe una reserva para esa zona en ese horario' }, { status: 409 })
  }

  const { data, error } = await createReserva({
    id_zona: zonaIdFinal,
    id_usuario: usuario_id,
    fecha,
    hora_inicio,
    hora_fin,
    estado: estado ?? 'pendiente',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data, { status: 201 })
}
