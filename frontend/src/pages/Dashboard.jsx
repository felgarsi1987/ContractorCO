import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboard, contratos as contratosDB, alertas as alertasDB } from '../lib/db'
import { supabase } from '../lib/supabase'
import StatusTag from '../components/ui/StatusTag'
import KpiCard from '../components/ui/KpiCard'
import { formatCOP } from '../utils/format'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats,     setStats]     = useState(null)
  const [contratos, setContratos] = useState([])
  const [alertas,   setAlertas]   = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      dashboard.getStats(),
      contratosDB.listar({ limit: 5 }),
      alertasDB.listar({ leida: false, limit: 4 }),
    ]).then(([s, c, a]) => {
      setStats(s)
      setContratos(c.data || [])
      setAlertas(a || [])
    }).catch(console.error)
      .finally(() => setLoading(false))

    // Realtime: refrescar dashboard cuando cambien contratos
    const channel = supabase
      .channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contratos' },
        () => dashboard.getStats().then(setStats)
      ).subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh' }}>
      <span className="ms animate-spin" style={{ fontSize:32, color:'var(--primary)' }}>refresh</span>
    </div>
  )

  const cumplimiento = [
    { label:'Prestación de servicios', valor:87, color:'var(--success)' },
    { label:'Obra',                    valor:72, color:'var(--warning)' },
    { label:'Suministro',              valor:61, color:'var(--warning)' },
    { label:'Consultoría',             valor:95, color:'var(--success)' },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Resumen General</h2>
          <p>Panel de control de contratos y cumplimiento administrativo.</p>
        </div>
        <div className="hdr-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/reportes')}>
            <span className="ms ms-sm">download</span>Exportar Datos
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/reportes')}>
            <span className="ms ms-sm">summarize</span>Reporte Mensual
          </button>
        </div>
      </div>

      <div className="grid-kpi">
        <KpiCard icon="description"     iconColor="var(--info)"    iconBg="var(--info-bg)"    label="Contratos Activos"       value={stats?.contratos_activos ?? 0}          sub="En ejecución"            trend="+12%" trendOk />
        <KpiCard icon="event_upcoming"  iconColor="var(--warning)" iconBg="var(--warning-bg)" label="Próximos a Vencer"       value={stats?.contratos_proximos_vencer ?? 0}  sub="Próximos 30 días"        trend="Crítico" trendOk={false} />
        <KpiCard icon="assignment_late" iconColor="var(--danger)"  iconBg="var(--danger-bg)"  label="Docs. Pendientes"        value={stats?.documentos_vencidos ?? 0}        sub="Requieren acción"        trend="Atraso" trendOk={false} />
        <KpiCard icon="engineering"     iconColor="var(--primary)" iconBg="rgba(4,22,56,.06)" label="Contratistas Registrados" value={stats?.contratistas_activos ?? 0}       sub="94% verificados" />
      </div>

      <div className="grid-3">
        <div className="stack">
          <div className="card">
            <div className="card-header">
              <h4>Contratos Recientes</h4>
              <button className="btn btn-ghost" onClick={() => navigate('/contratos')}>Ver todos</button>
            </div>
            <table className="data-table">
              <thead><tr><th>N° Contrato</th><th>Contratista</th><th>Valor</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {contratos.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/contratos/${c.id}`)}>
                    <td className="td-primary">{c.numero_contrato}</td>
                    <td className="td-secondary">{c.contratista_nombre}</td>
                    <td className="td-secondary">{formatCOP(c.valor_actual)}</td>
                    <td><StatusTag value={c.semaforo} /></td>
                    <td><span className="ms ms-sm" style={{ color:'var(--secondary-text)' }}>visibility</span></td>
                  </tr>
                ))}
                {contratos.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign:'center', padding:24, color:'var(--outline)' }}>Sin contratos registrados aún.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="navy-banner">
            <div>
              <h4>Análisis de Cumplimiento</h4>
              <p>Los contratistas mejoraron su puntaje de cumplimiento 18.4% este trimestre.</p>
            </div>
            <button className="btn" style={{ background:'#fff', color:'var(--primary)', border:'none', whiteSpace:'nowrap' }}
              onClick={() => navigate('/reportes')}>Ver Informe</button>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-header">
              <h4>Alertas Críticas</h4>
              <span className="tag tag-danger">{stats?.alertas_pendientes ?? 0} activas</span>
            </div>
            <div style={{ padding:12, display:'flex', flexDirection:'column', gap:8 }}>
              {alertas.map(a => (
                <div key={a.id} style={{ padding:'10px 12px', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer' }}
                  onClick={() => navigate('/alertas')}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(185,28,28,.25)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span className="ms ms-sm" style={{ color: a.tipo_alerta?.includes('documento') ? 'var(--warning)' : 'var(--danger)' }}>report</span>
                    <div style={{ fontSize:12, fontWeight:500, color:'var(--primary)', flex:1 }}>{a.contratos?.numero_contrato || 'Alerta del sistema'}</div>
                    <span style={{ fontSize:10, color:'var(--outline)' }}>{new Date(a.creado_en).toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })}</span>
                  </div>
                  <p style={{ fontSize:11, color:'var(--secondary-text)', marginTop:4, lineHeight:1.4 }}>{a.mensaje}</p>
                </div>
              ))}
              {alertas.length === 0 && (
                <div style={{ padding:20, textAlign:'center', color:'var(--outline)', fontSize:12 }}>
                  <span className="ms ms-sm" style={{ display:'block', marginBottom:4 }}>check_circle</span>
                  Sin alertas pendientes
                </div>
              )}
            </div>
            <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', textAlign:'center' }}>
              <button className="btn btn-ghost" onClick={() => navigate('/alertas')}>Ver todas →</button>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h4>Cumplimiento por Tipo</h4></div>
            <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
              {cumplimiento.map(({ label, valor, color }) => (
                <div key={label}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                    <span style={{ color:'var(--secondary-text)' }}>{label}</span>
                    <span style={{ fontWeight:600 }}>{valor}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width:`${valor}%`, background:color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
