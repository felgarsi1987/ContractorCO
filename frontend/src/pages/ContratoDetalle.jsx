import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Download, Eye, Plus, Edit, ExternalLink, PenLine, Calendar, DollarSign } from 'lucide-react';
import { contratos as contratosDB, documentos as docsDB } from '../lib/db';
import ConfirmModal from '../components/ui/ConfirmModal';
import { formatCOP, exportarCSV } from '../utils/export';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const SemTag = ({ s }) => {
  const m = { vigente:['badge-green','Vigente'], proximo:['badge-orange','Por Vencer'], vencido:['badge-red','Vencido'], en_ejecucion:['badge-emerald','En Ejecución'], liquidado:['badge-gray','Liquidado'], borrador:['badge-gray','Borrador'] };
  const [cls, lbl] = m[s] || ['badge-gray', s||'—'];
  return <span className={`badge ${cls}`}>{lbl}</span>;
};

// Modal para cambiar estado del contrato
function ModalCambioEstado({ contrato, onClose, onActualizado }) {
  const ESTADOS = ['borrador','en_ejecucion','suspendido','terminado','liquidado'];
  const [estado, setEstado] = useState(contrato.estado || 'borrador');
  const [obs, setObs] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try {
      await contratosDB.actualizar(contrato.id, { estado, observaciones: obs || undefined });
      toast.success('Estado actualizado');
      onActualizado(); onClose();
    } catch(e) { toast.error(e.message||'Error'); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:420 }}>
        <div className="modal-header"><h3>Cambiar estado del contrato</h3><button className="btn-icon" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="field"><label>Nuevo estado *</label>
            <select className="select-field" value={estado} onChange={e=>setEstado(e.target.value)}>
              {ESTADOS.map(e => <option key={e} value={e}>{e.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div className="field"><label>Observación del cambio</label>
            <textarea className="input-field" rows={3} value={obs} onChange={e=>setObs(e.target.value)} placeholder="Motivo del cambio de estado..." style={{ resize:'vertical' }}/>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading?'Guardando...':'Guardar cambio'}</button>
        </div>
      </div>
    </div>
  );
}

// Modal adición / prórroga
function ModalModificacion({ contrato, onClose, onActualizado }) {
  const [tipo, setTipo] = useState('prorroga');
  const [form, setForm] = useState({ valor_adicional:'', dias_adicionales:'', nueva_fecha_fin:'', justificacion:'', resolucion:'' });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const submit = async () => {
    if (!form.justificacion) return toast.error('La justificación es requerida');
    setLoading(true);
    try {
      await contratosDB.agregarModificacion(contrato.id, { tipo_modificacion:tipo, ...form, valor_adicional:+form.valor_adicional||0, dias_adicionales:+form.dias_adicionales||0 });
      toast.success('Modificación registrada');
      onActualizado(); onClose();
    } catch(e) { toast.error(e.message||'Error'); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:520 }}>
        <div className="modal-header"><h3>Adición / Prórroga</h3><button className="btn-icon" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="field"><label>Tipo de modificación *</label>
            <select className="select-field" value={tipo} onChange={e=>setTipo(e.target.value)}>
              <option value="prorroga">Prórroga (extensión de plazo)</option>
              <option value="adicion_valor">Adición en valor</option>
              <option value="suspension">Suspensión</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          {(tipo==='adicion_valor'||tipo==='prorroga') && (
            <div className="grid-2">
              {tipo==='adicion_valor' && <div className="field"><label>Valor adicional (COP)</label>
                <input className="input-field" type="number" min="0" value={form.valor_adicional} onChange={e=>set('valor_adicional',e.target.value)} placeholder="0"/></div>}
              {tipo==='prorroga' && <>
                <div className="field"><label>Días adicionales</label>
                  <input className="input-field" type="number" min="1" value={form.dias_adicionales} onChange={e=>set('dias_adicionales',e.target.value)} placeholder="0"/></div>
                <div className="field"><label>Nueva fecha de terminación</label>
                  <input className="input-field" type="date" value={form.nueva_fecha_fin} onChange={e=>set('nueva_fecha_fin',e.target.value)}/></div>
              </>}
            </div>
          )}
          <div className="field"><label>N° Resolución / Contrato adicional</label>
            <input className="input-field" value={form.resolucion} onChange={e=>set('resolucion',e.target.value)} placeholder="Ej: Res-2025-0001"/></div>
          <div className="field"><label>Justificación *</label>
            <textarea className="input-field" rows={3} value={form.justificacion} onChange={e=>set('justificacion',e.target.value)} placeholder="Describe la justificación de la modificación..." style={{ resize:'vertical' }}/></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading?'Guardando...':'Registrar modificación'}</button>
        </div>
      </div>
    </div>
  );
}

