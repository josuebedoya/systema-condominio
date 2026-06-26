import { NextResponse } from 'next/server'
import { getTarifas } from '@/supabase/helpers/pagos'

export async function GET() {
  const { data, error } = await getTarifas()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
