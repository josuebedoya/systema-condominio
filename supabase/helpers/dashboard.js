import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { getUnidadesCount, getUnidadesCountByEstado } from './unidades'
import { getPqrsCount } from './pqrs'
import { getReservasCountHoy, getReservasDeHoy } from './reservas'
import { getPagosByFecha } from './pagos'

export { getReservasDeHoy }

export async function getDashboardStats(fecha) {
  const hoy = fecha ?? format(new Date(), 'yyyy-MM-dd')

  const [
    { count: totalUnidades },
    { count: unidadesMora },
    { count: pqrsAbiertas },
    { count: reservasHoy },
  ] = await Promise.all([
    getUnidadesCount(),
    getUnidadesCountByEstado('mora'),
    getPqrsCount({ excluirEstado: 'cerrada' }),
    getReservasCountHoy(hoy),
  ])

  return { totalUnidades, unidadesMora, pqrsAbiertas, reservasHoy }
}

export async function getRecaudacionMeses(meses = 6) {
  const resultado = []

  for (let i = meses - 1; i >= 0; i--) {
    const fecha = subMonths(new Date(), i)
    const inicio = format(startOfMonth(fecha), 'yyyy-MM-dd')
    const fin    = format(endOfMonth(fecha),   'yyyy-MM-dd')
    const mes    = format(fecha, 'MMM yyyy')

    const { data: pagos } = await getPagosByFecha(inicio, fin)
    const total = (pagos ?? []).reduce((acc, p) => acc + (p.monto ?? 0), 0)

    resultado.push({ mes, total })
  }

  return resultado
}
