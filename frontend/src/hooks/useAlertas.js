import { useState, useEffect } from 'react'
import { alertas as alertasDB } from '../lib/db'
import { supabase } from '../lib/supabase'

export function useAlertas() {
  const [noLeidas, setNoLeidas] = useState(0)

  useEffect(() => {
    // Carga inicial
    alertasDB.listar({ leida: false, limit: 1 })
      .then(data => setNoLeidas(data.length))
      .catch(() => {})

    // Suscripción realtime — badge se actualiza al llegar nueva alerta
    const channel = supabase
      .channel('alertas-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alertas' },
        () => setNoLeidas(n => n + 1)
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return { noLeidas }
}
