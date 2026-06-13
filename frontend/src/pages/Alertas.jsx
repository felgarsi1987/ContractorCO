import { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { alertas as alertasDB } from '../lib/db';
import toast from 'react-hot-toast';

const priorityStyle = (tipo) => {
  if (tipo?.includes('vencido') || tipo?.includes('_5'))
    return { icon:<XCircle size={14} color="#dc2626"/>, bg:'#fee2e2', label:'Crítica', badgeCls:'badge-red' };
  if (tipo?.includes('_15'))
    return { icon:<AlertCircle size={14} color="#c2410c"/>, bg:'#fff7ed', label:'Alta', badgeCls:'badge-orange' };
  return { icon:<Clock size={14} color="#f59e0b"/>, bg:'#fefce8', label:'Media', badgeCls:'badge-gray' };
};

export default function Alertas() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    alertasDB.listar({ limit:50 }).then(r => setData(r||[])).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const marcar = async (id) => {
    await alertasDB.marcarLeida(id);
    setData(p => p.map(a => a.id===id ? {...a, leida:true} : a));
    toast.success('Alerta marcada como leída');
  };

  const criticas = data.filter(a => a.tipo_alerta?.includes('vencido') || a.tipo_alerta?.includes('_5'));
  const altas    = data.filter(a => a.tipo_alerta?.includes('_15'));
  const noLeidas = data.filter(a => !a.leida).length;

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1>Alertas</h1><p>Notificaciones y alertas del sistema</p></div>
        <div className="hdr-actions">
          <div className="badge badge-red" style={{ padding:'6px 12px' }}><XCircle size={12}/>{criticas.length} Críticas</div>
          <div className="badge badge-orange" style={{ padding:'6px 12px' }}><Clock size={12}/>{altas.length} Alta prioridad</div>
          <div className="badge badge-green" style={{ padding:'6px 12px' }}><CheckCircle size={12}/>{data.filter(a=>a.leida).length} Resueltas</div>
          <button className="btn btn-secondary btn-sm"><Filter size={12}/> Filtros</button>
        </div>
      </div>

      <div className="card" style={{ flex:1, minHeight:0, overflow:'auto' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Cargando...</div>
        ) : data.length === 0 ? (
          <div style={{ padding:48, textAlign:'center' }}>
            <CheckCircle size={32} color="#94a3b8" style={{ margin:'0 auto 12px', display:'block' }}/>
            <div style={{ fontSize:14, fontWeight:500, color:'#64748b' }}>Sin alertas pendientes</div>
          </div>
        ) : data.map((a,i) => {
          const { icon, bg, label, badgeCls } = priorityStyle(a.tipo_alerta);
          return (
            <div key={a.id} className="alert-row" style={{ opacity: a.leida ? .6 : 1 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'#1e293b' }}>{a.contratos?.numero_contrato || 'Sistema'}</span>
                  <span className={`badge ${badgeCls}`}>{label}</span>
                  {a.leida && <span className="badge badge-green">Resuelta</span>}
                </div>
                <p style={{ fontSize:12, color:'#334155', fontWeight:500 }}>{a.mensaje}</p>
              </div>
              <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:11, color:'#475569' }}>{new Date(a.creado_en).toLocaleDateString('es-CO')}</p>
                  <p style={{ fontSize:10, color:'#94a3b8' }}>{new Date(a.creado_en).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</p>
                </div>
                {!a.leida && (
                  <div style={{ display:'flex', gap:4 }}>
                    <button className="btn btn-primary btn-sm" onClick={()=>marcar(a.id)}>Ver</button>
                    <button className="btn btn-secondary btn-sm" onClick={()=>marcar(a.id)}>Resolver</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
