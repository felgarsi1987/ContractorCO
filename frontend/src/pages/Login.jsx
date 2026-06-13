import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEMO = [
  ['Administrador', 'admin@contractorco.gov.co',    'Admin2025*'],
  ['Supervisor',    'p.suarez@contractorco.gov.co', 'Super2025*'],
  ['Auditor',       'auditor@contraloria.gov.co',   'Audit2025*'],
];

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm] = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (ex) {
      const m = ex?.message || 'Error al iniciar sesión';
      const t = { 'Invalid login credentials':'Correo o contraseña incorrectos.', 'Email not confirmed':'Confirma tu correo antes de ingresar.' };
      setErr(t[m] || m);
      toast.error(t[m] || m);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #0d1f3c 0%, #1a3460 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, borderRadius:12, background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 6v4c0 4.4 3 8.5 7 9.5C14 18.5 17 14.4 17 10V6L10 2z" fill="white" fillOpacity="0.95"/>
              <path d="M7 10l2 2 4-4" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ color:'#fff', fontSize:20, fontWeight:700, letterSpacing:'-.01em' }}>ContralControl</div>
          <div style={{ color:'rgba(147,197,253,0.7)', fontSize:11, marginTop:4, letterSpacing:'.08em', textTransform:'uppercase' }}>Sistema de Control de Contratistas</div>
        </div>

        {/* Form card */}
        <div style={{ background:'#fff', borderRadius:14, padding:28, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="field">
              <label>Correo institucional</label>
              <input className="input-field" type="email" placeholder="usuario@entidad.gov.co"
                value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required autoComplete="email"/>
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input className="input-field" type="password" placeholder="••••••••"
                value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required autoComplete="current-password"/>
            </div>
            {err && (
              <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6, padding:'8px 12px', fontSize:12, color:'#dc2626' }}>{err}</div>
            )}
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ justifyContent:'center', padding:'10px', marginTop:4, opacity:loading?.9:1 }}>
              {loading ? 'Verificando...' : 'Ingresar al sistema'}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div style={{ marginTop:16, background:'rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 16px', border:'1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ fontSize:10, fontWeight:600, color:'rgba(147,197,253,0.6)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8 }}>Acceso de demo</div>
          {DEMO.map(([rol, email, pass]) => (
            <div key={email}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.08)', cursor:'pointer' }}
              onClick={() => setForm({ email, password: pass })}>
              <span style={{ background:'rgba(59,130,246,0.4)', color:'#93c5fd', fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:99, minWidth:72, textAlign:'center' }}>{rol}</span>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.75)', flex:1 }}>{email}</span>
            </div>
          ))}
          <div style={{ fontSize:10, color:'rgba(147,197,253,0.5)', marginTop:6 }}>Haz clic en una fila para autocompletar</div>
        </div>
      </div>
    </div>
  );
}
