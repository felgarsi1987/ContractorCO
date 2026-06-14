import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Users, Shield, BarChart2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO = [
  { rol: 'Admin',      email: 'admin@contractorco.gov.co',    pass: 'Admin2025*', color: '#059669' },
  { rol: 'Supervisor', email: 'p.suarez@contractorco.gov.co', pass: 'Super2025*', color: '#2563EB' },
  { rol: 'Auditor',    email: 'auditor@contraloria.gov.co',   pass: 'Audit2025*', color: '#7C3AED' },
];

const FEATURES = [
  { Icon: Users,     title: 'Gestión eficiente',       desc: 'Administra contratistas, supervisores y actividades en un solo lugar.' },
  { Icon: Shield,    title: 'Seguridad institucional',  desc: 'Protegemos tu información con los más altos estándares.' },
  { Icon: BarChart2, title: 'Control y transparencia',  desc: 'Monitorea avances, documentos y cumplimiento en tiempo real.' },
  { Icon: FileText,  title: 'Cumplimiento normativo',   desc: 'Alineado con las políticas y regulaciones de tu entidad.' },
];

/* Diagonal line coordinates for background SVG */
const DIAG_LINES = Array.from({ length: 14 }, (_, i) => ({
  x1: -300 + i * 120, y1: 900,
  x2: 500  + i * 120, y2: -100,
}));

/* Dot grid — top-left + bottom-right clusters */
const DOT_GRID = [
  ...Array.from({ length: 30 }, (_, i) => ({
    cx: 50 + (i % 6) * 38,
    cy: 50 + Math.floor(i / 6) * 38,
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    cx: 1080 + (i % 5) * 38,
    cy: 580 + Math.floor(i / 5) * 38,
  })),
];

function ShieldSVG() {
  return (
    <svg width="110" height="128" viewBox="0 0 110 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shieldStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="shieldFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a3520" />
          <stop offset="100%" stopColor="#052a14" />
        </linearGradient>
        <linearGradient id="shieldHighlight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(52,211,153,0.3)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      {/* Shield body */}
      <path
        d="M55 5 L102 22 L102 62 C102 92 55 122 55 122 C55 122 8 92 8 62 L8 22 Z"
        fill="url(#shieldFill)"
        stroke="url(#shieldStroke)"
        strokeWidth="2"
      />
      {/* Inner highlight */}
      <path
        d="M55 14 L92 28 L92 62 C92 86 55 110 55 110 C55 110 18 86 18 62 L18 28 Z"
        fill="url(#shieldHighlight)"
      />
      {/* Leaf stem */}
      <line x1="55" y1="84" x2="55" y2="52" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      {/* Left leaf */}
      <path
        d="M55 66 C55 66 40 58 38 44 C38 44 52 40 60 54"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      {/* Right leaf */}
      <path
        d="M55 58 C55 58 70 50 72 36 C72 36 58 32 50 46"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </svg>
  );
}

