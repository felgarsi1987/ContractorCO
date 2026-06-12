import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatusTag from '../components/ui/StatusTag';
import { formatCOP, diasRestantes, clasesDias } from '../utils/format';
import toast from 'react-hot-toast';

export default function ContratoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    api.get(`/contratos/${id}`).then(r => setContrato(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign:'center' }}><span className="ms animate-spin">refresh</span></div>;
  if (!contrato) return <div style={{ padding: 40 }}>Contrato no encontrado.</div>;

  const dias = diasRestantes(contrato.fecha_fin);

  return (
    <>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost" onClick={() => navigate('/contratos')} style={{ marginBottom: 6, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4 }}>
            <span className="ms ms-sm">arrow_back</span> Volver
          </button>
          <h2>{contrato.numero_contrato}</h2>
          <p>{contrato.tipo_contrato?.replace(/_/g,' ')} · <span className={clasesDias(dias)} style={{ fontWeight: 600 }}>
            {dias < 0 ? `Vencido hace ${Math.abs(dias)} días` : `${dias} días restantes`}
          </span></p>
        </div>
        <div className="hdr-actions">
          <button className="btn btn-secondary"><span className="ms ms-sm">edit</span>Editar</button>
          <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
            <span className="ms ms-sm">upload</span>Cargar Doc.
          </button>
        </div>
      </div>

      <div className="grid-3">
        <div className="stack">
          {/* Info principal */}
          <div className="card">
            <div className="card-header">
              <h3>Información del Contrato</h3>
              <StatusTag value={contrato.estado} />
            </div>
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['Contratista', <><div style={{ fontWeight:600 }}>{contrato.contratista_nombre}</div><div style={{ fontSize:11,color:'var(--secondary-text)' }}>{contrato.cedula} · {contrato.tipo_persona}</div></>],
                ['Supervisor',  <><div style={{ fontWeight:600 }}>{contrato.supervisor_nombre || '—'}</div><div style={{ fontSize:11,color:'var(--secondary-text)' }}>{contrato.dependencia || ''}</div></>],
                ['Valor', <div style={{ fontSize:22,fontWeight:700,color:'var(--primary)',letterSpacing:'-.02em' }}>{formatCOP(contrato.valor_actual)}</div>],
                ['Fecha Fin', <div style={{ fontWeight:600, color: clasesDias(dias) === 'c-danger' ? 'var(--danger)' : clasesDias(dias) === 'c-warning' ? 'var(--warning)' : 'inherit' }}>
                  {new Date(contrato.fecha_fin).toLocaleDateString('es-CO')} · {dias}d
                </div>],
                ['Fecha Inicio', new Date(contrato.fecha_inicio).toLocaleDateString('es-CO')],
                ['SECOP II', contrato.numero_secop ? <span style={{ color:'var(--info)',fontSize:12 }}>{contrato.numero_secop}</span> : '—'],
              ].map(([label, val], i) => (
                <div key={i} style={{ gridColumn: label === 'Objeto' ? 'span 2' : undefined }}>
                  <div className="text-label c-secondary" style={{ marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize:13 }}>{val}</div>
                </div>
              ))}
              <div style={{ gridColumn: 'span 2' }}>
                <div className="text-label c-secondary" style={{ marginBottom: 3 }}>Objeto</div>
                <div style={{ fontSize:13, lineHeight: 1.5 }}>{contrato.objeto}</div>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="card">
            <div className="card-header">
              <h4>Documentos del Contrato</h4>
              <span className="tag tag-warning">{contrato.documentos?.filter(d => d.estado_vence !== 'vigente').length || 0} alertas</span>
            </div>
            <table className="data-table">
              <thead><tr><th>Documento</th><th>Categoría</th><th>Vence</th><th>Estado</th></tr></thead>
              <tbody>
                {(contrato.documentos || []).map(doc => (
                  <tr key={doc.id}>
                    <td style={{ color:'var(--info)' }}>
                      <span className="ms ms-sm" style={{ color:'var(--danger)',marginRight:4,verticalAlign:-3 }}>picture_as_pdf</span>
                      {doc.nombre}
                    </td>
                    <td><span className="tag tag-gray" style={{ borderRadius:4 }}>{doc.categoria?.replace(/_/g,' ')}</span></td>
                    <td className={doc.fecha_vencimiento ? clasesDias(diasRestantes(doc.fecha_vencimiento)) : 'td-secondary'}>
                      {doc.fecha_vencimiento ? new Date(doc.fecha_vencimiento).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td><StatusTag value={doc.estado_vence} /></td>
                  </tr>
                ))}
                {(!contrato.documentos?.length) && (
                  <tr><td colSpan={4} style={{ textAlign:'center',padding:20,color:'var(--outline)' }}>Sin documentos cargados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="stack">
          <div className="card">
            <div className="card-header"><h4>Acciones Rápidas</h4></div>
            <div style={{ padding:12,display:'flex',flexDirection:'column',gap:6 }}>
              {[
                ['add_circle','Agregar adición / prórroga'],
                ['draw','Firma electrónica'],
                ['open_in_new','Ver en SECOP II'],
                ['download','Exportar expediente PDF'],
              ].map(([ic,lbl]) => (
                <button key={lbl} className="btn btn-secondary" style={{ justifyContent:'flex-start' }}>
                  <span className="ms ms-sm">{ic}</span>{lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h4>Historial de Cambios</h4></div>
            <div style={{ padding:'12px 14px',display:'flex',flexDirection:'column',gap:10 }}>
              {(contrato.adiciones || []).map(a => (
                <div key={a.id} style={{ display:'flex',gap:8 }}>
                  <span className="ms ms-sm" style={{ color:'var(--info)' }}>edit</span>
                  <div>
                    <div style={{ fontSize:12 }}>{a.tipo_modificacion?.replace(/_/g,' ')} — {formatCOP(a.valor_adicional)}</div>
                    <div style={{ fontSize:11,color:'var(--secondary-text)',marginTop:1 }}>{a.creado_por_nombre} · {new Date(a.creado_en).toLocaleDateString('es-CO')}</div>
                  </div>
                </div>
              ))}
              {!contrato.adiciones?.length && <p style={{ fontSize:12,color:'var(--outline)' }}>Sin modificaciones registradas</p>}
            </div>
          </div>
        </div>
      </div>

      {uploadOpen && (
        <UploadModal
          contratoId={id}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => { setUploadOpen(false); api.get(`/contratos/${id}`).then(r => setContrato(r.data)); }}
        />
      )}
    </>
  );
}

function UploadModal({ contratoId, onClose, onUploaded }) {
  const [form, setForm] = useState({ categoria: 'acta_inicio', fecha_vencimiento: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) return toast.error('Selecciona un archivo');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('archivo', file);
      fd.append('contrato_id', contratoId);
      fd.append('nombre', file.name);
      fd.append('categoria', form.categoria);
      if (form.fecha_vencimiento) fd.append('fecha_vencimiento', form.fecha_vencimiento);
      await api.post('/documentos/upload', fd);
      toast.success('Documento cargado correctamente');
      onUploaded();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cargar');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Cargar Documento</h3>
          <button className="btn-icon" onClick={onClose}><span className="ms ms-sm">close</span></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Categoría</label>
            <select className="select" style={{ width:'100%' }} value={form.categoria} onChange={e => setForm(f=>({...f,categoria:e.target.value}))}>
              {['poliza_cumplimiento','poliza_responsabilidad','acta_inicio','informe_supervision','paz_y_salvo','cedula','rut','certificacion_bancaria'].map(c=>(
                <option key={c} value={c}>{c.replace(/_/g,' ')}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Fecha de vencimiento (si aplica)</label>
            <input className="input" type="date" value={form.fecha_vencimiento} onChange={e => setForm(f=>({...f,fecha_vencimiento:e.target.value}))} />
          </div>
          <div className={`dropzone ${file ? 'active' : ''}`} onClick={() => document.getElementById('file-input').click()}>
            <input id="file-input" type="file" accept=".pdf,.jpg,.png" style={{ display:'none' }} onChange={e => setFile(e.target.files[0])} />
            <span className="ms ms-lg" style={{ color:'var(--outline)',display:'block',marginBottom:8 }}>upload_file</span>
            {file ? (
              <><div style={{ fontWeight:500,color:'var(--primary)' }}>{file.name}</div><div style={{ fontSize:11,color:'var(--secondary-text)',marginTop:4 }}>{(file.size/1024/1024).toFixed(2)} MB</div></>
            ) : (
              <><div style={{ fontWeight:500 }}>Arrastra el archivo aquí</div><div style={{ fontSize:12,color:'var(--secondary-text)',marginTop:4 }}>o haz clic para seleccionar · PDF, JPG, PNG · Máx. 10 MB</div></>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="ms animate-spin" style={{ fontSize:18 }}>refresh</span> : <><span className="ms ms-sm">upload</span>Cargar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
