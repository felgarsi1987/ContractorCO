import { useState, useEffect, useMemo } from 'react';
import { Download, TrendingUp, FileText, DollarSign, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { reportes as reportesDB } from '../lib/db';
import { exportarCSV } from '../utils/export';
import toast from 'react-hot-toast';

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const TIPO_CONFIG = {
  prestacion_servicios: { label:'Prest. Servicios',  color:'#059669', bg:'#D1FAE5' },
  obra:                 { label:'Obra',               color:'#C2410C', bg:'#FFEDD5' },
  suministro:           { label:'Suministro',         color:'#78716C', bg:'#F5F5F4' },
  consultoria:          { label:'Consultoría',        color:'#9A3412', bg:'#FED7AA' },
  interadministrativo:  { label:'Interadm.',          color:'#0369A1', bg:'#E0F2FE' },
  otro:                 { label:'Otro',               color:'#7C3AED', bg:'#EDE9FE' },
};

const SEMAFORO_CONFIG = {
  vigente: { label:'Vigente',    color:'#059669', bg:'#D1FAE5' },
  proximo: { label:'Por Vencer', color:'#C2410C', bg:'#FFEDD5' },
  vencido: { label:'Vencido',    color:'#9A3412', bg:'#FED7AA' },
};

const reportList = [
  { id:'general',     label:'Reporte General de Contratos' },
  { id:'vigentes',    label:'Contratos Vigentes' },
  { id:'vencidos',    label:'Contratos Vencidos' },
  { id:'por_vencer',  label:'Contratos Por Vencer' },
];

function ChartTooltip({ active, payload, label, isPie }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={{
      background:'#fff', border:'1px solid #D1FAE5', borderRadius:8,
      padding:'8px 12px', boxShadow:'0 4px 16px rgba(6,78,59,0.1)',
      fontSize:12, minWidth:120,
    }}>
      <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:4 }}>
        {isPie ? item.name : label}
      </div>
      <div style={{ fontWeight:700, color: item.payload?.color || '#059669', fontSize:15 }}>
        {isPie ? `${item.value}%` : `${item.value} contratos`}
      </div>
    </div>
  );
}

