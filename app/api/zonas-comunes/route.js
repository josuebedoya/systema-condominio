import { NextResponse } from 'next/server'
import { getItems } from '@/supabase/helpers/base'

export async function GET() {
  const { data, error } = await getItems('zonas_comunes', {
    select: 'id, nombre, capacidad, descripcion, created_at',
    order: [{ column: 'nombre', ascending: true }],
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
