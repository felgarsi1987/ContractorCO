import { useState, useEffect } from 'react';
import { Plus, Edit, Filter, Mail, Shield, X } from 'lucide-react';
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
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre:'', email:'', rol:'supervisor', activo:true });

  const ROL_OPTS = ['admin','supervisor','auditor','contratista'];
  const lbl = { fontSize:11, fontWeight:600, color:'#374151', display:'block', marginBottom:3 };
  const inp = { width:'100%', padding:'7px 10px', borderRadius:6, border:'1px solid #D1D5DB', fontSize:12 };

  const load = () => {
    setLoading(true);
    usuariosDB.listar().then(r => setData(r||[])).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openEdit = (u) => {
    setEditing(u);
    setForm({ nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo });
    setModal(true);
  };
  const openNew = () => {
    setEditing(null);
    setForm({ nombre:'', email:'', rol:'supervisor', activo:true });
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditing(null); };

  const guardar = async () => {
    try {
      if (editing) {
        await usuariosDB.actualizar(editing.id, { nombre: form.nombre, rol: form.rol, activo: form.activo });
        toast.success('Usuario actualizado');
      } else {
        toast('Para crear usuarios nuevos usa Supabase Auth directamente.', { icon: 'ℹ️' });
      }
      closeModal();
      load();
    } catch (e) { toast.error(e.message); }
  };

  const kpis = [
    { label:'Usuarios Totales',  val:data.length,                               bg:'#dbeafe', ic:'#3b82f6', sub:'Registrados' },
    { label:'Usuarios Activos',  val:data.filter(u=>u.activo).length,           bg:'#dcfce7', ic:'#16a34a', sub:'Con acceso' },
    { label:'Administradores',   val:data.filter(u=>u.rol==='admin').length,     bg:'#f3e8ff', ic:'#7c3aed', sub:'Permisos completos' },
    { label:'Supervisores',      val:data.filter(u=>u.rol==='supervisor').length,bg:'#FEE2E2', ic:'#DC2626', sub:'Usuarios operativos' },
  ];

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1>Usuarios</h1><p>Gestión de usuarios y permisos del sistema</p></div>
        <div className="hdr-actions">
          <button className="btn btn-secondary btn-sm"><Filter size={12}/> Filtros</button>
          <button className="btn btn-primary" onClick={openNew}><Plus size={13}/> Nuevo Usuario</button>
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
                      <button className="btn-icon" title="Editar" onClick={()=>openEdit(u)}><Edit size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:24, width:380, boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <h3 style={{ fontSize:14, fontWeight:700, margin:0 }}>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={closeModal} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={16}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={lbl}>Nombre</label>
                <input style={inp} value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/>
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input style={{...inp, background: editing ? '#f3f4f6':undefined}} disabled={!!editing} value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
                {editing && <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>El email no se puede cambiar</div>}
              </div>
              <div>
                <label style={lbl}>Rol</label>
                <select style={inp} value={form.rol} onChange={e=>setForm(f=>({...f,rol:e.target.value}))}>
                  {ROL_OPTS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="checkbox" id="activo_chk" checked={form.activo} onChange={e=>setForm(f=>({...f,activo:e.target.checked}))}/>
                <label htmlFor="activo_chk" style={{ fontSize:12, cursor:'pointer' }}>Usuario activo</label>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
              <button className="btn btn-secondary btn-sm" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
