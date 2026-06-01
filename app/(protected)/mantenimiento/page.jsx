'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Button, Modal, Select, Badge, Group, Stack,
  Title, Text, Paper, Loader, Center, SimpleGrid, Card,
  Divider, Textarea, TextInput
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { Plus, Wrench, AlertTriangle, ArrowRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../../services/supabaseClient'
import { useAuth } from '../../../context/AuthContext'

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADOS_ORDEN = ['creada', 'asignada', 'en_proceso', 'terminada']

const ESTADO_LABEL = {
  creada: 'Creada',
  asignada: 'Asignada',
  en_proceso: 'En Proceso',
  terminada: 'Terminada',
}

const ESTADO_COLOR = {
  creada: 'gray',
  asignada: 'blue',
  en_proceso: 'orange',
  terminada: 'green',
}

const PRIORIDAD_COLOR = {
  urgente: 'red',
  alta: 'orange',
  media: 'blue',
  baja: 'green',
}

const PRIORIDADES = ['urgente', 'alta', 'media', 'baja']

const FORM_INICIAL = { descripcion: '', area: '', prioridad: 'media' }

// ─── Tarjeta de solicitud ──────────────────────────────────────────────────────

function SolicitudCard({ solicitud, esAdmin, tecnicos, onAvanzar, onAsignar }) {
  const [tecnico, setTecnico] = useState(solicitud.id_tecnico ?? '')
  const [asignando, setAsignando] = useState(false)
  const [avanzando, setAvanzando] = useState(false)

  const estadoActual = solicitud.estado
  const puedeAvanzar = estadoActual !== 'terminada'
  const estadoSiguiente = ESTADOS_ORDEN[ESTADOS_ORDEN.indexOf(estadoActual) + 1]


  async function handleAsignar() {
    if (!tecnico) return notifications.show({ color: 'yellow', message: 'Selecciona un técnico.' })
    setAsignando(true)
    await onAsignar(solicitud.id, tecnico)
    setAsignando(false)
  }

  async function handleAvanzar() {
    setAvanzando(true)
    await onAvanzar(solicitud.id, estadoSiguiente)
    setAvanzando(false)
  }

  return (
    <Card shadow="sm" padding="sm" radius="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Badge size="xs" color={PRIORIDAD_COLOR[solicitud.prioridad] ?? 'gray'} variant="filled" tt="capitalize">
            {solicitud.prioridad}
          </Badge>
          <Text size="xs" c="dimmed">
            {solicitud.created_at
              ? format(parseISO(solicitud.created_at), 'dd MMM', { locale: es })
              : ''}
          </Text>
        </Group>

        <Text size="sm" fw={500} lineClamp={3} style={{ wordBreak: 'break-word' }}>
          {solicitud.descripcion}
        </Text>

        {solicitud.area && (
          <Text size="xs" c="dimmed">Área: {solicitud.area}</Text>
        )}

        {solicitud.usuarios && (
          <Text size="xs" c="dimmed">Por: {solicitud.usuarios.nombre}</Text>
        )}

        {solicitud.id_tecnico && solicitud.tecnicos && (
          <Text size="xs" c="teal">Técnico: {solicitud.tecnicos.nombre}</Text>
        )}

        {esAdmin && estadoActual === 'creada' && (
          <Stack gap={4}>
            <Select
              size="xs"
              placeholder="Asignar técnico..."
              data={tecnicos.map((t) => ({ value: t.id, label: t.nombre }))}
              value={tecnico}
              onChange={(v) => setTecnico(v ?? '')}
              searchable
              nothingFoundMessage="Sin resultados"
            />
            <Button size="xs" variant="light" color="blue" loading={asignando} onClick={handleAsignar}>
              Asignar
            </Button>
          </Stack>
        )}

        {esAdmin && puedeAvanzar && estadoActual !== 'creada' && (
          <Button
            size="xs"
            variant="light"
            color={ESTADO_COLOR[estadoSiguiente] ?? 'gray'}
            loading={avanzando}
            rightSection={<ArrowRight size={12} />}
            onClick={handleAvanzar}
          >
            Pasar a {ESTADO_LABEL[estadoSiguiente]}
          </Button>
        )}

        {!esAdmin && puedeAvanzar && (
          <Button
            size="xs"
            variant="light"
            color={ESTADO_COLOR[estadoSiguiente] ?? 'gray'}
            loading={avanzando}
            rightSection={<ArrowRight size={12} />}
            onClick={handleAvanzar}
          >
            Marcar: {ESTADO_LABEL[estadoSiguiente]}
          </Button>
        )}
      </Stack>
    </Card>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function MantenimientoPage() {
  const { perfil, rol } = useAuth()
  const esAdmin = rol === 'administrador'

  // ── Datos ────────────────────────────────────────────────────────────────────
  const [solicitudes, setSolicitudes] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Modal reportar daño ────────────────────────────────────────────────────────
  const [modalAbierto, { open: abrirModal, close: cerrarModal }] = useDisclosure(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [guardando, setGuardando] = useState(false)

  // ── Cargar datos ──────────────────────────────────────────────────────────────
  const cargarSolicitudes = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .select(`
          id, descripcion, area, prioridad, estado, created_at, id_tecnico,
          usuarios:id_reportado_por(nombre),
          tecnicos:id_tecnico(nombre)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      setSolicitudes(data ?? [])
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error', message: err.message })
    } finally {
      setLoading(false)
    }
  }, [])

  const cargarTecnicos = useCallback(async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nombre')
      .in('rol', ['tecnico', 'administrador'])
      .order('nombre')
    setTecnicos(data ?? [])
  }, [])

  useEffect(() => {
    cargarSolicitudes()
    if (esAdmin) cargarTecnicos()
  }, [cargarSolicitudes, cargarTecnicos, esAdmin])

  // ── Crear solicitud ────────────────────────────────────────────────────────────
  function setField(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleGuardar() {
    if (!form.descripcion.trim()) {
      notifications.show({ color: 'yellow', message: 'La descripción es obligatoria.' })
      return
    }
    setGuardando(true)
    try {
      const { error } = await supabase.from('ordenes_trabajo').insert([{
        descripcion: form.descripcion.trim(),
        area: form.area.trim() || null,
        prioridad: form.prioridad,
        estado: 'creada',
        id_reportado_por: perfil?.id ?? null,
      }])
      if (error) throw error
      notifications.show({ color: 'green', title: 'Solicitud creada', message: 'El daño fue reportado correctamente.' })
      setForm(FORM_INICIAL)
      cerrarModal()
      cargarSolicitudes()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al crear solicitud', message: err.message })
    } finally {
      setGuardando(false)
    }
  }

  // ── Avanzar estado ─────────────────────────────────────────────────────────────
  async function handleAvanzar(id, nuevoEstado) {
    try {
      const { error } = await supabase
        .from('ordenes_trabajo')
        .update({ estado: nuevoEstado })
        .eq('id', id)
      if (error) throw error
      notifications.show({ color: 'green', message: `Estado actualizado a "${ESTADO_LABEL[nuevoEstado]}".` })
      cargarSolicitudes()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error', message: err.message })
    }
  }

  // ── Asignar técnico ────────────────────────────────────────────────────────────
  async function handleAsignar(id, tecnicoId) {
    try {
      const { error } = await supabase
        .from('ordenes_trabajo')
        .update({ id_tecnico: tecnicoId, estado: 'asignada' })
        .eq('id', id)
      if (error) throw error
      notifications.show({ color: 'green', message: 'Técnico asignado correctamente.' })
      cargarSolicitudes()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al asignar', message: err.message })
    }
  }

  const columnas = ESTADOS_ORDEN.map((estado) => ({
    estado,
    items: solicitudes.filter((s) => s.estado === estado),
  }))

  return (
    <>
      <Stack gap="lg">
        {/* Cabecera */}
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Stack gap={2}>
            <Title order={3}>Mantenimiento</Title>
            <Text size="sm" c="dimmed">{solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''} registrada{solicitudes.length !== 1 ? 's' : ''}</Text>
          </Stack>
          <Button leftSection={<Plus size={16} />} onClick={abrirModal} color="orange">
            Reportar daño
          </Button>
        </Group>

        {/* Kanban */}
        {loading ? (
          <Center h={300}><Loader size="md" /></Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {columnas.map(({ estado, items }) => (
              <Stack key={estado} gap="sm">
                {/* Cabecera columna */}
                <Paper p="xs" radius="sm" bg={`${ESTADO_COLOR[estado]}.0`} withBorder>
                  <Group gap="xs" justify="space-between">
                    <Text size="sm" fw={700} c={`${ESTADO_COLOR[estado]}.8`}>
                      {ESTADO_LABEL[estado]}
                    </Text>
                    <Badge size="sm" color={ESTADO_COLOR[estado]} variant="filled" circle>
                      {items.length}
                    </Badge>
                  </Group>
                </Paper>

                {/* Tarjetas */}
                {items.length === 0 ? (
                  <Paper p="md" radius="md" withBorder style={{ borderStyle: 'dashed' }}>
                    <Center>
                      <Text size="xs" c="dimmed">Sin solicitudes</Text>
                    </Center>
                  </Paper>
                ) : (
                  items.map((s) => (
                    <SolicitudCard
                      key={s.id}
                      solicitud={s}
                      esAdmin={esAdmin}
                      tecnicos={tecnicos}
                      onAvanzar={handleAvanzar}
                      onAsignar={handleAsignar}
                    />
                  ))
                )}
              </Stack>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      {/* ── Modal reportar daño ─────────────────────────────────────────────────── */}
      <Modal
        opened={modalAbierto}
        onClose={cerrarModal}
        title={
          <Group gap="xs">
            <AlertTriangle size={18} color="var(--mantine-color-orange-5)" />
            <Text fw={600}>Reportar daño</Text>
          </Group>
        }
        size="md"
        centered
        overlayProps={{ blur: 3 }}
      >
        <Stack gap="sm">
          <Textarea
            label="Descripción del daño"
            placeholder="Describe detalladamente el problema..."
            required
            minRows={3}
            value={form.descripcion}
            onChange={(e) => setField('descripcion', e.target.value)}
          />
          <TextInput
            label="Área o ubicación"
            placeholder="Ej: Parqueadero, Zona verde, Escaleras..."
            value={form.area}
            onChange={(e) => setField('area', e.target.value)}
          />
          <Select
            label="Prioridad"
            required
            data={PRIORIDADES.map((p) => ({
              value: p,
              label: p.charAt(0).toUpperCase() + p.slice(1),
            }))}
            value={form.prioridad}
            onChange={(v) => setField('prioridad', v ?? 'media')}
          />
          <Divider mt="xs" />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={cerrarModal} disabled={guardando}>Cancelar</Button>
            <Button onClick={handleGuardar} loading={guardando} color="orange" leftSection={<Wrench size={14} />}>
              Reportar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
