import { NextResponse } from 'next/server'
import { getItems } from '@/supabase/helpers/base'
import { createPago } from '@/supabase/helpers/pagos'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const fechaInicio = searchParams.get('fecha_inicio')
  const fechaFin    = searchParams.get('fecha_fin')
  const cuotaId     = searchParams.get('cuota_id')

  const filters = []
  if (fechaInicio) filters.push({ op: 'gte', column: 'fecha', value: fechaInicio })
  if (fechaFin)    filters.push({ op: 'lte', column: 'fecha', value: fechaFin })
  if (cuotaId)     filters.push({ op: 'eq',  column: 'id_cuota', value: cuotaId })

  const { data, error } = await getItems('pagos', {
    select: 'id, id_cuota, id_propietario, monto, fecha, metodo_pago, created_at',
    filters,
    order: [{ column: 'fecha', ascending: false }],
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request) {
  const body = await request.json()
  const { id_cuota, id_propietario, monto, metodo_pago } = body

  if (!id_cuota || monto === undefined) {
    return NextResponse.json({ error: 'id_cuota y monto son requeridos' }, { status: 400 })
  }

  const { data, error } = await createPago({
    id_cuota,
    id_propietario: id_propietario ?? null,
    monto: Number(monto),
    metodo_pago: metodo_pago ?? null,
    fecha: new Date().toISOString().split('T')[0],
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] ?? data, { status: 201 })
}
