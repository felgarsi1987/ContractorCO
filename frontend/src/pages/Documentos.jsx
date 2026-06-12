import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import StatusTag from '../components/ui/StatusTag';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

const CATS = [
  { value:'',                       label:'Todas las categorías' },
  { value:'poliza_cumplimiento',    label:'Póliza de cumplimiento' },
  { value:'poliza_responsabilidad', label:'Póliza de responsabilidad' },
  { value:'acta_inicio',            label:'Acta de inicio' },
  { value:'informe_supervision',    label:'Informe de supervisión' },
  { value:'paz_y_salvo',            label:'Paz y salvo' },
  { value:'cedula',                 label:'Cédula de ciudadanía' },
  { value:'rut',                    label:'RUT' },
  { value:'certificacion_bancaria', label:'Certificación bancaria' },
  { value:'otro',                   label:'Otro' },
];

export default function Documentos() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat,     setCat]     = useState('');
  const [estado,  setEstado]  = useState('');
  const [buscar,  setBuscar]  = useState('');
  const [upload,  setUpload]  = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: 50 });
    if (cat)    p.set('categoria',    cat);
    if (estado) p.set('estado_vence', estado);
    api.get('/documentos?' + p).then(r => setData(r.data || [])).finally(() => setLoading(false));
  }, [cat, estado]);

  useEffect(() => { load(); }, [load]);

  const docs = buscar
    ? data.filter(d => d.nombre?.toLowerCase().includes(buscar.toLowerCase()))
    : data;

  return (
    <>
      <div className="page-header">
        <div><h2>Documentos</h2><p>Gestión documental asociada a contratos y contratistas.</p></div>
        <div className="hdr-actions">
          <button className="btn btn-secondary"><span className="ms ms-sm">download</span>Exportar</button>
          <button className="btn btn-primary" onClick={() => setUpload(true)}>
            <span className="ms ms-sm">upload_file</span>Cargar Documento
          </button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          ['folder_managed','var(--primary)','rgba(4,22,56,.06)','Total',data.length],
          ['check_circle','var(--success)','var(--success-bg)','Vigentes',data.filter(d=>d.estado_vence==='vigente').length],
          ['schedule','var(--warning)','var(--warning-bg)','Por vencer',data.filter(d=>d.estado_vence==='proximo').length],
          ['error','var(--danger)','var(--danger-bg)','Vencidos',data.filter(d=>d.estado_vence==='vencido').length],
        ].map(([icon,color,bg,label,val]) => (
          <div key={label} className="kpi-card" style={{ padding:16 }}>
            <div className="kpi-top">
              <div className="kpi-icon" style={{ background:bg }}>
                <span className="ms" style={{ color, fontSize:20 }}>{icon}</span>
              </div>
            </div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value" style={{ color }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-box" style={{ flex:1, maxWidth:280 }}>
            <span className="ms">search</span>
            <input className="input" placeholder="Buscar documento..."
              value={buscar} onChange={e => setBuscar(e.target.value)} />
          </div>
          <select className="select" value={cat} onChange={e => setCat(e.target.value)}>
            {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="select" value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="vigente">Vigente</option>
            <option value="proximo">Por vencer</option>
            <option value="vencido">Vencido</option>
          </select>
          <span className="spacer" />
          <span className="text-caption c-secondary">{docs.length} documentos</span>
        </div>

        {loading ? (
          <div style={{ padding:40, textAlign:'center' }}><span className="ms animate-spin">refresh</span></div>
        ) : docs.length === 0 ? (
          <EmptyState icon="folder_open" title="Sin documentos" description="Carga el primer documento con el botón superior." />
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Documento</th><th>Contrato</th><th>Categoría</th>
                  <th>Expedición</th><th>Vencimiento</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span className="ms ms-sm" style={{ color:'var(--danger)', flexShrink:0 }}>picture_as_pdf</span>
                        <div>
                          <div style={{ color:'var(--primary)', fontWeight:500 }}>{d.nombre}</div>
                          {d.version > 1 && <div style={{ fontSize:10, color:'var(--outline)' }}>v{d.version}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="td-secondary">{d.numero_contrato || '—'}</td>
                    <td><span className="tag tag-gray" style={{ borderRadius:4 }}>{CATS.find(c=>c.value===d.categoria)?.label || d.categoria}</span></td>
                    <td className="td-secondary">{d.fecha_expedicion ? new Date(d.fecha_expedicion).toLocaleDateString('es-CO') : '—'}</td>
                    <td style={{ color: d.estado_vence==='vencido'?'var(--danger)': d.estado_vence==='proximo'?'var(--warning)':'inherit', fontWeight: d.estado_vence!=='vigente'?600:400 }}>
                      {d.fecha_vencimiento ? new Date(d.fecha_vencimiento).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td><StatusTag value={d.estado_vence} /></td>
                    <td><span className="ms ms-sm" style={{ color:'var(--info)', cursor:'pointer' }}>visibility</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {upload && <ModalUpload onClose={() => setUpload(false)} onUploaded={() => { setUpload(false); load(); }} />}
    </>
  );
}

function ModalUpload({ onClose, onUploaded }) {
  const [form, setForm] = useState({ categoria:'acta_inicio', fecha_vencimiento:'', contrato_id:'' });
  const [file, setFile]     = useState(null);
  const [drag, setDrag]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDrop = e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if(f) setFile(f); };

  const submit = async () => {
    if (!file) return toast.error('Selecciona un archivo');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('archivo', file); fd.append('nombre', file.name); fd.append('categoria', form.categoria);
      if (form.contrato_id)       fd.append('contrato_id', form.contrato_id);
      if (form.fecha_vencimiento) fd.append('fecha_vencimiento', form.fecha_vencimiento);
      await api.post('/documentos/upload', fd);
      toast.success('Documento cargado correctamente');
      onUploaded();
    } catch(e) { toast.error(e.response?.data?.error || 'Error al cargar'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>Cargar Documento</h3><button className="btn-icon" onClick={onClose}><span className="ms ms-sm">close</span></button></div>
        <div className="modal-body">
          <div className="field"><label>Categoría *</label>
            <select className="select" style={{ width:'100%' }} value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
              {CATS.filter(c=>c.value).map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
            </select></div>
          <div className="field"><label>N° Contrato (opcional)</label>
            <input className="input" placeholder="Ej: PSS-2025-041" value={form.contrato_id} onChange={e=>setForm(f=>({...f,contrato_id:e.target.value}))} /></div>
          <div className="field"><label>Fecha de vencimiento</label>
            <input className="input" type="date" value={form.fecha_vencimiento} onChange={e=>setForm(f=>({...f,fecha_vencimiento:e.target.value}))} /></div>
          <div className={'dropzone ' + (drag||file?'active':'')}
            onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={handleDrop}
            onClick={()=>document.getElementById('doc-inp').click()}>
            <input id="doc-inp" type="file" accept=".pdf,.jpg,.png" style={{ display:'none' }} onChange={e=>setFile(e.target.files[0])} />
            <span className="ms ms-lg" style={{ color:'var(--outline)', display:'block', marginBottom:8 }}>upload_file</span>
            {file
              ? <><div style={{ fontWeight:500, color:'var(--primary)' }}>{file.name}</div><div style={{ fontSize:11, color:'var(--secondary-text)', marginTop:4 }}>{(file.size/1024/1024).toFixed(2)} MB</div></>
              : <><div style={{ fontWeight:500 }}>Arrastra el archivo aquí</div><div style={{ fontSize:12, color:'var(--secondary-text)', marginTop:4 }}>PDF, JPG, PNG · Máx. 10 MB</div></>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? <span className="ms animate-spin" style={{fontSize:18}}>refresh</span> : <><span className="ms ms-sm">upload</span>Cargar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
