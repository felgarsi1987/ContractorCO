import { useState } from 'react';
import { Download, Calendar, TrendingUp, FileText, DollarSign, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const byMonth = [
  { month:'Ene', contracts:4 },{ month:'Feb', contracts:6 },{ month:'Mar', contracts:5 },
  { month:'Abr', contracts:8 },{ month:'May', contracts:7 },{ month:'Jun', contracts:6 },
];
const byType = [
  { name:'Prestación de servicios', value:35, color:'#059669', bg:'#D1FAE5', contratos:13 },
  { name:'Obra',                    value:25, color:'#C2410C', bg:'#FFEDD5', contratos:9  },
  { name:'Suministro',              value:20, color:'#78716C', bg:'#F5F5F4', contratos:7  },
  { name:'Consultoría',             value:20, color:'#9A3412', bg:'#FED7AA', contratos:7  },
];
const byStatus = [
  { name:'Vigente',    value:5, color:'#059669', bg:'#D1FAE5' },
  { name:'Por Vencer', value:1, color:'#C2410C', bg:'#FFEDD5' },
  { name:'Vencido',    value:1, color:'#9A3412', bg:'#FED7AA' },
];
const reportList = [
  'Reporte General de Contratos','Reporte de Cumplimiento','Reporte Financiero',
  'Reporte de Documentación','Reporte de Supervisores','Reporte de Alertas',
];

/* ── Branded tooltip shared by both charts ── */
function ChartTooltip({ active, payload, label, isPie }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #D1FAE5',
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 4px 16px rgba(6,78,59,0.1)',
      fontSize: 12,
      minWidth: 120,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>
        {isPie ? item.name : label}
      </div>
      <div style={{ fontWeight: 700, color: item.payload?.color || '#059669', fontSize: 15 }}>
        {isPie ? `${item.value}%` : `${item.value} contratos`}
      </div>
    </div>
  );
}

