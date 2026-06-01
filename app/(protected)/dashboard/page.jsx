'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Grid, Card, Text, Title, Group, Stack, Badge, Table,
  Paper, Loader, Center,
  ScrollArea, Skeleton
} from '@mantine/core'

const SectionIcon = ({ color, children }) => (
  <div style={{ width: 32, height: 32, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    {children}
  </div>
)
import { notifications } from '@mantine/notifications'
import {
  Home, AlertTriangle, MessageSquare, CalendarDays,
  TrendingUp, Clock, CheckCircle2, AlertCircle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/services/supabaseClient'
import { useAuth } from '@/context/AuthContext'

// ─── Colores y helpers ────────────────────────────────────────────────────────

const statColorMap = {
  blue:   { bg: 'rgba(59,130,246,0.1)',  icon: '#3b82f6', num: '#1d4ed8' },
  red:    { bg: 'rgba(239,68,68,0.1)',   icon: '#ef4444', num: '#dc2626' },
  orange: { bg: 'rgba(245,158,11,0.1)',  icon: '#f59e0b', num: '#b45309' },
  green:  { bg: 'rgba(16,185,129,0.1)',  icon: '#10b981', num: '#047857' },
  brand:  { bg: 'rgba(15,191,176,0.1)',  icon: '#0fbfb0', num: '#088d82' },
}

const estadoPQRColor = {
  abierta: 'orange',
  'en_proceso': 'blue',
  resuelta: 'green',
  cerrada: 'gray',
}

const estadoReservaColor = {
  aprobada: 'green',
  pendiente: 'yellow',
  rechazada: 'red',
  cancelada: 'gray',
}

function StatCard({ label, value, icon: Icon, color, loading }) {
  const c = statColorMap[color] ?? statColorMap.brand
  return (
    <div className="card-lift" style={{
      background: '#fff',
      borderRadius: 14,
      boxShadow: '0 2px 14px rgba(15,31,61,0.08), 0 1px 3px rgba(15,31,61,0.04)',
      border: '1px solid rgba(15,31,61,0.06)',
      overflow: 'hidden',
    }}>
      {/* Colored top accent line */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${c.icon} 0%, ${c.bg.replace('0.1)', '0.4)')} 100%)` }} />
      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            {label}
          </span>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={19} color={c.icon} strokeWidth={2} />
          </div>
        </div>
        {loading ? (
          <Skeleton height={36} width={60} radius="sm" />
        ) : (
          <div style={{ fontSize: 36, fontWeight: 800, color: c.num, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {value ?? '—'}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Vista Administrador ──────────────────────────────────────────────────────

function AdminDashboard() {
  const [stats, setStats] = useState({ unidades: 0, mora: 0, pqrs: 0, reservasHoy: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [chartData, setChartData] = useState([])
  const [chartLoading, setChartLoading] = useState(true)
  const [ultimasPQRs, setUltimasPQRs] = useState([])
  const [pqrsLoading, setPqrsLoading] = useState(true)
  const [reservasHoy, setReservasHoy] = useState([])
  const [reservasLoading, setReservasLoading] = useState(true)

  const cargarStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const hoy = format(new Date(), 'yyyy-MM-dd')

      const [
        { count: totalUnidades },
        { count: enMora },
        { count: pqrsActivas },
        { count: reservasDeHoy },
      ] = await Promise.all([
        supabase.from('unidades').select('*', { count: 'exact', head: true }),
        supabase.from('unidades').select('*', { count: 'exact', head: true }).eq('estado', 'mora'),
        supabase.from('pqrs').select('*', { count: 'exact', head: true }).neq('estado', 'cerrada'),
        supabase.from('reservas').select('*', { count: 'exact', head: true }).eq('fecha', hoy),
      ])

      setStats({
        unidades: totalUnidades ?? 0,
        mora: enMora ?? 0,
        pqrs: pqrsActivas ?? 0,
        reservasHoy: reservasDeHoy ?? 0,
      })
    } catch {
      notifications.show({ color: 'red', title: 'Error', message: 'No se pudieron cargar las estadísticas.' })
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const cargarChart = useCallback(async () => {
    setChartLoading(true)
    try {
      const meses = Array.from({ length: 6 }, (_, i) => {
        const fecha = subMonths(new Date(), 5 - i)
        return {
          label: format(fecha, 'MMM', { locale: es }),
          inicio: format(startOfMonth(fecha), 'yyyy-MM-dd'),
          fin: format(endOfMonth(fecha), 'yyyy-MM-dd'),
        }
      })

      const resultados = await Promise.all(
        meses.map(({ inicio, fin }) =>
          supabase
            .from('pagos')
            .select('monto')
            .gte('fecha', inicio)
            .lte('fecha', fin)
        )
      )

      const data = meses.map(({ label }, i) => {
        const filas = resultados[i].data ?? []
        const total = filas.reduce((sum, p) => sum + (Number(p.monto) || 0), 0)
        return { mes: label.charAt(0).toUpperCase() + label.slice(1), total }
      })

      setChartData(data)
    } catch {
      notifications.show({ color: 'red', title: 'Error', message: 'No se pudo cargar la gráfica de pagos.' })
    } finally {
      setChartLoading(false)
    }
  }, [])

  const cargarPQRs = useCallback(async () => {
    setPqrsLoading(true)
    try {
      const { data, error } = await supabase
        .from('pqrs')
        .select('id, asunto, estado, tipo, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) {
        notifications.show({ color: 'red', title: 'Error', message: 'No se pudieron cargar las PQRs.' })
        return
      }
      setUltimasPQRs(data ?? [])
    } catch {
      notifications.show({ color: 'red', title: 'Error', message: 'No se pudieron cargar las PQRs.' })
    } finally {
      setPqrsLoading(false)
    }
  }, [])

  const cargarReservasHoy = useCallback(async () => {
    setReservasLoading(true)
    try {
      const hoy = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('reservas')
        .select('id, hora_inicio, hora_fin, estado, zonas_comunes:id_zona(nombre), usuarios:id_usuario(nombre)')
        .eq('fecha', hoy)
        .order('hora_inicio')
      if (error) {
        notifications.show({ color: 'red', title: 'Error', message: 'No se pudieron cargar las reservas de hoy.' })
        return
      }
      setReservasHoy(data ?? [])
    } catch {
      notifications.show({ color: 'red', title: 'Error', message: 'No se pudieron cargar las reservas de hoy.' })
    } finally {
      setReservasLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarStats()
    cargarChart()
    cargarPQRs()
    cargarReservasHoy()
  }, [cargarStats, cargarChart, cargarPQRs, cargarReservasHoy])

  const statCards = [
    { label: 'Total Unidades', value: stats.unidades, icon: Home, color: 'blue' },
    { label: 'En Mora', value: stats.mora, icon: AlertTriangle, color: 'red' },
    { label: 'PQRs Activas', value: stats.pqrs, icon: MessageSquare, color: 'orange' },
    { label: 'Reservas Hoy', value: stats.reservasHoy, icon: CalendarDays, color: 'green' },
  ]

  const maxChart = Math.max(...chartData.map((d) => d.total), 1)

  return (
    <Stack gap="lg">
      {/* Stat Cards */}
      <Grid gutter="md">
        {statCards.map((card) => (
          <Grid.Col key={card.label} span={{ base: 12, xs: 6, md: 3 }}>
            <StatCard {...card} loading={statsLoading} />
          </Grid.Col>
        ))}
      </Grid>

      {/* Gráfica + Reservas hoy */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group mb="md" justify="space-between">
              <Group gap={8}>
                <div style={{ width: 4, height: 18, borderRadius: 2, background: '#0fbfb0' }} />
                <Title order={5} style={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Recaudación — últimos 6 meses</Title>
              </Group>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(15,191,176,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} color="#0fbfb0" />
              </div>
            </Group>
            {chartLoading ? (
              <Center h={220}><Loader size="sm" /></Center>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => [`$${Number(v).toLocaleString('es-CO')}`, 'Recaudado']}
                    contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid rgba(15,31,61,0.08)', boxShadow: '0 4px 16px rgba(15,31,61,0.1)', fontFamily: 'Inter, system-ui' }}
                    cursor={{ fill: 'rgba(15,31,61,0.03)' }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#0fbfb0" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group mb="md" justify="space-between">
              <Group gap={8}>
                <div style={{ width: 4, height: 18, borderRadius: 2, background: '#10b981' }} />
                <Title order={5} style={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Reservas de hoy</Title>
              </Group>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarDays size={16} color="#10b981" />
              </div>
            </Group>
            {reservasLoading ? (
              <Stack gap="xs">
                {[1, 2, 3].map((i) => <Skeleton key={i} height={52} radius="sm" />)}
              </Stack>
            ) : reservasHoy.length === 0 ? (
              <Center h={120}>
                <Stack align="center" gap="xs">
                  <CheckCircle2 size={32} color="var(--mantine-color-green-5)" />
                  <Text size="sm" c="dimmed">Sin reservas para hoy</Text>
                </Stack>
              </Center>
            ) : (
              <ScrollArea h={200} offsetScrollbars>
                <Stack gap="xs">
                  {reservasHoy.map((r) => (
                    <Paper key={r.id} p="xs" radius="sm" withBorder>
                      <Group justify="space-between" wrap="nowrap">
                        <Stack gap={2} style={{ minWidth: 0 }}>
                          <Text size="sm" fw={600} truncate>
                            {r.zonas_comunes?.nombre ?? 'Zona'}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {r.hora_inicio} – {r.hora_fin}
                          </Text>
                          <Text size="xs" c="dimmed" truncate>
                            {r.usuarios?.nombre ?? '—'}
                          </Text>
                        </Stack>
                        <Badge
                          size="xs"
                          color={estadoReservaColor[r.estado] ?? 'gray'}
                          variant="light"
                        >
                          {r.estado}
                        </Badge>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </ScrollArea>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Últimas PQRs */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group mb="md" justify="space-between">
          <Group gap={8}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: '#f59e0b' }} />
            <Title order={5} style={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Últimas PQRs</Title>
          </Group>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={16} color="#f59e0b" />
          </div>
        </Group>
        {pqrsLoading ? (
          <Stack gap="xs">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={40} radius="sm" />)}
          </Stack>
        ) : ultimasPQRs.length === 0 ? (
          <Center h={80}>
            <Text size="sm" c="dimmed">No hay PQRs registradas</Text>
          </Center>
        ) : (
          <ScrollArea>
            <Table striped highlightOnHover withTableBorder={false} verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Asunto</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Fecha</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {ultimasPQRs.map((pqr) => (
                  <Table.Tr key={pqr.id}>
                    <Table.Td>
                      <Text size="sm" fw={500} lineClamp={1}>{pqr.asunto}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" style={{ textTransform: 'capitalize' }}>{pqr.tipo ?? '—'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        color={estadoPQRColor[pqr.estado] ?? 'gray'}
                        variant="light"
                        style={{ textTransform: 'capitalize' }}
                      >
                        {pqr.estado?.replace('_', ' ')}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {pqr.created_at
                          ? format(parseISO(pqr.created_at), 'dd MMM yyyy', { locale: es })
                          : '—'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Card>
    </Stack>
  )
}

// ─── Vista Residente / Propietario ────────────────────────────────────────────

function ResidenteDashboard({ perfil }) {
  const [misPQRs, setMisPQRs] = useState([])
  const [pqrsLoading, setPqrsLoading] = useState(true)
  const [misReservas, setMisReservas] = useState([])
  const [reservasLoading, setReservasLoading] = useState(true)
  const [hoy, setHoy] = useState('')
  useEffect(() => {
    setHoy(format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es }))
  }, [])

  const cargarMisPQRs = useCallback(async () => {
    if (!perfil?.id) return
    setPqrsLoading(true)
    try {
      const { data, error } = await supabase
        .from('pqrs')
        .select('id, asunto, estado, tipo, created_at')
        .eq('usuario_id', perfil.id)
        .neq('estado', 'cerrada')
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) {
        notifications.show({ color: 'red', title: 'Error', message: 'No se pudieron cargar tus PQRs.' })
        return
      }
      setMisPQRs(data ?? [])
    } catch {
      notifications.show({ color: 'red', title: 'Error', message: 'No se pudieron cargar tus PQRs.' })
    } finally {
      setPqrsLoading(false)
    }
  }, [perfil?.id])

  const cargarMisReservas = useCallback(async () => {
    if (!perfil?.id) return
    setReservasLoading(true)
    try {
      const hoy = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('reservas')
        .select('id, fecha, hora_inicio, hora_fin, estado, zonas_comunes:id_zona(nombre)')
        .eq('id_usuario', perfil.id)
        .gte('fecha', hoy)
        .order('fecha')
        .limit(5)
      if (error) {
        notifications.show({ color: 'red', title: 'Error', message: 'No se pudieron cargar tus reservas.' })
        return
      }
      setMisReservas(data ?? [])
    } catch {
      notifications.show({ color: 'red', title: 'Error', message: 'No se pudieron cargar tus reservas.' })
    } finally {
      setReservasLoading(false)
    }
  }, [perfil?.id])

  useEffect(() => {
    cargarMisPQRs()
    cargarMisReservas()
  }, [cargarMisPQRs, cargarMisReservas])

  return (
    <Stack gap="lg">
      <div style={{
        padding: '22px 26px', borderRadius: 14,
        background: 'linear-gradient(145deg, #0c1a35 0%, #152040 100%)',
        boxShadow: '0 4px 20px rgba(15,31,61,0.25)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #0fbfb0 0%, #088d82 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 800, color: '#fff',
          boxShadow: '0 2px 12px rgba(15,191,176,0.4)',
        }}>
          {perfil?.nombre?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            Bienvenido, {perfil?.nombre ?? 'Usuario'}
          </div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 2, textTransform: 'capitalize' }}>
            {hoy}
          </div>
        </div>
      </div>

      <Grid gutter="md">
        {/* Mis PQRs */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group mb="md" justify="space-between">
              <Group gap={8}>
                <div style={{ width: 4, height: 18, borderRadius: 2, background: '#f59e0b' }} />
                <Title order={5} style={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Mis PQRs abiertas</Title>
              </Group>
              <SectionIcon color="rgba(245,158,11,0.1)"><MessageSquare size={16} color="#f59e0b" /></SectionIcon>
            </Group>
            {pqrsLoading ? (
              <Stack gap="xs">
                {[1, 2, 3].map((i) => <Skeleton key={i} height={56} radius="sm" />)}
              </Stack>
            ) : misPQRs.length === 0 ? (
              <Center h={100}>
                <Stack align="center" gap="xs">
                  <CheckCircle2 size={32} color="var(--mantine-color-green-5)" />
                  <Text size="sm" c="dimmed">No tienes PQRs activas</Text>
                </Stack>
              </Center>
            ) : (
              <Stack gap="xs">
                {misPQRs.map((pqr) => (
                  <Paper key={pqr.id} p="sm" radius="sm" withBorder>
                    <Group justify="space-between" wrap="nowrap">
                      <Stack gap={2} style={{ minWidth: 0 }}>
                        <Text size="sm" fw={600} truncate>{pqr.asunto}</Text>
                        <Group gap={6}>
                          <Text size="xs" c="dimmed" style={{ textTransform: 'capitalize' }}>{pqr.tipo ?? '—'}</Text>
                          <Text size="xs" c="dimmed">·</Text>
                          <Text size="xs" c="dimmed">
                            {pqr.created_at
                              ? format(parseISO(pqr.created_at), 'dd MMM', { locale: es })
                              : '—'}
                          </Text>
                        </Group>
                      </Stack>
                      <Badge
                        size="xs"
                        color={estadoPQRColor[pqr.estado] ?? 'gray'}
                        variant="light"
                        style={{ textTransform: 'capitalize', flexShrink: 0 }}
                      >
                        {pqr.estado?.replace('_', ' ')}
                      </Badge>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>

        {/* Mis reservas */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group mb="md" justify="space-between">
              <Group gap={8}>
                <div style={{ width: 4, height: 18, borderRadius: 2, background: '#10b981' }} />
                <Title order={5} style={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Mis reservas próximas</Title>
              </Group>
              <SectionIcon color="rgba(16,185,129,0.1)"><CalendarDays size={16} color="#10b981" /></SectionIcon>
            </Group>
            {reservasLoading ? (
              <Stack gap="xs">
                {[1, 2, 3].map((i) => <Skeleton key={i} height={56} radius="sm" />)}
              </Stack>
            ) : misReservas.length === 0 ? (
              <Center h={100}>
                <Stack align="center" gap="xs">
                  <AlertCircle size={32} color="var(--mantine-color-gray-4)" />
                  <Text size="sm" c="dimmed">No tienes reservas próximas</Text>
                </Stack>
              </Center>
            ) : (
              <Stack gap="xs">
                {misReservas.map((r) => (
                  <Paper key={r.id} p="sm" radius="sm" withBorder>
                    <Group justify="space-between" wrap="nowrap">
                      <Stack gap={2} style={{ minWidth: 0 }}>
                        <Text size="sm" fw={600} truncate>
                          {r.zonas_comunes?.nombre ?? 'Zona común'}
                        </Text>
                        <Group gap={6}>
                          <Clock size={12} color="var(--mantine-color-dimmed)" />
                          <Text size="xs" c="dimmed">
                            {r.fecha
                              ? format(parseISO(r.fecha), 'dd MMM yyyy', { locale: es })
                              : '—'}
                            {' · '}
                            {r.hora_inicio} – {r.hora_fin}
                          </Text>
                        </Group>
                      </Stack>
                      <Badge
                        size="xs"
                        color={estadoReservaColor[r.estado] ?? 'gray'}
                        variant="light"
                        style={{ flexShrink: 0 }}
                      >
                        {r.estado}
                      </Badge>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { perfil, rol, loading } = useAuth()

  if (loading) {
    return (
      <Center h="60vh">
        <Loader size="lg" />
      </Center>
    )
  }

  if (rol === 'administrador' || rol === 'portero') {
    return <AdminDashboard />
  }

  return <ResidenteDashboard perfil={perfil} />
}
