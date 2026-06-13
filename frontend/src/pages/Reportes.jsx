import { useState } from 'react';
import { Download, Calendar, TrendingUp, FileText, DollarSign, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const byMonth = [
  {month:'Ene',contracts:4},{month:'Feb',contracts:6},{month:'Mar',contracts:5},
  {month:'Abr',contracts:8},{month:'May',contracts:7},{month:'Jun',contracts:6},
];
const byType = [
  {name:'Prestación de servicios',value:35,color:'#3b82f6'},
  {name:'Obra',value:25,color:'#10b981'},
  {name:'Suministro',value:20,color:'#f59e0b'},
  {name:'Consultoría',value:20,color:'#8b5cf6'},
];
const byStatus = [
  {name:'Vigente',value:5,color:'#10b981'},
  {name:'Por Vencer',value:1,color:'#f59e0b'},
  {name:'Vencido',value:1,color:'#ef4444'},
];
const reportList = [
  'Reporte General de Contratos','Reporte de Cumplimiento','Reporte Financiero',
  'Reporte de Documentación','Reporte de Supervisores','Reporte de Alertas',
];

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
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${nombre.replace(/ /g,'_')}_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      toast.success('Reporte descargado');
    } catch { toast.error('Error al generar reporte'); }
    finally { setLoading(''); }
  };

  const kpis = [
    { label:'TOTAL CONTRATOS', val:'36', sub:'+15% vs mes anterior', Icon:FileText, bg:'#dbeafe', ic:'#3b82f6', trend:true },
    { label:'VALOR TOTAL',     val:'$673M', sub:'+8% vs mes anterior', Icon:DollarSign, bg:'#dcfce7', ic:'#16a34a', trend:true },
    { label:'CUMPLIMIENTO PROM.', val:'87%', sub:'+18.4% este trimestre', Icon:BarChart3, bg:'#fff7ed', ic:'#c2410c', trend:true },
    { label:'DOCS. PROCESADOS', val:'124', sub:'Este mes', Icon:FileText, bg:'#f3e8ff', ic:'#7c3aed' },
  ];

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1>Reportes</h1><p>Análisis y estadísticas del sistema</p></div>
        <div className="hdr-actions">
          <button className="btn btn-secondary"><Calendar size={12}/> Período</button>
          <button className="btn btn-primary" onClick={() => descargar('Reporte_General','/reportes/contratos')}><Download size={13}/> Exportar Reporte</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ flexShrink:0 }}>
        {kpis.map(({ label, val, sub, Icon, bg, ic, trend }) => (
          <div key={label} className="card" style={{ padding:'12px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{ padding:6, borderRadius:6, background:bg }}><Icon size={14} style={{ color:ic }}/></div>
              <span style={{ fontSize:10, fontWeight:600, color:'#64748b', letterSpacing:'.06em', textTransform:'uppercase' }}>{label}</span>
            </div>
            <div style={{ fontSize:22, fontWeight:600, color:'#1e293b' }}>{val}</div>
            {trend && <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#16a34a', marginTop:2 }}>
              <TrendingUp size={11}/>{sub}
            </div>}
            {!trend && <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ flex:1, minHeight:0 }}>
        <div className="card" style={{ padding:16, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>Contratos por Mes</div>
          <div style={{ flex:1, minHeight:0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMonth} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="month" tick={{ fontSize:10, fill:'#64748b' }}/>
                <YAxis tick={{ fontSize:10, fill:'#64748b' }}/>
                <Tooltip contentStyle={{ fontSize:11, borderRadius:8, border:'1px solid #e2e8f0' }}/>
                <Bar dataKey="contracts" fill="#3b82f6" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding:16, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>Contratos por Tipo</div>
          <div style={{ flex:1, minHeight:0, display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ flex:'0 0 55%', height:'100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} cx="50%" cy="50%" outerRadius="70%" dataKey="value" labelLine={false}>
                    {byType.map((e,i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize:11, borderRadius:8, border:'1px solid #e2e8f0' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1 }}>
              {byType.map(item => (
                <div key={item.name} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:item.color, flexShrink:0 }}/>
                  <span style={{ fontSize:11, color:'#475569' }}>{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>Estado de Contratos</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {byStatus.map(({ name, value, color }) => (
              <div key={name}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:2, background:color }}/>
                    <span style={{ color:'#475569', fontWeight:500 }}>{name}</span>
                  </div>
                  <span style={{ fontWeight:600 }}>{value} contratos</span>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{ width:`${(value/7)*100}%`, background:color }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>Reportes Disponibles</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {reportList.map(r => (
              <div key={r} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:6, border:'1px solid #f1f5f9', cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <FileText size={13} color="#94a3b8"/>
                  <span style={{ fontSize:12, fontWeight:500, color:'#475569' }}>{r}</span>
                </div>
                <button className="btn-icon" onClick={() => descargar(r, '/reportes/contratos')}>
                  {loading === r ? '...' : <Download size={12}/>}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
