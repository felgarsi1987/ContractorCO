import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      const msg = err?.message || err?.response?.data?.error || 'Error al iniciar sesión';
      // Traducir mensajes de Supabase
      const traducciones = {
        'Invalid login credentials': 'Correo o contraseña incorrectos.',
        'Email not confirmed':        'Confirma tu correo antes de ingresar.',
        'User not found':             'Usuario no registrado.',
        'Too many requests':          'Demasiados intentos. Espera unos minutos.',
      };
      const msgFinal = traducciones[msg] || msg;
      setErrorMsg(msgFinal);
      toast.error(msgFinal);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:48, height:48, borderRadius:12, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <span className="ms" style={{ color:'#fff', fontSize:26 }}>assured_workload</span>
          </div>
          <div style={{ fontSize:22, fontWeight:700, color:'var(--primary)', letterSpacing:'-.01em' }}>Control Portal</div>
          <div style={{ fontSize:11, color:'var(--secondary-text)', marginTop:4, letterSpacing:'.06em', textTransform:'uppercase' }}>
            Sistema de Control de Contratistas
          </div>
        </div>

        {/* Card */}
        <div className="card">
          <div style={{ padding:'24px 24px 20px' }}>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="field">
                <label>Correo institucional</label>
                <input
                  className="input"
                  type="email"
                  placeholder="usuario@entidad.gov.co"
                  value={form.email}
                  onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="field">
                <label>Contraseña</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  autoComplete="current-password"
                  required
                />
              </div>

              {errorMsg && (
                <div style={{ background:'var(--danger-bg)', border:'1px solid rgba(185,28,28,.2)', borderRadius:4, padding:'8px 12px', fontSize:12, color:'var(--danger)', display:'flex', gap:8, alignItems:'center' }}>
                  <span className="ms ms-sm">error</span>
                  {errorMsg}
                </div>
              )}

              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading}
                style={{ justifyContent:'center', padding:'10px 16px', marginTop:4 }}
              >
                {loading
                  ? <span className="ms animate-spin" style={{ fontSize:18 }}>refresh</span>
                  : <><span className="ms ms-sm">login</span>Ingresar al sistema</>}
              </button>
            </form>
          </div>
        </div>

        {/* Credenciales de demo */}
        <div style={{ marginTop:16, background:'var(--surface-card)', border:'1px solid var(--border)', borderRadius:6, padding:'12px 14px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--secondary-text)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8 }}>
            Acceso demo
          </div>
          {[
            ['Admin',     'admin@contractorco.gov.co',    'Admin2025*'],
            ['Supervisor','p.suarez@contractorco.gov.co', 'Super2025*'],
            ['Auditor',   'auditor@contraloria.gov.co',   'Audit2025*'],
          ].map(([rol, email, pass]) => (
            <div
              key={email}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' }}
              onClick={() => setForm({ email, password: pass })}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-low)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="tag tag-navy" style={{ fontSize:9, padding:'1px 6px', minWidth:64, textAlign:'center' }}>{rol}</span>
              <span style={{ fontSize:11, color:'var(--primary)', flex:1 }}>{email}</span>
              <span style={{ fontSize:11, color:'var(--outline)', fontFamily:'monospace' }}>{pass}</span>
            </div>
          ))}
          <div style={{ marginTop:4 }} />
        </div>

        <p style={{ textAlign:'center', fontSize:10, color:'var(--outline)', marginTop:12 }}>
          Acceso restringido · Entidad Pública Colombiana
        </p>
      </div>
    </div>
  );
}
