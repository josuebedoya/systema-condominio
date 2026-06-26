'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Modal, TextInput, Select, Badge, Group, Stack,
  Title, Text, Paper, Loader, Center, SimpleGrid, Card, ScrollArea,
  Divider, ActionIcon, Tabs, Box
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import {
  Plus, CalendarDays, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight
} from 'lucide-react'
import {
  format, parseISO, startOfWeek, addDays, isSameDay, addWeeks, subWeeks
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../../../context/AuthContext'
import {
  getReservas,
  getZonaPorNombre,
  getZonaPorNombreExacto,
  createZona,
  checkSolapamiento,
  createReserva,
  updateReservaEstado,
} from '@/supabase/helpers/reservas'

const ZONAS = ['Salón Comunal', 'Piscina', 'Gimnasio', 'Cancha Múltiple']

const estadoColor = {
  pendiente: 'yellow',
  aprobada: 'green',
  rechazada: 'red',
  cancelada: 'gray',
}

const FORM_INICIAL = { zona: '', fecha: '', hora_inicio: '', hora_fin: '' }

function diasDeLaSemana(semanaBase) {
  const inicio = startOfWeek(semanaBase, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(inicio, i))
}

export default function ReservasPage() {
  const { perfil, rol } = useAuth()
  const esAdmin = rol === 'administrador'

  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [semanaBase, setSemanaBase] = useState(new Date())
  const dias = diasDeLaSemana(semanaBase)
  const [zonaActiva, setZonaActiva] = useState('todas')
  const [modalAbierto, { open: abrirModal, close: cerrarModal }] = useDisclosure(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [guardando, setGuardando] = useState(false)

  const cargarReservas = useCallback(async () => {
    setLoading(true)
    try {
      let zonaId = undefined
      if (zonaActiva !== 'todas') {
        const { data: zona } = await getZonaPorNombre(zonaActiva)
        if (zona) zonaId = zona.id
      }

      const { data, error } = await getReservas({ usuarioId: perfil?.id, esAdmin, zonaId })
      if (error) throw error
      setReservas(data ?? [])
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al cargar reservas', message: err.message })
    } finally {
      setLoading(false)
    }
  }, [perfil, esAdmin, zonaActiva])

  useEffect(() => { cargarReservas() }, [cargarReservas])

  function setField(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleGuardar() {
    if (!form.zona) return notifications.show({ color: 'yellow', message: 'Selecciona una zona.' })
    if (!form.fecha) return notifications.show({ color: 'yellow', message: 'Selecciona una fecha.' })
    if (!form.hora_inicio || !form.hora_fin) return notifications.show({ color: 'yellow', message: 'Ingresa hora de inicio y fin.' })
    if (form.hora_fin <= form.hora_inicio) return notifications.show({ color: 'yellow', message: 'La hora de fin debe ser mayor a la de inicio.' })

    setGuardando(true)
    try {
      let zonaData = (await getZonaPorNombreExacto(form.zona)).data

      if (!zonaData) {
        const { data: nueva, error: errZ } = await createZona({ nombre: form.zona })
        if (errZ) throw errZ
        zonaData = nueva
      }

      const solapado = await checkSolapamiento(zonaData.id, form.fecha, form.hora_inicio, form.hora_fin)
      if (solapado) {
        notifications.show({ color: 'red', title: 'Horario ocupado', message: 'Ya existe una reserva para esa zona en ese horario.' })
        return
      }

      const { error } = await createReserva({
        id_zona: zonaData.id,
        id_usuario: perfil?.id,
        fecha: form.fecha,
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        estado: esAdmin ? 'aprobada' : 'pendiente',
      })
      if (error) throw error

      notifications.show({ color: 'green', title: 'Reserva creada', message: `Reserva para ${form.zona} el ${format(parseISO(form.fecha), 'dd MMM yyyy', { locale: es })}.` })
      setForm(FORM_INICIAL)
      cerrarModal()
      cargarReservas()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al crear reserva', message: err.message })
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(id, estado) {
    try {
      const { error } = await updateReservaEstado(id, estado)
      if (error) throw error
      notifications.show({ color: estado === 'aprobada' ? 'green' : 'orange', message: `Reserva ${estado === 'aprobada' ? 'aprobada' : 'rechazada'}.` })
      cargarReservas()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error', message: err.message })
    }
  }

  function reservasDeDia(dia) {
    const diaStr = format(dia, 'yyyy-MM-dd')
    return reservas.filter((r) => r.fecha === diaStr)
  }

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Stack gap={2}>
            <Title order={3}>Reservas de Zonas Comunes</Title>
            <Text size="sm" c="dimmed">{reservas.length} reserva{reservas.length !== 1 ? 's' : ''}</Text>
          </Stack>
          <Button leftSection={<Plus size={16} />} onClick={abrirModal}>Nueva reserva</Button>
        </Group>

        <Tabs value={zonaActiva} onChange={(v) => setZonaActiva(v ?? 'todas')}>
          <Tabs.List>
            <Tabs.Tab value="todas">Todas</Tabs.Tab>
            {ZONAS.map((z) => (
              <Tabs.Tab key={z} value={z}>{z}</Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Text fw={600} size="sm">
              Semana del {format(dias[0], 'd MMM', { locale: es })} al {format(dias[6], 'd MMM yyyy', { locale: es })}
            </Text>
            <Group gap="xs">
              <ActionIcon variant="light" onClick={() => setSemanaBase((s) => subWeeks(s, 1))}><ChevronLeft size={16} /></ActionIcon>
              <Button variant="subtle" size="xs" onClick={() => setSemanaBase(new Date())}>Hoy</Button>
              <ActionIcon variant="light" onClick={() => setSemanaBase((s) => addWeeks(s, 1))}><ChevronRight size={16} /></ActionIcon>
            </Group>
          </Group>
          <SimpleGrid cols={7} spacing="xs">
            {dias.map((dia) => {
              const esHoy = isSameDay(dia, new Date())
              const rsDia = reservasDeDia(dia)
              return (
                <Box key={dia.toISOString()} style={{ minHeight: 90 }}>
                  <Text size="xs" fw={esHoy ? 700 : 400} c={esHoy ? 'blue' : 'dimmed'} ta="center" mb={4}>
                    {format(dia, 'EEE d', { locale: es })}
                  </Text>
                  <Stack gap={2}>
                    {rsDia.slice(0, 3).map((r) => (
                      <Paper key={r.id} p={4} radius="sm" style={{ background: `var(--mantine-color-${estadoColor[r.estado] ?? 'gray'}-1)`, borderLeft: `3px solid var(--mantine-color-${estadoColor[r.estado] ?? 'gray'}-5)` }}>
                        <Text size="xs" lineClamp={1}>{r.zonas_comunes?.nombre ?? 'Zona'}</Text>
                        <Text size="xs" c="dimmed">{r.hora_inicio}–{r.hora_fin}</Text>
                      </Paper>
                    ))}
                    {rsDia.length > 3 && (
                      <Text size="xs" c="dimmed" ta="center">+{rsDia.length - 3} más</Text>
                    )}
                  </Stack>
                </Box>
              )
            })}
          </SimpleGrid>
        </Paper>

        <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
          {loading ? (
            <Center h={250}><Loader size="md" /></Center>
          ) : reservas.length === 0 ? (
            <Center h={150}>
              <Stack align="center" gap="xs">
                <CalendarDays size={36} color="var(--mantine-color-gray-4)" />
                <Text size="sm" c="dimmed">No hay reservas.</Text>
              </Stack>
            </Center>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover verticalSpacing="sm" miw={650}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Zona</Table.Th>
                    {esAdmin && <Table.Th>Residente</Table.Th>}
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Horario</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    {esAdmin && <Table.Th ta="center">Acciones</Table.Th>}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {reservas.map((r) => (
                    <Table.Tr key={r.id}>
                      <Table.Td><Text size="sm" fw={500}>{r.zonas_comunes?.nombre ?? '—'}</Text></Table.Td>
                      {esAdmin && (
                        <Table.Td>
                          <Stack gap={0}>
                            <Text size="sm">{r.usuarios?.nombre ?? '—'}</Text>
                            <Text size="xs" c="dimmed">{r.usuarios?.email}</Text>
                          </Stack>
                        </Table.Td>
                      )}
                      <Table.Td>
                        <Text size="sm">{r.fecha ? format(parseISO(r.fecha), 'dd MMM yyyy', { locale: es }) : '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Clock size={13} />
                          <Text size="sm">{r.hora_inicio} – {r.hora_fin}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" color={estadoColor[r.estado] ?? 'gray'} variant="light" tt="capitalize">{r.estado}</Badge>
                      </Table.Td>
                      {esAdmin && (
                        <Table.Td>
                          {r.estado === 'pendiente' && (
                            <Group justify="center" gap="xs">
                              <ActionIcon variant="light" color="green" size="sm" title="Aprobar" onClick={() => cambiarEstado(r.id, 'aprobada')}>
                                <CheckCircle2 size={14} />
                              </ActionIcon>
                              <ActionIcon variant="light" color="red" size="sm" title="Rechazar" onClick={() => cambiarEstado(r.id, 'rechazada')}>
                                <XCircle size={14} />
                              </ActionIcon>
                            </Group>
                          )}
                        </Table.Td>
                      )}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Paper>
      </Stack>

      <Modal
        opened={modalAbierto}
        onClose={cerrarModal}
        title={<Group gap="xs"><CalendarDays size={18} /><Text fw={600}>Nueva reserva</Text></Group>}
        size="md"
        centered
        overlayProps={{ blur: 3 }}
      >
        <Stack gap="sm">
          <Select
            label="Zona común"
            placeholder="Selecciona una zona..."
            required
            data={ZONAS.map((z) => ({ value: z, label: z }))}
            value={form.zona}
            onChange={(v) => setField('zona', v ?? '')}
          />
          <TextInput
            label="Fecha"
            type="date"
            required
            min={format(new Date(), 'yyyy-MM-dd')}
            value={form.fecha}
            onChange={(e) => setField('fecha', e.target.value)}
          />
          <Group grow>
            <TextInput label="Hora inicio" type="time" required value={form.hora_inicio} onChange={(e) => setField('hora_inicio', e.target.value)} />
            <TextInput label="Hora fin" type="time" required value={form.hora_fin} onChange={(e) => setField('hora_fin', e.target.value)} />
          </Group>
          <Divider mt="xs" />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={cerrarModal} disabled={guardando}>Cancelar</Button>
            <Button onClick={handleGuardar} loading={guardando} leftSection={<Plus size={14} />}>Crear reserva</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
