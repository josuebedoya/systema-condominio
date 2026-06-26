import { NextResponse } from 'next/server'
import { getUnidadesParaCobro, getCuotasExistentes, createCuotas, getTarifas } from '@/supabase/helpers/pagos'

const TIPO_A_TARIFA = {
  apartamento: 'apartamento',
  local:       'local',
  oficina:     'oficina',
  parqueadero: 'parqueadero',
  bodega:      'bodega',
}

export async function POST(request) {
  const body = await request.json()
  const { mes } = body

  if (!mes) {
    return NextResponse.json({ error: 'mes es requerido (formato YYYY-MM-DD)' }, { status: 400 })
  }

  const [{ data: unidades, error: errU }, { data: tarifas, error: errT }, { data: existentes, error: errE }] =
    await Promise.all([getUnidadesParaCobro(), getTarifas(), getCuotasExistentes(mes)])

  if (errU) return NextResponse.json({ error: errU.message }, { status: 500 })
  if (errT) return NextResponse.json({ error: errT.message }, { status: 500 })
  if (errE) return NextResponse.json({ error: errE.message }, { status: 500 })

  const tarifaMap = Object.fromEntries((tarifas ?? []).map((t) => [t.tipo, t.monto_base]))
  const idsExistentes = new Set((existentes ?? []).map((c) => c.id_unidad))

  const nuevas = (unidades ?? [])
    .filter((u) => !idsExistentes.has(u.id) && tarifaMap[TIPO_A_TARIFA[u.tipo]] != null)
    .map((u) => ({
      id_unidad:  u.id,
      monto_base: tarifaMap[TIPO_A_TARIFA[u.tipo]],
      estado:     'pendiente',
      mes,
    }))

  if (nuevas.length === 0) {
    return NextResponse.json({ message: 'Todas las unidades ya tienen cuota para este mes', generadas: 0 })
  }

  const { error: errC } = await createCuotas(nuevas)
  if (errC) return NextResponse.json({ error: errC.message }, { status: 500 })

  return NextResponse.json({ message: `${nuevas.length} cuota(s) generada(s)`, generadas: nuevas.length }, { status: 201 })
}
