import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, Filter, Download, Plus, CheckCircle, Search, Users, UserCheck, Clock } from 'lucide-react';
import { contratistas as contratistasDB } from '../lib/db';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ui/ConfirmModal';
import { exportarCSV } from '../utils/export';

// helper seguro para contratos_activos (puede venir como number, array, o null)
const getContratosActivos = (c) => {
  if (typeof c.contratos_activos === 'number') return c.contratos_activos;
  if (Array.isArray(c.contratos_activos)) return c.contratos_activos.length;
  if (c.contratos_activos && typeof c.contratos_activos === 'object' && 'count' in c.contratos_activos)
    return c.contratos_activos.count;
  return 0;
};

export default function Contratistas() {
  const navigate = useNavigate();
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [buscar,  setBuscar]  = useState('');
  const [tab,     setTab]     = useState('todos');
  const [modal,   setModal]   = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmSuspender, setConfirmSuspender] = useState(null);
  const [page,    setPage]    = useState(1);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = { page, limit: 15 };
    if (tab === 'activos')   params.estado = 'activo';
    if (tab === 'inactivos') params.estado = 'suspendido';
    if (buscar) params.buscar = buscar;

    contratistasDB.listar(params)
      .then(r => {
        setData(r.data || []);
        setTotal(r.total || 0);
      })
      .catch(e => {
        console.error('Error cargando contratistas:', e);
        setError('No se pudieron cargar los contratistas. Verifica la conexión.');
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [page, tab, buscar]);

  useEffect(() => { load(); }, [load]);

  const kpis = [
    { label: 'Total registrados', val: total,                                                    color: '#64748B', bg: '#F1F5F9' },
    { label: 'Activos',           val: data.filter(c => c.estado === 'activo').length,            color: '#059669', bg: '#D1FAE5' },
    { label: 'Pendientes',        val: data.filter(c => c.estado === 'suspendido').length,        color: '#7C3AED', bg: '#EDE9FE' },
    { label: 'Jurídicas',         val: data.filter(c => c.tipo_persona === 'juridica').length,    color: '#7C3AED', bg: '#EDE9FE' },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div>
          <h1>Contratistas</h1>
          <p>Registro y verificación de personas naturales y jurídicas</p>
        </div>
        <div className="hdr-actions">
          <button className="btn btn-secondary btn-sm" onClick={async()=>{
          const r=await contratistasDB.listar({limit:1000});
          exportarCSV(r.data,'contratistas');toast.success('Exportado');
        }}><Download size={12}/> Exportar</button>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={13}/> Nuevo Contratista
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4">
        {kpis.map(({ label, val, color, bg }) => (
          <div key={label} className="kpi-card" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filtros + búsqueda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div className="tab-group">
          {[['todos','Todos'],['activos','Activos'],['inactivos','Suspendidos']].map(([k,l]) => (
            <button key={k} className={`tab-btn ${tab===k?'active':''}`} onClick={() => { setTab(k); setPage(1); }}>
              {l}
            </button>
          ))}
        </div>
        <div className="search-wrap" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={14}/>
          <input
            className="search-input"
            placeholder="Buscar por nombre, cédula o NIT..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
          />
        </div>
        <button className="btn btn-secondary btn-sm"><Filter size={12}/> Filtros</button>
        <span style={{ fontSize: 12, color: '#64748b' }}>{total} registros</span>
      </div>

      {/* Tabla */}
      <div className="card">
        {error ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ color: '#064E3B', fontSize: 13, marginBottom: 12 }}>{error}</div>
            <button className="btn btn-primary btn-sm" onClick={load}>Reintentar</button>
          </div>
        ) : loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Cargando contratistas...</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre / Razón Social</th>
                  <th>Tipo</th>
                  <th>Identificación</th>
                  <th>Contacto</th>
                  <th>Municipio</th>
                  <th>Contratos</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.map(c => {
                  const activos = getContratosActivos(c);
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.tipo_persona === 'natural' ? '#F1F5F9' : '#EDE9FE', color: c.tipo_persona === 'natural' ? '#64748B' : '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {(c.nombres || c.razon_social || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 12, color: '#064E3B' }}>
                              {c.nombres || ''} {c.apellidos || ''}{c.razon_social ? c.razon_social : ''}
                            </div>
                            {c.email && <div style={{ fontSize: 10, color: '#94a3b8' }}>{c.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={c.tipo_persona === 'natural' ? 'badge badge-blue' : 'badge badge-purple'}>
                          {c.tipo_persona === 'natural' ? 'Natural' : 'Jurídica'}
                        </span>
                      </td>
                      <td className="td-muted">
                        {c.cedula ? `CC ${c.cedula}` : c.nit ? `NIT ${c.nit}` : '—'}
                      </td>
                      <td className="td-muted">{c.telefono || '—'}</td>
                      <td className="td-muted">{c.municipio ? `${c.municipio}${c.departamento ? ', ' + c.departamento : ''}` : '—'}</td>
                      <td>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: activos > 0 ? '#D1FAE5' : '#f1f5f9', color: activos > 0 ? '#059669' : '#94a3b8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                          {activos}
                        </span>
                      </td>
                      <td>
                        <span className={c.estado === 'activo' ? 'badge badge-green' : c.estado === 'inhabilitado' ? 'badge badge-red' : 'badge badge-orange'}>
                          {c.estado === 'activo' ? 'Activo' : c.estado === 'inhabilitado' ? 'Inhabilitado' : 'Suspendido'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button className="btn-icon" title="Ver contratos" onClick={e=>{e.stopPropagation();navigate('/contratos?contratista_id='+c.id);}}><Eye size={13}/></button>
                          <button className="btn-icon" title="Editar" onClick={e=>{e.stopPropagation();setEditando(c);setModal(true);}}><Edit size={13}/></button>
                          <button className="btn-icon" title="Suspender" style={{ color:'#5B21B6' }} onClick={e=>{e.stopPropagation();setConfirmSuspender(c.id);}}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                      <Users size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: .4 }}/>
                      <div style={{ fontSize: 13 }}>Sin contratistas registrados.</div>
                      <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setModal(true)}>
                        <Plus size={12}/> Registrar primero
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {total > 15 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {Math.min((page-1)*15+1, total)}–{Math.min(page*15, total)} de {total}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p-1)}>Anterior</button>
              <button className="btn btn-primary btn-sm" disabled={page*15 >= total} onClick={() => setPage(p => p+1)}>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {modal && <ModalNuevoContratista onClose={() => { setModal(false); setEditando(null); }} onCreated={load} inicial={editando}/>}
      {confirmSuspender && (
        <ConfirmModal
          titulo="Suspender contratista"
          mensaje="¿Confirmas la suspensión de este contratista? Podrá rehabilitarse después."
          confirmLabel="Suspender"
          danger
          onConfirm={async()=>{
            await contratistasDB.actualizar(confirmSuspender,{estado:'suspendido'});
            toast.success('Contratista suspendido');
            setConfirmSuspender(null); load();
          }}
          onCancel={()=>setConfirmSuspender(null)}
        />
      )}
    </div>
  );
}

function ModalNuevoContratista({ onClose, onCreated }) {
  const [form, setForm] = useState({
    nombres: '', apellidos: '', cedula: '', nit: '',
    tipo_persona: 'natural', razon_social: '',
    telefono: '', email: '', municipio: '', departamento: '',
    banco: '', numero_cuenta: '', tipo_cuenta: 'ahorros',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.nombres) return toast.error('El nombre es requerido');
    if (form.tipo_persona === 'natural' && !form.cedula) return toast.error('La cédula es requerida');
    if (form.tipo_persona === 'juridica' && !form.nit) return toast.error('El NIT es requerido');
    setLoading(true);
    try {
      await contratistasDB.crear(form);
      toast.success('Contratista registrado correctamente');
      onCreated();
      onClose();
    } catch (e) {
      const msg = e?.message || 'Error al guardar';
      if (msg.includes('cedula') || msg.includes('unique')) toast.error('Ya existe un contratista con esa cédula o NIT.');
      else toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div>
            <h3>Nuevo Contratista</h3>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Paso {step} de 2</div>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Steps indicator */}
        <div style={{ padding: '10px 20px 0', display: 'flex', gap: 8 }}>
          {[1,2].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: s <= step ? '#10B981' : '#e2e8f0', cursor: 'pointer' }} onClick={() => s < step && setStep(s)}/>
          ))}
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div className="grid-2">
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Tipo de persona *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['natural','👤 Persona Natural'],['juridica','🏢 Persona Jurídica']].map(([v,l]) => (
                    <button key={v} type="button"
                      style={{ flex: 1, padding: '8px', borderRadius: 6, border: `2px solid ${form.tipo_persona===v?'#10B981':'#e2e8f0'}`, background: form.tipo_persona===v?'#ECFDF5':'#fff', color: form.tipo_persona===v?'#047857':'#475569', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                      onClick={() => set('tipo_persona', v)}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Nombres *</label>
                <input className="input-field" value={form.nombres} onChange={e => set('nombres', e.target.value)} placeholder="Ej: Carlos Alberto"/>
              </div>
              {form.tipo_persona === 'natural'
                ? <div className="field"><label>Apellidos</label><input className="input-field" value={form.apellidos} onChange={e => set('apellidos', e.target.value)} placeholder="Ej: Mejía Torres"/></div>
                : <div className="field"><label>Razón Social</label><input className="input-field" value={form.razon_social} onChange={e => set('razon_social', e.target.value)} placeholder="Ej: Constructora Andes S.A.S"/></div>
              }
              <div className="field">
                <label>{form.tipo_persona === 'natural' ? 'Cédula de ciudadanía *' : 'NIT *'}</label>
                <input className="input-field"
                  value={form.tipo_persona === 'natural' ? form.cedula : form.nit}
                  onChange={e => set(form.tipo_persona === 'natural' ? 'cedula' : 'nit', e.target.value)}
                  placeholder={form.tipo_persona === 'natural' ? 'Ej: 10425887' : 'Ej: 900127441-1'}/>
              </div>
              <div className="field">
                <label>Correo electrónico</label>
                <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="correo@ejemplo.com"/>
              </div>
              <div className="field">
                <label>Teléfono</label>
                <input className="input-field" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="Ej: 3101234567"/>
              </div>
              <div className="field">
                <label>Municipio</label>
                <input className="input-field" value={form.municipio} onChange={e => set('municipio', e.target.value)} placeholder="Ej: Cali"/>
              </div>
              <div className="field">
                <label>Departamento</label>
                <input className="input-field" value={form.departamento} onChange={e => set('departamento', e.target.value)} placeholder="Ej: Valle del Cauca"/>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid-2">
              <div style={{ gridColumn: 'span 2', padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
                ✓ Datos bancarios para pagos y desembolsos
              </div>
              <div className="field">
                <label>Banco</label>
                <select className="select-field" value={form.banco} onChange={e => set('banco', e.target.value)}>
                  <option value="">Seleccionar banco...</option>
                  {['Bancolombia','Davivienda','BBVA','Banco de Bogotá','Banco Popular','Nequi','Daviplata','Banco Agrario','Banco de Occidente','Colpatria'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Tipo de cuenta</label>
                <select className="select-field" value={form.tipo_cuenta} onChange={e => set('tipo_cuenta', e.target.value)}>
                  <option value="ahorros">Ahorros</option>
                  <option value="corriente">Corriente</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Número de cuenta</label>
                <input className="input-field" value={form.numero_cuenta} onChange={e => set('numero_cuenta', e.target.value)} placeholder="Ej: 123456789012"/>
              </div>
              <div style={{ gridColumn: 'span 2', padding: '10px 12px', background: '#fef3c7', borderRadius: 6, fontSize: 11, color: '#92400e' }}>
                ℹ️ Los datos bancarios son requeridos para la gestión de pagos. Pueden completarse después.
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 2 && <button className="btn btn-secondary" onClick={() => setStep(1)}>← Anterior</button>}
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          {step === 1
            ? <button className="btn btn-primary" onClick={() => { if (!form.nombres) { toast.error('Nombre requerido'); return; } setStep(2); }}>
                Siguiente →
              </button>
            : <button className="btn btn-primary" onClick={submit} disabled={loading}>
                {loading ? 'Guardando...' : '✓ Registrar Contratista'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}
