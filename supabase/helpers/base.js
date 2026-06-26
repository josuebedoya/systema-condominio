import { supabase } from '@/services/supabaseClient'

export async function getItems(table, params = {}) {
  const {
    select = '*',
    filters = [],
    order = [],
    limit,
    range,
    count = false,
    head = false,
    single = false,
  } = params

  let q = supabase
    .from(table)
    .select(select, count || head ? { count: 'exact', head } : undefined)

  for (const f of filters) {
    switch (f.op) {
      case 'eq':    q = q.eq(f.column, f.value);                       break
      case 'neq':   q = q.neq(f.column, f.value);                      break
      case 'ilike': q = q.ilike(f.column, f.value);                    break
      case 'in':    q = q.in(f.column, f.value);                       break
      case 'gte':   q = q.gte(f.column, f.value);                      break
      case 'lte':   q = q.lte(f.column, f.value);                      break
      case 'is':    q = q.is(f.column, f.value);                       break
      case 'not':   q = q.not(f.column, f.op2 ?? 'is', f.value);      break
      case 'or':    q = q.or(f.value);                                  break
    }
  }

  for (const o of order) {
    q = q.order(o.column, { ascending: o.ascending ?? true, nullsFirst: o.nullsFirst ?? false })
  }

  if (range) q = q.range(range[0], range[1])
  if (limit)  q = q.limit(limit)
  if (single) return q.maybeSingle()

  return await q
}

export async function insertItem(table, payload) {
  const { data, error } = await supabase.from(table).insert(payload).select()
  return { data, error }
}

export async function updateItem(table, id, payload) {
  const { data, error } = await supabase.from(table).update(payload).eq('id', id).select()
  return { data, error }
}

export async function deleteItem(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  return { error }
}
