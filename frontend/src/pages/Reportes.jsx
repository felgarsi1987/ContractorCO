import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const REPORTES = [
  { id:'contratos',    icon:'article',           title:'Reporte de Contratos',        desc:'Listado completo con estado, semáforo y valores de todos los contratos.',  endpoint:'/reportes/contratos',    badge:'Excel / PDF' },
  { id:'vencimientos', icon:'event_busy',         title:'Vencimientos Próximos',        desc:'Contratos y documentos en alerta dentro de los próximos 30, 15 o 5 días.', endpoint:'/reportes/vencimientos', badge:'Excel / PDF' },
  { id:'supervisores', icon:'manage_accounts',    title:'Por Supervisor',               desc:'Cartera de contratos agrupada por supervisor asignado.',                   endpoint:'/supervisores',          badge:'Excel / PDF' },
  { id:'indicadores',  icon:'bar_chart',          title:'Indicadores de Gestión',       desc:'KPIs de cumplimiento para Contraloría, Personería y entes de control.',    endpoint:'/reportes/contratos',    badge:'PDF'         },
  { id:'presupuesto',  icon:'payments',           title:'Por Valor y Tipo',             desc:'Distribución del presupuesto contractual por tipo y dependencia.',         endpoint:'/reportes/contratos',    badge:'Excel / PDF' },
  { id:'auditoria',    icon:'policy',             title:'Log de Auditoría',             desc:'Trazabilidad completa de cambios con usuario, fecha e IP de origen.',      endpoint:'/auditoria',             badge:'Excel / PDF' },
];

export default function Reportes() {
  const [loading, setLoading] = useState('');

  const generar = async (reporte) => {
    setLoading(reporte.id);
    try {
      const { data } = await api.get(reporte.endpoint);
      // Generar CSV en el navegador
      if (!data.length) return toast('Sin datos para exportar.');
      const keys = Object.keys(data[0]);
      const csv  = [keys.join(','), ...data.map(row =>
        keys.map(k => JSON.stringify(row[k] ?? '')).join(',')
      )].join('\n');
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${reporte.id}_${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Reporte descargado correctamente');
    } catch(e) {
      toast.error('Error al generar el reporte');
    } finally { setLoading(''); }
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Reportes y Exportaciones</h2><p>Generación de informes para entes de control y gestión interna.</p></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:16 }}>
        {REPORTES.map(r => (
          <div
            key={r.id}
            className="card"
            style={{ padding:18, cursor:'pointer', transition:'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <div style={{ width:40, height:40, borderRadius:6, background:'rgba(4,22,56,.06)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span className="ms" style={{ fontSize:22, color:'var(--primary)' }}>{r.icon}</span>
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--primary)' }}>{r.title}</div>
                <span className="tag tag-gray" style={{ fontSize:10, marginTop:2 }}>{r.badge}</span>
              </div>
            </div>
            <p style={{ fontSize:12, color:'var(--secondary-text)', marginBottom:14, lineHeight:1.5 }}>{r.desc}</p>
            <button
              className="btn btn-primary"
              style={{ width:'100%', justifyContent:'center' }}
              onClick={() => generar(r)}
              disabled={loading === r.id}
            >
              {loading === r.id
                ? <span className="ms animate-spin" style={{ fontSize:18 }}>refresh</span>
                : <><span className="ms ms-sm">download</span>Generar Reporte</>}
            </button>
          </div>
        ))}
      </div>

      {/* Acceso rápido */}
      <div className="navy-banner" style={{ marginTop:24 }}>
        <div>
          <h4>Reportes programados</h4>
          <p>Configura informes automáticos semanales o mensuales enviados por correo a los supervisores y administradores.</p>
        </div>
        <button className="btn" style={{ background:'#fff', color:'var(--primary)', border:'none', whiteSpace:'nowrap' }}>
          <span className="ms ms-sm">schedule</span>Configurar
        </button>
      </div>
    </>
  );
}
