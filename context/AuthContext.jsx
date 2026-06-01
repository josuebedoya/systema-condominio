'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [rol, setRol] = useState(null)
  const [loading, setLoading] = useState(true)

  async function cargarPerfil(session) {
    if (!session?.user) {
      setUsuario(null); setPerfil(null); setRol(null)
      return
    }
    setUsuario(session.user)
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle()
    if (error) console.error('Error perfil:', error.message)
    if (data) { setPerfil(data); setRol(data.rol) }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      cargarPerfil(session).finally(() => setLoading(false))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      cargarPerfil(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await cargarPerfil(data.session)
    return data
  }

  async function logout() {
    await supabase.auth.signOut()
    setUsuario(null); setPerfil(null); setRol(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, perfil, rol, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fuera de AuthProvider')
  return ctx
}
