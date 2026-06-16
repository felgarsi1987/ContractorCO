import { useState, useEffect } from 'react';
import { Mail, ToggleLeft, ToggleRight, Clock, Send, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { emailPrefs, emailHistorial, TIPOS_EMAIL, emailService } from '../lib/emailService';
import { contratos as contratosDB } from '../lib/db';
import { supabase } from '../lib/supabase';

const ESTADO_HIST = {
  enviado: { cls:'badge-green', icon:<CheckCircle size={11}/> },
  error:   { cls:'badge-red',   icon:<XCircle size={11}/> },
};

export default function ConfigEmail() {
  const { usuario } = useAuth();
  const [contratos, setContratos]     = useState([]);
  const [historial, setHistorial]     = useState([]);
  const [prefsMapa, setPrefsMapa]     = useState({});
  const [contratoSel, setContratoSel] = useState('global');
  const [loading, setLoading]         = useState(true);
  const [guardando, setGuardando]     = useState({});
  const [enviando, setEnviando]       = useState(false);
  const [testEmail, setTestEmail]     = useState('');
  const [testTipo, setTestTipo]       = useState('nueva_solicitud');

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    if (usuario?.id) cargarPrefs();
  }, [contratoSel, usuario]);

  async function cargar() {
    setLoading(true);
    try {
      const [cts, hist] = await Promise.all([
        contratosDB.listar({ limit: 200 }),
        emailHistorial.listar({ limit: 50 }),
      ]);
      setContratos(cts.data || []);
      setHistorial(hist);
    } catch { toast.error('Error cargando configuración'); }
    finally { setLoading(false); }
  }

  async function cargarPrefs() {
    if (!usuario?.id) return;
    try {
      const mapa = await emailPrefs.cargarMapa(
        usuario.id,
        contratoSel !== 'global' ? contratoSel : null
      );
      setPrefsMapa(mapa);
    } catch {}
  }

  function isHabilitado(tipo) {
    return prefsMapa[tipo] !== false;
  }

  async function toggleTipo(tipo) {
    if (!usuario?.id) return;
    const actual = isHabilitado(tipo);
    setGuardando(p => ({ ...p, [tipo]: true }));
    try {
      await emailPrefs.toggle({
        usuarioId:   usuario.id,
        contratoId:  contratoSel !== 'global' ? contratoSel : null,
        tipoEmail:   tipo,
        habilitado:  !actual,
      });
      setPrefsMapa(p => ({ ...p, [tipo]: !actual }));
      toast.success(!actual ? 'Email activado' : 'Email desactivado');
    } catch { toast.error('Error guardando preferencia'); }
    finally { setGuardando(p => ({ ...p, [tipo]: false })); }
  }

  async function toggleTodos(habilitar) {
    if (!usuario?.id) return;
    const ops = TIPOS_EMAIL.map(t =>
      emailPrefs.toggle({
        usuarioId:  usuario.id,
        contratoId: contratoSel !== 'global' ? contratoSel : null,
        tipoEmail:  t.key,
        habilitado: habilitar,
      })
    );
    try {
      await Promise.all(ops);
      const nuevoMapa = {};
      TIPOS_EMAIL.forEach(t => nuevoMapa[t.key] = habilitar);
      setPrefsMapa(nuevoMapa);
      toast.success(habilitar ? 'Todos los emails activados' : 'Todos los emails desactivados');
    } catch { toast.error('Error guardando preferencias'); }
  }

  async function enviarPrueba() {
    if (!testEmail.trim()) { toast.error('Ingresa un email de prueba'); return; }
    setEnviando(true);
    try {
      await emailService.enviar({
        para: testEmail,
        tipo: testTipo,
        datos: {
          numero_contrato: 'DEMO-2026-001',
          titulo: 'Documentos para pago mensual junio 2026',
          contratista_nombre: 'Juan Pérez García',
          nombre_item: 'Planilla PILA (salud + pensión + ARL)',
          nombre_archivo: 'pila_junio_2026.pdf',
          version: 1,
          fecha_limite: '2026-06-30',
          dias_restantes: 3,
          valor: 5850000,
          periodo: 'Junio 2026',
          total_items: 3,
          pendientes: 2,
          comentario_rechazo: 'El archivo está incompleto. Por favor sube la planilla completa con los tres aportes (salud, pensión y ARL).',
          items_pendientes: [
            { nombre: 'Planilla PILA', base_legal: 'Decreto 1273/2018' },
            { nombre: 'Informe de actividades', base_legal: 'Art. 83 Ley 1474/2011' },
          ],
          portal_url: 'https://contractor-co-aixondemo.vercel.app/portal',
          contratos_url: 'https://contractor-co-aixondemo.vercel.app/contratos',
          asunto: `Prueba de email — ${TIPOS_EMAIL.find(t => t.key === testTipo)?.label || testTipo}`,
        },
      });
      toast.success(`Email de prueba enviado a ${testEmail}`);
      cargar();
    } catch (e) { toast.error(e.message || 'Error enviando email de prueba'); }
    finally { setEnviando(false); }
  }

  const totalHab   = TIPOS_EMAIL.filter(t => isHabilitado(t.key)).length;
  const totalEnv   = historial.length;
  const totalError = historial.filter(h => h.estado === 'error').length;

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1>Configuración de Emails</h1>
          <p>Gestiona qué notificaciones se envían por correo y a quién</p>
        </div>
      </div>

      <div className="grid-4" style={{ flexShrink:0 }}>
        {[
          { label:'TIPOS ACTIVOS',    val:`${totalHab}/${TIPOS_EMAIL.length}`, ic:'#059669', bg:'#D1FAE5', Icon:Mail },
          { label:'EMAILS ENVIADOS',  val:totalEnv,   ic:'#059669', bg:'#D1FAE5', Icon:Send },
          { label:'ERRORES',          val:totalError, ic:'#9A3412', bg:'#FED7AA', Icon:XCircle },
          { label:'CONFIGURANDO',     val: contratoSel === 'global' ? 'Global' : 'Por contrato', ic:'#047857', bg:'#ECFDF5', Icon:ToggleRight },
        ].map(({ label, val, ic, bg, Icon }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon" style={{ background:bg }}><Icon size={16} style={{ color:ic }}/></div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value" style={{ fontSize: typeof val === 'string' && val.length > 8 ? 14 : undefined }}>{val}</div>
            <div className="kpi-card-bar" style={{ background:ic }}/>
          </div>
        ))}
      </div>

      <div style={{ flex:1, minHeight:0, overflow:'auto', display:'grid', gridTemplateColumns:'1fr 340px', gap:16, alignItems:'start' }}>

        {/* ── Panel izquierdo: preferencias ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Selector de alcance */}
          <div className="card" style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'.08em', marginBottom:10 }}>ALCANCE DE LA CONFIGURACIÓN</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button onClick={() => setContratoSel('global')}
                className={contratoSel === 'global' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ fontSize:11, padding:'5px 12px' }}>
                Global (todos los contratos)
              </button>
              {contratos.map(c => (
                <button key={c.id} onClick={() => setContratoSel(c.id)}
                  className={contratoSel === c.id ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ fontSize:11, padding:'5px 12px' }}>
                  {c.numero_contrato}
                </button>
              ))}
            </div>
            <div style={{ fontSize:10, color:'#94a3b8', marginTop:8 }}>
              {contratoSel === 'global'
                ? 'Las preferencias globales aplican a todos los contratos salvo que haya una configuración específica por contrato.'
                : 'Las preferencias por contrato sobreescriben las globales solo para ese contrato.'}
            </div>
          </div>

          {/* Toggles */}
          <div className="card" style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'.08em' }}>
                TIPOS DE EMAIL — {contratoSel === 'global' ? 'CONFIGURACIÓN GLOBAL' : `CONTRATO ${contratos.find(c=>c.id===contratoSel)?.numero_contrato||''}`}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => toggleTodos(true)}
                  className="btn btn-secondary" style={{ fontSize:10, padding:'4px 10px' }}>Activar todos</button>
                <button onClick={() => toggleTodos(false)}
                  className="btn btn-secondary" style={{ fontSize:10, padding:'4px 10px', color:'#064E3B', borderColor:'#A7F3D0' }}>Desactivar todos</button>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {TIPOS_EMAIL.map(t => {
                const on = isHabilitado(t.key);
                return (
                  <div key={t.key} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                    background: on ? '#F0FDF4' : '#F8FAFC',
                    border:`1px solid ${on ? '#BBF7D0' : '#E2E8F0'}`,
                    borderRadius:8, transition:'all .15s'
                  }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{t.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color: on ? '#065f46' : '#94a3b8', marginBottom:2 }}>{t.label}</div>
                      <div style={{ fontSize:10, color:'#94a3b8', lineHeight:1.4 }}>{t.desc}</div>
                    </div>
                    <button
                      onClick={() => toggleTipo(t.key)}
                      disabled={guardando[t.key]}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:0, flexShrink:0 }}>
                      {guardando[t.key]
                        ? <RefreshCw size={20} color="#94a3b8" style={{ animation:'spin 1s linear infinite' }}/>
                        : on
                          ? <ToggleRight size={28} color="#059669"/>
                          : <ToggleLeft  size={28} color="#CBD5E1"/>
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instrucciones deploy */}
          <div className="card" style={{ padding:'14px 16px', background:'#FFFBEB', border:'1px solid #FDE68A' }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#92400e', letterSpacing:'.08em', marginBottom:8 }}>⚙️ CONFIGURACIÓN REQUERIDA EN SUPABASE</div>
            <div style={{ fontSize:11, color:'#78350f', lineHeight:1.7 }}>
              Para que los emails funcionen:
              <ol style={{ margin:'8px 0 0 16px', padding:0 }}>
                <li>Crea una cuenta en <strong>resend.com</strong> (gratis hasta 3.000 emails/mes)</li>
                <li>Obtén tu API Key en <strong>resend.com/api-keys</strong></li>
                <li>En Supabase → Project Settings → Edge Functions → <strong>Secrets</strong></li>
                <li>Agrega: <code style={{ background:'rgba(0,0,0,.08)', padding:'1px 5px', borderRadius:3 }}>RESEND_API_KEY = re_xxxxxxxxx</code></li>
                <li>Despliega: <code style={{ background:'rgba(0,0,0,.08)', padding:'1px 5px', borderRadius:3 }}>supabase functions deploy send-email</code></li>
              </ol>
            </div>
          </div>
        </div>

        {/* ── Panel derecho ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Enviar email de prueba */}
          <div className="card" style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'.08em', marginBottom:12 }}>ENVIAR EMAIL DE PRUEBA</div>
            <div className="form-group">
              <label className="form-label">Email destino</label>
              <input className="form-input" type="email" placeholder="correo@ejemplo.com"
                value={testEmail} onChange={e => setTestEmail(e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de plantilla</label>
              <select className="form-select" value={testTipo} onChange={e => setTestTipo(e.target.value)}>
                {TIPOS_EMAIL.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <button onClick={enviarPrueba} disabled={enviando} className="btn btn-primary"
              style={{ width:'100%', marginTop:4, justifyContent:'center', display:'flex', alignItems:'center', gap:6 }}>
              {enviando ? <><RefreshCw size={12} style={{ animation:'spin 1s linear infinite' }}/> Enviando...</> : <><Send size={12}/> Enviar prueba</>}
            </button>
          </div>

          {/* Historial */}
          <div className="card" style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'.08em' }}>HISTORIAL DE ENVÍOS</div>
              <button onClick={cargar} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
                <RefreshCw size={13}/>
              </button>
            </div>
            {loading ? (
              <div style={{ textAlign:'center', color:'#94a3b8', fontSize:11, padding:'20px 0' }}>Cargando...</div>
            ) : historial.length === 0 ? (
              <div style={{ textAlign:'center', color:'#94a3b8', fontSize:11, padding:'20px 0' }}>
                <Mail size={20} style={{ margin:'0 auto 8px', display:'block', opacity:.2 }}/>
                Sin historial aún
              </div>
            ) : historial.map(h => {
              const { cls, icon } = ESTADO_HIST[h.estado] || ESTADO_HIST.enviado;
              const tipo = TIPOS_EMAIL.find(t => t.key === h.tipo_email);
              return (
                <div key={h.id} style={{ padding:'8px 0', borderBottom:'1px solid #F5F5F4' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <span style={{ fontSize:14, flexShrink:0 }}>{tipo?.icon || '📧'}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                        <span style={{ fontSize:11, fontWeight:600, color:'#064E3B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {h.para.substring(0, 28)}{h.para.length > 28 ? '…' : ''}
                        </span>
                        <span className={`badge ${cls}`} style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>{icon} {h.estado}</span>
                      </div>
                      <div style={{ fontSize:10, color:'#94a3b8' }}>
                        {tipo?.label || h.tipo_email} · {new Date(h.enviado_en).toLocaleString('es-CO', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                      </div>
                      {h.error_mensaje && (
                        <div style={{ fontSize:9, color:'#064E3B', marginTop:2, background:'#F0FDF4', padding:'3px 6px', borderRadius:4 }}>
                          {h.error_mensaje.substring(0, 80)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
