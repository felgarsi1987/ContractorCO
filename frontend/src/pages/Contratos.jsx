import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Edit, Filter, Download, Plus, FileText, Search, X } from 'lucide-react';
import { contratos as contratosDB } from '../lib/db';
import FiltroPanel from '../components/ui/FiltroPanel';
import { exportarCSV, formatCOP } from '../utils/export';
import toast from 'react-hot-toast';

const TABS = [
  { key:'',        label:'Todos'      },
  { key:'vigente', label:'Vigentes'   },
  { key:'proximo', label:'Por Vencer' },
  { key:'vencido', label:'Vencidos'   },
];
const TIPOS = {
  prestacion_servicios:'Prest. Servicios', obra:'Obra',
  suministro:'Suministro', consultoria:'Consultoría',
  interadministrativo:'Interadm.', otro:'Otro',
};
const SemaforoTag = ({ s }) => {
  const m = { vigente:['badge-green','Vigente'], proximo:['badge-orange','Por Vencer'], vencido:['badge-red','Vencido'] };
  const [cls, lbl] = m[s] || ['badge-gray', s];
  return <span className={`badge ${cls}`}>{lbl}</span>;
};

export default function Contratos() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [filtros, setFiltros] = useState({});
  const [showFiltros, setShowFiltros] = useState(false);

  const tab    = sp.get('semaforo') || '';
  const buscar = sp.get('buscar')   || '';

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit:15 });
    if (tab)    p.set('semaforo', tab);
    if (buscar) p.set('buscar',   buscar);
    if (filtros.tipo_contrato) p.set('tipo_contrato', filtros.tipo_contrato);
    if (filtros.supervisor_id) p.set('supervisor_id', filtros.supervisor_id);
    contratosDB.listar(Object.fromEntries(p))
      .then(r => { setData(r.data||[]); setTotal(r.total||0); })
      .catch(e => { console.error(e); toast.error('Error al cargar contratos'); })
      .finally(() => setLoading(false));
  }, [page, tab, buscar, filtros]);

  useEffect(() => { load(); }, [load]);

  const setTab = (key) => {
    const n = new URLSearchParams(sp);
    key ? n.set('semaforo', key) : n.delete('semaforo');
    setSp(n); setPage(1);
  };

  const handleExportar = async () => {
    try {
      toast.loading('Preparando exportación...');
      const r = await contratosDB.listar({ limit:1000, semaforo: tab || undefined });
      toast.dismiss();
      exportarCSV(r.data, `contratos${tab ? '_'+tab : ''}`);
      toast.success(`${r.data.length} contratos exportados`);
    } catch { toast.dismiss(); toast.error('Error al exportar'); }
  };

  const camposFiltro = [
    { key:'tipo_contrato', label:'Tipo de contrato', type:'select', options:[
      {value:'prestacion_servicios',label:'Prestación de Servicios'},
      {value:'obra',label:'Obra'},{value:'suministro',label:'Suministro'},
      {value:'consultoria',label:'Consultoría'},{value:'interadministrativo',label:'Interadministrativo'},
    ]},
    { key:'fecha_inicio', label:'Rango de fechas inicio', type:'date-range' },
  ];

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1>Contratos</h1>
          <p>Gestión del ciclo de vida contractual · {total} registros</p>
        </div>
        <div className="hdr-actions">
          <button className="btn btn-secondary" onClick={handleExportar}>
            <Download size={13}/> Exportar CSV
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/contratos/nuevo')}>
            <Plus size={13}/> Nuevo Contrato
          </button>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div className="tab-group">
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)}>
              {t.label}{tab===t.key&&total>0?` (${total})`:''}
            </button>
          ))}
        </div>
        <div className="search-wrap" style={{ flex:1, maxWidth:300 }}>
          <Search size={14}/>
          <input
            className="search-input"
            placeholder="N° contrato, contratista u objeto..."
            value={buscar}
            onChange={e => {
              const n = new URLSearchParams(sp);
              e.target.value ? n.set('buscar', e.target.value) : n.delete('buscar');
              setSp(n); setPage(1);
            }}
          />
          {buscar && <button style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:'#94a3b8' }} onClick={() => { const n = new URLSearchParams(sp); n.delete('buscar'); setSp(n); setPage(1); }}><X size={13}/></button>}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowFiltros(true)}
          style={Object.keys(filtros).some(k=>filtros[k]) ? { borderColor:'var(--emerald)', color:'var(--emerald)' } : {}}>
          <Filter size={12}/>
          Filtros {Object.keys(filtros).filter(k=>filtros[k]).length > 0 ? `(${Object.keys(filtros).filter(k=>filtros[k]).length})` : ''}
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding:48, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Cargando contratos...</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Contrato</th><th>Contratista</th><th>Tipo</th>
                  <th>Valor</th><th>Inicio</th><th>Fin</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {data.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/contratos/${c.id}`)}>
                    <td className="td-strong td-link">{c.numero_contrato}</td>
                    <td>{c.contratista_nombre}</td>
                    <td className="td-muted">{TIPOS[c.tipo_contrato]||c.tipo_contrato}</td>
                    <td style={{ fontWeight:600, color:'var(--emerald-dark)' }}>{formatCOP(c.valor_actual)}</td>
                    <td className="td-muted">{c.fecha_inicio?new Date(c.fecha_inicio).toLocaleDateString('es-CO'):'—'}</td>
                    <td className="td-muted">{new Date(c.fecha_fin).toLocaleDateString('es-CO')}</td>
                    <td><SemaforoTag s={c.semaforo}/></td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div style={{ display:'flex', gap:2 }}>
                        <button className="btn-icon" title="Ver detalle" onClick={()=>navigate(`/contratos/${c.id}`)}><Eye size={13}/></button>
                        <button className="btn-icon" title="Editar" onClick={()=>navigate(`/contratos/${c.id}/editar`)}><Edit size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length===0 && (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>
                    <FileText size={28} style={{ margin:'0 auto 10px', display:'block', opacity:.3 }}/>
                    Sin contratos. <button className="btn-ghost" onClick={()=>navigate('/contratos/nuevo')}>Crear el primero →</button>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {total > 15 && (
          <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>{Math.min((page-1)*15+1,total)}–{Math.min(page*15,total)} de {total}</span>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Anterior</button>
              <button className="btn btn-primary btn-sm" disabled={page*15>=total} onClick={()=>setPage(p=>p+1)}>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {showFiltros && (
        <FiltroPanel
          campos={camposFiltro}
          valores={filtros}
          onAplicar={f => { setFiltros(f); setShowFiltros(false); setPage(1); }}
          onLimpiar={() => { setFiltros({}); setShowFiltros(false); setPage(1); }}
        />
      )}
    </div>
  );
}
