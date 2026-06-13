import { useState, useEffect, createContext, useContext } from 'react';
import supabase from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario,  setUsuario]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      if (session?.user) enrichUser(session.user);
      else setLoading(false);
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) enrichUser(session.user);
      else { setUsuario(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const enrichUser = async (authUser) => {
    const { data } = await supabase.from('usuarios').select('*').eq('email', authUser.email).single();
    setUsuario(data || { id:authUser.id, email:authUser.email, nombre:authUser.email, rol:'supervisor' });
    setLoading(false);
  };

  const login  = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const logout = () => supabase.auth.signOut().then(() => setUsuario(null));

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);