// Modal firma electrónica (flujo OTP simplificado)
function ModalFirma({ contrato, onClose }) {
  const [step, setStep] = useState(1);
  const [otp, setOtp]   = useState('');
  const [loading, setLoading] = useState(false);
  const solicitarOTP = async () => {
    setLoading(true);
    // Simular envío OTP — en producción conectar con proveedor certificado
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false); setStep(2);
    toast('Código OTP enviado al correo institucional', { icon:'📧' });
  };
  const firmar = async () => {
    if (otp.length < 4) return toast.error('Ingresa el código OTP');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    toast.success('Documento firmado electrónicamente');
    onClose();
  };
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:420 }}>
        <div className="modal-header"><h3>Firma Electrónica</h3><button className="btn-icon" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          {step === 1 ? (
            <>
              <div style={{ padding:'12px 14px', background:'#ECFDF5', borderRadius:6, border:'1px solid var(--border-mid)', fontSize:12, color:'var(--emerald-dark)', marginBottom:4 }}>
                Se solicitará un código OTP (clave de un solo uso) a tu correo institucional para validar la firma.
              </div>
              <div className="field"><label>Contrato a firmar</label>
                <div style={{ padding:'8px 10px', background:'var(--bg-app)', borderRadius:6, fontSize:13, fontWeight:500, color:'var(--forest)', border:'1px solid var(--border)' }}>
                  {contrato.numero_contrato} — {contrato.objeto?.slice(0,60)}...
                </div>
              </div>
              <div className="field"><label>Razón de la firma</label>
                <select className="select-field">
                  <option>Acta de inicio</option>
                  <option>Informe de supervisión</option>
                  <option>Acta de liquidación</option>
                  <option>Otro documento</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📧</div>
                <div style={{ fontSize:13, color:'var(--text-muted)' }}>Código enviado a tu correo institucional</div>
              </div>
              <div className="field"><label>Código OTP *</label>
                <input className="input-field" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Ingresa el código de 6 dígitos" maxLength={6} style={{ textAlign:'center', fontSize:20, letterSpacing:6, fontWeight:700 }}/>
              </div>
              <div style={{ textAlign:'center' }}>
                <button className="btn-ghost" style={{ fontSize:12 }} onClick={()=>setStep(1)}>← Volver</button>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          {step===1
            ? <button className="btn btn-primary" onClick={solicitarOTP} disabled={loading}>{loading?'Enviando...':'Solicitar OTP →'}</button>
            : <button className="btn btn-primary" onClick={firmar} disabled={loading}>{loading?'Firmando...':'✓ Firmar documento'}</button>}
        </div>
      </div>
    </div>
  );
}

