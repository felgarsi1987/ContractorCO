import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) enrichUser(session.user)
      else setLoading(false)
    })

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) enrichUser(session.user)
      else { setUsuario(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const enrichUser = async (authUser) => {
    // Obtener datos adicionales del usuario desde la tabla usuarios
    const { data } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, activo')
      .eq('email', authUser.email)
      .single()

    setUsuario(data || { id: authUser.id, email: authUser.email, nombre: authUser.email, rol: 'admin' })
    setLoading(false)
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUsuario(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
