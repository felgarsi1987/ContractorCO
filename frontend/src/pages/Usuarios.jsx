import { useState, useEffect } from 'react';
import api from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

const ROL_TAG = { admin:'tag-danger', supervisor:'tag-info', auditor:'tag-gray', contratista:'tag-gray' };
const ROL_LABEL = { admin:'Administrador', supervisor:'Supervisor', auditor:'Auditor', contratista:'Contratista' };

export default function Usuarios() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/usuarios').then(r => setData(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="page-header">
        <div><h2>Usuarios y Permisos</h2><p>Control de acceso y roles del sistema.</p></div>
        <div className="hdr-actions">
          <button className="btn btn-primary" onClick={() => { setEditing(null); setModal(true); }}>
            <span className="ms ms-sm">person_add</span>Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Resumen de roles */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {['admin','supervisor','auditor','contratista'].map(rol => {
          const count = data.filter(u => u.rol === rol).length;
          return (
            <div key={rol} className="kpi-card" style={{ padding:14 }}>
              <div className="kpi-label">{ROL_LABEL[rol]}s</div>
              <div className="kpi-value" style={{ fontSize:22 }}>{count}</div>
            </div>
          );
        })}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding:40, textAlign:'center' }}><span className="ms animate-spin">refresh</span></div>
        ) : data.length === 0 ? (
          <EmptyState icon="group" title="Sin usuarios" description="Crea el primer usuario con el botón superior." />
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Último acceso</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {data.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--primary-container)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, flexShrink:0 }}>
                        {u.nombre?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                      </div>
                      <span style={{ fontWeight:500, color:'var(--primary)' }}>{u.nombre}</span>
                    </div>
                  </td>
                  <td className="td-secondary">{u.email}</td>
                  <td><span className={'tag ' + (ROL_TAG[u.rol]||'tag-gray')} style={{ borderRadius:4 }}>{ROL_LABEL[u.rol]||u.rol}</span></td>
                  <td className="td-secondary">
                    {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-CO') : 'Nunca'}
                  </td>
                  <td>
                    <span className={'tag ' + (u.activo ? 'tag-ok' : 'tag-gray')}>
                      <span className="tag-dot" style={{ background: u.activo ? 'var(--success)' : 'var(--outline)' }} />
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon" onClick={() => { setEditing(u); setModal(true); }}>
                      <span className="ms ms-sm">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ModalUsuario usuario={editing} onClose={() => setModal(false)} onSaved={load} />}
    </>
  );
}

function ModalUsuario({ usuario, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:   usuario?.nombre   || '',
    email:    usuario?.email    || '',
    rol:      usuario?.rol      || 'supervisor',
    password: '',
    activo:   usuario?.activo   ?? true,
  });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const submit = async () => {
    if (!form.nombre || !form.email) return toast.error('Nombre y correo requeridos');
    setLoading(true);
    try {
      if (usuario) {
        await api.put('/usuarios/' + usuario.id, { nombre:form.nombre, rol:form.rol, activo:form.activo });
        toast.success('Usuario actualizado');
      } else {
        await api.post('/usuarios', form);
        toast.success('Usuario creado. Contraseña temporal: ' + (form.password || 'Temporal2025*'));
      }
      onSaved(); onClose();
    } catch(e) { toast.error(e.response?.data?.error || 'Error al guardar'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{usuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          <button className="btn-icon" onClick={onClose}><span className="ms ms-sm">close</span></button>
        </div>
        <div className="modal-body">
          <div className="grid-2">
            <div className="field"><label>Nombre completo *</label><input className="input" value={form.nombre} onChange={e=>set('nombre',e.target.value)} /></div>
            <div className="field"><label>Correo *</label><input className="input" type="email" value={form.email} disabled={!!usuario} onChange={e=>set('email',e.target.value)} /></div>
            <div className="field">
              <label>Rol *</label>
              <select className="select" style={{ width:'100%' }} value={form.rol} onChange={e=>set('rol',e.target.value)}>
                {Object.entries(ROL_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {!usuario && <div className="field"><label>Contraseña temporal</label><input className="input" type="password" placeholder="Temporal2025*" value={form.password} onChange={e=>set('password',e.target.value)} /></div>}
            {usuario && (
              <div className="field" style={{ flexDirection:'row', alignItems:'center', gap:10, paddingTop:20 }}>
                <input type="checkbox" id="activo-chk" checked={form.activo} onChange={e=>set('activo',e.target.checked)} />
                <label htmlFor="activo-chk" style={{ textTransform:'none', letterSpacing:0, fontSize:13, fontWeight:400 }}>Usuario activo</label>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? <span className="ms animate-spin" style={{fontSize:18}}>refresh</span> : <><span className="ms ms-sm">save</span>Guardar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
