import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Edit, Filter, Download, Plus } from 'lucide-react';
import api from '../services/api';

const TABS = [
  { key:'',        label:'Todos'     },
  { key:'vigente', label:'Vigentes'  },
  { key:'proximo', label:'Por Vencer'},
  { key:'vencido', label:'Vencidos'  },
];

const statusBadge = (semaforo) => {
  const map = { vigente:['badge-green','Vigente'], proximo:['badge-orange','Por Vencer'], vencido:['badge-red','Vencido'] };
  const [cls, lbl] = map[semaforo] || ['badge-gray', semaforo];
  return <span className={`badge ${cls}`}>{lbl}</span>;
};

export default function Contratos() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const tab    = sp.get('semaforo') || '';
  const buscar = sp.get('buscar')   || '';

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit:15 });
    if (tab)    p.set('semaforo', tab);
    if (buscar) p.set('buscar',   buscar);
    api.get(`/contratos?${p}`)
      .then(r => { setData(r.data.data || []); setTotal(r.data.total || 0); })
      .finally(() => setLoading(false));
  }, [page, tab, buscar]);

  useEffect(() => { load(); }, [load]);

  const setTab = (key) => { const n = new URLSearchParams(sp); key ? n.set('semaforo',key) : n.delete('semaforo'); setSp(n); setPage(1); };

  const formatCOP = v => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(v||0);

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1>Contratos</h1><p>Gestión y seguimiento de contratos administrativos</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/contratos/nuevo')}><Plus size={14}/>Nuevo Contrato</button>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <div className="tab-group">
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn ${tab===t.key?'active':''}`} onClick={() => setTab(t.key)}>
              {t.label} {tab===t.key && total > 0 ? `(${total})` : ''}
            </button>
          ))}
        </div>
        <div className="spacer"/>
        <button className="btn btn-secondary btn-sm"><Filter size={12}/> Filtros</button>
        <button className="btn btn-secondary btn-sm"><Download size={12}/> Exportar</button>
      </div>

      <div className="card" style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
        {loading ? (
          <div style={{ padding:48, textAlign:'center', color:'#94a3b8' }}>Cargando...</div>
        ) : (
          <div style={{ flex:1, overflow:'auto' }}>
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
                    <td className="td-strong">{c.numero_contrato}</td>
                    <td>{c.contratista_nombre}</td>
                    <td className="td-muted">{c.tipo_contrato?.replace(/_/g,' ')}</td>
                    <td style={{ fontWeight:500 }}>{formatCOP(c.valor_actual)}</td>
                    <td className="td-muted">{c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString('es-CO') : '—'}</td>
                    <td className="td-muted">{new Date(c.fecha_fin).toLocaleDateString('es-CO')}</td>
                    <td>{statusBadge(c.semaforo)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display:'flex', gap:2 }}>
                        <button className="btn-icon" onClick={() => navigate(`/contratos/${c.id}`)}><Eye size={13}/></button>
                        <button className="btn-icon"><Edit size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Sin contratos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {total > 15 && (
          <div style={{ padding:'10px 16px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
            <span style={{ fontSize:12, color:'#64748b' }}>Mostrando {Math.min((page-1)*15+1,total)}–{Math.min(page*15,total)} de {total}</span>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Anterior</button>
              <button className="btn btn-secondary btn-sm" disabled={page*15>=total} onClick={()=>setPage(p=>p+1)}>Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
