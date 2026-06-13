import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, FolderOpen, Users, TrendingUp, AlertCircle, Eye, Download, FileBarChart, ArrowUpRight } from 'lucide-react';
import { dashboard, contratos as contratosDB, alertas as alertasDB } from '../lib/db';

const statusBadge = (color, label) => {
  const cls = { green:'badge badge-green', orange:'badge badge-orange', red:'badge badge-red' };
  return <span className={cls[color] || 'badge badge-gray'}>{label}</span>;
};

const alertColor = { critical:'#ef4444', high:'#f97316', medium:'#f59e0b' };

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats,     setStats]     = useState(null);
  const [contratos, setContratos] = useState([]);
  const [alertas,   setAlertas]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      dashboard.getStats(),
      contratosDB.listar({ limit: 5 }),
      alertasDB.listar({ leida: false, limit: 4 }),
    ]).then(([s, c, a]) => {
      setStats(s);
      setContratos(c.data || []);
      setAlertas(a || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label:'CONTRATOS ACTIVOS',  value: stats?.contratos_activos ?? '—',             sub:'En ejecución',       Icon:FileText,   trend:'+12%',    grad:'linear-gradient(135deg,#1d4ed8,#3b82f6)', light:'#eff6ff', ic:'#2563eb' },
    { label:'PRÓXIMOS A VENCER',  value: stats?.contratos_proximos_vencer ?? '—',     sub:'Próximos 30 días',   Icon:Calendar,   badge:'Crítico',  grad:'linear-gradient(135deg,#c2410c,#f97316)', light:'#fff7ed', ic:'#ea580c' },
    { label:'DOCS. PENDIENTES',   value: stats?.documentos_vencidos ?? '—',           sub:'Requieren acción',   Icon:FolderOpen, badge:'Atraso',   grad:'linear-gradient(135deg,#b91c1c,#ef4444)', light:'#fef2f2', ic:'#dc2626' },
    { label:'CONTRATISTAS REG.',  value: stats?.contratistas_activos ?? '—',          sub:'94% verificados',    Icon:Users,      trend:'+2',      grad:'linear-gradient(135deg,#0f766e,#14b8a6)', light:'#f0fdfa', ic:'#0d9488' },
  ];

  const compliance = [
    { type:'Prestación de servicios', pct:87, color:'#2563eb' },
    { type:'Obra',                    pct:72, color:'#0d9488' },
    { type:'Suministro',              pct:61, color:'#f97316' },
    { type:'Consultoría',             pct:95, color:'#7c3aed' },
  ];

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
      <FileText size={32} color="#94a3b8" className="animate-spin" />
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div>
          <h1>Resumen General</h1>
          <p>Panel de control de contratos y cumplimiento administrativo</p>
        </div>
        <div className="hdr-actions">
          <button className="btn btn-secondary"><Download size={14} /> Exportar</button>
          <button className="btn btn-primary" onClick={() => navigate('/reportes')}><FileBarChart size={14} /> Reporte Mensual</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ flexShrink:0 }}>
        {kpis.map(({ label, value, sub, Icon, trend, badge, grad, light, ic }) => (
          <div key={label} className="kpi-card" style={{ display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div className="kpi-icon" style={{ background: light }}>
                <Icon size={18} style={{ color: ic }} />
              </div>
              {trend && <span style={{ fontSize:11, color:'#10b981', fontWeight:500, display:'flex', alignItems:'center', gap:2 }}><TrendingUp size={11}/>{trend}</span>}
              {badge && <span style={{ fontSize:10, fontWeight:500, padding:'2px 6px', borderRadius:4, background:'#fef2f2', color:'#dc2626' }}>{badge}</span>}
            </div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-sub">{sub}</div>
            <div className="kpi-card-bar" style={{ background: grad }} />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid-5-2" style={{ flex:1, minHeight:0 }}>
        {/* Left: tabla contratos */}
        <div className="card" style={{ display:'flex', flexDirection:'column' }}>
          <div className="card-header">
            <h2>Contratos Recientes</h2>
            <button className="btn-ghost" onClick={() => navigate('/contratos')} style={{ display:'flex', alignItems:'center', gap:4 }}>
              Ver todos <ArrowUpRight size={12}/>
            </button>
          </div>
          <div style={{ flex:1, overflow:'auto' }}>
            <table className="data-table">
              <thead><tr><th>N° Contrato</th><th>Contratista</th><th>Valor</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {contratos.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/contratos/${c.id}`)}>
                    <td className="td-strong">{c.numero_contrato}</td>
                    <td className="td-muted">{c.contratista_nombre}</td>
                    <td style={{ fontWeight:500 }}>
                      {new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(c.valor_actual)}
                    </td>
                    <td>{statusBadge(c.semaforo === 'vigente'?'green':c.semaforo === 'proximo'?'orange':'red', c.semaforo === 'vigente'?'Vigente':c.semaforo === 'proximo'?'Por Vencer':'Vencido')}</td>
                    <td><button className="btn-icon"><Eye size={14}/></button></td>
                  </tr>
                ))}
                {contratos.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign:'center', padding:32, color:'#94a3b8' }}>Sin contratos registrados aún.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: cumplimiento + alertas */}
        <div style={{ display:'flex', flexDirection:'column', gap:14, minHeight:0 }}>
          {/* Cumplimiento */}
          <div className="card" style={{ padding:16, flex:1 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>Cumplimiento por Tipo</div>
                <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>+18.4% este trimestre</div>
              </div>
              <button className="btn-ghost" onClick={() => navigate('/reportes')} style={{ display:'flex', alignItems:'center', gap:3 }}>
                Informe <ArrowUpRight size={11}/>
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {compliance.map(({ type, pct, color }) => (
                <div key={type}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                    <span style={{ color:'#64748b' }}>{type}</span>
                    <span style={{ fontWeight:600 }}>{pct}%</span>
                  </div>
                  <div className="prog-track">
                    <div className="prog-fill" style={{ width:`${pct}%`, background:color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas */}
          <div className="card" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div className="card-header" style={{ flexShrink:0 }}>
              <h2>Alertas Críticas</h2>
              <span className="badge badge-red">{stats?.alertas_pendientes ?? alertas.length} activas</span>
            </div>
            <div style={{ flex:1, overflow:'auto' }}>
              {alertas.map(a => (
                <div key={a.id} className="alert-row" style={{ cursor:'pointer' }} onClick={() => navigate('/alertas')}>
                  <AlertCircle size={14} style={{ color: alertColor['high'], flexShrink:0, marginTop:2 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:'#1e293b' }}>{a.contratos?.numero_contrato || 'Sistema'}</div>
                    <div style={{ fontSize:11, color:'#64748b', marginTop:1, lineHeight:1.4 }}>{a.mensaje}</div>
                  </div>
                </div>
              ))}
              {alertas.length === 0 && (
                <div style={{ padding:24, textAlign:'center', color:'#94a3b8', fontSize:12 }}>Sin alertas pendientes ✓</div>
              )}
            </div>
            <div style={{ padding:'8px 16px', borderTop:'1px solid #f1f5f9', textAlign:'center' }}>
              <button className="btn-ghost" onClick={() => navigate('/alertas')} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12 }}>
                Ver todas las alertas <ArrowUpRight size={11}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
