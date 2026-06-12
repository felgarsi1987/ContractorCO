import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al iniciar sesión');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>Control Portal</div>
          <div style={{ fontSize: 12, color: 'var(--secondary-text)', marginTop: 4, letterSpacing: '.05em', textTransform: 'uppercase' }}>Sistema de Control de Contratistas</div>
        </div>
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label>Correo institucional</label>
                <input className="input" type="email" placeholder="usuario@entidad.gov.co"
                  value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
              </div>
              <div className="field">
                <label>Contraseña</label>
                <input className="input" type="password" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 4 }}>
                {loading ? <span className="ms animate-spin" style={{ fontSize: 18 }}>refresh</span> : 'Ingresar al sistema'}
              </button>
            </form>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--outline)', marginTop: 16 }}>
          Acceso restringido · Entidad Pública Colombiana
        </p>
      </div>
    </div>
  );
}
