import { useState, useEffect } from 'react';
import api from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function Supervisores() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/supervisores').then(r => setData(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="page-header">
        <div><h2>Supervisores</h2><p>Funcionarios asignados a la vigilancia de contratos.</p></div>
        <div className="hdr-actions">
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <span className="ms ms-sm">person_add</span>Nuevo Supervisor
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding:40, textAlign:'center' }}><span className="ms animate-spin">refresh</span></div>
        ) : data.length === 0 ? (
          <EmptyState icon="manage_accounts" title="Sin supervisores" description="Registra el primer supervisor con el botón superior." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Supervisor</th><th>Cargo</th><th>Dependencia</th>
                <th>Contratos activos</th><th>Por vencer</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--primary-container)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, flexShrink:0 }}>
                        {s.nombre?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:500, color:'var(--primary)' }}>{s.nombre}</div>
                        <div style={{ fontSize:11, color:'var(--secondary-text)' }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td-secondary">{s.cargo}</td>
                  <td className="td-secondary">{s.dependencia}</td>
                  <td style={{ fontWeight:600, color:'var(--success)' }}>{s.contratos_activos || 0}</td>
                  <td style={{ fontWeight:600, color: (s.por_vencer||0)>0 ? 'var(--warning)' : 'var(--secondary-text)' }}>
                    {s.por_vencer || 0}
                  </td>
                  <td>
                    <span className={'tag ' + (s.activo ? 'tag-ok' : 'tag-gray')}>
                      <span className="tag-dot" style={{ background: s.activo ? 'var(--success)' : 'var(--outline)' }} />
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ModalNuevoSupervisor onClose={() => setModal(false)} onCreated={load} />}
    </>
  );
}

function ModalNuevoSupervisor({ onClose, onCreated }) {
  const [form, setForm]     = useState({ nombre:'', email:'', cargo:'', dependencia:'', telefono:'' });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f => ({...f, [k]:v}));

  const submit = async () => {
    if (!form.nombre || !form.email) return toast.error('Nombre y correo requeridos');
    setLoading(true);
    try {
      await api.post('/supervisores', form);
      toast.success('Supervisor registrado. Contraseña temporal: Supervisor2025*');
      onCreated(); onClose();
    } catch(e) { toast.error(e.response?.data?.error || 'Error al guardar'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>Nuevo Supervisor</h3><button className="btn-icon" onClick={onClose}><span className="ms ms-sm">close</span></button></div>
        <div className="modal-body">
          <div className="grid-2">
            <div className="field"><label>Nombre completo *</label><input className="input" value={form.nombre} onChange={e=>set('nombre',e.target.value)} /></div>
            <div className="field"><label>Correo institucional *</label><input className="input" type="email" value={form.email} onChange={e=>set('email',e.target.value)} /></div>
            <div className="field"><label>Cargo</label><input className="input" value={form.cargo} onChange={e=>set('cargo',e.target.value)} /></div>
            <div className="field"><label>Dependencia</label><input className="input" value={form.dependencia} onChange={e=>set('dependencia',e.target.value)} /></div>
            <div className="field"><label>Teléfono</label><input className="input" value={form.telefono} onChange={e=>set('telefono',e.target.value)} /></div>
          </div>
          <div style={{ background:'var(--surface-low)', border:'1px solid var(--border)', borderRadius:4, padding:'10px 12px', fontSize:12, color:'var(--secondary-text)' }}>
            Se creará un usuario en el sistema con rol <strong>Supervisor</strong>. Contraseña temporal: <code>Supervisor2025*</code>
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