export default function Reportes() {
  const [contratos, setContratos] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadingDL, setLoadingDL] = useState('');

  useEffect(() => {
    setLoading(true);
    reportesDB.contratos()
      .then(d => setContratos(d || []))
      .catch(() => toast.error('Error cargando datos'))
      .finally(() => setLoading(false));
  }, []);

  const byMonth = useMemo(() => {
    const now = new Date();
    const counts = {};
    contratos.forEach(c => {
      if (!c.fecha_inicio) return;
      const d   = new Date(c.fecha_inicio + 'T00:00:00');
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return { month: MESES_CORTO[d.getMonth()], contracts: counts[key] || 0 };
    });
  }, [contratos]);

  const byType = useMemo(() => {
    const total = contratos.length || 1;
    const counts = {};
    contratos.forEach(c => { counts[c.tipo_contrato] = (counts[c.tipo_contrato] || 0) + 1; });
    return Object.entries(counts)
      .map(([tipo, n]) => ({
        name:      TIPO_CONFIG[tipo]?.label || tipo,
        value:     Math.round((n / total) * 100),
        contratos: n,
        color:     TIPO_CONFIG[tipo]?.color || '#78716C',
        bg:        TIPO_CONFIG[tipo]?.bg    || '#F5F5F4',
      }))
      .sort((a, b) => b.contratos - a.contratos);
  }, [contratos]);

  const byStatus = useMemo(() =>
    Object.entries(SEMAFORO_CONFIG).map(([key, cfg]) => ({
      name:  cfg.label,
      value: contratos.filter(c => c.semaforo === key).length,
      color: cfg.color,
      bg:    cfg.bg,
    })), [contratos]);

  const totalActivos = contratos.filter(c => c.semaforo === 'vigente').length;
  const totalVencer  = contratos.filter(c => c.semaforo === 'proximo').length;
  const valorTotal   = contratos.filter(c => c.semaforo !== 'vencido')
    .reduce((s, c) => s + (c.valor_actual || 0), 0);

  const kpis = [
    { label:'TOTAL CONTRATOS', val: loading ? '...' : contratos.length,
      sub:`${totalActivos} vigentes`,           Icon:FileText,   bg:'#D1FAE5', ic:'#059669', bar:'#059669', trend:true  },
    { label:'VALOR TOTAL',     val: loading ? '...' : `$${(valorTotal/1e6).toFixed(0)}M`,
      sub:'En ejecución activa',                Icon:DollarSign, bg:'#D1FAE5', ic:'#059669', bar:'#059669', trend:true  },
    { label:'POR VENCER',      val: loading ? '...' : totalVencer,
      sub:'Próximos 30 días',                   Icon:BarChart3,  bg:'#FFEDD5', ic:'#C2410C', bar:'#C2410C', trend:false },
    { label:'MODALIDADES',     val: loading ? '...' : [...new Set(contratos.map(c => c.tipo_contrato))].length,
      sub:'Tipos distintos',                    Icon:FileText,   bg:'#F5F5F4', ic:'#78716C', bar:'#78716C', trend:false },
  ];

  const descargar = (rpt) => {
    setLoadingDL(rpt.id);
    try {
      let data = contratos;
      if (rpt.id === 'vigentes')   data = contratos.filter(c => c.semaforo === 'vigente');
      if (rpt.id === 'vencidos')   data = contratos.filter(c => c.semaforo === 'vencido');
      if (rpt.id === 'por_vencer') data = contratos.filter(c => c.semaforo === 'proximo');
      if (!data.length) { toast('Sin datos para exportar.'); return; }
      exportarCSV(data.map(c => ({
        numero_contrato: c.numero_contrato,
        contratista:     c.contratista_nombre,
        tipo:            c.tipo_contrato,
        valor:           c.valor_actual,
        fecha_inicio:    c.fecha_inicio,
        fecha_fin:       c.fecha_fin,
        estado:          c.estado,
        semaforo:        c.semaforo,
        supervisor:      c.supervisor_nombre || '',
      })), rpt.label.replace(/ /g, '_'));
      toast.success(`${rpt.label} descargado`);
    } catch { toast.error('Error al generar reporte'); }
    finally { setLoadingDL(''); }
  };

  const totalStatusMax = Math.max(...byStatus.map(b => b.value), 1);

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1>Reportes</h1><p>Análisis y estadísticas del sistema · {contratos.length} contratos</p></div>
        <div className="hdr-actions">
          <button className="btn btn-primary" onClick={() => descargar(reportList[0])} disabled={loading || !contratos.length}>
            <Download size={13}/> Exportar General
          </button>
        </div>
      </div>

      <div className="grid-4" style={{ flexShrink:0 }}>
        {kpis.map(({ label, val, sub, Icon, bg, ic, bar, trend }) => (
          <div key={label} className="kpi-card">
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div className="kpi-icon" style={{ background:bg }}><Icon size={16} style={{ color:ic }}/></div>
              {trend && <TrendingUp size={13} style={{ color:'#059669', marginTop:2 }}/>}
            </div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{val}</div>
            <div className="kpi-sub" style={{ color: trend ? '#059669' : '#6B7280' }}>{sub}</div>
            <div className="kpi-card-bar" style={{ background:bar }}/>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ flex:1, minHeight:0 }}>

        {/* Bar chart — Contratos por Mes */}
        <div className="card" style={{ padding:16, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--forest)', marginBottom:12 }}>Contratos por Mes (inicio)</div>
          {loading ? <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:12 }}>Cargando...</div> : (
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
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} width={28}/>
                <Tooltip content={<ChartTooltip />} cursor={{ fill:'rgba(5,150,105,0.06)', radius:4 }}/>
                <Bar dataKey="contracts" fill="url(#barGreen)" radius={[5,5,0,0]} animationDuration={600}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}
        </div>

        {/* Donut — por Tipo */}
        <div className="card" style={{ padding:16, display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--forest)' }}>Distribución por Modalidad</div>
            <span style={{ fontSize:10, color:'#94a3b8' }}>{contratos.length} contratos</span>
          </div>

          {loading ? <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:12 }}>Cargando...</div> : (
          <>
          <div style={{ display:'flex', height:8, borderRadius:99, overflow:'hidden', marginBottom:16, gap:1 }}>
            {byType.map(item => (
              <div key={item.name} style={{ flex: item.value || 1, background: item.color }}/>
            ))}
          </div>
          <div style={{ flex:1, minHeight:160, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ flex:'0 0 48%', height:160, position:'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} cx="50%" cy="50%" innerRadius="42%" outerRadius="70%"
                    dataKey="value" strokeWidth={2} stroke="#fff" animationDuration={600} paddingAngle={2}>
                    {byType.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip content={<ChartTooltip isPie />}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--forest)', lineHeight:1 }}>{contratos.length}</div>
                <div style={{ fontSize:9, color:'#94a3b8', letterSpacing:'.07em', textTransform:'uppercase', marginTop:3 }}>total</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:9, flex:1 }}>
              {byType.map(item => (
                <div key={item.name}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ display:'inline-block', padding:'1px 7px', borderRadius:99, fontSize:9, fontWeight:700, background: item.bg, color: item.color }}>
                        {item.name.split(' ')[0].toUpperCase()}
                      </span>
                      <span style={{ fontSize:10, color:'#64748b' }}>{item.contratos} cttos</span>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color: item.color }}>{item.value}%</span>
                  </div>
                  <div style={{ height:3, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${item.value}%`, background: item.color, borderRadius:99 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </>
          )}
        </div>

        {/* Estado */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--forest)', marginBottom:14 }}>Estado de Contratos</div>
          {loading ? <div style={{ color:'#94a3b8', fontSize:12, padding:20, textAlign:'center' }}>Cargando...</div> : (
          <>
          <div style={{ display:'flex', gap:6, marginBottom:16 }}>
            {byStatus.map(({ name, value, color, bg }) => (
              <div key={name} style={{ flex:1, padding:'8px 10px', borderRadius:8, background:bg, border:`1px solid ${color}22`, textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:700, color, lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:9, color, fontWeight:600, opacity:.75, marginTop:2, letterSpacing:'.04em' }}>{name.toUpperCase()}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {byStatus.map(({ name, value, color }) => (
              <div key={name}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:5 }}>
                  <span style={{ color:'#475569', fontWeight:500 }}>{name}</span>
                  <span style={{ fontWeight:700, color }}>{value} contratos</span>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{ '--w': value / totalStatusMax, background: color }}/>
                </div>
              </div>
            ))}
          </div>
          </>
          )}
        </div>

        {/* Reportes disponibles */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--forest)', marginBottom:12 }}>Reportes Disponibles</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {reportList.map(rpt => (
              <div key={rpt.id} className="report-row">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <FileText size={13} color="var(--emerald)"/>
                  <span style={{ fontSize:12, fontWeight:500, color:'#475569' }}>{rpt.label}</span>
                </div>
                <button className="btn-icon" onClick={() => descargar(rpt)} disabled={loading || !contratos.length} title="Descargar CSV">
                  {loadingDL === rpt.id
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
