import { useState, useEffect, useCallback } from 'react';
import { Shield, User, FileText, Calendar, Clock, Filter } from 'lucide-react';
import { auditoria as auditoriaDB } from '../lib/db';

const actionBadge = (a) => {
  const map = { crear:'badge-green', actualizar:'badge-orange', eliminar:'badge-red', consultar:'badge-gray', login:'badge-blue', logout:'badge-gray' };
  return <span className={`badge ${map[a]||'badge-gray'}`}>{a}</span>;
};

export default function Auditoria() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    auditoriaDB.listar({ page, limit:50 }).then(r=>setData(r||[])).finally(()=>setLoading(false));
  }, [page]);
  useEffect(() => { load(); }, [load]);

  const kpis = [
    { label:'Acciones Hoy',   val:data.filter(r=>r.timestamp?.slice(0,10)===new Date().toISOString().slice(0,10)).length, Icon:FileText, bg:'#D1FAE5', ic:'#10B981', sub:'Actividades registradas' },
    { label:'Usuarios Activos', val: new Set(data.map(r=>r.usuario_id)).size, Icon:User, bg:'#dcfce7', ic:'#16a34a', sub:'Usuarios únicos' },
    { label:'Eventos Críticos', val:data.filter(r=>r.accion==='eliminar').length, Icon:Shield, bg:'#ECFDF5', ic:'#059669', sub:'Esta semana' },
    { label:'Retención',        val:90, Icon:Calendar, bg:'#F0FDFA', ic:'#0D9488', sub:'Días de historial' },
  ];

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1>Auditoría</h1><p>Registro de actividades y trazabilidad del sistema</p></div>
        <button className="btn btn-secondary btn-sm"><Filter size={12}/> Filtros Avanzados</button>
      </div>

      <div className="grid-4" style={{ flexShrink:0 }}>
        {kpis.map(({ label, val, sub, Icon, bg, ic }) => (
          <div key={label} className="card" style={{ padding:'12px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{ padding:6, borderRadius:6, background:bg }}><Icon size={14} style={{ color:ic }}/></div>
              <span style={{ fontSize:10, fontWeight:600, color:'#64748b', letterSpacing:'.06em', textTransform:'uppercase' }}>{label}</span>
            </div>
            <div style={{ fontSize:22, fontWeight:600, color:'#064E3B' }}>{val}</div>
            <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'10px 16px', borderBottom:'1px solid #e2e8f0', flexShrink:0 }}>
          <div style={{ fontSize:12, fontWeight:600 }}>Registro de Actividades</div>
        </div>
        <div style={{ flex:1, overflow:'auto' }}>
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Cargando...</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Acción</th><th>Detalle</th><th>Usuario</th><th>Tabla</th><th>IP</th><th>Fecha / Hora</th></tr></thead>
              <tbody>
                {data.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ padding:4, borderRadius:4, background:'#f1f5f9' }}><Shield size={11} color="#64748b"/></div>
                        {actionBadge(r.accion)}
                      </div>
                    </td>
                    <td className="td-muted td-truncate">{JSON.stringify(r.datos_nuevos)?.slice(0,60) || '—'}</td>
                    <td>
                      <div style={{ fontSize:12, fontWeight:500 }}>{r.usuario?.nombre || 'Sistema'}</div>
                    </td>
                    <td className="td-muted">{r.tabla_afectada}</td>
                    <td style={{ fontSize:11, fontFamily:'monospace', color:'#64748b' }}>{r.ip_origen || '—'}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#475569' }}>
                        <Calendar size={11} color="#94a3b8"/>{new Date(r.timestamp).toLocaleDateString('es-CO')}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#94a3b8' }}>
                        <Clock size={10}/>{new Date(r.timestamp).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Sin registros.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding:'10px 16px', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <span style={{ fontSize:12, color:'#64748b' }}>Página {page}</span>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Anterior</button>
            <button className="btn btn-primary btn-sm" disabled={data.length<50} onClick={()=>setPage(p=>p+1)}>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
