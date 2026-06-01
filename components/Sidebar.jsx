'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Home, Users, CreditCard, CalendarDays, Wrench, MessageSquare, ShieldCheck, LogOut, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navPorRol = {
  administrador: [
    { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/unidades',     icon: Home,            label: 'Unidades' },
    { href: '/propietarios', icon: Users,           label: 'Propietarios' },
    { href: '/pagos',        icon: CreditCard,      label: 'Pagos' },
    { href: '/reservas',     icon: CalendarDays,    label: 'Reservas' },
    { href: '/mantenimiento',icon: Wrench,          label: 'Mantenimiento' },
    { href: '/pqrs',         icon: MessageSquare,   label: 'PQRs' },
    { href: '/acceso',       icon: ShieldCheck,     label: 'Control Acceso' },
  ],
  propietario: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/pagos',     icon: CreditCard,      label: 'Pagos' },
    { href: '/reservas',  icon: CalendarDays,    label: 'Reservas' },
    { href: '/pqrs',      icon: MessageSquare,   label: 'PQRs' },
  ],
  residente: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/reservas',  icon: CalendarDays,    label: 'Reservas' },
    { href: '/pqrs',      icon: MessageSquare,   label: 'PQRs' },
  ],
  portero: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/acceso',    icon: ShieldCheck,     label: 'Control Acceso' },
  ],
}

const rolLabels = {
  administrador: 'Administrador',
  propietario: 'Propietario',
  residente: 'Residente',
  portero: 'Portero',
}

export default function Sidebar({ open, onClose }) {
  const { perfil, rol, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const items = navPorRol[rol] || []

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: 'rgba(8,15,32,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{
          width: 260,
          background: 'linear-gradient(168deg, #080f20 0%, #0d1c38 45%, #152040 100%)',
          boxShadow: '6px 0 40px rgba(8,15,32,0.5)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* ── Logo ── */}
        <div style={{
          padding: '22px 18px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/logo.png"
                alt="HabitApp"
                style={{
                  width: 40, height: 40,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 10px rgba(15,191,176,0.35))',
                }}
              />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                  HabitApp
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 500, color: 'rgba(15,191,176,0.65)', letterSpacing: '0.09em', textTransform: 'uppercase', marginTop: 2 }}>
                  Admin. Condominios
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="md:hidden"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Navigation ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 10px 8px' }}>
            Menú principal
          </div>
          {items.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <Link key={href} href={href} onClick={onClose} style={{ textDecoration: 'none', display: 'block', marginBottom: 1 }}>
                <div className={`nav-item${isActive ? ' active' : ''}`}>
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  {label}
                </div>
              </Link>
            )
          })}
        </div>

        {/* ── User section ── */}
        <div style={{ padding: '10px 10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', marginBottom: 4,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #0fbfb0 0%, #088d82 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
              boxShadow: '0 2px 10px rgba(15,191,176,0.4)',
            }}>
              {perfil?.nombre?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                {perfil?.nombre || 'Usuario'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(15,191,176,0.65)', fontWeight: 500, marginTop: 2 }}>
                {rolLabels[rol] || rol}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '8px 12px',
              borderRadius: 8, border: 'none',
              background: 'transparent',
              color: 'rgba(255,255,255,0.35)',
              fontSize: 13, cursor: 'pointer',
              transition: 'all 0.18s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#fc8181'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
