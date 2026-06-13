import { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, Filter, Mail, Phone } from 'lucide-react';
import { supervisores as supDB } from '../lib/db';
import toast from 'react-hot-toast';

export default function Supervisores() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = () => {
    setLoading(true);
    supDB.listar().then(r => setData(r||[])).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const total = data.length;
  const totalContratos = data.reduce((s,d) => s + (d.contratos_activos?.length||parseInt(d.contratos_activos||0)||0), 0);

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1>Supervisores</h1><p>Gestión de supervisores de contratos</p></div>
        <div className="hdr-actions">
          <button className="btn btn-secondary btn-sm"><Filter size={12}/> Filtros</button>
          <button className="btn btn-primary" onClick={()=>setModal(true)}><Plus size={13}/> Nuevo Supervisor</button>
        </div>
      </div>

      <div className="grid-4" style={{ flexShrink:0 }}>
        {[
          { label:'Supervisores Activos', val:total },
          { label:'Contratos Asignados',  val:totalContratos },
          { label:'En Ejecución',         val:totalContratos },
          { label:'Carga Promedio',       val: total ? (totalContratos/total).toFixed(1) : 0 },
        ].map(({ label, val }) => (
          <div key={label} className="card" style={{ padding:'12px 16px' }}>
            <div style={{ fontSize:10, fontWeight:600, color:'#64748b', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:24, fontWeight:600, color:'#1d4ed8' }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ flex:1, minHeight:0, overflow:'auto' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Cargando...</div>
        ) : data.length === 0 ? (
          <div style={{ padding:48, textAlign:'center', color:'#94a3b8', fontSize:13 }}>
            Sin supervisores registrados.
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Nombre</th><th>Especialidad</th><th>Contacto</th><th>Contratos Asignados</th><th>Activos</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {data.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'#1d4ed8', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, flexShrink:0 }}>
                        {(s.usuario?.nombre||s.nombre||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:500 }}>{s.usuario?.nombre || s.nombre || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td-muted">{s.cargo || '—'}</td>
                  <td>
                    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#64748b' }}>
                        <Mail size={11}/>{s.usuario?.email || '—'}
                      </div>
                      {s.telefono && <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#64748b' }}>
                        <Phone size={11}/>{s.telefono}
                      </div>}
                    </div>
                  </td>
                  <td>
                    <span style={{ width:24, height:24, borderRadius:'50%', background:'#dbeafe', color:'#1d4ed8', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600 }}>
                      {s.contratos_activos?.length||0}
                    </span>
                  </td>
                  <td>
                    <span style={{ width:24, height:24, borderRadius:'50%', background:'#dcfce7', color:'#16a34a', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600 }}>
                      {s.contratos_activos?.length||0}
                    </span>
                  </td>
                  <td><span className="badge badge-green">{s.activo ? 'Activo':'Inactivo'}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:2 }}>
                      <button className="btn-icon" title="Ver contratos" onClick={()=>window.location='/contratos?supervisor='+s.id}><Eye size={13}/></button>
                      <button className="btn-icon" title="Editar"><Edit size={13}/></button>
                      <button className="btn-icon" title="Desactivar" style={{ color:'#DC2626' }}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