export default function Reportes() {
  const [loading, setLoading] = useState('');

  const descargar = async (nombre, endpoint) => {
    setLoading(nombre);
    try {
      const { data } = await api.get(endpoint);
      if (!data || !data.length) return toast('Sin datos para exportar.');
      const keys = Object.keys(data[0]);
      const csv  = [keys.join(','), ...data.map(r => keys.map(k => JSON.stringify(r[k]??'')).join(','))].join('\n');
      const blob = new Blob([csv], { type:'text/csv' });
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = `${nombre.replace(/ /g,'_')}_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      toast.success('Reporte descargado');
    } catch { toast.error('Error al generar reporte'); }
    finally { setLoading(''); }
  };

  const kpis = [
    { label:'TOTAL CONTRATOS',    val:'36',    sub:'+15% vs mes anterior',  Icon:FileText,   bg:'#D1FAE5', ic:'#059669', bar:'#059669', trend:true  },
    { label:'VALOR TOTAL',        val:'$673M', sub:'+8% vs mes anterior',   Icon:DollarSign, bg:'#D1FAE5', ic:'#059669', bar:'#059669', trend:true  },
    { label:'CUMPLIMIENTO PROM.', val:'87%',   sub:'+18.4% este trimestre', Icon:BarChart3,  bg:'#FFEDD5', ic:'#C2410C', bar:'#C2410C', trend:true  },
    { label:'DOCS. PROCESADOS',   val:'124',   sub:'Este mes',              Icon:FileText,   bg:'#F5F5F4', ic:'#78716C', bar:'#78716C', trend:false },
  ];

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1>Reportes</h1><p>Análisis y estadísticas del sistema</p></div>
        <div className="hdr-actions">
          <button className="btn btn-secondary" onClick={() => {
            const desde = prompt('Fecha desde (YYYY-MM-DD):');
            const hasta = prompt('Fecha hasta (YYYY-MM-DD):');
            if (desde && hasta) toast.success(`Filtrando: ${desde} → ${hasta}`);
          }}>
            <Calendar size={12}/> Período
          </button>
          <button className="btn btn-primary" onClick={() => descargar('Reporte_General', '/reportes/contratos')}>
            <Download size={13}/> Exportar Reporte
          </button>
        </div>
      </div>

      {/* ── KPIs — now with bottom bar matching Dashboard ── */}
      <div className="grid-4" style={{ flexShrink:0 }}>
        {kpis.map(({ label, val, sub, Icon, bg, ic, bar, trend }) => (
          <div key={label} className="kpi-card">
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div className="kpi-icon" style={{ background:bg }}>
                <Icon size={16} style={{ color:ic }}/>
              </div>
              {trend && <TrendingUp size={13} style={{ color:'#059669', marginTop:2 }}/>}
            </div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{val}</div>
            <div className="kpi-sub" style={{ color: trend ? '#059669' : '#6B7280' }}>{sub}</div>
            <div className="kpi-card-bar" style={{ background:bar }}/>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid-2" style={{ flex:1, minHeight:0 }}>

        {/* Bar chart — Contratos por Mes */}
        <div className="card" style={{ padding:16, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--forest)', marginBottom:12 }}>Contratos por Mes</div>
          <div style={{ flex:1, minHeight:180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMonth} margin={{ top:4, right:8, left:0, bottom:0 }} barCategoryGap="32%">
                <defs>
                  <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#059669" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.35}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize:11, fill:'#94a3b8', fontFamily:'IBM Plex Sans, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize:11, fill:'#94a3b8', fontFamily:'IBM Plex Sans, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill:'rgba(5,150,105,0.06)', radius:4 }}/>
                <Bar dataKey="contracts" fill="url(#barGreen)" radius={[5,5,0,0]} animationDuration={600} animationEasing="ease-out"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart — Contratos por Tipo / Modalidad */}
        <div className="card" style={{ padding:16, display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--forest)' }}>Distribución por Modalidad</div>
            <span style={{ fontSize:10, color:'#94a3b8' }}>36 contratos</span>
          </div>

          {/* Stacked pill bar — modalidades */}
          <div style={{ display:'flex', height:8, borderRadius:99, overflow:'hidden', marginBottom:16, gap:1 }}>
            {byType.map(item => (
              <div key={item.name} style={{ flex: item.value, background: item.color, transition:'flex .4s ease' }}/>
            ))}
          </div>

          <div style={{ flex:1, minHeight:160, display:'flex', alignItems:'center', gap:12 }}>
            {/* Donut */}
            <div style={{ flex:'0 0 48%', height:160, position:'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byType}
                    cx="50%" cy="50%"
                    innerRadius="42%"
                    outerRadius="70%"
                    dataKey="value"
                    labelLine={false}
                    strokeWidth={2}
                    stroke="#fff"
                    animationDuration={600}
                    animationEasing="ease-out"
                    paddingAngle={2}
                  >
                    {byType.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip content={<ChartTooltip isPie />}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)',
                textAlign:'center', pointerEvents:'none',
              }}>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--forest)', lineHeight:1 }}>36</div>
                <div style={{ fontSize:9, color:'#94a3b8', letterSpacing:'.07em', textTransform:'uppercase', marginTop:3 }}>total</div>
              </div>
            </div>

            {/* Legend — chip + bar per modality */}
            <div style={{ display:'flex', flexDirection:'column', gap:9, flex:1 }}>
              {byType.map(item => (
                <div key={item.name}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{
                        display:'inline-block', padding:'1px 7px', borderRadius:99,
                        fontSize:9, fontWeight:700, letterSpacing:'.04em',
                        background: item.bg, color: item.color,
                      }}>
                        {item.name.split(' ')[0].toUpperCase()}
                      </span>
                      <span style={{ fontSize:10, color:'#64748b' }}>{item.contratos} cttos</span>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color: item.color }}>{item.value}%</span>
                  </div>
                  <div style={{ height:3, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${item.value}%`, background: item.color, borderRadius:99, transition:'width .5s ease' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estado de Contratos */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--forest)', marginBottom:14 }}>Estado de Contratos</div>

          {/* Mini chips row */}
          <div style={{ display:'flex', gap:6, marginBottom:16 }}>
            {byStatus.map(({ name, value, color, bg }) => (
              <div key={name} style={{
                flex:1, padding:'8px 10px', borderRadius:8,
                background: bg, border:`1px solid ${color}22`, textAlign:'center',
              }}>
                <div style={{ fontSize:16, fontWeight:700, color, lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:9, color, fontWeight:600, opacity:.75, marginTop:2, letterSpacing:'.04em' }}>{name.toUpperCase()}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {byStatus.map(({ name, value, color, bg }) => (
              <div key={name}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background: bg, border:`2px solid ${color}`, flexShrink:0 }}/>
                    <span style={{ color:'#475569', fontWeight:500 }}>{name}</span>
                  </div>
                  <span style={{ fontWeight:700, color }}>{value} contratos</span>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{ '--w': value / 7, background: color }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reportes Disponibles */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--forest)', marginBottom:12 }}>Reportes Disponibles</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {reportList.map(r => (
              <div key={r} className="report-row">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <FileText size={13} color="var(--emerald)"/>
                  <span style={{ fontSize:12, fontWeight:500, color:'#475569' }}>{r}</span>
                </div>
                <button className="btn-icon" onClick={() => descargar(r, '/reportes/contratos')} title="Descargar">
                  {loading === r
                    ? <span style={{ fontSize:11, color:'#94a3b8' }}>...</span>
                    : <Download size={12}/>}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
