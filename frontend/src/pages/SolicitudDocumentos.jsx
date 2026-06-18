import { useState, useEffect, useRef } from 'react';
import {
  ClipboardList, Plus, CheckCircle, Clock, AlertTriangle,
  X, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Paperclip, Send,
  ToggleLeft, ToggleRight, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import { solicitudes as solicitudesDB, contratos as contratosDB, mensajes as mensajesDB } from '../lib/db';
import { emailService, emailPrefs } from '../lib/emailService';
import SearchSelect from '../components/ui/SearchSelect';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import ChecklistBuilder from '../components/ChecklistBuilder';
import { CATALOGO_DOCS } from '../lib/docCatalog';

const TIPO_LABEL = {
  precontractual: 'Precontractual',
  inicio:  'Inicio contrato',
  mensual: 'Mensual',
  especial:'Especial',
  cierre:  'Cierre',
};
const TIPO_COLOR = {
  precontractual: 'badge-purple',
  inicio:  'badge-blue',
  mensual: 'badge-green',
  especial:'badge-orange',
  cierre:  'badge-gray',
};
const ESTADO_CONFIG = {
  pendiente:   { label:'Pendiente',   cls:'badge-orange' },
  en_revision: { label:'En revisión', cls:'badge-blue' },
  completa:    { label:'Completa',    cls:'badge-green' },
  vencida:     { label:'Vencida',     cls:'badge-red' },
};
const ITEM_CONFIG = {
  pendiente: { label:'Pendiente', cls:'badge-gray' },
  subido:    { label:'Subido',    cls:'badge-blue' },
  aprobado:  { label:'Aprobado', cls:'badge-green' },
  rechazado: { label:'Rechazado',cls:'badge-red' },
};


const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function checklistPorDefecto(tipo) {
  return (CATALOGO_DOCS[tipo] || []).slice(0, 5).map((d, i) => ({
    nombre: d.nombre, base_legal: d.base_legal, obligatorio: true, orden: i + 1,
  }));
}

export default function SolicitudDocumentos() {
  const { usuario } = useAuth();
  const [lista, setLista]           = useState([]);
  const [contratos, setContratos]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [expandido, setExpandido]   = useState(null);
  const [modal, setModal]           = useState(false);
  const [modalRechazo, setModalRechazo] = useState(null);
  const [guardando, setGuardando]   = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState({});
  const [emailToggle, setEmailToggle]     = useState({});
  const [msgChat, setMsgChat]       = useState({});
  const [chatOpen, setChatOpen]     = useState(null);
  const [mensajesChat, setMensajesChat] = useState([]);
  const fileRefs = useRef({}); // eslint-disable-line no-unused-vars

  const [form, setForm] = useState({
    contrato_id:'', titulo:'', tipo_solicitud:'mensual',
    fecha_limite:'', periodo_mes:'', periodo_anio: new Date().getFullYear(),
    notas:'', checklist: checklistPorDefecto('mensual'),
  });
  const [comentarioRechazo, setComentarioRechazo] = useState('');

  useEffect(() => {
    cargar();
    contratosDB.listar({ limit: 200 }).then(r => setContratos(r.data || []));
  }, [filtroEstado]);

  async function cargar() {
    setLoading(true);
    try {
      const data = await solicitudesDB.listar({ estado: filtroEstado || undefined });
      setLista(data);
    } catch { toast.error('Error cargando solicitudes'); }
    finally { setLoading(false); }
  }

  async function guardar() {
    if (!form.contrato_id) { toast.error('Selecciona un contrato'); return; }
    if (!form.titulo.trim()) { toast.error('Escribe el título de la solicitud'); return; }
    if (form.checklist.length === 0) { toast.error('Agrega al menos un documento al checklist'); return; }
    setGuardando(true);
    try {
      await solicitudesDB.crear({
        contrato_id:    form.contrato_id,
        titulo:         form.titulo,
        tipo_solicitud: form.tipo_solicitud,
        fecha_limite:   form.fecha_limite || null,
        periodo_mes:    form.periodo_mes   ? parseInt(form.periodo_mes)  : null,
        periodo_anio:   form.periodo_anio  ? parseInt(form.periodo_anio) : null,
        notas:          form.notas,
        items_custom:   form.checklist,
        fase:           'contrato',
      });
      toast.success('Solicitud creada y notificada al contratista');
      setModal(false);
      resetForm();
      cargar();
    } catch (e) { toast.error(e.message || 'Error creando solicitud'); }
    finally { setGuardando(false); }
  }

  function resetForm() {
    setForm({
      contrato_id:'', titulo:'', tipo_solicitud:'mensual',
      fecha_limite:'', periodo_mes:'', periodo_anio: new Date().getFullYear(),
      notas:'', checklist: checklistPorDefecto('mensual'),
    });
  }

  async function aprobarItem(itemId) {
    try {
      await solicitudesDB.aprobarItem(itemId, { aprobado: true });
      toast.success('Documento aprobado');
      cargar();
    } catch { toast.error('Error aprobando'); }
  }

  async function enviarRecordatorio(sol) {
    setEnviandoEmail(p => ({ ...p, [sol.id]: true }));
    try {
      const { data: ctData } = await supabase
        .from('contratos')
        .select('contratistas(email, nombres, apellidos)')
        .eq('id', sol.contrato_id)
        .single();
      const email = ctData?.contratistas?.email;
      if (!email) { toast.error('El contratista no tiene email registrado'); return; }

      const itemsPend = (sol.items_checklist || []).filter(i => ['pendiente','rechazado'].includes(i.estado));
      const diasRest  = sol.fecha_limite
        ? Math.ceil((new Date(sol.fecha_limite) - new Date()) / 86400000)
        : null;

      await emailService.recordatorio({
        para: email,
        contratoId: sol.contrato_id,
        usuarioId:  usuario?.id,
        datos: {
          numero_contrato:   sol.contratos?.numero_contrato || '—',
          titulo_solicitud:  sol.titulo,
          fecha_limite:      sol.fecha_limite || '—',
          dias_restantes:    diasRest ?? '—',
          items_pendientes:  itemsPend,
          portal_url:        `${window.location.origin}/portal`,
        },
      });
      toast.success(`Recordatorio enviado a ${email}`);
    } catch (e) { toast.error(e.message || 'Error enviando recordatorio'); }
    finally { setEnviandoEmail(p => ({ ...p, [sol.id]: false })); }
  }

  async function toggleEmailSolicitud(sol) {
    if (!usuario?.id) return;
    const actual = emailToggle[sol.id] !== false;
    try {
      await emailPrefs.toggle({
        usuarioId:  usuario.id,
        contratoId: sol.contrato_id,
        tipoEmail:  `sol_${sol.id}`,
        habilitado: !actual,
      });
      setEmailToggle(p => ({ ...p, [sol.id]: !actual }));
      toast.success(!actual ? 'Emails activados para esta solicitud' : 'Emails desactivados para esta solicitud');
    } catch { toast.error('Error cambiando preferencia'); }
  }

  async function rechazarItem() {
    if (!comentarioRechazo.trim()) { toast.error('Escribe el motivo del rechazo'); return; }
    setRechazando(true);
    try {
      await solicitudesDB.aprobarItem(modalRechazo, { aprobado: false, comentario_rechazo: comentarioRechazo });
      toast.success('Documento rechazado — el contratista será notificado');
      setModalRechazo(null);
      setComentarioRechazo('');
      cargar();
    } catch { toast.error('Error rechazando'); }
    finally { setRechazando(false); }
  }

  async function abrirChat(contratoId) {
    setChatOpen(contratoId);
    const msgs = await mensajesDB.listar(contratoId);
    setMensajesChat(msgs);
  }

  async function enviarMensaje(contratoId) {
    const txt = (msgChat[contratoId] || '').trim();
    if (!txt) return;
    try {
      const msg = await mensajesDB.enviar({ contrato_id: contratoId, contenido: txt });
      setMensajesChat(prev => [...prev, msg]);
      setMsgChat(prev => ({ ...prev, [contratoId]: '' }));
    } catch { toast.error('Error enviando mensaje'); }
  }

  const totalPend  = lista.filter(s => s.estado === 'pendiente').length;
  const totalRev   = lista.filter(s => s.estado === 'en_revision').length;
  const totalComp  = lista.filter(s => s.estado === 'completa').length;
  const totalVenc  = lista.filter(s => s.estado === 'vencida').length;

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1>Solicitud de Documentos</h1>
          <p>Art. 23 Ley 1150/07 — Gestión documental entre contratante y contratista por contrato</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={13}/> Nueva Solicitud
        </button>
      </div>

      <div className="grid-4" style={{ flexShrink:0 }}>
        {[
          { label:'PENDIENTES',   val:totalPend, ic:'#C2410C', bg:'#FFEDD5', Icon:Clock },
          { label:'EN REVISIÓN',  val:totalRev,  ic:'#059669', bg:'#D1FAE5', Icon:ClipboardList },
          { label:'COMPLETADAS',  val:totalComp, ic:'#059669', bg:'#D1FAE5', Icon:CheckCircle },
          { label:'VENCIDAS',     val:totalVenc, ic:'#9A3412', bg:'#FED7AA', Icon:AlertTriangle },
        ].map(({ label, val, ic, bg, Icon }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon" style={{ background:bg }}><Icon size={16} style={{ color:ic }}/></div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{val}</div>
            <div className="kpi-card-bar" style={{ background:ic }}/>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
        {[['','Todas'],['pendiente','Pendientes'],['en_revision','En revisión'],['completa','Completadas'],['vencida','Vencidas']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltroEstado(v)}
            className={filtroEstado === v ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding:'5px 14px', fontSize:11 }}>{l}</button>
        ))}
      </div>

      <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? (
          <div className="card" style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Cargando solicitudes...</div>
        ) : lista.length === 0 ? (
          <div className="card" style={{ padding:60, textAlign:'center', color:'#9CA3AF' }}>
            <ClipboardList size={32} style={{ margin:'0 auto 12px', display:'block', opacity:.25 }}/>
            <p style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>No hay solicitudes de documentos</p>
            <p style={{ fontSize:12 }}>Crea una solicitud para pedirle documentos al contratista</p>
          </div>
        ) : lista.map(sol => {
          const cfg      = ESTADO_CONFIG[sol.estado] || ESTADO_CONFIG.pendiente;
          const items    = sol.items_checklist || [];
          const abierto  = expandido === sol.id;
          const total    = items.length;
          const aprobados= items.filter(i => i.estado === 'aprobado').length;
          const pct      = total > 0 ? Math.round(aprobados / total * 100) : 0;
          const contrato = sol.contratos;
          const ctNombre = contrato?.contratistas
            ? `${contrato.contratistas.nombres} ${contrato.contratistas.apellidos || ''}`.trim()
            : '—';

          return (
            <div key={sol.id} className="card" style={{ padding:0 }}>
              {/* Encabezado */}
              <div onClick={() => setExpandido(abierto ? null : sol.id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', cursor:'pointer' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#1F2937' }}>{sol.titulo}</span>
                    <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                    <span className={`badge ${TIPO_COLOR[sol.tipo_solicitud] || 'badge-gray'}`}>{TIPO_LABEL[sol.tipo_solicitud] || sol.tipo_solicitud}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#64748b', display:'flex', gap:12, flexWrap:'wrap' }}>
                    <span>Contrato: <strong>{contrato?.numero_contrato || '—'}</strong></span>
                    <span>Contratista: <strong>{ctNombre}</strong></span>
                    {sol.fecha_limite && <span>Límite: <strong>{sol.fecha_limite}</strong></span>}
                    {sol.periodo_mes && <span>Período: <strong>{MESES_ES[sol.periodo_mes - 1]} {sol.periodo_anio}</strong></span>}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color: pct === 100 ? '#059669' : '#475569' }}>{aprobados}/{total} aprobados</div>
                  <div style={{ width:80, height:4, background:'#E2E8F0', borderRadius:99, overflow:'hidden', marginTop:4 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: pct === 100 ? '#059669' : '#C2410C', borderRadius:99, transition:'width .4s' }}/>
                  </div>
                </div>
                {abierto ? <ChevronUp size={14} color="#94a3b8"/> : <ChevronDown size={14} color="#94a3b8"/>}
              </div>

              {/* Detalle expandido */}
              {abierto && (
                <div style={{ borderTop:'1px solid var(--border)', background:'#F8FAFC' }}>

                  {/* Barra de acciones de email */}
                  <div style={{ padding:'10px 16px', borderBottom:'1px solid #E2E8F0', display:'flex', gap:8, alignItems:'center', background:'#fff' }}>
                    <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>Emails:</span>
                    <button
                      onClick={() => enviarRecordatorio(sol)}
                      disabled={enviandoEmail[sol.id] || sol.estado === 'completa'}
                      className="btn btn-secondary"
                      style={{ padding:'4px 10px', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                      {enviandoEmail[sol.id]
                        ? <Clock size={10} style={{ animation:'spin 1s linear infinite' }}/>
                        : <><Bell size={10}/> Enviar recordatorio</>
                      }
                    </button>
                    <button
                      onClick={() => toggleEmailSolicitud(sol)}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748b' }}>
                      {emailToggle[sol.id] !== false
                        ? <><ToggleRight size={20} color="#059669"/> <span style={{ color:'#059669', fontWeight:600 }}>Emails ON</span></>
                        : <><ToggleLeft  size={20} color="#CBD5E1"/> <span>Emails OFF</span></>
                      }
                    </button>
                  </div>

                  {/* Checklist items */}
                  <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ fontSize:10, fontWeight:800, color:'#94a3b8', letterSpacing:'.08em', marginBottom:4 }}>DOCUMENTOS REQUERIDOS</div>
                    {items.sort((a,b) => a.orden - b.orden).map(item => {
                      const icfg  = ITEM_CONFIG[item.estado] || ITEM_CONFIG.pendiente;
                      const docs  = item.documentos_solicitud || [];
                      const ultimo = docs[docs.length - 1];
                      return (
                        <div key={item.id} style={{
                          background:'#fff', border:'1px solid #E2E8F0', borderRadius:8,
                          padding:'10px 12px', display:'flex', alignItems:'flex-start', gap:10
                        }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:item.base_legal ? 2 : 0, flexWrap:'wrap' }}>
                              <span style={{ fontSize:12, fontWeight:600, color:'#1F2937' }}>{item.nombre}</span>
                              <span className={`badge ${icfg.cls}`}>{icfg.label}</span>
                              {!item.obligatorio && <span style={{ fontSize:9, color:'#94a3b8', fontWeight:600 }}>Opcional</span>}
                            </div>
                            {item.base_legal && <div style={{ fontSize:10, color:'#94a3b8', marginBottom:2 }}>{item.base_legal}</div>}
                            {item.comentario_rechazo && (
                              <div style={{ fontSize:11, color:'#78716C', marginTop:4, background:'#F5F5F4', padding:'4px 8px', borderRadius:5 }}>
                                ✗ {item.comentario_rechazo}
                              </div>
                            )}
                            {ultimo && (
                              <a href={ultimo.url_publica} target="_blank" rel="noreferrer"
                                style={{ fontSize:10, color:'#059669', display:'flex', alignItems:'center', gap:4, marginTop:4, textDecoration:'none' }}>
                                <Paperclip size={10}/> {ultimo.nombre_archivo} (v{ultimo.version})
                              </a>
                            )}
                          </div>
                          {item.estado === 'subido' && (
                            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                              <button onClick={() => aprobarItem(item.id)}
                                className="btn btn-primary" style={{ padding:'5px 10px', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                                <ThumbsUp size={11}/> Aprobar
                              </button>
                              <button onClick={() => setModalRechazo(item.id)}
                                className="btn btn-secondary" style={{ padding:'5px 10px', fontSize:11, display:'flex', alignItems:'center', gap:4, borderColor:'#FDBA74', color:'#9A3412' }}>
                                <ThumbsDown size={11}/> Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Chat del contrato */}
                  <div style={{ padding:'0 16px 14px' }}>
                    <button onClick={() => chatOpen === sol.contrato_id ? setChatOpen(null) : abrirChat(sol.contrato_id)}
                      className="btn btn-secondary" style={{ padding:'6px 12px', fontSize:11, display:'flex', alignItems:'center', gap:5 }}>
                      <Send size={11}/> {chatOpen === sol.contrato_id ? 'Cerrar chat' : 'Abrir chat del contrato'}
                    </button>

                    {chatOpen === sol.contrato_id && (
                      <div style={{ marginTop:10, border:'1px solid #E2E8F0', borderRadius:8, background:'#fff', overflow:'hidden' }}>
                        <div style={{ maxHeight:200, overflow:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
                          {mensajesChat.length === 0 && (
                            <div style={{ textAlign:'center', color:'#94a3b8', fontSize:11, padding:'20px 0' }}>Sin mensajes aún</div>
                          )}
                          {mensajesChat.map(m => (
                            <div key={m.id} style={{ display:'flex', gap:8 }}>
                              <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,#059669,#34D399)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:9, fontWeight:700, flexShrink:0 }}>
                                {(m.autor?.nombre || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize:10, color:'#94a3b8', marginBottom:1 }}>{m.autor?.nombre || 'Usuario'} · {new Date(m.creado_en).toLocaleString('es-CO', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' })}</div>
                                <div style={{ fontSize:12, color:'#78716C', background:'#F5F5F4', padding:'6px 10px', borderRadius:6 }}>{m.contenido}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding:'8px 12px', borderTop:'1px solid #E2E8F0', display:'flex', gap:8 }}>
                          <input
                            className="form-input" style={{ flex:1, padding:'6px 10px', fontSize:12 }}
                            placeholder="Escribe un mensaje al contratista..."
                            value={msgChat[sol.contrato_id] || ''}
                            onChange={e => setMsgChat(p => ({ ...p, [sol.contrato_id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && enviarMensaje(sol.contrato_id)}
                          />
                          <button onClick={() => enviarMensaje(sol.contrato_id)} className="btn btn-primary" style={{ padding:'6px 12px' }}>
                            <Send size={12}/>
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

      {/* Modal: nueva solicitud */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth:660, maxHeight:'90vh', overflow:'auto' }}>
            <div className="modal-hdr">
              <div>
                <h2>Nueva Solicitud de Documentos</h2>
                <p style={{ margin:0, fontSize:11, color:'#64748b' }}>Ligada a un contrato vigente — el contratista será notificado</p>
              </div>
              <button className="btn-icon" onClick={() => { setModal(false); resetForm(); }}><X size={16}/></button>
            </div>
            <div style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:14 }}>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Contrato *</label>
                  <SearchSelect
                    value={form.contrato_id}
                    onChange={v => setForm(f => ({ ...f, contrato_id: v }))}
                    options={contratos.map(c => ({ value: c.id, label: c.numero_contrato, sublabel: c.objeto?.substring(0,60) }))}
                    placeholder="Seleccionar contrato..."
                    searchPlaceholder="Buscar por número u objeto..."
                  />
                </div>

                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Título de la solicitud *</label>
                  <input className="form-input" placeholder="Ej: Documentos pago mes junio 2026" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}/>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de solicitud</label>
                  <select className="form-select" value={form.tipo_solicitud}
                    onChange={e => {
                      const tipo = e.target.value;
                      setForm(f => ({ ...f, tipo_solicitud: tipo, checklist: checklistPorDefecto(tipo) }));
                    }}>
                    {Object.entries(TIPO_LABEL).filter(([v]) => v !== 'precontractual').map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha límite</label>
                  <input className="form-input" type="date" value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))}/>
                </div>

                {form.tipo_solicitud === 'mensual' && <>
                  <div className="form-group">
                    <label className="form-label">Mes del período</label>
                    <select className="form-select" value={form.periodo_mes} onChange={e => setForm(f => ({ ...f, periodo_mes: e.target.value }))}>
                      <option value="">— Seleccionar —</option>
                      {MESES_ES.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Año</label>
                    <input className="form-input" type="number" value={form.periodo_anio} onChange={e => setForm(f => ({ ...f, periodo_anio: e.target.value }))}/>
                  </div>
                </>}
              </div>

              {/* ChecklistBuilder */}
              <div className="form-group">
                <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                  Documentos requeridos *
                  <span style={{ fontSize:10, fontWeight:400, color:'#94a3b8' }}>— ajusta el checklist según lo que necesitas</span>
                </label>
                <ChecklistBuilder
                  items={form.checklist}
                  onChange={checklist => setForm(f => ({ ...f, checklist }))}
                  tipo={form.tipo_solicitud === 'precontractual' ? 'mensual' : form.tipo_solicitud}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notas / instrucciones adicionales</label>
                <textarea className="form-input" rows={3} value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Instrucciones adicionales para el contratista..."
                  style={{ resize:'vertical' }}/>
              </div>

              <div style={{ background:'#F5F5F4', border:'1px solid #D6D3D1', borderRadius:8, padding:'10px 14px', fontSize:11, color:'#78716C' }}>
                Al crear esta solicitud, el contratista recibirá una notificación con el listado de documentos requeridos.
              </div>

              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => { setModal(false); resetForm(); }}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
                  {guardando ? 'Creando...' : `Crear y notificar (${form.checklist.length} docs)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: rechazar documento */}
      {modalRechazo && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalRechazo(null)}>
          <div className="modal" style={{ maxWidth:420 }}>
            <div className="modal-hdr">
              <h2>Rechazar documento</h2>
              <button className="btn-icon" onClick={() => setModalRechazo(null)}><X size={16}/></button>
            </div>
            <div style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Motivo del rechazo *</label>
                <textarea className="form-input" rows={4}
                  placeholder="Explica al contratista qué debe corregir o volver a subir..."
                  value={comentarioRechazo}
                  onChange={e => setComentarioRechazo(e.target.value)}
                  style={{ resize:'vertical' }}/>
              </div>
              <div style={{ fontSize:11, color:'#64748b' }}>El contratista recibirá una notificación con este comentario.</div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setModalRechazo(null)}>Cancelar</button>
                <button className="btn btn-primary" style={{ background:'#9A3412', borderColor:'#9A3412' }} onClick={rechazarItem} disabled={rechazando}>
                  {rechazando ? 'Rechazando...' : 'Rechazar documento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
