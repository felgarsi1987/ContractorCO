import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Download, Eye, Plus } from 'lucide-react';
import { contratos as contratosDB, documentos as docsDB } from '../lib/db';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  const m = { vigente:['badge-green','Vigente'], proximo:['badge-orange','Por Vencer'], vencido:['badge-red','Vencido'], en_ejecucion:['badge-green','En Ejecución'] };
  const [cls, lbl] = m[s] || ['badge-gray', s];
  return <span className={`badge ${cls}`}>{lbl}</span>;
};

export default function ContratoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [uploadOpen, setUpload] = useState(false);

  useEffect(() => {
    contratosDB.obtener(id).then(setContrato).finally(()=>setLoading(false));
  }, [id]);

  const formatCOP = v => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(v||0);

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Cargando...</div>;
  if (!contrato) return <div style={{ padding:40 }}>Contrato no encontrado.</div>;

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/contratos')} style={{ marginBottom:8 }}>
            <ArrowLeft size={13}/> Volver
          </button>
          <h1>{contrato.numero_contrato}</h1>
          <p>{contrato.tipo_contrato?.replace(/_/g,' ')} · {statusBadge(contrato.semaforo||contrato.estado)}</p>
        </div>
        <div className="hdr-actions">
          <button className="btn btn-secondary btn-sm"><Download size={12}/> Exportar</button>
          <button className="btn btn-primary" onClick={()=>setUpload(true)}><Upload size={13}/> Cargar Doc.</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, flex:1, minHeight:0, overflow:'auto' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Info */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[
                ['Contratista', `${contrato.contratista_nombre} · ${contrato.cedula||''}`],
                ['Supervisor',  contrato.supervisor_nombre || '—'],
                ['Valor',       formatCOP(contrato.valor_actual)],
                ['Fecha Fin',   new Date(contrato.fecha_fin).toLocaleDateString('es-CO')],
                ['Fecha Inicio',new Date(contrato.fecha_inicio).toLocaleDateString('es-CO')],
                ['SECOP II',    contrato.numero_secop || '—'],
              ].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize:10, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>{k}</div>
                  <div style={{ fontSize:13, fontWeight: k==='Valor'?700:400 }}>{v}</div>
                </div>
              ))}
              <div style={{ gridColumn:'span 2' }}>
                <div style={{ fontSize:10, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>Objeto</div>
                <div style={{ fontSize:13, lineHeight:1.5 }}>{contrato.objeto}</div>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="card" style={{ flex:1 }}>
            <div className="card-header">
              <h2>Documentos</h2>
              <button className="btn btn-primary btn-sm" onClick={()=>setUpload(true)}><Plus size={12}/> Cargar</button>
            </div>
            <table className="data-table">
              <thead><tr><th>Documento</th><th>Categoría</th><th>Vencimiento</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {(contrato.documentos||[]).map(d => (
                  <tr key={d.id}>
                    <td style={{ color:'#3b82f6', fontWeight:500 }}>{d.nombre}</td>
                    <td className="td-muted">{d.categoria?.replace(/_/g,' ')}</td>
                    <td className="td-muted">{d.fecha_vencimiento ? new Date(d.fecha_vencimiento).toLocaleDateString('es-CO') : '—'}</td>
                    <td>{statusBadge(d.estado_vence)}</td>
                    <td><button className="btn-icon"><Eye size={13}/></button></td>
                  </tr>
                ))}
                {!contrato.documentos?.length && (
                  <tr><td colSpan={5} style={{ textAlign:'center', padding:24, color:'#94a3b8' }}>Sin documentos cargados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Acciones Rápidas</div>
            {[['Agregar prórroga / adición','+'],['Firma electrónica','✎'],['Ver en SECOP II','↗'],['Exportar expediente','↓']].map(([l])=>(
              <button key={l} className="btn btn-secondary" style={{ width:'100%', justifyContent:'flex-start', marginBottom:6, fontSize:12 }}>{l}</button>
            ))}
          </div>
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Modificaciones</div>
            {(contrato.adiciones||[]).map(a=>(
              <div key={a.id} style={{ padding:'8px 0', borderBottom:'1px solid #f1f5f9', fontSize:12 }}>
                <div style={{ fontWeight:500 }}>{a.tipo_modificacion?.replace(/_/g,' ')}</div>
                <div style={{ color:'#64748b', fontSize:11 }}>{a.creado_por_nombre} · {new Date(a.creado_en).toLocaleDateString('es-CO')}</div>
              </div>
            ))}
            {!contrato.adiciones?.length && <p style={{ fontSize:12, color:'#94a3b8' }}>Sin modificaciones.</p>}
          </div>
        </div>
      </div>

      {uploadOpen && (
        <UploadModal contratoId={id} onClose={()=>setUpload(false)}
          onUploaded={()=>{setUpload(false); contratosDB.obtener(id).then(setContrato);}} />
      )}
    </div>
  );
}

function UploadModal({ contratoId, onClose, onUploaded }) {
  const [form, setForm] = useState({ categoria:'acta_inicio', fecha_vencimiento:'' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { documentos: docsAPI } = require('../lib/db');

  const submit = async () => {
    if (!file) return toast.error('Selecciona un archivo');
    setLoading(true);
    try {
      await docsAPI.subir(file, { contrato_id:contratoId, nombre:file.name, categoria:form.categoria, fecha_vencimiento:form.fecha_vencimiento||null });
      toast.success('Documento cargado');
      onUploaded();
    } catch(e) { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:460 }}>
        <div className="modal-header"><h3>Cargar Documento</h3><button className="btn-icon" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="field"><label>Categoría *</label>
            <select className="select-field" value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
              {['acta_inicio','poliza_cumplimiento','poliza_responsabilidad','informe_supervision','paz_y_salvo','rut','cedula','certificacion_bancaria'].map(c=>(
                <option key={c} value={c}>{c.replace(/_/g,' ')}</option>
              ))}
            </select>
          </div>
          <div className="field"><label>Fecha de vencimiento</label>
            <input className="input-field" type="date" value={form.fecha_vencimiento} onChange={e=>setForm(f=>({...f,fecha_vencimiento:e.target.value}))}/>
          </div>
          <div style={{ border:'2px dashed #e2e8f0', borderRadius:8, padding:28, textAlign:'center', cursor:'pointer', background: file?'#eff6ff':'transparent' }}
            onClick={()=>document.getElementById('fu').click()}>
            <input id="fu" type="file" accept=".pdf,.jpg,.png" style={{ display:'none' }} onChange={e=>setFile(e.target.files[0])}/>
            <Upload size={24} color={file?'#3b82f6':'#94a3b8'} style={{ margin:'0 auto 8px', display:'block' }}/>
            {file ? <><div style={{ fontWeight:500, color:'#1d4ed8' }}>{file.name}</div><div style={{ fontSize:11, color:'#64748b' }}>{(file.size/1024/1024).toFixed(2)} MB</div></>
              : <><div style={{ fontWeight:500 }}>Arrastra el archivo aquí</div><div style={{ fontSize:12, color:'#64748b' }}>PDF, JPG, PNG · Máx. 10 MB</div></>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading?'Cargando...':'Cargar'}</button>
        </div>
      </div>
    </div>
  );
}
