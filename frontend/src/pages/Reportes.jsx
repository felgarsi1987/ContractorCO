import { useState } from 'react';
import { Download, Calendar, TrendingUp, FileText, DollarSign, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Defs, LinearGradient, Stop,
} from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const byMonth = [
  { month:'Ene', contracts:4 },{ month:'Feb', contracts:6 },{ month:'Mar', contracts:5 },
  { month:'Abr', contracts:8 },{ month:'May', contracts:7 },{ month:'Jun', contracts:6 },
];
const byType = [
  { name:'Prestación de servicios', value:35, color:'#059669' },
  { name:'Obra',                    value:25, color:'#f59e0b' },
  { name:'Suministro',              value:20, color:'#2563EB' },
  { name:'Consultoría',             value:20, color:'#8b5cf6' },
];
const byStatus = [
  { name:'Vigente',    value:5, color:'#059669' },
  { name:'Por Vencer', value:1, color:'#f59e0b' },
  { name:'Vencido',    value:1, color:'#ef4444' },
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
    { label:'TOTAL CONTRATOS',    val:'36',   sub:'+15% vs mes anterior',    Icon:FileText,   bg:'#D1FAE5', ic:'#059669', bar:'#059669', trend:true },
    { label:'VALOR TOTAL',        val:'$673M', sub:'+8% vs mes anterior',    Icon:DollarSign, bg:'#dcfce7', ic:'#16a34a', bar:'#16a34a', trend:true },
    { label:'CUMPLIMIENTO PROM.', val:'87%',  sub:'+18.4% este trimestre',   Icon:BarChart3,  bg:'#FEE2E2', ic:'#DC2626', bar:'#DC2626', trend:true },
    { label:'DOCS. PROCESADOS',   val:'124',  sub:'Este mes',                Icon:FileText,   bg:'#f3e8ff', ic:'#7c3aed', bar:'#7c3aed', trend:false },
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
              {trend && <TrendingUp size={13} style={{ color:'#10B981', marginTop:2 }}/>}
            </div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{val}</div>
            <div className="kpi-sub" style={{ color: trend ? '#16a34a' : '#6B7280' }}>{sub}</div>
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
                <Defs>
                  <LinearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%"   stopColor="#059669" stopOpacity={0.9}/>
                    <Stop offset="100%" stopColor="#059669" stopOpacity={0.35}/>
                  </LinearGradient>
                </Defs>
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

        {/* Donut chart — Contratos por Tipo */}
        <div className="card" style={{ padding:16, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--forest)', marginBottom:12 }}>Contratos por Tipo</div>
          <div style={{ flex:1, minHeight:180, display:'flex', alignItems:'center', gap:16 }}>
            {/* Donut with center label */}
            <div style={{ flex:'0 0 52%', height:'100%', position:'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byType}
                    cx="50%" cy="50%"
                    innerRadius="44%"
                    outerRadius="72%"
                    dataKey="value"
                    labelLine={false}
                    strokeWidth={2}
                    stroke="#fff"
                    animationDuration={600}
                    animationEasing="ease-out"
                  >
                    {byType.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip content={<ChartTooltip isPie />}/>
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div style={{
                position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)',
                textAlign:'center', pointerEvents:'none',
              }}>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--forest)', lineHeight:1 }}>36</div>
                <div style={{ fontSize:9, color:'#94a3b8', letterSpacing:'.07em', textTransform:'uppercase', marginTop:3 }}>total</div>
              </div>
            </div>

            {/* Legend — circles not squares */}
            <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
              {byType.map(item => (
                <div key={item.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:item.color, flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:'#334155' }}>{item.value}%</div>
                    <div style={{ fontSize:10, color:'#94a3b8', lineHeight:1.3 }}>{item.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estado de Contratos */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--forest)', marginBottom:14 }}>Estado de Contratos</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {byStatus.map(({ name, value, color }) => (
              <div key={name}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {/* Circle indicator */}
                    <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }}/>
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
