'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Modal, TextInput, NumberInput, Select, ActionIcon,
  Badge, Group, Stack, Title, Text, Paper, Loader, Center,
  Pagination, ScrollArea, Tooltip, Divider, Box, Grid
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import {
  Plus, Pencil, Trash2, Search, X, Home,
  AlertTriangle, CheckCircle2
} from 'lucide-react'
import { supabase } from '../../../services/supabaseClient'
import { useAuth } from '../../../context/AuthContext'

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS = ['apartamento', 'local', 'oficina', 'parqueadero', 'bodega']
const ESTADOS = ['activo', 'inactivo', 'mora', 'venta', 'arriendo']
const POR_PAGINA = 10

const estadoColor = {
  activo: 'green',
  inactivo: 'gray',
  mora: 'red',
  venta: 'blue',
  arriendo: 'violet',
}

const FORM_INICIAL = {
  numero: '',
  torre: '',
  piso: '',
  tipo: '',
  estado: 'activo',
  area_m2: '',
  coeficiente: '',
  propietario_id: '',
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function UnidadesPage() {
  const { rol } = useAuth()

  // ── Estado de datos ─────────────────────────────────────────────────────────
  const [unidades, setUnidades] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [propietarios, setPropietarios] = useState([])

  // ── Paginación / filtros ────────────────────────────────────────────────────
  const [pagina, setPagina] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  // ── Modal ───────────────────────────────────────────────────────────────────
  const [modalAbierto, { open: abrirModal, close: cerrarModal }] = useDisclosure(false)
  const [modalEliminar, { open: abrirEliminar, close: cerrarEliminar }] = useDisclosure(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  // ── Carga propietarios ──────────────────────────────────────────────────────
  const cargarPropietarios = useCallback(async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nombre, email')
      .in('rol', ['propietario'])
      .order('nombre')
    setPropietarios(data ?? [])
  }, [])

  // ── Carga unidades ──────────────────────────────────────────────────────────
  const cargarUnidades = useCallback(async () => {
    setLoading(true)
    try {
      const desde = (pagina - 1) * POR_PAGINA
      const hasta = desde + POR_PAGINA - 1

      const makeQuery = (ownerColumn) => {
        let query = supabase
          .from('unidades')
          .select(
            `id, numero, torre, piso, tipo, estado, area_m2, coeficiente, ${ownerColumn}`,
            { count: 'exact' }
          )

        if (filtroBusqueda) query = query.or(`numero.ilike.%${filtroBusqueda}%,torre.ilike.%${filtroBusqueda}%`)
        if (filtroTipo) query = query.eq('tipo', filtroTipo)
        if (filtroEstado) query = query.eq('estado', filtroEstado)

        return query.order('torre', { nullsFirst: true }).order('numero').range(desde, hasta)
      }

      // Evita dependencia de relaciones PostgREST: obtenemos usuarios en 2da consulta.
      let { data, count, error } = await makeQuery('propietario_id')
      if (error?.code === '42703') {
        const fallback = await makeQuery('id_propietario')
        data = fallback.data
        count = fallback.count
        error = fallback.error
      }
      if (error) throw error

      const baseUnidades = (data ?? []).map((u) => ({
        ...u,
        propietario_id: u.propietario_id ?? u.id_propietario ?? null,
      }))
      const ownerIds = [...new Set(baseUnidades.map((u) => u.propietario_id).filter(Boolean))]
      let ownersMap = new Map()

      if (ownerIds.length > 0) {
        const { data: owners, error: errOwners } = await supabase
          .from('usuarios')
          .select('id, nombre, email')
          .in('id', ownerIds)
        if (errOwners) throw errOwners
        ownersMap = new Map((owners ?? []).map((o) => [o.id, o]))
      }

      const enriched = baseUnidades.map((u) => ({
        ...u,
        usuarios: u.propietario_id ? ownersMap.get(u.propietario_id) ?? null : null,
      }))

      setUnidades(enriched)
      setTotal(count ?? 0)
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al cargar unidades',
        message: err.message ?? 'Intenta de nuevo.',
      })
    } finally {
      setLoading(false)
    }
  }, [pagina, filtroBusqueda, filtroTipo, filtroEstado])

  useEffect(() => { cargarPropietarios() }, [cargarPropietarios])
  useEffect(() => { cargarUnidades() }, [cargarUnidades])

  // ── Al cambiar filtros, volver a página 1 ───────────────────────────────────
  useEffect(() => { setPagina(1) }, [filtroBusqueda, filtroTipo, filtroEstado])

  // ── Helpers de modal ────────────────────────────────────────────────────────
  function abrirCrear() {
    setModoEdicion(false)
    setUnidadSeleccionada(null)
    setForm(FORM_INICIAL)
    abrirModal()
  }

  function abrirEditar(unidad) {
    setModoEdicion(true)
    setUnidadSeleccionada(unidad)
    setForm({
      numero: unidad.numero ?? '',
      torre: unidad.torre ?? '',
      piso: unidad.piso ?? '',
      tipo: unidad.tipo ?? '',
      estado: unidad.estado ?? 'activo',
      area_m2: unidad.area_m2 ?? '',
      coeficiente: unidad.coeficiente ?? '',
      propietario_id: unidad.propietario_id ?? '',
    })
    abrirModal()
  }

  function confirmarEliminar(unidad) {
    setUnidadSeleccionada(unidad)
    abrirEliminar()
  }

  function setField(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  // ── Guardar (crear / editar) ────────────────────────────────────────────────
  async function handleGuardar() {
    if (!form.numero.trim()) {
      notifications.show({ color: 'yellow', message: 'El número de unidad es obligatorio.' })
      return
    }
    if (!form.tipo) {
      notifications.show({ color: 'yellow', message: 'Selecciona el tipo de unidad.' })
      return
    }

    setGuardando(true)
    try {
      const payload = {
        numero: form.numero.trim(),
        torre: form.torre.trim() || null,
        piso: form.piso !== '' ? Number(form.piso) : null,
        tipo: form.tipo,
        estado: form.estado,
        area_m2: form.area_m2 !== '' ? Number(form.area_m2) : null,
        coeficiente: form.coeficiente !== '' ? Number(form.coeficiente) : null,
        propietario_id: form.propietario_id || null,
      }

      if (modoEdicion) {
        const { error } = await supabase
          .from('unidades')
          .update(payload)
          .eq('id', unidadSeleccionada.id)
        if (error) throw error
        notifications.show({ color: 'green', title: 'Unidad actualizada', message: `Unidad ${payload.numero} guardada correctamente.` })
      } else {
        const { error } = await supabase.from('unidades').insert([payload])
        if (error) throw error
        notifications.show({ color: 'green', title: 'Unidad creada', message: `Unidad ${payload.numero} registrada correctamente.` })
      }

      cerrarModal()
      cargarUnidades()
    } catch (err) {
      notifications.show({
        color: 'red',
        title: modoEdicion ? 'Error al actualizar' : 'Error al crear',
        message: err.message ?? 'Ocurrió un error inesperado.',
      })
    } finally {
      setGuardando(false)
    }
  }

  // ── Eliminar ────────────────────────────────────────────────────────────────
  async function handleEliminar() {
    if (!unidadSeleccionada) return
    setEliminando(true)
    try {
      const { error } = await supabase
        .from('unidades')
        .delete()
        .eq('id', unidadSeleccionada.id)
      if (error) throw error
      notifications.show({
        color: 'green',
        title: 'Unidad eliminada',
        message: `Unidad ${unidadSeleccionada.numero} eliminada.`,
      })
      cerrarEliminar()
      // Si era la última de la página, retroceder
      if (unidades.length === 1 && pagina > 1) setPagina((p) => p - 1)
      else cargarUnidades()
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al eliminar',
        message: err.message ?? 'No se pudo eliminar la unidad.',
      })
    } finally {
      setEliminando(false)
    }
  }

  // ── Búsqueda con debounce manual ────────────────────────────────────────────
  function handleBusquedaChange(valor) {
    setBusqueda(valor)
    if (valor.length === 0 || valor.length >= 2) {
      setFiltroBusqueda(valor)
    }
  }

  function limpiarFiltros() {
    setBusqueda('')
    setFiltroBusqueda('')
    setFiltroTipo('')
    setFiltroEstado('')
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)
  const hayFiltros = filtroBusqueda || filtroTipo || filtroEstado

  const propietariosOpciones = propietarios.map((p) => ({
    value: p.id,
    label: `${p.nombre} (${p.email})`,
  }))

  // ── Si no es administrador ──────────────────────────────────────────────────
  if (rol && rol !== 'administrador') {
    return (
      <Center h="50vh">
        <Stack align="center" gap="sm">
          <AlertTriangle size={48} color="var(--mantine-color-orange-5)" />
          <Title order={4}>Acceso restringido</Title>
          <Text c="dimmed">Solo los administradores pueden gestionar unidades.</Text>
        </Stack>
      </Center>
    )
  }

  return (
    <>
      <Stack gap="lg">
        {/* Cabecera */}
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Stack gap={2}>
            <Title order={3}>Gestión de Unidades</Title>
            <Text size="sm" c="dimmed">
              {total > 0 ? `${total} unidad${total !== 1 ? 'es' : ''} registrada${total !== 1 ? 's' : ''}` : 'Sin unidades registradas'}
            </Text>
          </Stack>
          <Button leftSection={<Plus size={16} />} onClick={abrirCrear}>
            Nueva unidad
          </Button>
        </Group>

        {/* Filtros */}
        <Paper p="md" radius="md" withBorder>
          <Grid gutter="sm" align="flex-end">
            <Grid.Col span={{ base: 12, sm: 5 }}>
              <TextInput
                label="Buscar"
                placeholder="Número o torre..."
                leftSection={<Search size={15} />}
                value={busqueda}
                onChange={(e) => handleBusquedaChange(e.target.value)}
                rightSection={
                  busqueda ? (
                    <ActionIcon variant="subtle" size="sm" onClick={() => handleBusquedaChange('')}>
                      <X size={14} />
                    </ActionIcon>
                  ) : null
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
                data={ESTADOS.map((e) => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))}
                value={filtroEstado}
                onChange={(v) => setFiltroEstado(v ?? '')}
                clearable
              />
            </Grid.Col>
            {hayFiltros && (
              <Grid.Col span={{ base: 12, sm: 1 }}>
                <Tooltip label="Limpiar filtros">
                  <Button variant="subtle" color="gray" px="xs" onClick={limpiarFiltros} fullWidth>
                    <X size={16} />
                  </Button>
                </Tooltip>
              </Grid.Col>
            )}
          </Grid>
        </Paper>

        {/* Tabla */}
        <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
          {loading ? (
            <Center h={300}>
              <Loader size="md" />
            </Center>
          ) : unidades.length === 0 ? (
            <Center h={200}>
              <Stack align="center" gap="xs">
                <Home size={40} color="var(--mantine-color-gray-4)" />
                <Text size="sm" c="dimmed">
                  {hayFiltros ? 'No hay unidades con esos filtros.' : 'No hay unidades registradas.'}
                </Text>
                {hayFiltros && (
                  <Button variant="subtle" size="xs" onClick={limpiarFiltros}>
                    Limpiar filtros
                  </Button>
                )}
              </Stack>
            </Center>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover verticalSpacing="sm" miw={760}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Número</Table.Th>
                    <Table.Th>Torre</Table.Th>
                    <Table.Th>Piso</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th>Propietario</Table.Th>
                    <Table.Th>Área (m²)</Table.Th>
                    <Table.Th ta="center">Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {unidades.map((u) => (
                    <Table.Tr key={u.id}>
                      <Table.Td>
                        <Text size="sm" fw={600}>{u.numero}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{u.torre ?? '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{u.piso ?? '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" style={{ textTransform: 'capitalize' }}>{u.tipo ?? '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={estadoColor[u.estado] ?? 'gray'}
                          variant="light"
                          style={{ textTransform: 'capitalize' }}
                        >
                          {u.estado ?? '—'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {u.usuarios ? (
                          <Stack gap={0}>
                            <Text size="sm">{u.usuarios.nombre}</Text>
                            <Text size="xs" c="dimmed">{u.usuarios.email}</Text>
                          </Stack>
                        ) : (
                          <Text size="sm" c="dimmed">Sin propietario</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{u.area_m2 != null ? `${u.area_m2} m²` : '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group justify="center" gap="xs">
                          <Tooltip label="Editar">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="sm"
                              onClick={() => abrirEditar(u)}
                            >
                              <Pencil size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Eliminar">
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="sm"
                              onClick={() => confirmarEliminar(u)}
                            >
                              <Trash2 size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}

          {/* Paginación */}
          {!loading && totalPaginas > 1 && (
            <>
              <Divider />
              <Group justify="space-between" p="md" wrap="wrap" gap="xs">
                <Text size="sm" c="dimmed">
                  Mostrando {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, total)} de {total}
                </Text>
                <Pagination
                  value={pagina}
                  onChange={setPagina}
                  total={totalPaginas}
                  size="sm"
                  withEdges
                />
              </Group>
            </>
          )}
        </Paper>
      </Stack>

      {/* ── Modal Crear / Editar ─────────────────────────────────────────────── */}
      <Modal
        opened={modalAbierto}
        onClose={cerrarModal}
        title={
          <Group gap="xs">
            <Home size={18} />
            <Text fw={600}>{modoEdicion ? 'Editar unidad' : 'Nueva unidad'}</Text>
          </Group>
        }
        size="lg"
        centered
        overlayProps={{ blur: 3 }}
      >
        <Stack gap="sm">
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Número de unidad"
                placeholder="Ej: 101, A-05"
                required
                value={form.numero}
                onChange={(e) => setField('numero', e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Torre / Bloque"
                placeholder="Ej: A, B, Norte"
                value={form.torre}
                onChange={(e) => setField('torre', e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Piso"
                placeholder="Ej: 3"
                min={-5}
                max={100}
                value={form.piso}
                onChange={(v) => setField('piso', v)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Tipo"
                placeholder="Selecciona..."
                required
                data={TIPOS.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
                value={form.tipo}
                onChange={(v) => setField('tipo', v ?? '')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Estado"
                data={ESTADOS.map((e) => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))}
                value={form.estado}
                onChange={(v) => setField('estado', v ?? 'activo')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Área (m²)"
                placeholder="Ej: 75.5"
                min={0}
                decimalScale={2}
                value={form.area_m2}
                onChange={(v) => setField('area_m2', v)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Coeficiente (%)"
                placeholder="Ej: 1.25"
                min={0}
                max={100}
                decimalScale={4}
                value={form.coeficiente}
                onChange={(v) => setField('coeficiente', v)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Propietario"
                placeholder="Sin propietario"
                data={propietariosOpciones}
                value={form.propietario_id}
                onChange={(v) => setField('propietario_id', v ?? '')}
                searchable
                clearable
                nothingFoundMessage="Sin resultados"
              />
            </Grid.Col>
          </Grid>

          <Divider mt="xs" />

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={cerrarModal} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar} loading={guardando}>
              {modoEdicion ? 'Guardar cambios' : 'Crear unidad'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Modal Confirmar Eliminar ─────────────────────────────────────────── */}
      <Modal
        opened={modalEliminar}
        onClose={cerrarEliminar}
        title={
          <Group gap="xs">
            <AlertTriangle size={18} color="var(--mantine-color-red-5)" />
            <Text fw={600} c="red">Eliminar unidad</Text>
          </Group>
        }
        size="sm"
        centered
        overlayProps={{ blur: 3 }}
      >
        <Stack gap="md">
          <Text size="sm">
            ¿Estás seguro de que deseas eliminar la unidad{' '}
            <strong>{unidadSeleccionada?.numero}</strong>
            {unidadSeleccionada?.torre ? ` (Torre ${unidadSeleccionada.torre})` : ''}?
            Esta acción no se puede deshacer.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={cerrarEliminar} disabled={eliminando}>
              Cancelar
            </Button>
            <Button color="red" onClick={handleEliminar} loading={eliminando} leftSection={<Trash2 size={14} />}>
              Eliminar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
