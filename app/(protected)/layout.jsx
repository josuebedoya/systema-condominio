'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, Menu } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const titulos = {
  '/dashboard':    'Dashboard',
  '/unidades':     'Gestión de Unidades',
  '/propietarios': 'Propietarios y Residentes',
  '/pagos':        'Control de Pagos',
  '/reservas':     'Reservas de Zonas Comunes',
  '/mantenimiento':'Órdenes de Mantenimiento',
  '/pqrs':         'PQRs — Peticiones y Quejas',
  '/acceso':       'Control de Acceso',
}

const accentColors = {
  '/dashboard':    '#0fbfb0',
  '/unidades':     '#3b82f6',
  '/propietarios': '#8b5cf6',
  '/pagos':        '#10b981',
  '/reservas':     '#f59e0b',
  '/mantenimiento':'#ef4444',
  '/pqrs':         '#06b6d4',
  '/acceso':       '#6366f1',
}

const rolesPermitidos = {
  '/unidades':     ['administrador'],
  '/propietarios': ['administrador'],
  '/pagos':        ['administrador', 'propietario'],
  '/reservas':     ['administrador', 'propietario', 'residente'],
  '/acceso':       ['administrador', 'portero'],
}

export default function ProtectedLayout({ children }) {
  const { usuario, rol, loading, perfil } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hoy, setHoy] = useState('')

  useEffect(() => {
    setHoy(format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es }))
  }, [])

  useEffect(() => {
    if (!loading && !usuario) { router.push('/login'); return }
    if (!loading && rol && rolesPermitidos[pathname]) {
      if (!rolesPermitidos[pathname].includes(rol)) router.push('/dashboard')
    }
  }, [loading, usuario, rol, pathname])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '3px solid var(--teal-100)',
            borderTopColor: 'var(--teal-500)',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Cargando HabitApp…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!usuario) return null

  const titulo = titulos[pathname] || 'HabitApp'
  const accent = accentColors[pathname] || '#0fbfb0'
  const initial = perfil?.nombre?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', marginLeft: 260 }}>

        {/* ── Header ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(15,31,61,0.07)',
          boxShadow: '0 2px 24px rgba(15,31,61,0.06)',
          padding: '0 24px',
          height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Left: title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
            >
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: accent, flexShrink: 0, transition: 'background 0.3s ease' }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                  {titulo}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: 400 }}>
                  {hoy}
                </div>
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 8, borderRadius: 10, color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,31,61,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Bell size={18} />
            </button>

            <div style={{ width: 1, height: 24, background: 'rgba(15,31,61,0.08)', margin: '0 4px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 4px 4px 6px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,31,61,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0fbfb0 0%, #088d82 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
                boxShadow: '0 2px 10px rgba(15,191,176,0.4)',
                flexShrink: 0,
              }}>
                {initial}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {perfil?.nombre?.split(' ')[0] || 'Usuario'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>
                  {rol?.charAt(0).toUpperCase() + rol?.slice(1) || ''}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main style={{ flex: 1, padding: 24 }} className="animate-page">
          {children}
        </main>
      </div>
    </div>
  )
}