function ShieldSmall() {
  return (
    <svg width="20" height="23" viewBox="0 0 110 128" fill="none">
      <defs>
        <linearGradient id="ss1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path d="M55 5 L102 22 L102 62 C102 92 55 122 55 122 C55 122 8 92 8 62 L8 22 Z" fill="url(#ss1)" />
      <line x1="55" y1="84" x2="55" y2="52" stroke="white" strokeWidth="8" strokeLinecap="round" />
      <path d="M55 66 C55 66 40 58 38 44 C38 44 52 40 60 54" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M55 58 C55 58 70 50 72 36 C72 36 58 32 50 46" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (ex) {
      const m = ex?.message || 'Error al iniciar sesión';
      const MAP = {
        'Invalid login credentials': 'Correo o contraseña incorrectos.',
        'Email not confirmed':        'Confirma tu correo antes de ingresar.',
        'Too many requests':          'Demasiados intentos. Espera un momento.',
      };
      setErr(MAP[m] || m);
      toast.error(MAP[m] || m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ll-root">

        {/* ── Background decoration ── */}
        <svg className="ll-bg-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {DIAG_LINES.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="rgba(52,211,153,0.06)" strokeWidth="1" />
          ))}
          {DOT_GRID.map((d, i) => (
            <circle key={i} cx={d.cx} cy={d.cy} r="1.5" fill="rgba(52,211,153,0.18)" />
          ))}
        </svg>

        {/* ── Center: animated rings + shield ── */}
        <div className="ll-center" aria-hidden="true">
          <div className="ll-ring ll-ring-1" />
          <div className="ll-ring ll-ring-2" />
          <div className="ll-ring ll-ring-3" />
          <div className="ll-ring ll-ring-4" />
          <div className="ll-orbit ll-orbit-a"><span className="ll-dot" /></div>
          <div className="ll-orbit ll-orbit-b"><span className="ll-dot" /></div>
          <div className="ll-orbit ll-orbit-c"><span className="ll-dot" /></div>
          <div className="ll-shield">
            <ShieldSVG />
          </div>
        </div>

        {/* ── Left: login card ── */}
        <div className={`ll-left${mounted ? ' is-in' : ''}`}>
          <div className="lc">

            {/* Logo */}
            <div className="lc-logo">
              <div className="lc-logo-mark"><ShieldSmall /></div>
              <div>
                <div className="lc-logo-name">ContralControl</div>
                <div className="lc-logo-sub">Gestión de Contratistas</div>
              </div>
            </div>

            <h1 className="lc-title">
              Bienvenido de <span className="lc-accent">vuelta</span>
            </h1>
            <p className="lc-sub">Ingresa tus credenciales institucionales para continuar.</p>

            <form onSubmit={submit} className="lc-form">
              <div className="lc-field">
                <label className="lc-label">Correo institucional</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="usuario@entidad.gov.co"
                  required
                  autoComplete="email"
                  className="lc-input"
                />
              </div>

              <div className="lc-field">
                <label className="lc-label">Contraseña</label>
                <div className="lc-pass">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••••"
                    required
                    autoComplete="current-password"
                    className="lc-input lc-input-pass"
                  />
                  <button type="button" className="lc-eye" onClick={() => setShowPass(s => !s)} aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {err && <div className="lc-error" role="alert">⚠ {err}</div>}

              <button type="submit" disabled={loading} className="lc-btn">
                {loading
                  ? <><span className="lc-spin" /> Verificando...</>
                  : <>Ingresar al sistema <span className="lc-arrow">›</span></>
                }
              </button>
            </form>

            {/* Demo credentials */}
            <div className="lc-demo">
              <div className="lc-demo-hdr">
                <span>🔒</span> Acceso de demostración
              </div>
              {DEMO.map(({ rol, email, pass, color }) => (
                <button
                  key={email}
                  type="button"
                  className="lc-demo-row"
                  onClick={() => setForm({ email, password: pass })}
                >
                  <span className="lc-badge" style={{ background: color + '22', color }}>{rol.toUpperCase()}</span>
                  <span className="lc-demo-email">{email}</span>
                  <span className="lc-demo-arr">↗</span>
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* ── Right: features ── */}
        <div className={`ll-right${mounted ? ' is-in' : ''}`}>
          {FEATURES.map(({ Icon, title, desc }, i) => (
            <div key={title} className="feat" style={{ '--i': i }}>
              <div className="feat-icon">
                <Icon size={18} aria-hidden="true" />
              </div>
              <div>
                <div className="feat-title">{title}</div>
                <div className="feat-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Styles — scoped to .ll-* and .lc-* to avoid collisions
───────────────────────────────────────────────────────────────── */
const CSS = `
/* Root */
.ll-root {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(340px, 420px) 1fr minmax(300px, 400px);
  position: relative;
  overflow: hidden;
  background: radial-gradient(ellipse 80% 80% at 50% 50%, #093d20 0%, #061509 55%, #020a04 100%);
}

/* Background SVG */
.ll-bg-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* ── Center rings ── */
.ll-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 1;
}

.ll-ring {
  position: absolute;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(52, 211, 153, 0.13);
}
.ll-ring-1 { width: 170px;  height: 170px;  border-color: rgba(52,211,153,0.22); }
.ll-ring-2 { width: 290px;  height: 290px;  animation: ringPulse 4s ease-in-out infinite 0s; }
.ll-ring-3 { width: 430px;  height: 430px;  animation: ringPulse 4s ease-in-out infinite 1.2s; }
.ll-ring-4 { width: 590px;  height: 590px;  animation: ringPulse 4s ease-in-out infinite 2.4s; }

@keyframes ringPulse {
  0%, 100% { opacity: 0.13; }
  50%       { opacity: 0.26; }
}

/* Orbiting dots */
.ll-orbit {
  position: absolute;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  animation: orbitSpin linear infinite;
}
.ll-orbit-a { width: 290px; height: 290px; margin: -145px 0 0 -145px; animation-duration: 22s; }
.ll-orbit-b { width: 430px; height: 430px; margin: -215px 0 0 -215px; animation-duration: 34s; animation-direction: reverse; }
.ll-orbit-c { width: 590px; height: 590px; margin: -295px 0 0 -295px; animation-duration: 50s; }

@keyframes orbitSpin {
  to { transform: rotate(360deg); }
}

.ll-dot {
  display: block;
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #34D399;
  box-shadow: 0 0 8px 3px rgba(52, 211, 153, 0.55);
}

/* Shield */
.ll-shield {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: shieldFloat 6s ease-in-out infinite;
  filter: drop-shadow(0 0 28px rgba(52, 211, 153, 0.35));
}

@keyframes shieldFloat {
  0%, 100% { transform: translate(-50%, -50%) translateY(0px);   }
  50%       { transform: translate(-50%, -50%) translateY(-10px); }
}

/* ── Left panel ── */
.ll-left {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  position: relative;
  z-index: 2;
  opacity: 0;
  transform: translateY(18px) scale(0.98);
  transition:
    opacity  420ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 420ms cubic-bezier(0.23, 1, 0.32, 1);
}
.ll-left.is-in {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Card */
.lc {
  width: 100%;
  max-width: 390px;
  background: rgba(3, 16, 8, 0.72);
  border: 1px solid rgba(52, 211, 153, 0.14);
  border-radius: 16px;
  padding: 26px 24px;
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(52, 211, 153, 0.08);
}

.lc-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
.lc-logo-mark {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #059669, #34D399);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.45);
}
.lc-logo-name { color: #fff; font-size: 15px; font-weight: 700; letter-spacing: -0.02em; }
.lc-logo-sub  { color: rgba(167,243,208,0.45); font-size: 10px; letter-spacing: .06em; text-transform: uppercase; margin-top: 1px; }

.lc-title  { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.03em; margin-bottom: 6px; line-height: 1.2; }
.lc-accent { color: #34D399; }
.lc-sub    { color: rgba(167,243,208,0.55); font-size: 13px; margin-bottom: 22px; line-height: 1.5; }

/* Form */
.lc-form  { display: flex; flex-direction: column; gap: 14px; }
.lc-field { display: flex; flex-direction: column; gap: 5px; }
.lc-label { font-size: 10px; font-weight: 700; color: rgba(167,243,208,0.55); letter-spacing: .08em; text-transform: uppercase; }

.lc-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  border: 1px solid rgba(52, 211, 153, 0.18);
  background: rgba(255, 255, 255, 0.04);
  color: #ecfdf5;
  outline: none;
  transition:
    border-color 150ms ease-out,
    box-shadow   150ms ease-out;
}
.lc-input::placeholder { color: rgba(167, 243, 208, 0.25); }
.lc-input:focus {
  border-color: rgba(52, 211, 153, 0.55);
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.12);
}
.lc-input-pass { padding-right: 40px; }

.lc-pass { position: relative; }
.lc-eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(167, 243, 208, 0.35);
  cursor: pointer;
  padding: 4px;
  display: flex;
  transition: color 150ms ease-out;
}
.lc-eye:hover { color: rgba(167, 243, 208, 0.75); }

.lc-error {
  background: rgba(220, 38, 38, 0.14);
  border: 1px solid rgba(220, 38, 38, 0.28);
  border-radius: 7px;
  padding: 9px 12px;
  font-size: 12px;
  color: #fca5a5;
  animation: fadeUp 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

.lc-btn {
  width: 100%;
  padding: 11px 16px;
  margin-top: 4px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(5, 150, 105, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition:
    transform  120ms cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 120ms ease-out,
    opacity    120ms ease-out;
}
.lc-btn:hover:not(:disabled) {
  box-shadow: 0 4px 20px rgba(5, 150, 105, 0.52);
}
.lc-btn:active:not(:disabled) {
  transform: scale(0.97);
  box-shadow: 0 1px 6px rgba(5, 150, 105, 0.28);
}
.lc-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.lc-arrow { font-size: 17px; line-height: 1; }

.lc-spin {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255, 255, 255, 0.28);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Demo block */
.lc-demo {
  margin-top: 20px;
  border: 1px solid rgba(52, 211, 153, 0.1);
  border-radius: 10px;
  overflow: hidden;
}
.lc-demo-hdr {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(52, 211, 153, 0.04);
  border-bottom: 1px solid rgba(52, 211, 153, 0.08);
  font-size: 10px;
  font-weight: 700;
  color: rgba(167, 243, 208, 0.4);
  letter-spacing: .08em;
  text-transform: uppercase;
}
.lc-demo-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(52, 211, 153, 0.06);
  font-family: inherit;
  cursor: pointer;
  transition: background 120ms ease-out;
  text-align: left;
}
.lc-demo-row:last-child { border-bottom: none; }
.lc-demo-row:hover  { background: rgba(52, 211, 153, 0.06); }
.lc-demo-row:active { background: rgba(52, 211, 153, 0.11); }
.lc-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 99px;
  letter-spacing: .04em;
  min-width: 68px;
  text-align: center;
  flex-shrink: 0;
}
.lc-demo-email {
  flex: 1;
  font-size: 11px;
  color: rgba(167, 243, 208, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lc-demo-arr { font-size: 11px; color: rgba(167, 243, 208, 0.28); flex-shrink: 0; }

/* ── Right panel ── */
.ll-right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 22px;
  padding: 32px 36px 32px 52px;
  position: relative;
  z-index: 2;
  opacity: 0;
  transition: opacity 300ms ease-out 80ms;
}
.ll-right.is-in { opacity: 1; }

.feat {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity   320ms cubic-bezier(0.23, 1, 0.32, 1) calc(120ms + var(--i) * 60ms),
    transform 320ms cubic-bezier(0.23, 1, 0.32, 1) calc(120ms + var(--i) * 60ms);
}
.ll-right.is-in .feat {
  opacity: 1;
  transform: translateY(0);
}

.feat-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 10px;
  background: rgba(52, 211, 153, 0.07);
  border: 1px solid rgba(52, 211, 153, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #34D399;
  transition:
    background     200ms ease-out,
    border-color   200ms ease-out;
}
.feat:hover .feat-icon {
  background: rgba(52, 211, 153, 0.14);
  border-color: rgba(52, 211, 153, 0.28);
}

.feat-title { font-size: 13px; font-weight: 700; color: #34D399; margin-bottom: 4px; letter-spacing: -0.01em; }
.feat-desc  { font-size: 12px; color: rgba(167, 243, 208, 0.5); line-height: 1.55; }

/* ── Shared keyframes ── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0);   }
}

/* ── Responsive ── */
@media (max-width: 1100px) {
  .ll-root { grid-template-columns: 1fr; }
  .ll-center { display: none; }
  .ll-right  { display: none; }
  .ll-left   { min-height: 100vh; }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .ll-ring, .ll-orbit, .ll-shield,
  .ll-left, .ll-right, .feat,
  .lc-spin {
    animation: none !important;
    transition-duration: 1ms !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
`;
