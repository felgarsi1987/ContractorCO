import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import EmptyState from '../components/ui/EmptyState';

const ACCIONES = ['','crear','actualizar','eliminar','consultar','login','logout'];
const TABLAS   = ['','usuarios','contratos','contratistas','documentos','alertas','adiciones_contratos'];

const badgeClass = { crear:'tag-ok', actualizar:'tag-warning', eliminar:'tag-danger', consultar:'tag-gray', login:'tag-info', logout:'tag-gray' };

export default function Auditoria() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [accion,  setAccion]  = useState('');
  const [tabla,   setTabla]   = useState('');
  const [desde,   setDesde]   = useState('');
  const [hasta,   setHasta]   = useState('');
  const [page,    setPage]    = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit:50 });
    if (accion) p.set('accion', accion);
    if (tabla)  p.set('tabla',  tabla);
    if (desde)  p.set('desde',  desde);
    if (hasta)  p.set('hasta',  hasta);
    api.get('/auditoria?' + p).then(r => setData(r.data || [])).finally(() => setLoading(false));
  }, [page, accion, tabla, desde, hasta]);

  useEffect(() => { load(); }, [load]);

  const exportar = () => {
    if (!data.length) return;
    const keys = ['timestamp','usuario_nombre','accion','tabla_afectada','registro_id','ip_origen'];
    const csv = [keys.join(','), ...data.map(r => keys.map(k => JSON.stringify(r[k]??'')).join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `auditoria_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Auditoría de Cambios</h2><p>Log inmutable de todas las acciones del sistema.</p></div>
        <div className="hdr-actions">
          <button className="btn btn-secondary" onClick={exportar}>
            <span className="ms ms-sm">download</span>Exportar CSV
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar" style={{ flexWrap:'wrap', gap:8 }}>
          <select className="select" value={accion} onChange={e=>{setAccion(e.target.value);setPage(1);}}>
            <option value="">Todas las acciones</option>
            {ACCIONES.filter(a=>a).map(a=><option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>)}
          </select>
          <select className="select" value={tabla} onChange={e=>{setTabla(e.target.value);setPage(1);}}>
            <option value="">Todas las tablas</option>
            {TABLAS.filter(t=>t).map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <div className="field" style={{ flexDirection:'row', alignItems:'center', gap:6, margin:0 }}>
            <label style={{ fontSize:11, color:'var(--secondary-text)', whiteSpace:'nowrap' }}>Desde</label>
            <input className="input" type="date" style={{ width:140 }} value={desde} onChange={e=>setDesde(e.target.value)} />
          </div>
          <div className="field" style={{ flexDirection:'row', alignItems:'center', gap:6, margin:0 }}>
            <label style={{ fontSize:11, color:'var(--secondary-text)', whiteSpace:'nowrap' }}>Hasta</label>
            <input className="input" type="date" style={{ width:140 }} value={hasta} onChange={e=>setHasta(e.target.value)} />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => { setAccion(''); setTabla(''); setDesde(''); setHasta(''); setPage(1); }}>
            <span className="ms ms-sm">filter_alt_off</span>Limpiar
          </button>
          <span className="spacer" />
          <span className="text-caption c-secondary">{data.length} registros</span>
        </div>

        {loading ? (
          <div style={{ padding:40, textAlign:'center' }}><span className="ms animate-spin">refresh</span></div>
        ) : data.length === 0 ? (
          <EmptyState icon="policy" title="Sin registros" description="No hay entradas de auditoría con los filtros aplicados." />
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha / Hora</th><th>Usuario</th><th>Acción</th>
                  <th>Tabla</th><th>Registro</th><th>IP Origen</th>
                </tr>
              </thead>
              <tbody>
                {data.map(r => (
                  <tr key={r.id}>
                    <td className="td-secondary" style={{ whiteSpace:'nowrap' }}>
                      {new Date(r.timestamp).toLocaleString('es-CO')}
                    </td>
                    <td style={{ fontWeight:500 }}>{r.usuario_nombre || 'Sistema'}</td>
                    <td>
                      <span className={'tag ' + (badgeClass[r.accion] || 'tag-gray')} style={{ borderRadius:4 }}>
                        {r.accion}
                      </span>
                    </td>
                    <td className="td-secondary">{r.tabla_afectada}</td>
                    <td className="td-secondary td-truncate" style={{ maxWidth:180 }}>{r.registro_id || '—'}</td>
                    <td className="td-mono">{r.ip_origen || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span className="text-caption c-secondary">Página {page}</span>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>
              <span className="ms ms-sm">chevron_left</span>
            </button>
            <button className="btn btn-secondary btn-sm" disabled={data.length < 50} onClick={()=>setPage(p=>p+1)}>
              <span className="ms ms-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
