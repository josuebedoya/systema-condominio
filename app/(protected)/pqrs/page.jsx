'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Modal, TextInput, Select, Badge, Group, Stack,
  Title, Text, Paper, Loader, Center, Drawer, ScrollArea, Divider,
  ActionIcon, Textarea, Box, Grid
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import {
  Plus, Search, X, MessageSquare, ChevronRight, Send, Clock
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../../services/supabaseClient'
import { useAuth } from '../../../context/AuthContext'

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS = ['peticion', 'queja', 'reclamo', 'sugerencia']
const CATEGORIAS = ['convivencia', 'infraestructura', 'administracion', 'servicios', 'seguridad', 'otro']
const ESTADOS = ['abierta', 'en_proceso', 'resuelta', 'cerrada']

const estadoColor = {
  abierta: 'orange',
  en_proceso: 'blue',
  resuelta: 'green',
  cerrada: 'gray',
}

const tipoColor = {
  peticion: 'blue',
  queja: 'red',
  reclamo: 'orange',
  sugerencia: 'teal',
}

const FORM_INICIAL = { tipo: 'peticion', categoria: 'otro', asunto: '', descripcion: '' }

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PQRSPage() {
  const { perfil, rol } = useAuth()
  const esAdmin = rol === 'administrador'

  // ── Datos ────────────────────────────────────────────────────────────────────
  const [pqrs, setPqrs] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState('')
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  // ── Drawer detalle ────────────────────────────────────────────────────────────
  const [drawerAbierto, { open: abrirDrawer, close: cerrarDrawer }] = useDisclosure(false)
  const [pqrSeleccionada, setPqrSeleccionada] = useState(null)
  const [respuestas, setRespuestas] = useState([])
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [textoRespuesta, setTextoRespuesta] = useState('')
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false)

  // ── Modal radicar ─────────────────────────────────────────────────────────────
  const [modalAbierto, { open: abrirModal, close: cerrarModal }] = useDisclosure(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [guardando, setGuardando] = useState(false)

  // ── Cargar PQRs ───────────────────────────────────────────────────────────────
  const cargarPqrs = useCallback(async () => {
    if (!perfil && !esAdmin) return
    setLoading(true)
    try {
      let query = supabase
        .from('pqrs')
        .select(`
          id, tipo, categoria, asunto, descripcion, estado, created_at,
          usuarios:usuario_id(id, nombre, email)
        `)
        .order('created_at', { ascending: false })

      if (!esAdmin && perfil?.id) {
        query = query.eq('usuario_id', perfil.id)
      }
      if (filtroTipo) query = query.eq('tipo', filtroTipo)
      if (filtroEstado) query = query.eq('estado', filtroEstado)

      const { data, error } = await query
      if (error) throw error

      let resultado = data ?? []
      if (filtroBusqueda) {
        const b = filtroBusqueda.toLowerCase()
        resultado = resultado.filter((p) =>
          p.asunto?.toLowerCase().includes(b) ||
          p.descripcion?.toLowerCase().includes(b) ||
          p.usuarios?.nombre?.toLowerCase().includes(b)
        )
      }
      setPqrs(resultado)
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al cargar PQRs', message: err.message })
    } finally {
      setLoading(false)
    }
  }, [perfil, esAdmin, filtroTipo, filtroEstado, filtroBusqueda])

  useEffect(() => { cargarPqrs() }, [cargarPqrs])

  // ── Abrir detalle ─────────────────────────────────────────────────────────────
  async function verDetalle(pqr) {
    setPqrSeleccionada(pqr)
    setNuevoEstado(pqr.estado)
    setTextoRespuesta('')
    abrirDrawer()
    setCargandoDetalle(true)
    try {
      const { data, error } = await supabase
        .from('pqrs_respuestas')
        .select(`
          id, texto, created_at, es_admin,
          usuarios:usuario_id(nombre)
        `)
        .eq('pqr_id', pqr.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      setRespuestas(data ?? [])
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error', message: err.message })
    } finally {
      setCargandoDetalle(false)
    }
  }

  // ── Enviar respuesta / cambiar estado ─────────────────────────────────────────
  async function handleEnviarRespuesta() {
    if (!textoRespuesta.trim() && nuevoEstado === pqrSeleccionada?.estado) {
      notifications.show({ color: 'yellow', message: 'Escribe una respuesta o cambia el estado.' })
      return
    }
    setEnviandoRespuesta(true)
    try {
      const actualizaciones = {}
      if (nuevoEstado !== pqrSeleccionada?.estado) actualizaciones.estado = nuevoEstado

      if (Object.keys(actualizaciones).length > 0) {
        const { error } = await supabase.from('pqrs').update(actualizaciones).eq('id', pqrSeleccionada.id)
        if (error) throw error
      }

      if (textoRespuesta.trim()) {
        const { error } = await supabase.from('pqrs_respuestas').insert([{
          pqr_id: pqrSeleccionada.id,
          usuario_id: perfil?.id,
          texto: textoRespuesta.trim(),
          es_admin: esAdmin,
        }])
        if (error) throw error
      }

      notifications.show({ color: 'green', message: 'Respuesta enviada correctamente.' })
      setTextoRespuesta('')
      cerrarDrawer()
      cargarPqrs()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al responder', message: err.message })
    } finally {
      setEnviandoRespuesta(false)
    }
  }

  // ── Radicar PQR ───────────────────────────────────────────────────────────────
  function setField(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleGuardar() {
    if (!form.asunto.trim()) return notifications.show({ color: 'yellow', message: 'El asunto es obligatorio.' })
    if (!form.descripcion.trim()) return notifications.show({ color: 'yellow', message: 'La descripción es obligatoria.' })
    setGuardando(true)
    try {
      const { error } = await supabase.from('pqrs').insert([{
        tipo: form.tipo,
        categoria: form.categoria,
        asunto: form.asunto.trim(),
        descripcion: form.descripcion.trim(),
        estado: 'abierta',
        usuario_id: perfil?.id ?? null,
      }])
      if (error) throw error
      notifications.show({ color: 'green', title: 'PQR radicada', message: `Tu ${form.tipo} fue registrada exitosamente.` })
      setForm(FORM_INICIAL)
      cerrarModal()
      cargarPqrs()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al radicar PQR', message: err.message })
    } finally {
      setGuardando(false)
    }
  }

  function handleBusquedaChange(valor) {
    setBusqueda(valor)
    if (valor.length === 0 || valor.length >= 2) setFiltroBusqueda(valor)
  }

  return (
    <>
      <Stack gap="lg">
        {/* Cabecera */}
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Stack gap={2}>
            <Title order={3}>PQR — Peticiones, Quejas y Reclamos</Title>
            <Text size="sm" c="dimmed">{pqrs.length} solicitud{pqrs.length !== 1 ? 'es' : ''}</Text>
          </Stack>
          <Button leftSection={<Plus size={16} />} onClick={abrirModal}>
            Radicar PQR
          </Button>
        </Group>

        {/* Filtros */}
        <Paper p="md" radius="md" withBorder>
          <Grid gutter="sm" align="flex-end">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label="Buscar"
                placeholder="Asunto, descripción o nombre..."
                leftSection={<Search size={15} />}
                value={busqueda}
                onChange={(e) => handleBusquedaChange(e.target.value)}
                rightSection={
                  busqueda
                    ? <ActionIcon variant="subtle" size="sm" onClick={() => handleBusquedaChange('')}><X size={14} /></ActionIcon>
                    : null
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Select
                label="Tipo"
                placeholder="Todos"
                data={TIPOS.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
                value={filtroTipo}
                onChange={(v) => setFiltroTipo(v ?? '')}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Select
                label="Estado"
                placeholder="Todos"
                data={ESTADOS.map((e) => ({ value: e, label: e.replace('_', ' ').charAt(0).toUpperCase() + e.replace('_', ' ').slice(1) }))}
                value={filtroEstado}
                onChange={(v) => setFiltroEstado(v ?? '')}
                clearable
              />
            </Grid.Col>
            {(filtroBusqueda || filtroTipo || filtroEstado) && (
              <Grid.Col span={{ base: 12, sm: 2 }}>
                <Button variant="subtle" color="gray" fullWidth onClick={() => { setBusqueda(''); setFiltroBusqueda(''); setFiltroTipo(''); setFiltroEstado('') }}>
                  Limpiar
                </Button>
              </Grid.Col>
            )}
          </Grid>
        </Paper>

        {/* Tabla */}
        <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
          {loading ? (
            <Center h={300}><Loader size="md" /></Center>
          ) : pqrs.length === 0 ? (
            <Center h={200}>
              <Stack align="center" gap="xs">
                <MessageSquare size={40} color="var(--mantine-color-gray-4)" />
                <Text size="sm" c="dimmed">No hay PQRs con los filtros seleccionados.</Text>
              </Stack>
            </Center>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover verticalSpacing="sm" miw={620} style={{ cursor: 'pointer' }}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Asunto</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Categoría</Table.Th>
                    {esAdmin && <Table.Th>Radicado por</Table.Th>}
                    <Table.Th>Estado</Table.Th>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pqrs.map((p) => (
                    <Table.Tr key={p.id} onClick={() => verDetalle(p)}>
                      <Table.Td>
                        <Text size="sm" fw={500} lineClamp={1}>{p.asunto}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" color={tipoColor[p.tipo] ?? 'gray'} variant="light" tt="capitalize">
                          {p.tipo}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" tt="capitalize">{p.categoria?.replace('_', ' ') ?? '—'}</Text>
                      </Table.Td>
                      {esAdmin && (
                        <Table.Td>
                          <Text size="sm">{p.usuarios?.nombre ?? '—'}</Text>
                        </Table.Td>
                      )}
                      <Table.Td>
                        <Badge size="sm" color={estadoColor[p.estado] ?? 'gray'} variant="light" tt="capitalize">
                          {p.estado?.replace('_', ' ')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {p.created_at ? format(parseISO(p.created_at), 'dd MMM yyyy', { locale: es }) : '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <ChevronRight size={16} color="var(--mantine-color-gray-4)" />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Paper>
      </Stack>

      {/* ── Drawer detalle PQR ──────────────────────────────────────────────────── */}
      <Drawer
        opened={drawerAbierto}
        onClose={cerrarDrawer}
        title={
          <Stack gap={2}>
            <Group gap="xs">
              <Badge color={tipoColor[pqrSeleccionada?.tipo] ?? 'gray'} variant="light" tt="capitalize" size="sm">
                {pqrSeleccionada?.tipo}
              </Badge>
              <Badge color={estadoColor[pqrSeleccionada?.estado] ?? 'gray'} variant="filled" size="sm">
                {pqrSeleccionada?.estado?.replace('_', ' ')}
              </Badge>
            </Group>
            <Text fw={600} size="sm" lineClamp={2}>{pqrSeleccionada?.asunto}</Text>
          </Stack>
        }
        position="right"
        size="md"
        overlayProps={{ blur: 2 }}
      >
        {cargandoDetalle ? (
          <Center h={200}><Loader /></Center>
        ) : (
          <Stack gap="lg" pt="sm">
            {/* Descripción original */}
            <Paper p="md" radius="md" withBorder>
              <Stack gap="xs">
                <Group gap="xs">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Descripción</Text>
                  <Text size="xs" c="dimmed">·</Text>
                  <Text size="xs" c="dimmed">
                    {pqrSeleccionada?.created_at
                      ? format(parseISO(pqrSeleccionada.created_at), "dd 'de' MMMM yyyy", { locale: es })
                      : ''}
                  </Text>
                </Group>
                <Text size="sm">{pqrSeleccionada?.descripcion}</Text>
                {esAdmin && pqrSeleccionada?.usuarios && (
                  <Text size="xs" c="dimmed">Radicado por: {pqrSeleccionada.usuarios.nombre} ({pqrSeleccionada.usuarios.email})</Text>
                )}
              </Stack>
            </Paper>

            {/* Timeline de respuestas */}
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="sm">Historial de respuestas</Text>
              {respuestas.length === 0 ? (
                <Text size="sm" c="dimmed">Sin respuestas aún.</Text>
              ) : (
                <Stack gap="sm">
                  {respuestas.map((r) => (
                    <Paper
                      key={r.id}
                      p="sm"
                      radius="md"
                      withBorder
                      style={{
                        borderLeft: `4px solid var(--mantine-color-${r.es_admin ? 'blue' : 'teal'}-4)`,
                        background: `var(--mantine-color-${r.es_admin ? 'blue' : 'teal'}-0)`,
                      }}
                    >
                      <Group gap="xs" mb={4} justify="space-between">
                        <Group gap="xs">
                          <Text size="xs" fw={600} c={r.es_admin ? 'blue' : 'teal'}>
                            {r.es_admin ? 'Administración' : (r.usuarios?.nombre ?? 'Usuario')}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <Clock size={11} />
                          <Text size="xs" c="dimmed">
                            {r.created_at ? format(parseISO(r.created_at), 'dd MMM yyyy HH:mm', { locale: es }) : ''}
                          </Text>
                        </Group>
                      </Group>
                      <Text size="sm">{r.texto}</Text>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>

            <Divider />

            {/* Responder / cambiar estado */}
            <Stack gap="sm">
              <Text size="sm" fw={500}>
                {esAdmin ? 'Gestionar PQR' : 'Añadir comentario'}
              </Text>
              {esAdmin && (
                <Select
                  label="Cambiar estado"
                  data={ESTADOS.map((e) => ({
                    value: e,
                    label: e.replace('_', ' ').charAt(0).toUpperCase() + e.replace('_', ' ').slice(1),
                  }))}
                  value={nuevoEstado}
                  onChange={(v) => setNuevoEstado(v ?? pqrSeleccionada?.estado)}
                />
              )}
              <Textarea
                label="Respuesta / comentario"
                placeholder="Escribe tu respuesta..."
                minRows={3}
                value={textoRespuesta}
                onChange={(e) => setTextoRespuesta(e.target.value)}
              />
              <Button
                onClick={handleEnviarRespuesta}
                loading={enviandoRespuesta}
                leftSection={<Send size={14} />}
              >
                Enviar
              </Button>
            </Stack>
          </Stack>
        )}
      </Drawer>

      {/* ── Modal radicar PQR ──────────────────────────────────────────────────── */}
      <Modal
        opened={modalAbierto}
        onClose={cerrarModal}
        title={<Group gap="xs"><MessageSquare size={18} /><Text fw={600}>Radicar PQR</Text></Group>}
        size="md"
        centered
        overlayProps={{ blur: 3 }}
      >
        <Stack gap="sm">
          <Group grow>
            <Select
              label="Tipo"
              required
              data={TIPOS.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
              value={form.tipo}
              onChange={(v) => setField('tipo', v ?? 'peticion')}
            />
            <Select
              label="Categoría"
              required
              data={CATEGORIAS.map((c) => ({ value: c, label: c.replace('_', ' ').charAt(0).toUpperCase() + c.replace('_', ' ').slice(1) }))}
              value={form.categoria}
              onChange={(v) => setField('categoria', v ?? 'otro')}
            />
          </Group>
          <TextInput
            label="Asunto"
            placeholder="Resumen breve del problema o solicitud"
            required
            value={form.asunto}
            onChange={(e) => setField('asunto', e.target.value)}
          />
          <Textarea
            label="Descripción detallada"
            placeholder="Explica con detalle tu petición, queja o reclamo..."
            required
            minRows={4}
            value={form.descripcion}
            onChange={(e) => setField('descripcion', e.target.value)}
          />
          <Divider mt="xs" />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={cerrarModal} disabled={guardando}>Cancelar</Button>
            <Button onClick={handleGuardar} loading={guardando} leftSection={<Send size={14} />}>
              Radicar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
