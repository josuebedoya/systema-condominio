'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Modal, TextInput, Select, Badge, Group, Stack,
  Title, Text, Paper, Loader, Center, SimpleGrid, Card, ScrollArea,
  Divider, ActionIcon, NumberInput, Grid
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { DollarSign, CheckCircle2, Clock, AlertTriangle, Zap, X, Search } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../../services/supabaseClient'
import { useAuth } from '../../../context/AuthContext'

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'nequi', label: 'Nequi' },
  { value: 'daviplata', label: 'Daviplata' },
  { value: 'pse', label: 'PSE' },
]

const estadoColor = { pendiente: 'yellow', pagada: 'green', mora: 'red' }

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function mesActual() { return String(new Date().getMonth() + 1).padStart(2, '0') }
function anioActual() { return String(new Date().getFullYear()) }
function mesLabel(mesStr) {
  if (!mesStr) return '—'
  return format(parseISO(mesStr), "MMMM yyyy", { locale: es })
}

export default function PagosPage() {
  const { perfil, rol } = useAuth()
  const esAdmin = rol === 'administrador'

  const [cuotas, setCuotas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroMes, setFiltroMes] = useState(mesActual())
  const [filtroAnio, setFiltroAnio] = useState(anioActual())
  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const [modalPago, { open: abrirModalPago, close: cerrarModalPago }] = useDisclosure(false)
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null)
  const [formPago, setFormPago] = useState({ monto: '', metodo_pago: 'efectivo' })
  const [guardandoPago, setGuardandoPago] = useState(false)
  const [generando, setGenerando] = useState(false)

  const totalPendiente = cuotas.filter(c => c.estado === 'pendiente').reduce((s, c) => s + Number(c.monto_base ?? 0), 0)
  const totalPagado = cuotas.filter(c => c.estado === 'pagada').reduce((s, c) => s + Number(c.monto_base ?? 0), 0)
  const totalMora = cuotas.filter(c => c.estado === 'mora').reduce((s, c) => s + Number(c.monto_base ?? 0) + Number(c.interes_mora ?? 0), 0)

  const cargarCuotas = useCallback(async () => {
    setLoading(true)
    try {
      const mesStr = `${filtroAnio}-${filtroMes}-01`

      const getMisUnidadesIds = async () => {
        let { data: misUnidades, error: errUnidades } = await supabase
          .from('unidades').select('id').eq('propietario_id', perfil.id)
        if (errUnidades?.code === '42703') {
          const fallback = await supabase
            .from('unidades').select('id').eq('id_propietario', perfil.id)
          misUnidades = fallback.data
          errUnidades = fallback.error
        }
        if (errUnidades) throw errUnidades
        return (misUnidades ?? []).map((u) => u.id)
      }

      let query = supabase
        .from('cuotas')
        .select('id, id_unidad, mes, monto_base, interes_mora, estado, pagos(fecha, monto, metodo_pago)')
        .eq('mes', mesStr)
        .order('created_at', { ascending: false })

      if (!esAdmin && perfil?.id) {
        const ids = await getMisUnidadesIds()
        if (ids.length === 0) { setCuotas([]); setLoading(false); return }
        query = query.in('id_unidad', ids)
      }

      if (filtroEstado) query = query.eq('estado', filtroEstado)

      const { data, error } = await query
      if (error) throw error

      const cuotasBase = data ?? []
      const unidadIds = [...new Set(cuotasBase.map((c) => c.id_unidad).filter(Boolean))]

      let unidadesMap = new Map()
      let ownerIds = []
      if (unidadIds.length > 0) {
        let { data: unidadesData, error: errUnidadesData } = await supabase
          .from('unidades')
          .select('id, numero, torre, propietario_id')
          .in('id', unidadIds)

        if (errUnidadesData?.code === '42703') {
          const fallback = await supabase
            .from('unidades')
            .select('id, numero, torre, id_propietario')
            .in('id', unidadIds)
          unidadesData = (fallback.data ?? []).map((u) => ({
            ...u,
            propietario_id: u.id_propietario ?? null,
          }))
          errUnidadesData = fallback.error
        }
        if (errUnidadesData) throw errUnidadesData

        unidadesMap = new Map((unidadesData ?? []).map((u) => [u.id, u]))
        ownerIds = [...new Set((unidadesData ?? []).map((u) => u.propietario_id).filter(Boolean))]
      }

      let ownersMap = new Map()
      if (ownerIds.length > 0) {
        const { data: owners, error: errOwners } = await supabase
          .from('usuarios')
          .select('id, nombre, email')
          .in('id', ownerIds)
        if (errOwners) throw errOwners
        ownersMap = new Map((owners ?? []).map((o) => [o.id, o]))
      }

      const resultadoConUnidades = cuotasBase.map((c) => {
        const unidad = unidadesMap.get(c.id_unidad)
        const owner = unidad?.propietario_id ? ownersMap.get(unidad.propietario_id) ?? null : null
        return {
          ...c,
          unidades: unidad
            ? {
                numero: unidad.numero,
                torre: unidad.torre,
                propietario_id: unidad.propietario_id ?? null,
                usuarios: owner,
              }
            : null,
        }
      })

      let resultado = resultadoConUnidades
      if (busqueda) {
        const b = busqueda.toLowerCase()
        resultado = resultado.filter(c =>
          c.unidades?.numero?.toLowerCase().includes(b) ||
          c.unidades?.usuarios?.nombre?.toLowerCase().includes(b)
        )
      }
      setCuotas(resultado)
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al cargar cuotas', message: err.message })
    } finally {
      setLoading(false)
    }
  }, [perfil, esAdmin, filtroMes, filtroAnio, filtroEstado, busqueda])

  useEffect(() => { cargarCuotas() }, [cargarCuotas])

  function tipoATarifa(tipo) {
    if (tipo === 'local' || tipo === 'comercial') return 'comercial'
    return 'residencial'
  }

  async function generarCobros() {
    setGenerando(true)
    try {
      const [{ data: unidades, error: errU }, { data: tarifas, error: errT }] = await Promise.all([
        supabase.from('unidades').select('id, tipo').not('estado', 'in', '(inactivo,desocupada)'),
        supabase.from('tarifas').select('tipo, monto_base'),
      ])
      if (errU) throw errU
      if (errT) throw errT

      const mesNum = parseInt(filtroMes, 10)
      const anioNum = parseInt(filtroAnio, 10)
      const mesStr = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`
      const tarifaMap = {}
      for (const t of tarifas ?? []) tarifaMap[t.tipo] = t.monto_base

      const { data: existentes } = await supabase
        .from('cuotas').select('id_unidad').eq('mes', mesStr)
      const existentesSet = new Set((existentes ?? []).map(e => e.id_unidad))

      const nuevas = (unidades ?? [])
        .filter(u => !existentesSet.has(u.id) && tarifaMap[tipoATarifa(u.tipo)] != null)
        .map(u => ({
          id_unidad: u.id,
          monto_base: tarifaMap[tipoATarifa(u.tipo)],
          estado: 'pendiente',
          mes: mesStr,
        }))

      if (nuevas.length === 0) {
        notifications.show({ color: 'blue', message: 'Todas las unidades ya tienen cuota para este mes.' })
        return
      }

      const { error } = await supabase.from('cuotas').insert(nuevas)
      if (error) throw error

      notifications.show({ color: 'green', title: 'Cobros generados', message: `${nuevas.length} cuota(s) creadas para ${MESES[mesNum - 1]} ${anioNum}.` })
      cargarCuotas()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al generar cobros', message: err.message })
    } finally {
      setGenerando(false)
    }
  }

  function abrirPago(cuota) {
    setCuotaSeleccionada(cuota)
    setFormPago({
      monto: (Number(cuota.monto_base ?? 0) + Number(cuota.interes_mora ?? 0)).toString(),
      metodo_pago: 'efectivo',
    })
    abrirModalPago()
  }

  async function handleRegistrarPago() {
    if (!formPago.monto || Number(formPago.monto) <= 0) {
      notifications.show({ color: 'yellow', message: 'Ingresa un monto válido.' })
      return
    }
    setGuardandoPago(true)
    try {
      const [{ error: errPago }, { error: errCuota }] = await Promise.all([
        supabase.from('pagos').insert({
          id_cuota: cuotaSeleccionada.id,
          id_propietario: perfil?.id ?? cuotaSeleccionada.unidades?.usuarios?.id ?? null,
          fecha: format(new Date(), 'yyyy-MM-dd'),
          monto: Number(formPago.monto),
          metodo_pago: formPago.metodo_pago,
        }),
        supabase.from('cuotas').update({ estado: 'pagada' }).eq('id', cuotaSeleccionada.id),
      ])
      if (errPago) throw errPago
      if (errCuota) throw errCuota

      notifications.show({ color: 'green', title: 'Pago registrado', message: `$${Number(formPago.monto).toLocaleString('es-CO')} registrado correctamente.` })
      cerrarModalPago()
      cargarCuotas()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al registrar pago', message: err.message })
    } finally {
      setGuardandoPago(false)
    }
  }

  const aniosOpciones = Array.from({ length: 5 }, (_, i) => {
    const a = String(new Date().getFullYear() - 2 + i)
    return { value: a, label: a }
  })

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Stack gap={2}>
            <Title order={3}>Gestión de Pagos</Title>
            <Text size="sm" c="dimmed">
              {cuotas.length} cuota{cuotas.length !== 1 ? 's' : ''} encontrada{cuotas.length !== 1 ? 's' : ''}
            </Text>
          </Stack>
          {esAdmin && (
            <Button leftSection={<Zap size={16} />} color="orange" onClick={generarCobros} loading={generando}>
              Generar cobros del mes
            </Button>
          )}
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group gap="sm">
              <Clock size={24} color="var(--mantine-color-yellow-6)" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Pendiente</Text>
                <Text fw={700} size="lg">${totalPendiente.toLocaleString('es-CO')}</Text>
              </Stack>
            </Group>
          </Card>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group gap="sm">
              <CheckCircle2 size={24} color="var(--mantine-color-green-6)" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Recaudado</Text>
                <Text fw={700} size="lg">${totalPagado.toLocaleString('es-CO')}</Text>
              </Stack>
            </Group>
          </Card>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group gap="sm">
              <AlertTriangle size={24} color="var(--mantine-color-red-6)" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">En mora</Text>
                <Text fw={700} size="lg">${totalMora.toLocaleString('es-CO')}</Text>
              </Stack>
            </Group>
          </Card>
        </SimpleGrid>

        <Paper p="md" radius="md" withBorder>
          <Grid gutter="sm" align="flex-end">
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Select
                label="Mes"
                data={MESES.map((m, i) => ({ value: String(i + 1).padStart(2, '0'), label: m }))}
                value={filtroMes}
                onChange={v => setFiltroMes(v ?? mesActual())}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 2 }}>
              <Select
                label="Año"
                data={aniosOpciones}
                value={filtroAnio}
                onChange={v => setFiltroAnio(v ?? anioActual())}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Select
                label="Estado"
                placeholder="Todos"
                data={['pendiente', 'pagada', 'mora'].map(e => ({
                  value: e,
                  label: e.charAt(0).toUpperCase() + e.slice(1),
                }))}
                value={filtroEstado}
                onChange={v => setFiltroEstado(v ?? '')}
                clearable
              />
            </Grid.Col>
            {esAdmin && (
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Buscar unidad / propietario"
                  placeholder="Número o nombre..."
                  leftSection={<Search size={15} />}
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  rightSection={
                    busqueda
                      ? <ActionIcon variant="subtle" size="sm" onClick={() => setBusqueda('')}><X size={14} /></ActionIcon>
                      : null
                  }
                />
              </Grid.Col>
            )}
          </Grid>
        </Paper>

        <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
          {loading ? (
            <Center h={300}><Loader size="md" /></Center>
          ) : cuotas.length === 0 ? (
            <Center h={200}>
              <Stack align="center" gap="xs">
                <DollarSign size={40} color="var(--mantine-color-gray-4)" />
                <Text size="sm" c="dimmed">No hay cuotas para los filtros seleccionados.</Text>
              </Stack>
            </Center>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover verticalSpacing="sm" miw={700}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Unidad</Table.Th>
                    {esAdmin && <Table.Th>Propietario</Table.Th>}
                    <Table.Th>Mes</Table.Th>
                    <Table.Th>Monto base</Table.Th>
                    <Table.Th>Interés mora</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th>Método pago</Table.Th>
                    <Table.Th>Fecha pago</Table.Th>
                    <Table.Th ta="center">Acción</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {cuotas.map(c => {
                    const ultimoPago = c.pagos?.[c.pagos.length - 1]
                    return (
                      <Table.Tr key={c.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {c.unidades?.numero ?? '—'}{c.unidades?.torre ? ` T.${c.unidades.torre}` : ''}
                          </Text>
                        </Table.Td>
                        {esAdmin && (
                          <Table.Td>
                            <Text size="sm">{c.unidades?.usuarios?.nombre ?? '—'}</Text>
                          </Table.Td>
                        )}
                        <Table.Td>
                          <Text size="sm" tt="capitalize">{mesLabel(c.mes)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600}>${Number(c.monto_base ?? 0).toLocaleString('es-CO')}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c={Number(c.interes_mora) > 0 ? 'red' : 'dimmed'}>
                            {Number(c.interes_mora) > 0 ? `$${Number(c.interes_mora).toLocaleString('es-CO')}` : '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge size="sm" color={estadoColor[c.estado] ?? 'gray'} variant="light" tt="capitalize">
                            {c.estado}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" tt="capitalize">{ultimoPago?.metodo_pago ?? '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {ultimoPago?.fecha
                              ? format(parseISO(ultimoPago.fecha), 'dd MMM yyyy', { locale: es })
                              : '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="center">
                          {(c.estado === 'pendiente' || c.estado === 'mora') && (
                            <Button size="xs" variant="light" color="green" onClick={() => abrirPago(c)}>
                              Registrar pago
                            </Button>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Paper>
      </Stack>

      <Modal
        opened={modalPago}
        onClose={cerrarModalPago}
        title={
          <Group gap="xs">
            <DollarSign size={18} />
            <Text fw={600}>Registrar pago</Text>
          </Group>
        }
        size="sm"
        centered
        overlayProps={{ blur: 3 }}
      >
        {cuotaSeleccionada && (
          <Stack gap="sm">
            <Paper p="sm" radius="sm" bg="gray.0">
              <Stack gap={2}>
                <Text size="sm" fw={500} tt="capitalize">
                  Administración {mesLabel(cuotaSeleccionada.mes)}
                </Text>
                <Text size="xs" c="dimmed">
                  Unidad {cuotaSeleccionada.unidades?.numero}
                  {cuotaSeleccionada.unidades?.usuarios?.nombre
                    ? ` · ${cuotaSeleccionada.unidades.usuarios.nombre}`
                    : ''}
                </Text>
              </Stack>
            </Paper>
            <NumberInput
              label="Monto pagado"
              placeholder="0"
              required
              min={0}
              prefix="$"
              thousandSeparator="."
              decimalSeparator=","
              value={formPago.monto}
              onChange={v => setFormPago(p => ({ ...p, monto: v }))}
            />
            <Select
              label="Método de pago"
              data={METODOS_PAGO}
              value={formPago.metodo_pago}
              onChange={v => setFormPago(p => ({ ...p, metodo_pago: v ?? 'efectivo' }))}
            />
            <Divider />
            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={cerrarModalPago} disabled={guardandoPago}>
                Cancelar
              </Button>
              <Button
                onClick={handleRegistrarPago}
                loading={guardandoPago}
                color="green"
                leftSection={<CheckCircle2 size={14} />}
              >
                Confirmar pago
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  )
}
