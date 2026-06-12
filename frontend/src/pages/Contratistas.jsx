import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatusTag from '../components/ui/StatusTag';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function Contratistas() {
  const navigate = useNavigate();
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [buscar,  setBuscar]  = useState('');
  const [estado,  setEstado]  = useState('');
  const [page,    setPage]    = useState(1);
  const [modal,   setModal]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit:15 });
    if (buscar) p.set('buscar', buscar);
    if (estado) p.set('estado', estado);
    api.get('/contratistas?' + p)
      .then(r => { setData(r.data.data || []); setTotal(r.data.total || 0); })
      .finally(() => setLoading(false));
  }, [page, buscar, estado]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="page-header">
        <div><h2>Contratistas</h2><p>Registro y gestión de personas naturales y jurídicas.</p></div>
        <div className="hdr-actions">
          <button className="btn btn-secondary"><span className="ms ms-sm">download</span>Exportar</button>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <span className="ms ms-sm">person_add</span>Nuevo Contratista
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-box" style={{ flex:1, maxWidth:300 }}>
            <span className="ms">search</span>
            <input className="input" placeholder="Nombre, cédula, NIT..."
              defaultValue={buscar}
              onKeyDown={e => { if(e.key==='Enter') { setBuscar(e.target.value); setPage(1); } }} />
          </div>
          <select className="select" value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="suspendido">Suspendido</option>
            <option value="inhabilitado">Inhabilitado</option>
          </select>
          <span className="spacer" />
          <span className="text-caption c-secondary">{total} registros</span>
        </div>

        {loading ? (
          <div style={{ padding:40, textAlign:'center' }}><span className="ms animate-spin">refresh</span></div>
        ) : data.length === 0 ? (
          <EmptyState icon="engineering" title="Sin contratistas" description="Registra el primer contratista con el botón superior." />
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Nombre / Razón Social</th><th>Identificación</th><th>Tipo</th><th>Municipio</th><th>Contratos</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {data.map(c => (
                  <tr key={c.id} onClick={() => navigate('/contratos?contratista=' + c.id)}>
                    <td>
                      <div style={{ fontWeight:500, color:'var(--primary)' }}>
                        {c.nombres} {c.apellidos || ''}{c.razon_social ? ` (${c.razon_social})` : ''}
                      </div>
                      {c.email && <div style={{ fontSize:11, color:'var(--secondary-text)' }}>{c.email}</div>}
                    </td>
                    <td className="td-secondary">{c.cedula || c.nit || '—'}</td>
                    <td><span className={'tag ' + (c.tipo_persona==='natural'?'tag-info':'tag-gray')}>{c.tipo_persona}</span></td>
                    <td className="td-secondary">{c.municipio || '—'}</td>
                    <td><span style={{ fontWeight:600, color:c.contratos_activos>0?'var(--success)':'var(--secondary-text)' }}>{c.contratos_activos||0} activos</span></td>
                    <td><StatusTag value={c.estado} /></td>
                    <td><span className="ms ms-sm" style={{ color:'var(--secondary-text)' }}>chevron_right</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 15 && (
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span className="text-caption c-secondary">
              Mostrando {Math.min((page-1)*15+1,total)}–{Math.min(page*15,total)} de {total}
            </span>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}><span className="ms ms-sm">chevron_left</span></button>
              <button className="btn btn-secondary btn-sm" disabled={page*15>=total} onClick={()=>setPage(p=>p+1)}><span className="ms ms-sm">chevron_right</span></button>
            </div>
          </div>
        )}
      </div>

      {modal && <ModalNuevoContratista onClose={() => setModal(false)} onCreated={load} />}
    </>
  );
}

function ModalNuevoContratista({ onClose, onCreated }) {
  const [form, setForm] = useState({
    nombres:'', apellidos:'', cedula:'', nit:'', tipo_persona:'natural',
    razon_social:'', telefono:'', email:'', municipio:'', departamento:'',
    banco:'', numero_cuenta:''
  });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const submit = async () => {
    if (!form.nombres) return toast.error('Nombre requerido');
    setLoading(true);
    try {
      await api.post('/contratistas', form);
      toast.success('Contratista registrado correctamente');
      onCreated(); onClose();
    } catch(e) { toast.error(e.response?.data?.error || 'Error al guardar'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:620 }}>
        <div className="modal-header">
          <h3>Nuevo Contratista</h3>
          <button className="btn-icon" onClick={onClose}><span className="ms ms-sm">close</span></button>
        </div>
        <div className="modal-body" style={{ maxHeight:'60vh', overflowY:'auto' }}>
          <div className="grid-2">
            <div className="field"><label>Tipo de persona *</label>
              <select className="select" style={{ width:'100%' }} value={form.tipo_persona} onChange={e=>set('tipo_persona',e.target.value)}>
                <option value="natural">Natural</option>
                <option value="juridica">Jurídica</option>
              </select>
            </div>
            {form.tipo_persona === 'juridica'
              ? <div className="field"><label>Razón Social *</label><input className="input" value={form.razon_social} onChange={e=>set('razon_social',e.target.value)} /></div>
              : <div className="field"><label>Apellidos</label><input className="input" value={form.apellidos} onChange={e=>set('apellidos',e.target.value)} /></div>}
            <div className="field"><label>Nombres *</label><input className="input" value={form.nombres} onChange={e=>set('nombres',e.target.value)} /></div>
            <div className="field"><label>{form.tipo_persona==='natural'?'Cédula':'NIT'}</label>
              <input className="input" value={form.tipo_persona==='natural'?form.cedula:form.nit}
                onChange={e=>set(form.tipo_persona==='natural'?'cedula':'nit',e.target.value)} />
            </div>
            <div className="field"><label>Teléfono</label><input className="input" value={form.telefono} onChange={e=>set('telefono',e.target.value)} /></div>
            <div className="field"><label>Correo</label><input className="input" type="email" value={form.email} onChange={e=>set('email',e.target.value)} /></div>
            <div className="field"><label>Municipio</label><input className="input" value={form.municipio} onChange={e=>set('municipio',e.target.value)} /></div>
            <div className="field"><label>Departamento</label><input className="input" value={form.departamento} onChange={e=>set('departamento',e.target.value)} /></div>
            <div className="field"><label>Banco</label><input className="input" value={form.banco} onChange={e=>set('banco',e.target.value)} /></div>
            <div className="field"><label>N° Cuenta</label><input className="input" value={form.numero_cuenta} onChange={e=>set('numero_cuenta',e.target.value)} /></div>
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
