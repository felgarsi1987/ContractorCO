import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Download, Eye, Plus, FileText } from 'lucide-react';
import { contratos as contratosDB, documentos as docsDB } from '../lib/db';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  const m = {
    vigente:      ['badge-green',  'Vigente'],
    proximo:      ['badge-orange', 'Por Vencer'],
    vencido:      ['badge-red',    'Vencido'],
    en_ejecucion: ['badge-green',  'En Ejecución'],
    liquidado:    ['badge-gray',   'Liquidado'],
    borrador:     ['badge-gray',   'Borrador'],
  };
  const [cls, lbl] = m[s] || ['badge-gray', s || '—'];
  return <span className={`badge ${cls}`}>{lbl}</span>;
};

const formatCOP = v =>
  new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(v||0);

export default function ContratoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [upload,   setUpload]   = useState(false);

  const cargar = () => {
    setLoading(true);
    contratosDB.obtener(id)
      .then(setContrato)
      .catch(() => toast.error('Error al cargar contrato'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [id]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:60 }}>
      <div style={{ fontSize:13, color:'#94a3b8' }}>Cargando...</div>
    </div>
  );
  if (!contrato) return (
    <div style={{ padding:40 }}>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/contratos')}>
        <ArrowLeft size={13}/> Volver
      </button>
      <p style={{ marginTop:20, color:'#94a3b8' }}>Contrato no encontrado.</p>
    </div>
  );

  const campos = [
    ['Contratista',  `${contrato.contratista_nombre || '—'}${contrato.cedula ? ' · CC '+contrato.cedula : ''}`],
    ['Supervisor',   contrato.supervisor_nombre || '—'],
    ['Valor actual', formatCOP(contrato.valor_actual)],
    ['Fecha inicio', contrato.fecha_inicio ? new Date(contrato.fecha_inicio).toLocaleDateString('es-CO') : '—'],
    ['Fecha fin',    contrato.fecha_fin ? new Date(contrato.fecha_fin).toLocaleDateString('es-CO') : '—'],
    ['SECOP II',     contrato.numero_secop || '—'],
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/contratos')} style={{ marginBottom:10 }}>
            <ArrowLeft size={13}/> Volver a contratos
          </button>
          <h1>{contrato.numero_contrato}</h1>
          <p style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
            {contrato.tipo_contrato?.replace(/_/g,' ')}
            &nbsp;·&nbsp;
            {statusBadge(contrato.semaforo || contrato.estado)}
          </p>
        </div>
        <div className="hdr-actions">
          <button className="btn btn-secondary"><Download size={13}/> Exportar</button>
          <button className="btn btn-primary" onClick={() => setUpload(true)}>
            <Upload size={13}/> Cargar Documento
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="grid-2" style={{ alignItems:'start' }}>
        {/* Columna izquierda */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Info del contrato */}
          <div className="card" style={{ padding:20 }}>
            <h2 style={{ fontSize:14, fontWeight:600, marginBottom:16, color:'#1e293b' }}>Información del Contrato</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {campos.map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize:10, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>{k}</div>
                  <div style={{ fontSize:13, fontWeight: k==='Valor actual' ? 700 : 400 }}>{v}</div>
                </div>
              ))}
              <div style={{ gridColumn:'span 2' }}>
                <div style={{ fontSize:10, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>Objeto del contrato</div>
                <div style={{ fontSize:13, lineHeight:1.6, color:'#334155' }}>{contrato.objeto}</div>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="card">
            <div className="card-header">
              <h2>Documentos ({contrato.documentos?.length || 0})</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setUpload(true)}>
                <Plus size={12}/> Cargar
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Documento</th><th>Categoría</th><th>Vencimiento</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {(contrato.documentos || []).map(d => (
                    <tr key={d.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <FileText size={13} color="#3b82f6"/>
                          <span style={{ fontWeight:500, color:'#1d4ed8', fontSize:12 }}>{d.nombre}</span>
                        </div>
                      </td>
                      <td className="td-muted">{d.categoria?.replace(/_/g,' ')}</td>
                      <td className="td-muted" style={{ color: d.estado_vence==='vencido'?'#dc2626':d.estado_vence==='proximo'?'#c2410c':undefined }}>
                        {d.fecha_vencimiento ? new Date(d.fecha_vencimiento).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td>{statusBadge(d.estado_vence)}</td>
                      <td><button className="btn-icon"><Eye size={13}/></button></td>
                    </tr>
                  ))}
                  {!contrato.documentos?.length && (
                    <tr><td colSpan={5} style={{ textAlign:'center', padding:28, color:'#94a3b8', fontSize:12 }}>Sin documentos cargados aún.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Acciones */}
          <div className="card" style={{ padding:16 }}>
            <h2 style={{ fontSize:13, fontWeight:600, marginBottom:12, color:'#1e293b' }}>Acciones Rápidas</h2>
            {[
              ['Agregar adición / prórroga', <Plus size={13}/>],
              ['Firma electrónica',          <FileText size={13}/>],
              ['Ver en SECOP II',            <Eye size={13}/>],
              ['Exportar expediente PDF',    <Download size={13}/>],
            ].map(([l, icon]) => (
              <button key={l} className="btn btn-secondary" style={{ width:'100%', justifyContent:'flex-start', marginBottom:6, fontSize:12 }}>
                {icon}{l}
              </button>
            ))}
          </div>

          {/* Modificaciones */}
          <div className="card" style={{ padding:16 }}>
            <h2 style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Modificaciones</h2>
            {(contrato.adiciones || []).map(a => (
              <div key={a.id} style={{ padding:'8px 0', borderBottom:'1px solid #f1f5f9', fontSize:12 }}>
                <div style={{ fontWeight:600 }}>{a.tipo_modificacion?.replace(/_/g,' ')}</div>
                <div style={{ color:'#64748b', fontSize:11, marginTop:2 }}>
                  {a.creado_por_nombre || '—'} · {new Date(a.creado_en).toLocaleDateString('es-CO')}
                </div>
              </div>
            ))}
            {!contrato.adiciones?.length && (
              <p style={{ fontSize:12, color:'#94a3b8' }}>Sin modificaciones registradas.</p>
            )}
          </div>

          {/* Historial de cambios */}
          <div className="card" style={{ padding:16 }}>
            <h2 style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Historial de cambios</h2>
            <div style={{ fontSize:12, color:'#64748b', lineHeight:1.8 }}>
              <div>📄 Contrato creado · {new Date(contrato.creado_en).toLocaleDateString('es-CO')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal upload */}
      {upload && (
        <UploadModal
          contratoId={id}
          onClose={() => setUpload(false)}
          onUploaded={() => { setUpload(false); cargar(); }}
        />
      )}
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
    setLoading(true);
    try {
      await docsDB.subir(file, {
        contrato_id:       contratoId,
        nombre:            file.name,
        categoria:         form.categoria,
        fecha_vencimiento: form.fecha_vencimiento || null,
      });
      toast.success('Documento cargado correctamente');
      onUploaded();
    } catch (e) {
      toast.error(e?.message || 'Error al cargar documento');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:460 }}>
        <div className="modal-header">
          <h3>Cargar Documento</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Categoría *</label>
            <select className="select-field" value={form.categoria}
              onChange={e => setForm(f=>({...f,categoria:e.target.value}))}>
              {['acta_inicio','poliza_cumplimiento','poliza_responsabilidad',
                'informe_supervision','paz_y_salvo','rut','cedula','certificacion_bancaria','otro']
                .map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Fecha de vencimiento (si aplica)</label>
            <input className="input-field" type="date" value={form.fecha_vencimiento}
              onChange={e => setForm(f=>({...f,fecha_vencimiento:e.target.value}))}/>
          </div>
          <div
            style={{ border:`2px dashed ${drag||file?'#3b82f6':'#e2e8f0'}`, borderRadius:8, padding:28, textAlign:'center', cursor:'pointer', background:drag||file?'#eff6ff':'transparent', transition:'all .15s' }}
            onDragOver={e=>{e.preventDefault();setDrag(true);}}
            onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)setFile(f);}}
            onClick={()=>document.getElementById('fi-upload').click()}
          >
            <input id="fi-upload" type="file" accept=".pdf,.jpg,.png" style={{ display:'none' }}
              onChange={e=>setFile(e.target.files[0])}/>
            <Upload size={24} color={file?'#3b82f6':'#94a3b8'} style={{ margin:'0 auto 8px', display:'block' }}/>
            {file
              ? <><div style={{ fontWeight:600, color:'#1d4ed8', fontSize:13 }}>{file.name}</div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>{(file.size/1024/1024).toFixed(2)} MB</div></>
              : <><div style={{ fontWeight:500, fontSize:13 }}>Arrastra el archivo aquí</div>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>PDF, JPG, PNG · Máx. 10 MB</div></>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Cargando...' : <><Upload size={13}/> Cargar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
