import { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, Filter, Mail, Shield, CheckCircle } from 'lucide-react';
import { usuarios as usuariosDB } from '../lib/db';
import toast from 'react-hot-toast';

const roleBadge = (r) => {
  const m = { admin:'badge-purple', supervisor:'badge-blue', auditor:'badge-gray', contratista:'badge-gray' };
  const l = { admin:'Administrador', supervisor:'Supervisor', auditor:'Auditor', contratista:'Contratista' };
  return <span className={`badge ${m[r]||'badge-gray'}`}>{l[r]||r}</span>;
};

export default function Usuarios() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = () => {
    setLoading(true);
    usuariosDB.listar().then(r => setData(r||[])).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const kpis = [
    { label:'Usuarios Totales',  val:data.length,                               bg:'#dbeafe', ic:'#3b82f6', sub:'Registrados' },
    { label:'Usuarios Activos',  val:data.filter(u=>u.activo).length,           bg:'#dcfce7', ic:'#16a34a', sub:'Con acceso' },
    { label:'Administradores',   val:data.filter(u=>u.rol==='admin').length,     bg:'#f3e8ff', ic:'#7c3aed', sub:'Permisos completos' },
    { label:'Supervisores',      val:data.filter(u=>u.rol==='supervisor').length,bg:'#fff7ed', ic:'#c2410c', sub:'Usuarios operativos' },
  ];

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1>Usuarios</h1><p>Gestión de usuarios y permisos del sistema</p></div>
        <div className="hdr-actions">
          <button className="btn btn-secondary btn-sm"><Filter size={12}/> Filtros</button>
          <button className="btn btn-primary" onClick={()=>setModal(true)}><Plus size={13}/> Nuevo Usuario</button>
        </div>
      </div>

      <div className="grid-4" style={{ flexShrink:0 }}>
        {kpis.map(({ label, val, sub, bg, ic }) => (
          <div key={label} className="card" style={{ padding:'12px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{ padding:6, borderRadius:6, background:bg }}><Shield size={14} style={{ color:ic }}/></div>
              <span style={{ fontSize:10, fontWeight:600, color:'#64748b', letterSpacing:'.06em', textTransform:'uppercase' }}>{label}</span>
            </div>
            <div style={{ fontSize:22, fontWeight:600, color:'#1e293b' }}>{val}</div>
            <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ flex:1, minHeight:0, overflow:'auto' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Cargando...</div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Último Acceso</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {data.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, flexShrink:0 }}>
                        {u.nombre?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:500 }}>{u.nombre}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'#94a3b8' }}>
                          <Mail size={9}/>{u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{roleBadge(u.rol)}</td>
                  <td className="td-muted" style={{ fontSize:11 }}>{u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-CO') : 'Nunca'}</td>
                  <td><span className={`badge ${u.activo ? 'badge-green':'badge-gray'}`}>{u.activo ? 'Activo':'Inactivo'}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:2 }}>
                      <button className="btn-icon"><Eye size={13}/></button>
                      <button className="btn-icon"><Edit size={13}/></button>
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
