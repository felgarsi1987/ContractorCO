import { useState, useEffect } from 'react';
import api from '../services/api';
import KpiCard from '../components/ui/KpiCard';
import toast from 'react-hot-toast';

export default function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlertas = () => {
    api.get('/alertas?limit=50').then(r => setAlertas(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAlertas(); }, []);

  const marcarLeida = async (id) => {
    await api.put(`/alertas/${id}/leer`);
    setAlertas(prev => prev.map(a => a.id === id ? {...a, leida: true} : a));
    toast.success('Alerta marcada como leída');
  };

  const criticas  = alertas.filter(a => a.tipo_alerta?.includes('vencido') || a.tipo_alerta?.includes('_5'));
  const warnings  = alertas.filter(a => !criticas.includes(a));
  const noLeidas  = alertas.filter(a => !a.leida).length;

  return (
    <>
      <div className="page-header">
        <div><h2>Centro de Alertas</h2><p>Supervisión y cumplimiento normativo de la cartera de contratos.</p></div>
        <div className="hdr-actions">
          <button className="btn btn-secondary"><span className="ms ms-sm">filter_list</span>Filtrar</button>
          <button className="btn btn-secondary" onClick={() => api.post('/alertas/procesar').then(() => { fetchAlertas(); toast.success('Alertas actualizadas'); })}>
            <span className="ms ms-sm">refresh</span>Actualizar
          </button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <KpiCard icon="emergency" iconColor="var(--danger)" iconBg="var(--danger-bg)" label="Total Críticas" value={criticas.length} sub={`+${Math.max(0,criticas.length-5)} desde ayer`} />
        <KpiCard icon="warning" iconColor="var(--warning)" iconBg="var(--warning-bg)" label="Advertencias" value={warnings.length} sub="Pendiente revisión" />
        <KpiCard icon="event_busy" iconColor="var(--info)" iconBg="var(--info-bg)" label="Vencimientos (7d)" value={alertas.filter(a=>a.tipo_alerta?.includes('_5')).length} sub="Contratos próximos" />
        <div className="kpi-card" style={{ background: 'var(--primary)', borderColor: 'var(--primary)' }}>
          <div className="kpi-label" style={{ color: 'rgba(255,255,255,.6)' }}>Sin Leer</div>
          <div className="kpi-value" style={{ color: '#fff' }}>{noLeidas}</div>
          <div className="progress-track" style={{ marginTop: 8, background: 'var(--primary-container)' }}>
            <div className="progress-fill" style={{ width: `${alertas.length ? (1 - noLeidas/alertas.length)*100 : 100}%`, background: '#fff' }} />
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="stack">
          {criticas.length > 0 && (
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:10 }}>
                <span style={{ width:7,height:7,borderRadius:'50%',background:'var(--danger)',display:'inline-block' }} />
                <span className="text-label c-primary">Prioridad Crítica</span>
              </div>
              <div className="stack-sm">
                {criticas.map(a => <AlertCard key={a.id} alerta={a} onLeer={marcarLeida} tipo="danger" />)}
              </div>
            </div>
          )}
          {warnings.length > 0 && (
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:10 }}>
                <span style={{ width:7,height:7,borderRadius:'50%',background:'var(--warning)',display:'inline-block' }} />
                <span className="text-label c-primary">Advertencias</span>
              </div>
              <div className="stack-sm">
                {warnings.map(a => <AlertCard key={a.id} alerta={a} onLeer={marcarLeida} tipo="warning" />)}
              </div>
            </div>
          )}
          {alertas.length === 0 && !loading && (
            <div style={{ padding: 48, textAlign:'center', color:'var(--outline)' }}>
              <span className="ms ms-lg" style={{ display:'block',marginBottom:8 }}>check_circle</span>
              No hay alertas pendientes
            </div>
          )}
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-header"><h4>Configuración de Alertas</h4></div>
            <div style={{ padding:'12px 14px',display:'flex',flexDirection:'column' }}>
              {[['30 días antes','ok'],['15 días antes','ok'],['5 días antes','ok'],['Push móvil','ok'],['Correo electrónico','ok'],['Auditoría automática','ok']].map(([l,s])=>(
                <div key={l} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12 }}>{l}</span>
                  <span className="tag tag-ok" style={{ fontSize:10 }}>Activo</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AlertCard({ alerta, onLeer, tipo }) {
  const icons = { danger: 'report', warning: 'schedule' };
  return (
    <div className={`alert-card ${tipo}`} style={{ opacity: alerta.leida ? .5 : 1 }}>
      <div className={`alert-icon ${tipo === 'warning' ? 'warning' : ''}`}>
        <span className="ms">{icons[tipo]}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display:'flex',justifyContent:'space-between' }}>
          <p style={{ fontSize:13,fontWeight:500,color:'var(--primary)' }}>{alerta.tipo_alerta?.replace(/_/g,' ')}</p>
          <span style={{ fontSize:10,color:'var(--outline)',whiteSpace:'nowrap',marginLeft:8 }}>
            {new Date(alerta.creado_en).toLocaleString('es-CO')}
          </span>
        </div>
        <p style={{ fontSize:12,color:'var(--on-surface-var)',marginTop:3,lineHeight:1.5 }}>{alerta.mensaje}</p>
        {!alerta.leida && (
          <div style={{ marginTop:8,display:'flex',gap:8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => onLeer(alerta.id)}>Marcar leída</button>
          </div>
        )}
      </div>
    </div>
  );
}
