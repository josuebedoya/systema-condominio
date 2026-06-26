'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Modal, TextInput, Select, Badge, Group, Stack,
  Title, Text, Paper, Loader, Center, Drawer, ScrollArea, Divider,
  ActionIcon, Avatar, Box, Grid
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import {
  Plus, Search, X, User, Mail, Car, Home, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getUsuarios, getVehiculosByPropietario, createUsuario } from '@/supabase/helpers/usuarios'
import { getUnidadesByPropietario } from '@/supabase/helpers/unidades'

const ROLES = ['propietario', 'residente']

const rolColor = {
  propietario: 'blue',
  residente: 'teal',
  administrador: 'violet',
  portero: 'orange',
}

const FORM_INICIAL = { nombre: '', email: '', telefono: '', documento: '', rol: 'propietario' }

export default function PropietariosPage() {
  const { rol: rolUsuario } = useAuth()

  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('')

  const [drawerAbierto, { open: abrirDrawer, close: cerrarDrawer }] = useDisclosure(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [unidadesUsuario, setUnidadesUsuario] = useState([])
  const [vehiculosUsuario, setVehiculosUsuario] = useState([])
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const [modalAbierto, { open: abrirModal, close: cerrarModal }] = useDisclosure(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [guardando, setGuardando] = useState(false)

  const cargarUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await getUsuarios({ roles: ROLES, busqueda: filtroBusqueda, filtroRol })
      if (error) throw error
      setUsuarios(data ?? [])
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al cargar usuarios', message: err.message })
    } finally {
      setLoading(false)
    }
  }, [filtroBusqueda, filtroRol])

  useEffect(() => { cargarUsuarios() }, [cargarUsuarios])

  async function verDetalle(u) {
    setUsuarioSeleccionado(u)
    abrirDrawer()
    setCargandoDetalle(true)
    try {
      const [{ data: unidades }, { data: vehiculos, error: errV }] = await Promise.all([
        getUnidadesByPropietario(u.id),
        getVehiculosByPropietario(u.id),
      ])

      let vehiculosFinales = vehiculos
      if (errV?.code === '42703') {
        const unidadesIds = (unidades ?? []).map((x) => x.id)
        const { data: fallbackV } = await getVehiculosByPropietario(u.id, unidadesIds)
        vehiculosFinales = fallbackV ?? []
      }

      setUnidadesUsuario(unidades ?? [])
      setVehiculosUsuario(vehiculosFinales ?? [])
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error', message: err.message })
    } finally {
      setCargandoDetalle(false)
    }
  }

  function setField(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleGuardar() {
    if (!form.nombre.trim()) {
      notifications.show({ color: 'yellow', message: 'El nombre es obligatorio.' })
      return
    }
    if (!form.email.trim()) {
      notifications.show({ color: 'yellow', message: 'El email es obligatorio.' })
      return
    }
    setGuardando(true)
    try {
      const { error } = await createUsuario({
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        telefono: form.telefono.trim() || null,
        documento: form.documento.trim() || null,
        rol: form.rol,
      })
      if (error) throw error
      notifications.show({ color: 'green', title: 'Usuario creado', message: `${form.nombre} registrado correctamente.` })
      setForm(FORM_INICIAL)
      cerrarModal()
      cargarUsuarios()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al crear usuario', message: err.message })
    } finally {
      setGuardando(false)
    }
  }

  function handleBusquedaChange(valor) {
    setBusqueda(valor)
    if (valor.length === 0 || valor.length >= 2) setFiltroBusqueda(valor)
  }

  const esAdmin = rolUsuario === 'administrador'

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Stack gap={2}>
            <Title order={3}>Propietarios y Residentes</Title>
            <Text size="sm" c="dimmed">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}</Text>
          </Stack>
          {esAdmin && (
            <Button leftSection={<Plus size={16} />} onClick={abrirModal}>
              Nuevo usuario
            </Button>
          )}
        </Group>

        <Paper p="md" radius="md" withBorder>
          <Grid gutter="sm" align="flex-end">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Buscar"
                placeholder="Nombre o email..."
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
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Select
                label="Rol"
                placeholder="Todos"
                data={ROLES.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
                value={filtroRol}
                onChange={(v) => setFiltroRol(v ?? '')}
                clearable
              />
            </Grid.Col>
            {(filtroBusqueda || filtroRol) && (
              <Grid.Col span={{ base: 12, sm: 2 }}>
                <Button variant="subtle" color="gray" fullWidth onClick={() => { setBusqueda(''); setFiltroBusqueda(''); setFiltroRol('') }}>
                  Limpiar
                </Button>
              </Grid.Col>
            )}
          </Grid>
        </Paper>

        <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
          {loading ? (
            <Center h={300}><Loader size="md" /></Center>
          ) : usuarios.length === 0 ? (
            <Center h={200}>
              <Stack align="center" gap="xs">
                <User size={40} color="var(--mantine-color-gray-4)" />
                <Text size="sm" c="dimmed">No hay usuarios con esos criterios.</Text>
              </Stack>
            </Center>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover verticalSpacing="sm" miw={600} style={{ cursor: 'pointer' }}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Nombre</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Teléfono</Table.Th>
                    <Table.Th>Documento</Table.Th>
                    <Table.Th>Rol</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {usuarios.map((u) => (
                    <Table.Tr key={u.id} onClick={() => verDetalle(u)}>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <Avatar color={rolColor[u.rol] ?? 'gray'} radius="xl" size="sm">
                            {u.nombre?.charAt(0)?.toUpperCase() ?? 'U'}
                          </Avatar>
                          <Text size="sm" fw={500}>{u.nombre}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td><Text size="sm">{u.email}</Text></Table.Td>
                      <Table.Td><Text size="sm">{u.telefono ?? '—'}</Text></Table.Td>
                      <Table.Td><Text size="sm">{u.documento ?? '—'}</Text></Table.Td>
                      <Table.Td>
                        <Badge size="sm" color={rolColor[u.rol] ?? 'gray'} variant="light" style={{ textTransform: 'capitalize' }}>
                          {u.rol}
                        </Badge>
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

      <Drawer
        opened={drawerAbierto}
        onClose={cerrarDrawer}
        title={
          <Group gap="sm">
            <Avatar color={rolColor[usuarioSeleccionado?.rol] ?? 'gray'} radius="xl">
              {usuarioSeleccionado?.nombre?.charAt(0)?.toUpperCase() ?? 'U'}
            </Avatar>
            <Stack gap={0}>
              <Text fw={600}>{usuarioSeleccionado?.nombre}</Text>
              <Text size="xs" c="dimmed">{usuarioSeleccionado?.email}</Text>
            </Stack>
          </Group>
        }
        position="right"
        size="md"
        overlayProps={{ blur: 2 }}
      >
        {cargandoDetalle ? (
          <Center h={200}><Loader size="md" /></Center>
        ) : (
          <Stack gap="lg" pt="sm">
            <Paper p="md" radius="md" withBorder>
              <Stack gap="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Información personal</Text>
                <Divider />
                <Group gap="sm">
                  <Mail size={14} color="var(--mantine-color-dimmed)" />
                  <Text size="sm">{usuarioSeleccionado?.email}</Text>
                </Group>
                {usuarioSeleccionado?.telefono && (
                  <Group gap="sm">
                    <User size={14} color="var(--mantine-color-dimmed)" />
                    <Text size="sm">{usuarioSeleccionado.telefono}</Text>
                  </Group>
                )}
                {usuarioSeleccionado?.documento && (
                  <Group gap="sm">
                    <User size={14} color="var(--mantine-color-dimmed)" />
                    <Text size="sm">Doc: {usuarioSeleccionado.documento}</Text>
                  </Group>
                )}
                <Group gap="sm">
                  <Badge size="sm" color={rolColor[usuarioSeleccionado?.rol] ?? 'gray'} variant="light">
                    {usuarioSeleccionado?.rol}
                  </Badge>
                </Group>
              </Stack>
            </Paper>

            <Box>
              <Group gap="xs" mb="sm">
                <Home size={16} />
                <Text fw={600} size="sm">Unidades ({unidadesUsuario.length})</Text>
              </Group>
              {unidadesUsuario.length === 0 ? (
                <Text size="sm" c="dimmed">Sin unidades asignadas.</Text>
              ) : (
                <Stack gap="xs">
                  {unidadesUsuario.map((u) => (
                    <Paper key={u.id} p="sm" radius="sm" withBorder>
                      <Group justify="space-between">
                        <Stack gap={0}>
                          <Text size="sm" fw={500}>Unidad {u.numero}{u.torre ? ` · Torre ${u.torre}` : ''}</Text>
                          <Text size="xs" c="dimmed" tt="capitalize">{u.tipo}</Text>
                        </Stack>
                        <Badge size="xs" variant="light" color={u.estado === 'activo' ? 'green' : u.estado === 'mora' ? 'red' : 'gray'}>
                          {u.estado}
                        </Badge>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>

            <Box>
              <Group gap="xs" mb="sm">
                <Car size={16} />
                <Text fw={600} size="sm">Vehículos ({vehiculosUsuario.length})</Text>
              </Group>
              {vehiculosUsuario.length === 0 ? (
                <Text size="sm" c="dimmed">Sin vehículos registrados.</Text>
              ) : (
                <Stack gap="xs">
                  {vehiculosUsuario.map((v) => (
                    <Paper key={v.id} p="sm" radius="sm" withBorder>
                      <Group justify="space-between">
                        <Stack gap={0}>
                          <Text size="sm" fw={500}>{v.placa}</Text>
                          <Text size="xs" c="dimmed">{[v.marca, v.modelo, v.color].filter(Boolean).join(' · ')}</Text>
                        </Stack>
                        <Badge size="xs" variant="light" color="blue" tt="capitalize">{v.tipo}</Badge>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        )}
      </Drawer>

      <Modal
        opened={modalAbierto}
        onClose={cerrarModal}
        title={<Group gap="xs"><Plus size={18} /><Text fw={600}>Nuevo usuario</Text></Group>}
        size="md"
        centered
        overlayProps={{ blur: 3 }}
      >
        <Stack gap="sm">
          <TextInput label="Nombre completo" placeholder="Ej: Juan García" required value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} />
          <TextInput label="Email" placeholder="correo@ejemplo.com" required type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
          <TextInput label="Teléfono" placeholder="3001234567" value={form.telefono} onChange={(e) => setField('telefono', e.target.value)} />
          <TextInput label="Documento de identidad" placeholder="CC / NIT" value={form.documento} onChange={(e) => setField('documento', e.target.value)} />
          <Select
            label="Rol"
            required
            data={ROLES.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
            value={form.rol}
            onChange={(v) => setField('rol', v ?? 'propietario')}
          />
          <Divider mt="xs" />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={cerrarModal} disabled={guardando}>Cancelar</Button>
            <Button onClick={handleGuardar} loading={guardando} leftSection={<Plus size={14} />}>Crear usuario</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
