import { useState, useEffect } from 'react';
import {
  UserCheck, Plus, CheckCircle, Clock, AlertTriangle, FileUp,
  X, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Paperclip, Send,
  Mail, ToggleLeft, ToggleRight, Bell, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { solicitudes as solicitudesDB, contratistas as contratistasDB } from '../lib/db';
import { emailService, emailPrefs } from '../lib/emailService';
import { useAuth } from '../context/AuthContext';
import ChecklistBuilder from '../components/ChecklistBuilder';
import { CATALOGO_DOCS } from '../lib/docCatalog';

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

export default function SolicitudPrecontrato() {
  const { usuario } = useAuth();
  const [lista, setLista]             = useState([]);
  const [contratistas, setContratistas] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [expandido, setExpandido]     = useState(null);
  const [modal, setModal]             = useState(false);
  const [modalRechazo, setModalRechazo] = useState(null);
  const [guardando, setGuardando]     = useState(false);
  const [rechazando, setRechazando]   = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState({});
  const [emailToggle, setEmailToggle] = useState({});
  const [comentarioRechazo, setComentarioRechazo] = useState('');

  const [form, setForm] = useState({
    contratista_id: '',
    titulo: '',
    fecha_limite: '',
    notas: '',
    checklist: [],
  });

  useEffect(() => {
    cargar();
    contratistasDB.listar({ limit: 500 }).then(r => setContratistas(r.data || []));
  }, [filtroEstado]);

  async function cargar() {
    setLoading(true);
    try {
      const data = await solicitudesDB.listar({ fase: 'precontractual', estado: filtroEstado || undefined });
      setLista(data);
    } catch { toast.error('Error cargando solicitudes precontractuales'); }
    finally { setLoading(false); }
  }

  function abrirModal() {
    // Pre-cargar los primeros 5 docs del catálogo precontractual como sugerencia
    const itemsIniciales = CATALOGO_DOCS.precontractual.slice(0, 5).map((d, i) => ({
      nombre: d.nombre, base_legal: d.base_legal, obligatorio: true, orden: i + 1,
    }));
    setForm({ contratista_id: '', titulo: '', fecha_limite: '', notas: '', checklist: itemsIniciales });
    setModal(true);
  }

  function resetForm() {
    setForm({ contratista_id: '', titulo: '', fecha_limite: '', notas: '', checklist: [] });
  }

  async function guardar() {
    if (!form.contratista_id) { toast.error('Selecciona un contratista'); return; }
    if (!form.titulo.trim()) { toast.error('Escribe el título de la solicitud'); return; }
    if (form.checklist.length === 0) { toast.error('Agrega al menos un documento al checklist'); return; }
    setGuardando(true);
    try {
      await solicitudesDB.crear({
        contratista_id:  form.contratista_id,
        contrato_id:     null,
        titulo:          form.titulo,
        tipo_solicitud: 'precontractual',
        fecha_limite:    form.fecha_limite || null,
        notas:           form.notas,
        items_custom:    form.checklist,
        fase:           'precontractual',
      });
      toast.success('Solicitud precontractual creada — el contratista será notificado');
      setModal(false);
      resetForm();
      cargar();
    } catch (e) { toast.error(e.message || 'Error creando solicitud'); }
    finally { setGuardando(false); }
  }

  async function aprobarItem(itemId) {
    try {
      await solicitudesDB.aprobarItem(itemId, { aprobado: true });
      toast.success('Documento aprobado');
      cargar();
    } catch { toast.error('Error aprobando'); }
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

  async function enviarRecordatorio(sol) {
    setEnviandoEmail(p => ({ ...p, [sol.id]: true }));
    try {
      const ct = sol.contratistas_pre;
      const email = ct?.email;
      if (!email) { toast.error('El contratista no tiene email registrado'); return; }

      const itemsPend = (sol.items_checklist || []).filter(i => ['pendiente','rechazado'].includes(i.estado));
      const diasRest  = sol.fecha_limite
        ? Math.ceil((new Date(sol.fecha_limite) - new Date()) / 86400000)
        : null;

      await emailService.recordatorio({
        para:       email,
        contratoId: null,
        usuarioId:  usuario?.id,
        datos: {
          numero_contrato:  'Proceso precontractual',
          titulo_solicitud: sol.titulo,
          fecha_limite:     sol.fecha_limite || '—',
          dias_restantes:   diasRest ?? '—',
          items_pendientes: itemsPend,
          portal_url:       `${window.location.origin}/portal`,
        },
      });
      toast.success(`Recordatorio enviado a ${email}`);
    } catch (e) { toast.error(e.message || 'Error enviando recordatorio'); }
    finally { setEnviandoEmail(p => ({ ...p, [sol.id]: false })); }
  }

  async function toggleEmail(sol) {
    if (!usuario?.id) return;
    const actual = emailToggle[sol.id] !== false;
    try {
      await emailPrefs.toggle({ usuarioId: usuario.id, contratoId: null, tipoEmail: `pre_${sol.id}`, habilitado: !actual });
      setEmailToggle(p => ({ ...p, [sol.id]: !actual }));
      toast.success(!actual ? 'Emails activados' : 'Emails desactivados');
    } catch { toast.error('Error cambiando preferencia'); }
  }

  const totalPend = lista.filter(s => s.estado === 'pendiente').length;
  const totalRev  = lista.filter(s => s.estado === 'en_revision').length;
  const totalComp = lista.filter(s => s.estado === 'completa').length;
  const totalVenc = lista.filter(s => s.estado === 'vencida').length;

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1>Solicitudes Precontractuales</h1>
          <p>Art. 8 Ley 80/93 — Verificación de idoneidad y habilitación antes de contratar</p>
        </div>
        <button className="btn btn-primary" onClick={abrirModal}>
          <Plus size={13}/> Nueva Solicitud
        </button>
      </div>

      <div className="grid-4" style={{ flexShrink:0 }}>
        {[
          { label:'PENDIENTES',  val:totalPend, ic:'#047857', bg:'#ECFDF5', Icon:Clock },
          { label:'EN REVISIÓN', val:totalRev,  ic:'#059669', bg:'#D1FAE5', Icon:UserCheck },
          { label:'COMPLETADAS', val:totalComp, ic:'#059669', bg:'#D1FAE5', Icon:CheckCircle },
          { label:'VENCIDAS',    val:totalVenc, ic:'#064E3B', bg:'#D1FAE5', Icon:AlertTriangle },
        ].map(({ label, val, ic, bg, Icon }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon" style={{ background:bg }}><Icon size={16} style={{ color:ic }}/></div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{val}</div>
            <div className="kpi-card-bar" style={{ background:ic }}/>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
        {[['','Todas'],['pendiente','Pendientes'],['en_revision','En revisión'],['completa','Completadas'],['vencida','Vencidas']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltroEstado(v)}
            className={filtroEstado === v ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding:'5px 14px', fontSize:11 }}>{l}</button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? (
          <div className="card" style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Cargando...</div>
        ) : lista.length === 0 ? (
          <div className="card" style={{ padding:60, textAlign:'center', color:'#9CA3AF' }}>
            <UserCheck size={32} style={{ margin:'0 auto 12px', display:'block', opacity:.25 }}/>
            <p style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Sin solicitudes precontractuales</p>
            <p style={{ fontSize:12 }}>Crea una solicitud para verificar a un contratista antes de contratarlo</p>
          </div>
        ) : lista.map(sol => {
          const cfg      = ESTADO_CONFIG[sol.estado] || ESTADO_CONFIG.pendiente;
          const items    = sol.items_checklist || [];
          const abierto  = expandido === sol.id;
          const total    = items.length;
          const aprobados= items.filter(i => i.estado === 'aprobado').length;
          const pct      = total > 0 ? Math.round(aprobados / total * 100) : 0;
          const ct       = sol.contratistas_pre;
          const ctNombre = ct ? `${ct.nombres || ''} ${ct.apellidos || ''}`.trim() : '—';

          return (
            <div key={sol.id} className="card" style={{ padding:0 }}>
              <div onClick={() => setExpandido(abierto ? null : sol.id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', cursor:'pointer' }}>
                {/* Avatar contratista */}
                <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#0D9488,#A78BFA)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:700, flexShrink:0 }}>
                  {ctNombre.charAt(0).toUpperCase() || <User size={14}/>}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#064E3B' }}>{sol.titulo}</span>
                    <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                    <span className="badge" style={{ background:'#CCFBF1', color:'#0D9488', fontSize:9, fontWeight:700 }}>Precontractual</span>
                  </div>
                  <div style={{ fontSize:11, color:'#64748b', display:'flex', gap:12, flexWrap:'wrap' }}>
                    <span>Contratista: <strong>{ctNombre}</strong></span>
                    {sol.fecha_limite && <span>Límite: <strong>{sol.fecha_limite}</strong></span>}
                    <span>{new Date(sol.creado_en).toLocaleDateString('es-CO')}</span>
                  </div>
                </div>

                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color: pct === 100 ? '#059669' : '#475569' }}>{aprobados}/{total} aprobados</div>
                  <div style={{ width:80, height:4, background:'#E2E8F0', borderRadius:99, overflow:'hidden', marginTop:4 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: pct === 100 ? '#059669' : '#0D9488', borderRadius:99, transition:'width .4s' }}/>
                  </div>
                </div>
                {abierto ? <ChevronUp size={14} color="#94a3b8"/> : <ChevronDown size={14} color="#94a3b8"/>}
              </div>

              {abierto && (
                <div style={{ borderTop:'1px solid var(--border)', background:'#F8FAFC' }}>

                  {/* Barra email */}
                  <div style={{ padding:'10px 16px', borderBottom:'1px solid #E2E8F0', display:'flex', gap:8, alignItems:'center', background:'#fff' }}>
                    <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>Notificaciones:</span>
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
                      onClick={() => toggleEmail(sol)}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748b' }}>
                      {emailToggle[sol.id] !== false
                        ? <><ToggleRight size={20} color="#059669"/> <span style={{ color:'#059669', fontWeight:600 }}>Emails ON</span></>
                        : <><ToggleLeft  size={20} color="#CBD5E1"/> <span>Emails OFF</span></>
                      }
                    </button>
                  </div>

                  {/* Notas */}
                  {sol.notas && (
                    <div style={{ padding:'8px 16px', background:'#FFFBEB', borderBottom:'1px solid #FEF3C7', fontSize:11, color:'#92400e' }}>
                      📋 {sol.notas}
                    </div>
                  )}

                  {/* Checklist items */}
                  <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ fontSize:10, fontWeight:800, color:'#94a3b8', letterSpacing:'.08em', marginBottom:4 }}>
                      DOCUMENTOS REQUERIDOS — HABILITACIÓN
                    </div>
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
                              <span style={{ fontSize:12, fontWeight:600, color:'#064E3B' }}>{item.nombre}</span>
                              <span className={`badge ${icfg.cls}`}>{icfg.label}</span>
                              {!item.obligatorio && <span style={{ fontSize:9, color:'#94a3b8', fontWeight:600 }}>Opcional</span>}
                            </div>
                            {item.base_legal && <div style={{ fontSize:10, color:'#94a3b8', marginBottom:2 }}>{item.base_legal}</div>}
                            {item.comentario_rechazo && (
                              <div style={{ fontSize:11, color:'#064E3B', marginTop:4, background:'#F0FDF4', padding:'4px 8px', borderRadius:5 }}>
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
                                className="btn btn-secondary" style={{ padding:'5px 10px', fontSize:11, display:'flex', alignItems:'center', gap:4, borderColor:'#A7F3D0', color:'#064E3B' }}>
                                <ThumbsDown size={11}/> Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: nueva solicitud precontractual */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth:660, maxHeight:'90vh', overflow:'auto' }}>
            <div className="modal-hdr">
              <div>
                <h2>Nueva Solicitud Precontractual</h2>
                <p style={{ margin:0, fontSize:11, color:'#64748b' }}>Verificación de documentos antes de formalizar el contrato</p>
              </div>
              <button className="btn-icon" onClick={() => { setModal(false); resetForm(); }}><X size={16}/></button>
            </div>

            <div style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:16 }}>

              {/* Info normativa */}
              <div style={{ background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:8, padding:'10px 14px', fontSize:11, color:'#5B21B6' }}>
                <strong>Art. 8 Ley 80/93</strong> — Antes de celebrar cualquier contrato, la entidad debe verificar que el contratista no esté inhabilitado o incapacitado para contratar con el Estado.
              </div>

              <div className="form-group">
                <label className="form-label">Contratista a verificar *</label>
                <select className="form-select" value={form.contratista_id}
                  onChange={e => setForm(f => ({ ...f, contratista_id: e.target.value }))}>
                  <option value="">Seleccionar contratista...</option>
                  {contratistas.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombres} {c.apellidos || ''} {c.cedula ? `· CC ${c.cedula}` : ''} {c.nit ? `· NIT ${c.nit}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Título de la solicitud *</label>
                <input className="form-input"
                  placeholder="Ej: Verificación precontractual — Consultoría Jurídica 2026"
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}/>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha límite para entrega</label>
                <input className="form-input" type="date" value={form.fecha_limite}
                  onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))}/>
              </div>

              {/* ChecklistBuilder */}
              <div className="form-group">
                <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                  Documentos requeridos *
                  <span style={{ fontSize:10, fontWeight:400, color:'#94a3b8' }}>— busca en el catálogo o agrega personalizados</span>
                </label>
                <ChecklistBuilder
                  items={form.checklist}
                  onChange={checklist => setForm(f => ({ ...f, checklist }))}
                  tipo="precontractual"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notas / instrucciones</label>
                <textarea className="form-input" rows={3}
                  placeholder="Instrucciones adicionales para el contratista..."
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  style={{ resize:'vertical' }}/>
              </div>

              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => { setModal(false); resetForm(); }}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardar} disabled={guardando}
                  style={{ background:'#0D9488', borderColor:'#0D9488' }}>
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
                  placeholder="Explica qué debe corregir o volver a subir..."
                  value={comentarioRechazo}
                  onChange={e => setComentarioRechazo(e.target.value)}
                  style={{ resize:'vertical' }}/>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setModalRechazo(null)}>Cancelar</button>
                <button className="btn btn-primary" style={{ background:'#064E3B', borderColor:'#064E3B' }} onClick={rechazarItem} disabled={rechazando}>
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
