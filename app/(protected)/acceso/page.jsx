'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, TextInput, Select, Badge, Group, Stack,
  Title, Text, Paper, Loader, Center, SimpleGrid, Card,
  Divider, ActionIcon, ScrollArea, Box, Textarea, Modal
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import {
  Search, X, UserCheck, UserX, LogIn, LogOut, Clock, Users,
  FileText, Plus, AlertCircle
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../../services/supabaseClient'
import { useAuth } from '../../../context/AuthContext'

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AccesoPage() {
  const { perfil } = useAuth()

  // ── Búsqueda de visitante ─────────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [visitanteEncontrado, setVisitanteEncontrado] = useState(null)
  const [mostrarFormRegistro, setMostrarFormRegistro] = useState(false)

  // ── Formulario de registro de visitante ───────────────────────────────────────
  const [formVisitante, setFormVisitante] = useState({
    nombre: '',
    documento: '',
    unidad_destino: '',
  })
  const [registrandoVisitante, setRegistrandoVisitante] = useState(false)

  // ── Unidades disponibles para seleccionar destino ─────────────────────────────
  const [unidades, setUnidades] = useState([])

  // ── Visitantes activos ────────────────────────────────────────────────────────
  const [visitantesActivos, setVisitantesActivos] = useState([])
  const [cargandoActivos, setCargandoActivos] = useState(true)

  // ── Log de accesos de hoy ─────────────────────────────────────────────────────
  const [logHoy, setLogHoy] = useState([])
  const [cargandoLog, setCargandoLog] = useState(true)

  // ── Novedades del turno ───────────────────────────────────────────────────────
  const [novedades, setNovedades] = useState([])
  const [cargandoNovedades, setCargandoNovedades] = useState(true)
  const [modalNovedad, { open: abrirModalNovedad, close: cerrarModalNovedad }] = useDisclosure(false)
  const [textoNovedad, setTextoNovedad] = useState('')
  const [guardandoNovedad, setGuardandoNovedad] = useState(false)

  // ── Cargar unidades ────────────────────────────────────────────────────────────
  const cargarUnidades = useCallback(async () => {
    const { data } = await supabase
      .from('unidades')
      .select('id, numero, torre')
      .eq('estado', 'activo')
      .order('numero')
    setUnidades(data ?? [])
  }, [])

  // ── Cargar visitantes activos (sin salida, con visitante) ────────────────────
  const cargarVisitantesActivos = useCallback(async () => {
    setCargandoActivos(true)
    try {
      const { data, error } = await supabase
        .from('registros_acceso')
        .select(`
          id, hora_ingreso,
          visitantes:id_visitante(id, nombre, documento, unidades:id_unidad_destino(numero, torre))
        `)
        .is('hora_salida', null)
        .not('id_visitante', 'is', null)
        .order('hora_ingreso', { ascending: false })
      if (error) throw error
      setVisitantesActivos(data ?? [])
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error', message: err.message })
    } finally {
      setCargandoActivos(false)
    }
  }, [])

  // ── Cargar log del día (solo registros con visitante) ────────────────────────
  const cargarLogHoy = useCallback(async () => {
    setCargandoLog(true)
    try {
      const hoy = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('registros_acceso')
        .select(`
          id, hora_ingreso, hora_salida,
          visitantes:id_visitante(nombre, documento, unidades:id_unidad_destino(numero, torre))
        `)
        .gte('hora_ingreso', `${hoy}T00:00:00`)
        .lte('hora_ingreso', `${hoy}T23:59:59`)
        .not('id_visitante', 'is', null)
        .order('hora_ingreso', { ascending: false })
      if (error) throw error
      setLogHoy(data ?? [])
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al cargar log', message: err.message })
    } finally {
      setCargandoLog(false)
    }
  }, [])

  // ── Cargar novedades del turno (registros sin visitante) ──────────────────────
  const cargarNovedades = useCallback(async () => {
    setCargandoNovedades(true)
    try {
      const hoy = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('registros_acceso')
        .select('id, hora_ingreso, novedad, usuarios:id_portero(nombre)')
        .gte('hora_ingreso', `${hoy}T00:00:00`)
        .lte('hora_ingreso', `${hoy}T23:59:59`)
        .is('id_visitante', null)
        .order('hora_ingreso', { ascending: false })
      if (error) throw error
      setNovedades(data ?? [])
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al cargar novedades', message: err.message })
    } finally {
      setCargandoNovedades(false)
    }
  }, [])

  useEffect(() => {
    cargarUnidades()
    cargarVisitantesActivos()
    cargarLogHoy()
    cargarNovedades()
  }, [cargarUnidades, cargarVisitantesActivos, cargarLogHoy, cargarNovedades])

  // ── Buscar visitante ──────────────────────────────────────────────────────────
  async function buscarVisitante() {
    if (!busqueda.trim()) return
    setBuscando(true)
    setVisitanteEncontrado(null)
    setMostrarFormRegistro(false)
    try {
      const { data, error } = await supabase
        .from('visitantes')
        .select('id, nombre, documento')
        .or(`nombre.ilike.%${busqueda.trim()}%,documento.ilike.%${busqueda.trim()}%`)
        .limit(1)
        .maybeSingle()
      if (error) throw error
      if (data) {
        setVisitanteEncontrado(data)
        setMostrarFormRegistro(false)
      } else {
        setVisitanteEncontrado(null)
        setMostrarFormRegistro(true)
        setFormVisitante((prev) => ({
          ...prev,
          nombre: busqueda.trim(),
          documento: '',
          unidad_destino: '',
        }))
      }
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al buscar', message: err.message })
    } finally {
      setBuscando(false)
    }
  }

  function limpiarBusqueda() {
    setBusqueda('')
    setVisitanteEncontrado(null)
    setMostrarFormRegistro(false)
    setFormVisitante({ nombre: '', documento: '', unidad_destino: '' })
  }

  function setFieldForm(campo, valor) {
    setFormVisitante((prev) => ({ ...prev, [campo]: valor }))
  }

  // ── Registrar nuevo visitante + ingreso ───────────────────────────────────────
  async function handleRegistrarNuevo() {
    if (!formVisitante.nombre.trim()) return notifications.show({ color: 'yellow', message: 'El nombre es obligatorio.' })
    if (!formVisitante.documento.trim()) return notifications.show({ color: 'yellow', message: 'El documento es obligatorio.' })
    if (!formVisitante.unidad_destino) return notifications.show({ color: 'yellow', message: 'Selecciona la unidad de destino.' })

    setRegistrandoVisitante(true)
    try {
      // Crear visitante
      const { data: nuevoVisitante, error: errV } = await supabase
        .from('visitantes')
        .insert([{
          nombre: formVisitante.nombre.trim(),
          documento: formVisitante.documento.trim(),
          id_unidad_destino: formVisitante.unidad_destino || null,
        }])
        .select('id')
        .single()
      if (errV) throw errV

      // Registrar ingreso
      const { error: errA } = await supabase.from('registros_acceso').insert([{
        id_visitante: nuevoVisitante.id,
        id_portero: perfil?.id ?? null,
        hora_ingreso: new Date().toISOString(),
      }])
      if (errA) throw errA

      notifications.show({ color: 'green', title: 'Ingreso registrado', message: `${formVisitante.nombre} ingresó al conjunto.` })
      limpiarBusqueda()
      cargarVisitantesActivos()
      cargarLogHoy()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al registrar', message: err.message })
    } finally {
      setRegistrandoVisitante(false)
    }
  }

  // ── Registrar ingreso de visitante existente ──────────────────────────────────
  const [unidadDestino, setUnidadDestino] = useState('')
  const [registrandoIngreso, setRegistrandoIngreso] = useState(false)

  async function handleRegistrarIngreso() {
    if (!visitanteEncontrado) return
    if (!unidadDestino) return notifications.show({ color: 'yellow', message: 'Selecciona la unidad de destino.' })
    setRegistrandoIngreso(true)
    try {
      const { error } = await supabase.from('registros_acceso').insert([{
        id_visitante: visitanteEncontrado.id,
        id_portero: perfil?.id ?? null,
        hora_ingreso: new Date().toISOString(),
      }])
      if (error) throw error
      notifications.show({ color: 'green', title: 'Ingreso registrado', message: `${visitanteEncontrado.nombre} ingresó al conjunto.` })
      setUnidadDestino('')
      limpiarBusqueda()
      cargarVisitantesActivos()
      cargarLogHoy()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al registrar ingreso', message: err.message })
    } finally {
      setRegistrandoIngreso(false)
    }
  }

  // ── Registrar salida ──────────────────────────────────────────────────────────
  async function handleRegistrarSalida(accesoId, nombre) {
    try {
      const { error } = await supabase
        .from('registros_acceso')
        .update({ hora_salida: new Date().toISOString() })
        .eq('id', accesoId)
      if (error) throw error
      notifications.show({ color: 'blue', title: 'Salida registrada', message: `${nombre} salió del conjunto.` })
      cargarVisitantesActivos()
      cargarLogHoy()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al registrar salida', message: err.message })
    }
  }

  // ── Registrar novedad de turno ────────────────────────────────────────────────
  async function handleRegistrarNovedad() {
    if (!textoNovedad.trim()) {
      notifications.show({ color: 'yellow', message: 'Escribe la novedad antes de guardar.' })
      return
    }
    setGuardandoNovedad(true)
    try {
      const { error } = await supabase.from('registros_acceso').insert([{
        id_portero: perfil?.id ?? null,
        hora_ingreso: new Date().toISOString(),
        novedad: textoNovedad.trim(),
      }])
      if (error) throw error
      notifications.show({ color: 'green', title: 'Novedad registrada', message: 'La novedad quedó guardada en el turno.' })
      setTextoNovedad('')
      cerrarModalNovedad()
      cargarNovedades()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error', message: err.message })
    } finally {
      setGuardandoNovedad(false)
    }
  }

  const unidadesOpciones = unidades.map((u) => ({
    value: u.id,
    label: `Unidad ${u.numero}${u.torre ? ` (Torre ${u.torre})` : ''}`,
  }))

  return (
    <>
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Stack gap={2}>
          <Title order={3}>Control de Acceso</Title>
          <Text size="sm" c="dimmed">Registro de visitantes e ingresos</Text>
        </Stack>
        <Button
          leftSection={<FileText size={16} />}
          color="violet"
          variant="light"
          onClick={abrirModalNovedad}
        >
          Registrar novedad de turno
        </Button>
      </Group>

      {/* ── Resumen del día ──────────────────────────────────────────────────────── */}
      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group gap="sm">
            <Users size={22} color="var(--mantine-color-blue-6)" />
            <Stack gap={0}>
              <Text size="xs" c="dimmed">Visitantes activos</Text>
              <Text fw={700} size="lg">{visitantesActivos.length}</Text>
            </Stack>
          </Group>
        </Card>
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group gap="sm">
            <LogIn size={22} color="var(--mantine-color-green-6)" />
            <Stack gap={0}>
              <Text size="xs" c="dimmed">Ingresos hoy</Text>
              <Text fw={700} size="lg">{logHoy.length}</Text>
            </Stack>
          </Group>
        </Card>
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group gap="sm">
            <LogOut size={22} color="var(--mantine-color-gray-6)" />
            <Stack gap={0}>
              <Text size="xs" c="dimmed">Salidas hoy</Text>
              <Text fw={700} size="lg">{logHoy.filter((a) => a.hora_salida).length}</Text>
            </Stack>
          </Group>
        </Card>
      </SimpleGrid>

      {/* ── Búsqueda y registro ───────────────────────────────────────────────────── */}
      <Paper p="lg" radius="md" withBorder>
        <Stack gap="md">
          <Text fw={600} size="sm">Buscar o registrar visitante</Text>
          <Group gap="sm" wrap="nowrap">
            <TextInput
              placeholder="Nombre o número de documento..."
              leftSection={<Search size={15} />}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarVisitante()}
              style={{ flex: 1 }}
              rightSection={
                busqueda
                  ? <ActionIcon variant="subtle" size="sm" onClick={limpiarBusqueda}><X size={14} /></ActionIcon>
                  : null
              }
            />
            <Button onClick={buscarVisitante} loading={buscando} leftSection={<Search size={14} />}>
              Buscar
            </Button>
          </Group>

          {/* Visitante encontrado */}
          {visitanteEncontrado && (
            <Paper p="md" radius="md" bg="green.0" withBorder style={{ borderColor: 'var(--mantine-color-green-3)' }}>
              <Stack gap="sm">
                <Group gap="sm">
                  <UserCheck size={20} color="var(--mantine-color-green-6)" />
                  <Stack gap={0}>
                    <Text fw={600} size="sm">{visitanteEncontrado.nombre}</Text>
                    <Text size="xs" c="dimmed">Doc: {visitanteEncontrado.documento}</Text>
                  </Stack>
                  <Badge color="green" variant="light" size="sm">Visitante registrado</Badge>
                </Group>
                <Group gap="sm" wrap="nowrap">
                  <Select
                    placeholder="Selecciona unidad destino..."
                    data={unidadesOpciones}
                    value={unidadDestino}
                    onChange={(v) => setUnidadDestino(v ?? '')}
                    searchable
                    style={{ flex: 1 }}
                  />
                  <Button
                    onClick={handleRegistrarIngreso}
                    loading={registrandoIngreso}
                    color="green"
                    leftSection={<LogIn size={14} />}
                  >
                    Registrar ingreso
                  </Button>
                </Group>
              </Stack>
            </Paper>
          )}

          {/* Visitante no encontrado → formulario de registro */}
          {mostrarFormRegistro && (
            <Paper p="md" radius="md" bg="orange.0" withBorder style={{ borderColor: 'var(--mantine-color-orange-3)' }}>
              <Stack gap="sm">
                <Group gap="sm">
                  <UserX size={20} color="var(--mantine-color-orange-6)" />
                  <Text size="sm" fw={500} c="orange.8">Visitante no encontrado — completa los datos para registrarlo</Text>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  <TextInput
                    label="Nombre completo"
                    required
                    value={formVisitante.nombre}
                    onChange={(e) => setFieldForm('nombre', e.target.value)}
                  />
                  <TextInput
                    label="Documento de identidad"
                    required
                    value={formVisitante.documento}
                    onChange={(e) => setFieldForm('documento', e.target.value)}
                  />
                  <Select
                    label="Unidad destino"
                    placeholder="Selecciona..."
                    required
                    data={unidadesOpciones}
                    value={formVisitante.unidad_destino}
                    onChange={(v) => setFieldForm('unidad_destino', v ?? '')}
                    searchable
                  />
                </SimpleGrid>
                <Group justify="flex-end">
                  <Button
                    onClick={handleRegistrarNuevo}
                    loading={registrandoVisitante}
                    color="orange"
                    leftSection={<LogIn size={14} />}
                  >
                    Registrar y autorizar ingreso
                  </Button>
                </Group>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Paper>

      {/* ── Visitantes activos ────────────────────────────────────────────────────── */}
      <Box>
        <Text fw={600} size="sm" mb="sm">Visitantes en el conjunto ahora</Text>
        <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
          {cargandoActivos ? (
            <Center h={150}><Loader size="sm" /></Center>
          ) : visitantesActivos.length === 0 ? (
            <Center h={100}>
              <Stack align="center" gap="xs">
                <Users size={32} color="var(--mantine-color-gray-4)" />
                <Text size="sm" c="dimmed">No hay visitantes activos.</Text>
              </Stack>
            </Center>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover verticalSpacing="sm" miw={550}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Visitante</Table.Th>
                    <Table.Th>Documento</Table.Th>
                    <Table.Th>Unidad destino</Table.Th>
                    <Table.Th>Hora ingreso</Table.Th>
                    <Table.Th ta="center">Acción</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {visitantesActivos.map((a) => (
                    <Table.Tr key={a.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{a.visitantes?.nombre ?? '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{a.visitantes?.documento ?? '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          Unidad {a.visitantes?.unidades?.numero ?? '—'}{a.visitantes?.unidades?.torre ? ` (T.${a.visitantes.unidades.torre})` : ''}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Clock size={13} />
                          <Text size="sm">
                            {a.hora_ingreso
                              ? format(parseISO(a.hora_ingreso), 'HH:mm', { locale: es })
                              : '—'}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Button
                          size="xs"
                          variant="light"
                          color="red"
                          leftSection={<LogOut size={12} />}
                          onClick={() => handleRegistrarSalida(a.id, a.visitantes?.nombre ?? 'Visitante')}
                        >
                          Registrar salida
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Paper>
      </Box>

      {/* ── Log de accesos del día ────────────────────────────────────────────────── */}
      <Box>
        <Text fw={600} size="sm" mb="sm">
          Registro de accesos — {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </Text>
        <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
          {cargandoLog ? (
            <Center h={150}><Loader size="sm" /></Center>
          ) : logHoy.length === 0 ? (
            <Center h={100}>
              <Text size="sm" c="dimmed">No hay movimientos hoy.</Text>
            </Center>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover verticalSpacing="sm" miw={550}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Visitante</Table.Th>
                    <Table.Th>Documento</Table.Th>
                    <Table.Th>Unidad</Table.Th>
                    <Table.Th>Ingreso</Table.Th>
                    <Table.Th>Salida</Table.Th>
                    <Table.Th>Estado</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {logHoy.map((a) => (
                    <Table.Tr key={a.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{a.visitantes?.nombre ?? '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{a.visitantes?.documento ?? '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {a.visitantes?.unidades?.numero ?? '—'}{a.visitantes?.unidades?.torre ? ` T.${a.visitantes.unidades.torre}` : ''}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <LogIn size={12} color="var(--mantine-color-green-6)" />
                          <Text size="sm">
                            {a.hora_ingreso ? format(parseISO(a.hora_ingreso), 'HH:mm') : '—'}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        {a.hora_salida ? (
                          <Group gap="xs">
                            <LogOut size={12} color="var(--mantine-color-red-5)" />
                            <Text size="sm">{format(parseISO(a.hora_salida), 'HH:mm')}</Text>
                          </Group>
                        ) : (
                          <Text size="sm" c="dimmed">—</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="xs"
                          color={a.hora_salida ? 'gray' : 'green'}
                          variant="light"
                        >
                          {a.hora_salida ? 'Salió' : 'En conjunto'}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Paper>
      </Box>
      {/* ── Novedades del turno ───────────────────────────────────────────────────── */}
      <Box>
        <Group justify="space-between" mb="sm">
          <Text fw={600} size="sm">
            Novedades del turno — {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </Text>
          <Badge size="sm" color="violet" variant="light">{novedades.length}</Badge>
        </Group>
        <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
          {cargandoNovedades ? (
            <Center h={100}><Loader size="sm" /></Center>
          ) : novedades.length === 0 ? (
            <Center h={100}>
              <Stack align="center" gap="xs">
                <AlertCircle size={28} color="var(--mantine-color-gray-4)" />
                <Text size="sm" c="dimmed">Sin novedades registradas hoy.</Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap={0}>
              {novedades.map((n, i) => (
                <Box key={n.id}>
                  {i > 0 && <Divider />}
                  <Group gap="sm" p="md" align="flex-start">
                    <FileText size={16} color="var(--mantine-color-violet-5)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Text size="sm">{n.novedad}</Text>
                      <Text size="xs" c="dimmed">
                        {n.hora_ingreso ? format(parseISO(n.hora_ingreso), 'HH:mm', { locale: es }) : '—'}
                        {n.usuarios?.nombre ? ` · ${n.usuarios.nombre}` : ''}
                      </Text>
                    </Stack>
                  </Group>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    </Stack>

    {/* ── Modal registrar novedad ──────────────────────────────────────────────── */}
    <Modal
      opened={modalNovedad}
      onClose={cerrarModalNovedad}
      title={
        <Group gap="xs">
          <FileText size={18} />
          <Text fw={600}>Registrar novedad de turno</Text>
        </Group>
      }
      size="md"
      centered
      overlayProps={{ blur: 3 }}
    >
      <Stack gap="sm">
        <Textarea
          label="Descripción de la novedad"
          placeholder="Describe el incidente, observación o novedad del turno..."
          required
          minRows={4}
          value={textoNovedad}
          onChange={(e) => setTextoNovedad(e.target.value)}
          autosize
        />
        <Divider />
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={cerrarModalNovedad} disabled={guardandoNovedad}>
            Cancelar
          </Button>
          <Button
            color="violet"
            leftSection={<Plus size={14} />}
            onClick={handleRegistrarNovedad}
            loading={guardandoNovedad}
          >
            Guardar novedad
          </Button>
        </Group>
      </Stack>
    </Modal>
    </>
  )
}
