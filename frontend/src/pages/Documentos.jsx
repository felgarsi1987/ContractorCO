import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Eye, Upload, Search, X } from 'lucide-react';
import { documentos as docsDB, contratos as contratosDB } from '../lib/db';
import toast from 'react-hot-toast';

const TIPOS = ['Todos','Contrato','Documento Legal','Póliza','Acta','Informe'];
const CATS  = ['Contrato','Documento Legal','Póliza','Acta','Informe','Otro'];

const EMPTY_FORM = { nombre:'', categoria:'Contrato', contrato_id:'', fecha_vencimiento:'', file:null };

export default function Documentos() {
  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('');
  const [buscar,    setBuscar]    = useState('');
  const [upload,    setUpload]    = useState(false);
  const [contratos, setContratos] = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);

  const load = useCallback(() => {
    setLoading(true);
    docsDB.listar({ categoria: filter||undefined }).then(r=>setData(r||[])).finally(()=>setLoading(false));
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (upload && contratos.length === 0) {
      contratosDB.listar({ limit:200 }).then(r => setContratos(r.data||[]));
    }
  }, [upload]);

  const filtered = buscar ? data.filter(d=>d.nombre?.toLowerCase().includes(buscar.toLowerCase())) : data;

  const statusStyle = (s) => {
    if (s==='vigente')  return 'badge badge-green';
    if (s==='proximo')  return 'badge badge-orange';
    if (s==='vencido')  return 'badge badge-red';
    return 'badge badge-blue';
  };
  const statusLabel = (s) => ({ vigente:'Aprobado', proximo:'Por Vencer', vencido:'Vencido' }[s] || s);

  const handleSubir = async (e) => {
    e.preventDefault();
    if (!form.file)           return toast.error('Selecciona un archivo');
    if (!form.nombre.trim())  return toast.error('Nombre del documento requerido');
    setSaving(true);
    try {
      await docsDB.subir(form.file, {
        contrato_id:      form.contrato_id      || null,
        nombre:           form.nombre.trim(),
        categoria:        form.categoria,
        fecha_vencimiento: form.fecha_vencimiento || null,
      });
      toast.success('Documento subido correctamente');
      setUpload(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      toast.error(e.message || 'Error al subir documento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1>Documentos</h1><p>Gestión de documentos contractuales y legales</p></div>
        <div className="hdr-actions">
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {TIPOS.map(t => (
              <button key={t} className="btn btn-secondary btn-sm"
                style={filter===(t==='Todos'?'':t)?{background:'#D1FAE5',color:'#059669',borderColor:'#A7F3D0'}:{}}
                onClick={()=>setFilter(t==='Todos'?'':t)}>
                {t}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={()=>setUpload(true)}><Upload size={13}/> Subir Documento</button>
        </div>
      </div>

      <div className="card" style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'8px 16px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
          <div className="search-wrap">
            <Search size={14}/>
            <input className="search-input" placeholder="Buscar documentos por nombre, contrato o tipo..."
              value={buscar} onChange={e=>setBuscar(e.target.value)}/>
          </div>
        </div>
        <div style={{ flex:1, overflow:'auto' }}>
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Cargando...</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Nombre del Documento</th><th>Tipo</th><th>Contrato</th><th>Fecha de Carga</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ padding:5, borderRadius:6, background:'#D1FAE5' }}>
                          <FileText size={13} color="#059669"/>
                        </div>
                        <span style={{ fontSize:12, fontWeight:500 }}>{d.nombre}</span>
                      </div>
                    </td>
                    <td className="td-muted">{d.categoria?.replace(/_/g,' ') || '—'}</td>
                    <td style={{ fontWeight:500, fontSize:12 }}>{d.contratos?.numero_contrato || '—'}</td>
                    <td className="td-muted">{new Date(d.subido_en).toLocaleDateString('es-CO')}</td>
                    <td><span className={statusStyle(d.estado_vence)}>{statusLabel(d.estado_vence)}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:2 }}>
                        <a href={d.url_archivo} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>
                          <button className="btn-icon" title="Ver documento"><Eye size={13}/></button>
                        </a>
                        <a href={d.url_archivo} download={d.nombre_archivo||d.nombre} style={{textDecoration:'none'}}>
                          <button className="btn-icon" title="Descargar"><Download size={13}/></button>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length===0 && (
                  <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>
                    <FileText size={28} style={{ margin:'0 auto 10px', display:'block', opacity:.3 }}/>
                    Sin documentos.{' '}
                    <button className="btn-ghost" onClick={()=>setUpload(true)}>Subir el primero →</button>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal — subir documento */}
      {upload && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setUpload(false)}>
          <div className="modal" style={{ maxWidth:500 }}>
            <div className="modal-hdr">
              <h2>Subir Documento</h2>
              <button className="btn-icon" onClick={()=>setUpload(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleSubir} style={{ display:'flex', flexDirection:'column', gap:14, padding:'0 24px 24px' }}>
              <div className="field">
                <label>Nombre del documento *</label>
                <input className="input-field" value={form.nombre}
                  onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}
                  placeholder="Ej: Póliza de cumplimiento 2025"/>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label>Tipo / Categoría *</label>
                  <select className="select-field" value={form.categoria}
                    onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Fecha de vencimiento</label>
                  <input type="date" className="input-field" value={form.fecha_vencimiento}
                    onChange={e=>setForm(f=>({...f,fecha_vencimiento:e.target.value}))}/>
                </div>
              </div>

              <div className="field">
                <label>Contrato (opcional)</label>
                <select className="select-field" value={form.contrato_id}
                  onChange={e=>setForm(f=>({...f,contrato_id:e.target.value}))}>
                  <option value="">Sin contrato asociado</option>
                  {contratos.map(c => <option key={c.id} value={c.id}>{c.numero_contrato}</option>)}
                </select>
              </div>

              <div className="field">
                <label>Archivo * <span style={{ color:'#94a3b8', fontWeight:400 }}>(PDF, Word, Excel, imagen)</span></label>
                <input type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={e=>setForm(f=>({...f,file:e.target.files[0]||null}))}
                  style={{ fontSize:12, color:'#475569' }}/>
                {form.file && (
                  <div style={{ fontSize:11, color:'#059669', marginTop:4, fontWeight:500 }}>
                    {form.file.name} · {(form.file.size/1024).toFixed(1)} KB
                  </div>
                )}
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:4 }}>
                <button type="button" className="btn btn-secondary" onClick={()=>setUpload(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Subiendo...' : <><Upload size={12}/> Subir</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
