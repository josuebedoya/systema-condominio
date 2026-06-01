'use client'
import { useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useRealtime() {
  const { rol } = useAuth()

  useEffect(() => {
    if (rol !== 'administrador') return

    const pqrSub = supabase.channel('pqrs-next')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pqrs' }, () => {
        notifications.show({ title: 'Nueva PQR', message: 'Se radicó una nueva petición', color: 'blue' })
      }).subscribe()

    const ordenSub = supabase.channel('ordenes-next')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ordenes_trabajo' }, () => {
        notifications.show({ title: 'Nueva orden', message: 'Se reportó un daño', color: 'orange' })
      }).subscribe()

    return () => {
      supabase.removeChannel(pqrSub)
      supabase.removeChannel(ordenSub)
    }
  }, [rol])
}
