import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Eye, Upload, Filter, Search } from 'lucide-react';
import { documentos as docsDB } from '../lib/db';
import toast from 'react-hot-toast';

const TIPOS = ['Todos','Contrato','Documento Legal','Póliza','Acta','Informe'];

export default function Documentos() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');
  const [buscar,  setBuscar]  = useState('');
  const [upload,  setUpload]  = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    docsDB.listar({ categoria: filter||undefined }).then(r=>setData(r||[])).finally(()=>setLoading(false));
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const filtered = buscar ? data.filter(d=>d.nombre?.toLowerCase().includes(buscar.toLowerCase())) : data;

  const statusStyle = (s) => {
    if (s==='vigente')  return 'badge badge-green';
    if (s==='proximo')  return 'badge badge-orange';
    if (s==='vencido')  return 'badge badge-red';
    return 'badge badge-blue';
  };
  const statusLabel = (s) => ({ vigente:'Aprobado', proximo:'Por Vencer', vencido:'Vencido' }[s] || s);

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
          <button className="btn btn-secondary btn-sm"><Filter size={12}/> Filtros</button>
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
                  <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Sin documentos.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