export default function ContratoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [modal, setModal] = useState(null); // 'upload'|'modificacion'|'estado'|'firma'

  const cargar = () => {
    setLoading(true);
    contratosDB.obtener(id).then(setContrato).catch(() => toast.error('Error al cargar')).finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, [id]);

  const exportarExpediente = () => {
    if (!contrato) return;
    const data = [{
      numero: contrato.numero_contrato, objeto: contrato.objeto,
      tipo: contrato.tipo_contrato, valor: contrato.valor_actual,
      contratista: contrato.contratista_nombre, supervisor: contrato.supervisor_nombre||'',
      inicio: contrato.fecha_inicio, fin: contrato.fecha_fin, estado: contrato.estado,
      secop: contrato.numero_secop||'', documentos: contrato.documentos?.length||0,
    }];
    exportarCSV(data, `expediente_${contrato.numero_contrato}`);
    toast.success('Expediente exportado');
  };

  const verEnSECOP = () => {
    const url = contrato?.url_secop || (contrato?.numero_secop
      ? `https://www.colombiacompra.gov.co/secop/g/contracts/view?id=${contrato.numero_secop}`
      : 'https://www.colombiacompra.gov.co/secop-ii');
    window.open(url, '_blank', 'noopener');
  };

  if (loading) return <div className="page" style={{ alignItems:'center', justifyContent:'center' }}><div style={{ color:'var(--text-muted)' }}>Cargando...</div></div>;
  if (!contrato) return <div className="page"><button className="btn btn-secondary btn-sm" onClick={()=>navigate('/contratos')}><ArrowLeft size={13}/> Volver</button><p style={{ marginTop:20, color:'var(--text-muted)' }}>Contrato no encontrado.</p></div>;

  const campos = [
    ['Contratista',  `${contrato.contratista_nombre||'—'}${contrato.cedula?' · CC '+contrato.cedula:''}`],
    ['Supervisor',   contrato.supervisor_nombre||'Sin asignar'],
    ['Valor actual', formatCOP(contrato.valor_actual)],
    ['Inicio',       contrato.fecha_inicio?new Date(contrato.fecha_inicio).toLocaleDateString('es-CO'):'—'],
    ['Terminación',  contrato.fecha_fin?new Date(contrato.fecha_fin).toLocaleDateString('es-CO'):'—'],
    ['SECOP II',     contrato.numero_secop||'—'],
  ];

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/contratos')} style={{ marginBottom:10 }}>
            <ArrowLeft size={13}/> Volver a contratos
          </button>
          <h1>{contrato.numero_contrato}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>{contrato.tipo_contrato?.replace(/_/g,' ')}</span>
            <span style={{ color:'var(--border)' }}>·</span>
            <SemTag s={contrato.semaforo||contrato.estado}/>
            <button className="btn-ghost" style={{ fontSize:11, padding:'2px 6px' }} onClick={()=>setModal('estado')}>
              <Edit size={11}/> Cambiar
            </button>
          </div>
        </div>
        <div className="hdr-actions">
          <button className="btn btn-secondary" onClick={exportarExpediente}><Download size={13}/> Exportar</button>
          <button className="btn btn-secondary" onClick={verEnSECOP}><ExternalLink size={13}/> SECOP II</button>
          <button className="btn btn-primary" onClick={()=>setModal('upload')}><Upload size={13}/> Cargar Doc.</button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems:'start' }}>
        {/* Columna izquierda */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card" style={{ padding:20 }}>
            <h2 style={{ fontSize:14, fontWeight:600, color:'var(--forest)', marginBottom:16 }}>Información del Contrato</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {campos.map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{k}</div>
                  <div style={{ fontSize:13, fontWeight: k==='Valor actual'?700:400, color: k==='Valor actual'?'var(--emerald-dark)':'var(--text-primary)' }}>{v}</div>
                </div>
              ))}
              <div style={{ gridColumn:'span 2' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>Objeto</div>
                <div style={{ fontSize:13, lineHeight:1.6, color:'var(--text-primary)' }}>{contrato.objeto}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Documentos ({contrato.documentos?.length||0})</h2>
              <button className="btn btn-primary btn-sm" onClick={()=>setModal('upload')}><Plus size={12}/> Cargar</button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Documento</th><th>Categoría</th><th>Vencimiento</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {(contrato.documentos||[]).map(d => (
                    <tr key={d.id}>
                      <td style={{ color:'var(--emerald)', fontWeight:500, fontSize:12 }}>{d.nombre}</td>
                      <td className="td-muted">{d.categoria?.replace(/_/g,' ')}</td>
                      <td style={{ color:d.estado_vence==='vencido'?'#DC2626':d.estado_vence==='proximo'?'#F59E0B':undefined, fontWeight:d.estado_vence!=='vigente'?600:400, fontSize:12 }}>
                        {d.fecha_vencimiento?new Date(d.fecha_vencimiento).toLocaleDateString('es-CO'):'—'}
                      </td>
                      <td><SemTag s={d.estado_vence}/></td>
                      <td>
                        <a href={d.url_archivo} target="_blank" rel="noreferrer">
                          <button className="btn-icon" title="Ver documento"><Eye size={13}/></button>
                        </a>
                      </td>
                    </tr>
                  ))}
                  {!contrato.documentos?.length && (
                    <tr><td colSpan={5} style={{ textAlign:'center', padding:24, color:'var(--text-muted)', fontSize:12 }}>
                      Sin documentos. <button className="btn-ghost" style={{ fontSize:12 }} onClick={()=>setModal('upload')}>Cargar primero →</button>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--forest)', marginBottom:12 }}>Acciones del contrato</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <button className="btn btn-secondary" style={{ justifyContent:'flex-start' }} onClick={()=>setModal('modificacion')}>
                <Calendar size={13}/> Agregar adición / prórroga
              </button>
              <button className="btn btn-secondary" style={{ justifyContent:'flex-start' }} onClick={()=>setModal('firma')}>
                <PenLine size={13}/> Firma electrónica
              </button>
              <button className="btn btn-secondary" style={{ justifyContent:'flex-start' }} onClick={verEnSECOP}>
                <ExternalLink size={13}/> Ver en SECOP II
              </button>
              <button className="btn btn-secondary" style={{ justifyContent:'flex-start' }} onClick={exportarExpediente}>
                <Download size={13}/> Exportar expediente PDF
              </button>
              <button className="btn btn-secondary" style={{ justifyContent:'flex-start' }} onClick={()=>setModal('estado')}>
                <Edit size={13}/> Cambiar estado del contrato
              </button>
            </div>
          </div>

          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--forest)', marginBottom:12 }}>Modificaciones ({contrato.adiciones?.length||0})</div>
            {(contrato.adiciones||[]).map(a => (
              <div key={a.id} style={{ padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                <div style={{ fontWeight:600, color:'var(--forest)' }}>{a.tipo_modificacion?.replace(/_/g,' ')}</div>
                {a.valor_adicional>0 && <div style={{ color:'var(--emerald-dark)', fontWeight:500 }}>+{formatCOP(a.valor_adicional)}</div>}
                {a.nueva_fecha_fin && <div style={{ color:'var(--text-muted)' }}>Nueva fecha: {new Date(a.nueva_fecha_fin).toLocaleDateString('es-CO')}</div>}
                <div style={{ color:'var(--text-muted)', fontSize:11, marginTop:2 }}>{a.creado_por_nombre||'—'} · {new Date(a.creado_en).toLocaleDateString('es-CO')}</div>
              </div>
            ))}
            {!contrato.adiciones?.length && (
              <p style={{ fontSize:12, color:'var(--text-muted)' }}>Sin modificaciones registradas.</p>
            )}
            <button className="btn btn-ghost" style={{ marginTop:8, fontSize:12 }} onClick={()=>setModal('modificacion')}>
              <Plus size={12}/> Agregar modificación
            </button>
          </div>
        </div>
      </div>

      {/* Modales */}
      {modal==='upload'     && <UploadModal    contratoId={id} onClose={()=>setModal(null)} onUploaded={()=>{setModal(null);cargar();}}/>}
      {modal==='modificacion'&&<ModalModificacion contrato={contrato} onClose={()=>setModal(null)} onActualizado={cargar}/>}
      {modal==='estado'     && <ModalCambioEstado contrato={contrato} onClose={()=>setModal(null)} onActualizado={cargar}/>}
      {modal==='firma'      && <ModalFirma     contrato={contrato} onClose={()=>setModal(null)}/>}
    </div>
  );
}

function UploadModal({ contratoId, onClose, onUploaded }) {
  const [form, setForm] = useState({ categoria:'acta_inicio', fecha_vencimiento:'' });
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!file) return toast.error('Selecciona un archivo');
    if (file.size > 10*1024*1024) return toast.error('El archivo supera 10 MB');
    setLoading(true);
    try {
      await docsDB.subir(file, { contrato_id:contratoId, nombre:file.name, categoria:form.categoria, fecha_vencimiento:form.fecha_vencimiento||null });
      toast.success('Documento cargado correctamente');
      onUploaded();
    } catch(e) { toast.error(e?.message||'Error al cargar'); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:460 }}>
        <div className="modal-header"><h3>Cargar Documento</h3><button className="btn-icon" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="field"><label>Categoría *</label>
            <select className="select-field" value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
              {['acta_inicio','poliza_cumplimiento','poliza_responsabilidad','informe_supervision','paz_y_salvo','rut','cedula','certificacion_bancaria','otro'].map(c=>(
                <option key={c} value={c}>{c.replace(/_/g,' ')}</option>
              ))}
            </select>
          </div>
          <div className="field"><label>Fecha de vencimiento (si aplica)</label>
            <input className="input-field" type="date" value={form.fecha_vencimiento} onChange={e=>setForm(f=>({...f,fecha_vencimiento:e.target.value}))}/></div>
          <div style={{ border:`2px dashed ${drag||file?'var(--emerald)':'var(--border)'}`, borderRadius:8, padding:28, textAlign:'center', cursor:'pointer', background:drag||file?'var(--bg-app)':'transparent', transition:'all .15s' }}
            onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)setFile(f);}}
            onClick={()=>document.getElementById('fi-up').click()}>
            <input id="fi-up" type="file" accept=".pdf,.jpg,.png,.docx" style={{ display:'none' }} onChange={e=>setFile(e.target.files[0])}/>
            <Upload size={22} color={file?'var(--emerald)':'var(--text-subtle)'} style={{ margin:'0 auto 8px', display:'block' }}/>
            {file ? <><div style={{ fontWeight:600, color:'var(--emerald-dark)', fontSize:13 }}>{file.name}</div><div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{(file.size/1024/1024).toFixed(2)} MB</div></>
              : <><div style={{ fontWeight:500, fontSize:13 }}>Arrastra el archivo aquí</div><div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>PDF, JPG, PNG, DOCX · Máx. 10 MB</div></>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading?'Cargando...':'Cargar documento'}</button>
        </div>
      </div>
    </div>
  );
}
