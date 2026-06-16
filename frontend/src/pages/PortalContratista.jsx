import { useState, useEffect, useRef } from 'react';
import {
  FileText, Bell, CheckCircle, Clock, Upload, AlertTriangle,
  ChevronDown, ChevronUp, Paperclip, Send, X, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { solicitudes as solicitudesDB, notificaciones as notifDB, mensajes as mensajesDB, contratistas as contratistasDB } from '../lib/db';
import { supabase } from '../lib/supabase';

const ESTADO_CONFIG = {
  pendiente:   { label:'Pendiente',   cls:'badge-orange', color:'#C2410C' },
  en_revision: { label:'En revisión', cls:'badge-blue',   color:'#78716C' },
  completa:    { label:'Completa',    cls:'badge-green',  color:'#059669' },
  vencida:     { label:'Vencida',     cls:'badge-red',    color:'#9A3412' },
};
const ITEM_CONFIG = {
  pendiente: { label:'Pendiente', cls:'badge-gray' },
  subido:    { label:'Subido',    cls:'badge-blue' },
  aprobado:  { label:'Aprobado', cls:'badge-green' },
  rechazado: { label:'Rechazado',cls:'badge-red' },
};

export default function PortalContratista() {
  const { usuario } = useAuth();
  const [contratista, setContratista] = useState(null);
  const [solicitudes, setSolicitudes]   = useState([]);
  const [notifs, setNotifs]             = useState([]);
  const [noLeidas, setNoLeidas]         = useState(0);
  const [loading, setLoading]           = useState(true);
  const [expandido, setExpandido]       = useState(null);
  const [subiendo, setSubiendo]         = useState({});
  const [chatOpen, setChatOpen]         = useState(null);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [msgText, setMsgText]           = useState('');
  const fileInputs = useRef({});

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    setLoading(true);
    try {
      // Buscar el contratista vinculado a este usuario
      const { data: ctData } = await supabase
        .from('contratistas')
        .select('*')
        .eq('usuario_id', usuario?.id)
        .maybeSingle();

      if (!ctData) {
        setLoading(false);
        return;
      }
      setContratista(ctData);

      const [sols, ntfs] = await Promise.all([
        solicitudesDB.listar({ contratista_id: ctData.id }),
        notifDB.listar({ limit: 30 }),
      ]);
      setSolicitudes(sols);
      setNotifs(ntfs);
      setNoLeidas(ntfs.filter(n => !n.leida).length);
    } catch (e) {
      toast.error('Error cargando portal');
    } finally {
      setLoading(false);
    }
  }

  async function subirArchivo(itemId, file) {
    if (!file) return;
    setSubiendo(p => ({ ...p, [itemId]: true }));
    try {
      await solicitudesDB.subirDocumento(itemId, file, '');
      toast.success('Documento subido — el supervisor será notificado');
      cargarTodo();
    } catch (e) {
      toast.error(e.message || 'Error subiendo documento');
    } finally {
      setSubiendo(p => ({ ...p, [itemId]: false }));
    }
  }

  async function marcarNotifLeida(id) {
    await notifDB.marcarLeida(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    setNoLeidas(prev => Math.max(0, prev - 1));
  }

  async function marcarTodasLeidas() {
    await notifDB.marcarTodasLeidas();
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);
    toast.success('Todas las notificaciones marcadas como leídas');
  }

  async function abrirChat(contratoId) {
    setChatOpen(contratoId);
    const msgs = await mensajesDB.listar(contratoId);
    setMensajesChat(msgs);
  }

  async function enviarMensaje() {
    if (!msgText.trim() || !chatOpen) return;
    try {
      const msg = await mensajesDB.enviar({ contrato_id: chatOpen, contenido: msgText.trim() });
      setMensajesChat(prev => [...prev, msg]);
      setMsgText('');
    } catch { toast.error('Error enviando mensaje'); }
  }

  const solicsPendientes = solicitudes.filter(s => s.estado !== 'completa').length;
  const solicsCompletas  = solicitudes.filter(s => s.estado === 'completa').length;

  if (loading) {
    return (
      <div className="page" style={{ alignItems:'center', justifyContent:'center' }}>
        <div style={{ color:'#9CA3AF', fontSize:13 }}>Cargando portal...</div>
      </div>
    );
  }

  if (!contratista) {
    return (
      <div className="page" style={{ alignItems:'center', justifyContent:'center' }}>
        <div className="card" style={{ maxWidth:420, textAlign:'center', padding:40 }}>
          <AlertTriangle size={32} style={{ color:'#047857', margin:'0 auto 12px', display:'block' }}/>
          <h2 style={{ fontSize:16, marginBottom:8 }}>Perfil de contratista no vinculado</h2>
          <p style={{ fontSize:12, color:'#64748b' }}>
            Tu usuario no está vinculado a un contratista. Contacta al administrador para que vincule tu cuenta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1>Mi Portal de Contratista</h1>
          <p>
            {contratista.nombres} {contratista.apellidos || ''} · {contratista.cedula || contratista.nit || '—'}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={cargarTodo} style={{ display:'flex', alignItems:'center', gap:6 }}>
          <RefreshCw size={12}/> Actualizar
        </button>
      </div>

      <div className="grid-4" style={{ flexShrink:0 }}>
        {[
          { label:'CONTRATOS',           val: solicitudes.reduce((acc, s) => { const id = s.contrato_id; return acc.includes(id) ? acc : [...acc, id]; }, []).length, ic:'#059669', bg:'#D1FAE5', Icon:FileText },
          { label:'DOCS PENDIENTES',     val: solicsPendientes, ic:'#C2410C', bg:'#FFEDD5', Icon:Clock },
          { label:'SOLICITUDES LISTAS',  val: solicsCompletas,  ic:'#059669', bg:'#D1FAE5', Icon:CheckCircle },
          { label:'NOTIFICACIONES',      val: noLeidas,         ic:'#78716C', bg:'#F5F5F4', Icon:Bell },
        ].map(({ label, val, ic, bg, Icon }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon" style={{ background:bg }}><Icon size={16} style={{ color:ic }}/></div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{val}</div>
            <div className="kpi-card-bar" style={{ background:ic }}/>
          </div>
        ))}
      </div>

      <div style={{ flex:1, minHeight:0, overflow:'auto', display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>

        {/* ── Columna izquierda: solicitudes ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, minHeight:0 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'.08em' }}>
            MIS SOLICITUDES DE DOCUMENTOS ({solicitudes.length})
          </div>

          {solicitudes.length === 0 ? (
            <div className="card" style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>
              <CheckCircle size={28} style={{ margin:'0 auto 10px', display:'block', opacity:.2 }}/>
              <p style={{ fontSize:13, fontWeight:600 }}>No hay solicitudes pendientes</p>
              <p style={{ fontSize:11 }}>Cuando el supervisor solicite documentos, aparecerán aquí</p>
            </div>
          ) : solicitudes.map(sol => {
            const cfg   = ESTADO_CONFIG[sol.estado] || ESTADO_CONFIG.pendiente;
            const items = sol.items_checklist || [];
            const abierto = expandido === sol.id;
            const total   = items.length;
            const subidos = items.filter(i => ['subido','aprobado'].includes(i.estado)).length;
            const pct     = total > 0 ? Math.round(subidos / total * 100) : 0;
            const contrato = sol.contratos;

            return (
              <div key={sol.id} className="card" style={{ padding:0, border: sol.estado === 'vencida' ? '1px solid #A7F3D0' : undefined }}>
                <div onClick={() => setExpandido(abierto ? null : sol.id)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', cursor:'pointer' }}>
                  <div style={{ width:3, height:40, borderRadius:2, background:cfg.color, flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#064E3B' }}>{sol.titulo}</span>
                      <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                    <div style={{ fontSize:11, color:'#64748b' }}>
                      Contrato: <strong>{contrato?.numero_contrato || '—'}</strong>
                      {sol.fecha_limite && <> · Límite: <strong style={{ color: new Date(sol.fecha_limite) < new Date() ? '#9A3412' : '#475569' }}>{sol.fecha_limite}</strong></>}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#475569' }}>{subidos}/{total}</div>
                    <div style={{ width:64, height:4, background:'#E2E8F0', borderRadius:99, overflow:'hidden', marginTop:3 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background: pct === 100 ? '#059669' : '#10B981', borderRadius:99 }}/>
                    </div>
                  </div>
                  {abierto ? <ChevronUp size={14} color="#94a3b8"/> : <ChevronDown size={14} color="#94a3b8"/>}
                </div>

                {abierto && (
                  <div style={{ borderTop:'1px solid var(--border)', background:'#F8FAFC' }}>
                    {sol.notas && (
                      <div style={{ padding:'10px 16px', background:'#ECFDF5', borderBottom:'1px solid #D1FAE5', fontSize:11, color:'#065F46' }}>
                        <strong>Instrucciones:</strong> {sol.notas}
                      </div>
                    )}

                    <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                      {items.sort((a,b) => a.orden - b.orden).map(item => {
                        const icfg  = ITEM_CONFIG[item.estado] || ITEM_CONFIG.pendiente;
                        const docs  = item.documentos_solicitud || [];
                        const ultimo = docs[docs.length - 1];
                        const puedeSubir = ['pendiente','rechazado'].includes(item.estado);

                        return (
                          <div key={item.id} style={{
                            background:'#fff', border:'1px solid', borderColor: item.estado === 'rechazado' ? '#A7F3D0' : '#E2E8F0',
                            borderRadius:8, padding:'10px 12px'
                          }}>
                            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:item.base_legal ? 2 : 0, flexWrap:'wrap' }}>
                                  <span style={{ fontSize:12, fontWeight:600, color:'#064E3B' }}>{item.nombre}</span>
                                  <span className={`badge ${icfg.cls}`}>{icfg.label}</span>
                                  {!item.obligatorio && <span style={{ fontSize:9, color:'#94a3b8', fontWeight:600 }}>Opcional</span>}
                                </div>
                                {item.base_legal && <div style={{ fontSize:10, color:'#94a3b8' }}>{item.base_legal}</div>}
                                {item.descripcion && <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{item.descripcion}</div>}

                                {item.comentario_rechazo && (
                                  <div style={{ fontSize:11, color:'#064E3B', marginTop:6, background:'#F0FDF4', padding:'6px 10px', borderRadius:6 }}>
                                    <strong>Motivo rechazo:</strong> {item.comentario_rechazo}
                                  </div>
                                )}

                                {ultimo && item.estado !== 'rechazado' && (
                                  <a href={ultimo.url_publica} target="_blank" rel="noreferrer"
                                    style={{ fontSize:10, color:'#059669', display:'flex', alignItems:'center', gap:4, marginTop:4, textDecoration:'none' }}>
                                    <Paperclip size={10}/> {ultimo.nombre_archivo} (v{ultimo.version})
                                  </a>
                                )}
                              </div>

                              {puedeSubir && (
                                <div style={{ flexShrink:0 }}>
                                  <input
                                    type="file"
                                    ref={el => fileInputs.current[item.id] = el}
                                    style={{ display:'none' }}
                                    onChange={e => subirArchivo(item.id, e.target.files[0])}
                                  />
                                  <button
                                    onClick={() => fileInputs.current[item.id]?.click()}
                                    className="btn btn-primary"
                                    disabled={subiendo[item.id]}
                                    style={{ padding:'5px 10px', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                                    {subiendo[item.id]
                                      ? <><RefreshCw size={11} style={{ animation:'spin 1s linear infinite' }}/> Subiendo...</>
                                      : <><Upload size={11}/> {item.estado === 'rechazado' ? 'Volver a subir' : 'Subir'}</>
                                    }
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mini chat con supervisor */}
                    <div style={{ padding:'0 16px 14px' }}>
                      <button onClick={() => chatOpen === sol.contrato_id ? setChatOpen(null) : abrirChat(sol.contrato_id)}
                        className="btn btn-secondary" style={{ padding:'6px 12px', fontSize:11, display:'flex', alignItems:'center', gap:5 }}>
                        <Send size={11}/> Mensaje al supervisor
                      </button>
                      {chatOpen === sol.contrato_id && (
                        <div style={{ marginTop:8, border:'1px solid #E2E8F0', borderRadius:8, background:'#fff', overflow:'hidden' }}>
                          <div style={{ maxHeight:160, overflow:'auto', padding:'8px 12px', display:'flex', flexDirection:'column', gap:6 }}>
                            {mensajesChat.length === 0
                              ? <div style={{ textAlign:'center', color:'#94a3b8', fontSize:11, padding:'12px 0' }}>Sin mensajes</div>
                              : mensajesChat.map(m => (
                                <div key={m.id} style={{ display:'flex', gap:7 }}>
                                  <div style={{ width:20, height:20, borderRadius:'50%', background:'linear-gradient(135deg,#059669,#34D399)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:8, fontWeight:700, flexShrink:0 }}>
                                    {(m.autor?.nombre || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontSize:9, color:'#94a3b8' }}>{m.autor?.nombre} · {new Date(m.creado_en).toLocaleString('es-CO',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}</div>
                                    <div style={{ fontSize:11, color:'#064E3B', background:'#F5F5F4', padding:'5px 8px', borderRadius:5 }}>{m.contenido}</div>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                          <div style={{ padding:'6px 10px', borderTop:'1px solid #E2E8F0', display:'flex', gap:6 }}>
                            <input className="form-input" style={{ flex:1, padding:'5px 8px', fontSize:11 }}
                              placeholder="Escribe un mensaje..."
                              value={msgText} onChange={e => setMsgText(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && enviarMensaje()}/>
                            <button onClick={enviarMensaje} className="btn btn-primary" style={{ padding:'5px 10px' }}>
                              <Send size={11}/>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Columna derecha: notificaciones ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'.08em' }}>
              NOTIFICACIONES {noLeidas > 0 && <span style={{ background:'#C2410C', color:'#fff', borderRadius:99, padding:'1px 6px', fontSize:9, fontWeight:700, marginLeft:4 }}>{noLeidas}</span>}
            </div>
            {noLeidas > 0 && (
              <button onClick={marcarTodasLeidas} style={{ fontSize:10, color:'#059669', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                Marcar todas leídas
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div className="card" style={{ padding:24, textAlign:'center', color:'#9CA3AF', fontSize:11 }}>
              <Bell size={20} style={{ margin:'0 auto 8px', display:'block', opacity:.2 }}/>
              Sin notificaciones
            </div>
          ) : notifs.map(n => (
            <div key={n.id} className="card" style={{
              padding:'10px 12px',
              background: n.leida ? '#fff' : '#F0FDF4',
              borderLeft: n.leida ? undefined : '3px solid #059669',
              cursor: n.leida ? 'default' : 'pointer'
            }}
            onClick={() => !n.leida && marcarNotifLeida(n.id)}>
              <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                <div style={{
                  width:28, height:28, borderRadius:6, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: n.tipo?.includes('rechaz') ? '#D1FAE5' : n.tipo?.includes('aprob') || n.tipo?.includes('pago') ? '#D1FAE5' : '#D1FAE5',
                  fontSize:13
                }}>
                  {n.tipo?.includes('rechaz') ? '❌' : n.tipo?.includes('aprob') ? '✅' : n.tipo?.includes('pago') ? '💰' : n.tipo?.includes('plazo') ? '⏰' : '📋'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'#064E3B', marginBottom:2 }}>{n.titulo}</div>
                  {n.cuerpo && <div style={{ fontSize:10, color:'#64748b', lineHeight:1.4 }}>{n.cuerpo}</div>}
                  <div style={{ fontSize:9, color:'#94a3b8', marginTop:3 }}>
                    {new Date(n.creado_en).toLocaleString('es-CO', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                    {n.contratos && <> · {n.contratos.numero_contrato}</>}
                  </div>
                </div>
                {!n.leida && <div style={{ width:7, height:7, borderRadius:'50%', background:'#059669', flexShrink:0, marginTop:4 }}/>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
