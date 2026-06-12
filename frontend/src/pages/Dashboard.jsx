import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import StatusTag from '../components/ui/StatusTag';
import KpiCard from '../components/ui/KpiCard';
import { formatCOP, diasRestantes, clasesDias } from '../utils/format';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [contratos, setContratos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [cumplimiento, setCumplimiento] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/contratos?limit=5&estado=en_ejecucion'),
      api.get('/alertas?limit=3&leida=false'),
    ]).then(([d, c, a]) => {
      setStats(d.data);
      setContratos(c.data.data || []);
      setAlertas(a.data || []);
      setCumplimiento([
        { label: 'Prestación de servicios', valor: 87, color: 'var(--success)' },
        { label: 'Obra', valor: 72, color: 'var(--warning)' },
        { label: 'Suministro', valor: 61, color: 'var(--warning)' },
        { label: 'Consultoría', valor: 95, color: 'var(--success)' },
      ]);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <>
      {/* ── Page header ──────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Resumen General</h2>
          <p>Panel de control de contratos y cumplimiento administrativo.</p>
        </div>
        <div className="hdr-actions">
          <button className="btn btn-secondary">
            <span className="ms ms-sm">download</span>Exportar Datos
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/reportes')}>
            <span className="ms ms-sm">summarize</span>Reporte Mensual
          </button>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <div className="grid-kpi">
        <KpiCard
          icon="description" iconColor="var(--info)" iconBg="var(--info-bg)"
          label="Contratos Activos"
          value={stats?.contratos_activos ?? '—'}
          sub="Vigencia promedio: 8.4 meses"
          trend="+12%" trendOk
        />
        <KpiCard
          icon="event_upcoming" iconColor="var(--warning)" iconBg="var(--warning-bg)"
          label="Próximos a Vencer"
          value={stats?.contratos_proximos_vencer ?? '—'}
          sub="Próximos 30 días"
          trend="Crítico" trendOk={false}
        />
        <KpiCard
          icon="assignment_late" iconColor="var(--danger)" iconBg="var(--danger-bg)"
          label="Documentación Pendiente"
          value={stats?.documentos_vencidos ?? '—'}
          sub="Requieren acción inmediata"
          trend="Atraso alto" trendOk={false}
        />
        <KpiCard
          icon="engineering" iconColor="var(--primary)" iconBg="rgba(4,22,56,.06)"
          label="Contratistas Registrados"
          value={stats?.contratistas_activos ?? '—'}
          sub="94% verificados"
          trend="Total sistema"
        />
      </div>

      {/* ── Contenido principal ───────────────────────────── */}
      <div className="grid-3">
        {/* Columna izquierda */}
        <div className="stack">
          {/* Tabla contratos */}
          <div className="card">
            <div className="card-header">
              <h4>Contratos Recientes</h4>
              <button className="btn btn-ghost" onClick={() => navigate('/contratos')}>
                Ver todos
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Contrato</th>
                  <th>Contratista</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contratos.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/contratos/${c.id}`)}>
                    <td className="td-primary">{c.numero_contrato}</td>
                    <td className="td-secondary">{c.contratista_nombre}</td>
                    <td className="td-secondary">{formatCOP(c.valor_actual)}</td>
                    <td><StatusTag value={c.semaforo} /></td>
                    <td><span className="ms ms-sm" style={{ color: 'var(--secondary-text)' }}>visibility</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Banner navy */}
          <div className="navy-banner">
            <div>
              <h4>Análisis de Cumplimiento Contractual</h4>
              <p>Los contratistas han mejorado su puntaje de cumplimiento en un 18.4% este trimestre.</p>
            </div>
            <button
              className="btn"
              style={{ background: '#fff', color: 'var(--primary)', border: 'none', whiteSpace: 'nowrap' }}
              onClick={() => navigate('/reportes')}
            >
              Ver Informe
            </button>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="stack">
          {/* Alertas */}
          <div className="card">
            <div className="card-header">
              <h4>Alertas Críticas</h4>
              <span className="tag tag-danger">{stats?.alertas_pendientes ?? 0} activas</span>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alertas.map(a => (
                <div
                  key={a.id}
                  style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer' }}
                  onClick={() => navigate('/alertas')}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(185,28,28,.25)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="ms ms-sm" style={{ color: a.tipo_alerta?.includes('documento') ? 'var(--warning)' : 'var(--danger)' }}>
                      {a.tipo_alerta?.includes('documento') ? 'folder_off' : 'report'}
                    </span>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--primary)', flex: 1 }}>{a.tipo_alerta?.replace(/_/g, ' ')}</div>
                    <span style={{ fontSize: 10, color: 'var(--outline)' }}>{format(new Date(a.creado_en), 'HH:mm')}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--secondary-text)', marginTop: 4, lineHeight: 1.4 }}>{a.mensaje}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              <button className="btn btn-ghost" onClick={() => navigate('/alertas')}>Ver todas las alertas →</button>
            </div>
          </div>

          {/* Cumplimiento por tipo */}
          <div className="card">
            <div className="card-header"><h4>Cumplimiento por Tipo</h4></div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cumplimiento.map(({ label, valor, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--secondary-text)' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{valor}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${valor}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PageSkeleton() {
  return (
    <div style={{ opacity: .5 }}>
      <div style={{ height: 28, width: 200, background: 'var(--surface-container)', borderRadius: 4, marginBottom: 24 }} />
      <div className="grid-kpi">
        {[1,2,3,4].map(i => (
          <div key={i} style={{ height: 110, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 6 }} />
        ))}
      </div>
    </div>
  );
}
