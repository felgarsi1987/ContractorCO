import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO = [
  { rol:'Admin',      email:'admin@contractorco.gov.co',    pass:'Admin2025*', color:'#059669' },
  { rol:'Supervisor', email:'p.suarez@contractorco.gov.co', pass:'Super2025*', color:'#2563EB' },
  { rol:'Auditor',    email:'auditor@contraloria.gov.co',   pass:'Audit2025*', color:'#7C3AED' },
];

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm] = useState({ email:'', password:'' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (ex) {
      const m = ex?.message || 'Error al iniciar sesión';
      const t = {
        'Invalid login credentials': 'Correo o contraseña incorrectos.',
        'Email not confirmed':        'Confirma tu correo antes de ingresar.',
        'Too many requests':          'Demasiados intentos. Espera un momento.',
      };
      setErr(t[m] || m);
      toast.error(t[m] || m);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex',
      background:'linear-gradient(135deg, #0D3321 0%, #0A2A1B 50%, #064E3B 100%)',
    }}>
      {/* Panel izquierdo — contexto institucional */}
      <div style={{ display:'none', flex:1, padding:'48px', flexDirection:'column', justifyContent:'space-between', '@media(min-width:1024px)':{display:'flex'} }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,#059669,#34D399)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Leaf size={18} color="#fff" fill="rgba(255,255,255,0.3)"/>
          </div>
          <span style={{ color:'#fff', fontSize:16, fontWeight:700, letterSpacing:'-0.02em' }}>ContralControl</span>
        </div>
        <div>
          <div style={{ color:'#34D399', fontSize:12, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:12 }}>Sistema Institucional</div>
          <div style={{ color:'#fff', fontSize:28, fontWeight:700, letterSpacing:'-0.03em', lineHeight:1.25, marginBottom:14 }}>
            Control de Contratistas<br/>para Entidades Públicas
          </div>
          <div style={{ color:'rgba(167,243,208,0.7)', fontSize:14, lineHeight:1.6 }}>
            Gestiona contratos, vencimientos y documentación desde un solo lugar.
          </div>
        </div>
        <div style={{ color:'rgba(167,243,208,0.3)', fontSize:11 }}>© 2025 ContralControl · Colombia 🇨🇴</div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{
        width:'100%', maxWidth:440,
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'32px 24px',
        background:'rgba(0,0,0,0.25)',
        backdropFilter:'blur(12px)',
        borderLeft:'1px solid rgba(52,211,153,0.1)',
      }}>
        <div style={{ width:'100%', maxWidth:380 }}>

          {/* Mobile logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,#059669,#34D399)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Leaf size={18} color="#fff" fill="rgba(255,255,255,0.3)"/>
            </div>
            <div>
              <div style={{ color:'#fff', fontSize:15, fontWeight:700, letterSpacing:'-0.02em' }}>ContralControl</div>
              <div style={{ color:'rgba(167,243,208,0.5)', fontSize:10, letterSpacing:'.06em', textTransform:'uppercase' }}>Gestión de Contratistas</div>
            </div>
          </div>

          <div style={{ color:'#fff', fontSize:22, fontWeight:700, letterSpacing:'-0.03em', marginBottom:6 }}>
            Bienvenido de vuelta
          </div>
          <div style={{ color:'rgba(167,243,208,0.6)', fontSize:13, marginBottom:28 }}>
            Ingresa tus credenciales institucionales para continuar.
          </div>

          {/* Form */}
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(167,243,208,0.6)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:5 }}>
                Correo institucional
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f=>({...f,email:e.target.value}))}
                placeholder="usuario@entidad.gov.co"
                required
                autoComplete="email"
                style={{
                  width:'100%', padding:'10px 12px',
                  borderRadius:7, fontSize:13,
                  border:'1px solid rgba(52,211,153,0.2)',
                  background:'rgba(255,255,255,0.07)',
                  color:'#ECFDF5', outline:'none',
                }}
                onFocus={e => { e.target.style.borderColor='#34D399'; e.target.style.boxShadow='0 0 0 3px rgba(52,211,153,0.15)'; }}
                onBlur={e  => { e.target.style.borderColor='rgba(52,211,153,0.2)'; e.target.style.boxShadow='none'; }}
              />
            </div>

            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(167,243,208,0.6)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:5 }}>
                Contraseña
              </label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f=>({...f,password:e.target.value}))}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width:'100%', padding:'10px 40px 10px 12px',
                    borderRadius:7, fontSize:13,
                    border:'1px solid rgba(52,211,153,0.2)',
                    background:'rgba(255,255,255,0.07)',
                    color:'#ECFDF5', outline:'none',
                  }}
                  onFocus={e => { e.target.style.borderColor='#34D399'; e.target.style.boxShadow='0 0 0 3px rgba(52,211,153,0.15)'; }}
                  onBlur={e  => { e.target.style.borderColor='rgba(52,211,153,0.2)'; e.target.style.boxShadow='none'; }}
                />
                <button type="button" onClick={() => setShowPass(s=>!s)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(167,243,208,0.5)', cursor:'pointer' }}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {err && (
              <div style={{ background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:6, padding:'9px 12px', fontSize:12, color:'#FCA5A5', display:'flex', gap:6 }}>
                ⚠ {err}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'11px',
              borderRadius:7, border:'none',
              background: loading ? '#047857' : 'linear-gradient(135deg,#059669,#10B981)',
              color:'#fff', fontSize:13, fontWeight:600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow:'0 2px 8px rgba(5,150,105,0.35)',
              transition:'all .15s',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              marginTop:4,
            }}>
              {loading ? 'Verificando...' : 'Ingresar al sistema'}
            </button>
          </form>

          {/* Demo */}
          <div style={{ marginTop:24, border:'1px solid rgba(52,211,153,0.15)', borderRadius:8, overflow:'hidden' }}>
            <div style={{ padding:'8px 12px', background:'rgba(52,211,153,0.06)', borderBottom:'1px solid rgba(52,211,153,0.1)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(167,243,208,0.5)', letterSpacing:'.08em' }}>ACCESO DE DEMOSTRACIÓN</div>
            </div>
            {DEMO.map(({ rol, email, pass, color }, i) => (
              <div key={email}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', cursor:'pointer', borderBottom: i < DEMO.length-1 ? '1px solid rgba(52,211,153,0.08)' : 'none', transition:'background .1s' }}
                onClick={() => setForm({ email, password: pass })}
                onMouseEnter={e => e.currentTarget.style.background='rgba(52,211,153,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <span style={{ background:color+'22', color, fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:99, letterSpacing:'.04em', minWidth:68, textAlign:'center', flexShrink:0 }}>
                  {rol.toUpperCase()}
                </span>
                <span style={{ fontSize:11, color:'rgba(167,243,208,0.65)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{email}</span>
                <span style={{ fontSize:10, color:'rgba(167,243,208,0.3)', flexShrink:0 }}>↗</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
