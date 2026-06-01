'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextInput, PasswordInput, Button, Alert } from '@mantine/core'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #080f20 0%, #0f1f3d 50%, #152040 100%)',
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,191,176,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,191,176,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 32px 80px rgba(8,15,32,0.55), 0 8px 24px rgba(8,15,32,0.3)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Card top accent */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #0fbfb0 0%, #1dd8c8 50%, #3dd4ca 100%)' }} />

        <div style={{ padding: '36px 36px 32px' }}>
          {/* Logo + name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80,
              borderRadius: 20,
              background: 'linear-gradient(145deg, #0f1f3d 0%, #152040 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 8px 24px rgba(15,191,176,0.2)',
            }}>
              <img src="/logo.png" alt="HabitApp" style={{ width: 56, height: 56, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(15,191,176,0.4))' }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f1f3d', letterSpacing: '-0.03em', lineHeight: 1 }}>
              HabitApp
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 6, fontWeight: 400, letterSpacing: '0.02em' }}>
              Administración de Condominios
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TextInput
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              styles={{ label: { fontWeight: 600, fontSize: 13, color: '#0f1f3d', marginBottom: 5 } }}
            />
            <PasswordInput
              label="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              styles={{ label: { fontWeight: 600, fontSize: 13, color: '#0f1f3d', marginBottom: 5 } }}
            />
            {error && (
              <Alert icon={<AlertCircle size={15} />} color="red" variant="light" radius="md" style={{ fontSize: 13 }}>
                {error}
              </Alert>
            )}
            <Button type="submit" loading={loading} fullWidth size="md" mt={4} radius="md"
              style={{ fontWeight: 700, letterSpacing: '-0.01em', fontSize: 14 }}
            >
              Ingresar al sistema
            </Button>
          </form>

          {/* Test credentials */}
          <div style={{
            marginTop: 24,
            padding: '14px 16px',
            borderRadius: 12,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              Credenciales de prueba
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['Admin',       'admin@condo.com',     'Admin123*'],
                ['Propietario', 'prop@condo.com',      'Prop123*'],
                ['Residente',   'residente@condo.com', 'Resi123*'],
                ['Portero',     'portero@condo.com',   'Port123*'],
              ].map(([r, m, p]) => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500, width: 82, flexShrink: 0 }}>{r}:</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>{m} / {p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
