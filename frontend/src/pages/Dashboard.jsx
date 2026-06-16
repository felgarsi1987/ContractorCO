import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Calendar, FolderOpen, Users,
  TrendingUp, AlertCircle, Eye, Download,
  FileBarChart, ArrowUpRight, CheckCircle
} from 'lucide-react';
import { dashboard, contratos as contratosDB, alertas as alertasDB } from '../lib/db';

const fCOP = v =>
  new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(v||0);

const SemaforoTag = ({ s }) => {
  const m = { vigente:['badge-green','Vigente'], proximo:['badge-orange','Por Vencer'], vencido:['badge-red','Vencido'] };
  const [cls, lbl] = m[s] || ['badge-gray', s];
  return <span className={`badge ${cls}`}>{lbl}</span>;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats,     setStats]     = useState(null);
  const [contratos, setContratos] = useState([]);
  const [alertas,   setAlertas]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      dashboard.getStats(),
      contratosDB.listar({ limit:5 }),
      alertasDB.listar({ leida:false, limit:4 }),
    ]).then(([s,c,a]) => {
      setStats(s); setContratos(c.data||[]); setAlertas(a||[]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label:'Contratos Activos',  value:stats?.contratos_activos??'—',          sub:'En ejecución',     Icon:FileText,   ic:'#059669', bg:'#D1FAE5', bar:'#059669' },
    { label:'Por Vencer',         value:stats?.contratos_proximos_vencer??'—',  sub:'Próximos 30 días', Icon:Calendar,   ic:'#7C3AED', bg:'#EDE9FE', bar:'#7C3AED' },
    { label:'Docs. Pendientes',   value:stats?.documentos_vencidos??'—',        sub:'Acción requerida', Icon:FolderOpen, ic:'#5B21B6', bg:'#DDD6FE', bar:'#5B21B6' },
    { label:'Contratistas',       value:stats?.contratistas_activos??'—',       sub:'Registrados',      Icon:Users,      ic:'#64748B', bg:'#F1F5F9', bar:'#64748B' },
  ];

  const compliance = [
    { type:'Prestación de servicios', pct:87, color:'#059669' },
    { type:'Obra',                    pct:72, color:'#7C3AED' },
    { type:'Suministro',              pct:61, color:'#5B21B6' },
    { type:'Consultoría',             pct:95, color:'#059669' },
  ];

  if (loading) return (
    <div className="page" style={{ alignItems:'center', justifyContent:'center', minHeight:400 }}>
      <div style={{ color:'#6B7280', fontSize:13 }}>Cargando panel...</div>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div>
          <h1>Resumen General</h1>
          <p>Panel de control · {new Date().toLocaleDateString('es-CO',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <div className="hdr-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/reportes')}>
            <Download size={13}/> Exportar
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/reportes')}>
            <FileBarChart size={13}/> Reporte Mensual
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4">
        {kpis.map(({ label, value, sub, Icon, ic, bg, bar }) => (
          <div key={label} className="kpi-card">
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div className="kpi-icon" style={{ background:bg }}>
                <Icon size={16} style={{ color:ic }}/>
              </div>
              <TrendingUp size={13} style={{ color:'#10B981', marginTop:2 }}/>
            </div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-sub">{sub}</div>
            <div className="kpi-card-bar" style={{ background:bar }}/>
          </div>
        ))}
      </div>

      {/* Contenido principal */}
      <div className="grid-5-2">
        {/* Tabla contratos */}
        <div className="card">
          <div className="card-header">
            <h2>Contratos recientes</h2>
            <button className="btn-ghost" onClick={() => navigate('/contratos')} style={{ display:'flex', alignItems:'center', gap:4 }}>
              Ver todos <ArrowUpRight size={11}/>
            </button>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Contrato</th>
                  <th>Contratista</th>
                  <th>Valor</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contratos.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/contratos/${c.id}`)}>
                    <td className="td-strong">{c.numero_contrato}</td>
                    <td className="td-muted">{c.contratista_nombre}</td>
                    <td style={{ fontWeight:600, color:'#059669' }}>{fCOP(c.valor_actual)}</td>
                    <td><SemaforoTag s={c.semaforo}/></td>
                    <td>
                      <button className="btn-icon" onClick={e=>{e.stopPropagation();navigate(`/contratos/${c.id}`);}}>
                        <Eye size={13}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {contratos.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign:'center', padding:36, color:'#9CA3AF' }}>
                      <div style={{ marginBottom:8 }}><CheckCircle size={24} style={{ margin:'0 auto', display:'block', opacity:.3 }}/></div>
                      Sin contratos registrados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Cumplimiento */}
          <div className="card" style={{ padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--forest)', letterSpacing:'-0.01em' }}>Cumplimiento</div>
                <div style={{ fontSize:11, color:'#6B7280', marginTop:1 }}>por tipo de contrato</div>
              </div>
              <button className="btn-ghost" onClick={() => navigate('/reportes')} style={{ display:'flex', alignItems:'center', gap:3, fontSize:11 }}>
                Informe <ArrowUpRight size={11}/>
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {compliance.map(({ type, pct, color }) => (
                <div key={type}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                    <span style={{ color:'#6B7280' }}>{type}</span>
                    <span style={{ fontWeight:700, color }}>{pct}%</span>
                  </div>
                  <div className="prog-track">
                    <div className="prog-fill" style={{ '--w': pct / 100, background: color }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas */}
          <div className="card" style={{ flex:1 }}>
            <div className="card-header">
              <h2>Alertas activas</h2>
              {stats?.alertas_pendientes > 0 && (
                <span className="badge badge-red">{stats.alertas_pendientes}</span>
              )}
            </div>
            <div>
              {alertas.map(a => (
                <div key={a.id} className="alert-row" style={{ cursor:'pointer' }} onClick={() => navigate('/alertas')}>
                  <AlertCircle size={13} style={{ color:'#059669', flexShrink:0, marginTop:2 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--forest)' }}>
                      {a.contratos?.numero_contrato || 'Sistema'}
                    </div>
                    <div style={{ fontSize:11, color:'#6B7280', marginTop:1, lineHeight:1.4 }} className="td-truncate">
                      {a.mensaje}
                    </div>
                  </div>
                </div>
              ))}
              {alertas.length === 0 && (
                <div style={{ padding:20, textAlign:'center', color:'#9CA3AF', fontSize:12 }}>
                  <CheckCircle size={18} style={{ margin:'0 auto 6px', display:'block', color:'#10B981' }}/>
                  Sin alertas pendientes
                </div>
              )}
            </div>
            <div style={{ padding:'8px 16px', borderTop:'1px solid var(--border)', textAlign:'center' }}>
              <button className="btn-ghost" onClick={() => navigate('/alertas')} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11 }}>
                Ver todas <ArrowUpRight size={11}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
