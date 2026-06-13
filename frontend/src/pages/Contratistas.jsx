import { useState, useEffect, useCallback } from 'react';
import { Eye, Edit, Trash2, Filter, Download, Plus, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Contratistas() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [modal,   setModal]   = useState(false);
  const [page,    setPage]    = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit:15 });
    if (filter === 'verified') p.set('estado', 'activo');
    api.get('/contratistas?' + p)
      .then(r => { setData(r.data.data||[]); setTotal(r.data.total||0); })
      .finally(() => setLoading(false));
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const verified = data.filter(c => c.estado === 'activo').length;
  const pending  = data.filter(c => c.estado !== 'activo').length;

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1>Contratistas</h1><p>Registro y verificación de contratistas</p></div>
        <div className="hdr-actions">
          {[['all','Todos',total],['verified','Verificados',verified],['pending','Pendientes',pending]].map(([k,l,n])=>(
            <button key={k} className="btn btn-secondary btn-sm"
              style={filter===k?{background:'#dbeafe',color:'#1d4ed8',borderColor:'#bfdbfe'}:{}}
              onClick={()=>{setFilter(k);setPage(1);}}>
              {l} ({n})
            </button>
          ))}
          <button className="btn btn-secondary btn-sm"><Filter size={12}/> Filtros</button>
          <button className="btn btn-secondary btn-sm"><Download size={12}/> Exportar</button>
          <button className="btn btn-primary" onClick={()=>setModal(true)}><Plus size={13}/> Nuevo Contratista</button>
        </div>
      </div>

      <div className="card" style={{ flex:1, minHeight:0, overflow:'auto' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Cargando...</div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Nombre / Razón Social</th><th>Tipo</th><th>Documento</th><th>Email</th><th>Contratos</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {data.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:12, fontWeight:500 }}>{c.nombres} {c.apellidos||''}{c.razon_social?` (${c.razon_social})`:''}</span>
                      {c.estado === 'activo' && <CheckCircle size={12} color="#16a34a"/>}
                    </div>
                  </td>
                  <td className="td-muted">{c.tipo_persona === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}</td>
                  <td className="td-muted">{c.cedula ? `CC ${c.cedula}` : c.nit ? `NIT ${c.nit}` : '—'}</td>
                  <td className="td-muted">{c.email || '—'}</td>
                  <td>
                    <span style={{ width:24, height:24, borderRadius:'50%', background:'#dbeafe', color:'#1d4ed8', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600 }}>
                      {c.contratos_activos || 0}
                    </span>
                  </td>
                  <td>
                    <span className={c.estado==='activo'?'badge badge-green':'badge badge-orange'}>
                      {c.estado==='activo' ? 'Activo' : 'Pendiente'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:2 }}>
                      <button className="btn-icon"><Eye size={13}/></button>
                      <button className="btn-icon"><Edit size={13}/></button>
                      <button className="btn-icon" style={{ color:'#fca5a5' }}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length===0 && <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Sin contratistas registrados.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ModalContratista onClose={()=>setModal(false)} onCreated={load}/>}
    </div>
  );
}

function ModalContratista({ onClose, onCreated }) {
  const [form, setForm] = useState({ nombres:'', apellidos:'', cedula:'', nit:'', tipo_persona:'natural', email:'', telefono:'', municipio:'', departamento:'' });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async () => {
    if (!form.nombres) return toast.error('Nombre requerido');
    setLoading(true);
    try {
      await api.post('/contratistas', form);
      toast.success('Contratista registrado');
      onCreated(); onClose();
    } catch(e) { toast.error(e.response?.data?.error || 'Error al guardar'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:560 }}>
        <div className="modal-header"><h3>Nuevo Contratista</h3><button className="btn-icon" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="grid-2">
            <div className="field"><label>Tipo *</label>
              <select className="select-field" value={form.tipo_persona} onChange={e=>set('tipo_persona',e.target.value)}>
                <option value="natural">Persona Natural</option>
                <option value="juridica">Persona Jurídica</option>
              </select>
            </div>
            <div className="field"><label>Nombres *</label><input className="input-field" value={form.nombres} onChange={e=>set('nombres',e.target.value)}/></div>
            {form.tipo_persona==='natural'
              ? <div className="field"><label>Apellidos</label><input className="input-field" value={form.apellidos} onChange={e=>set('apellidos',e.target.value)}/></div>
              : <div className="field"><label>NIT</label><input className="input-field" value={form.nit} onChange={e=>set('nit',e.target.value)}/></div>}
            <div className="field"><label>Cédula</label><input className="input-field" value={form.cedula} onChange={e=>set('cedula',e.target.value)}/></div>
            <div className="field"><label>Email</label><input className="input-field" type="email" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
            <div className="field"><label>Teléfono</label><input className="input-field" value={form.telefono} onChange={e=>set('telefono',e.target.value)}/></div>
            <div className="field"><label>Municipio</label><input className="input-field" value={form.municipio} onChange={e=>set('municipio',e.target.value)}/></div>
            <div className="field"><label>Departamento</label><input className="input-field" value={form.departamento} onChange={e=>set('departamento',e.target.value)}/></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading?'Guardando...':'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}
