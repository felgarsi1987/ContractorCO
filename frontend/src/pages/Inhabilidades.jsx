import { useState, useEffect } from 'react'
import { Shield, Plus, AlertTriangle, CheckCircle, Clock, Search, X, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { inhabilidades as inhabDB, contratistas as contratistasDB } from '../lib/db'

// Art. 8 Ley 80/93 — Inhabilidades e incompatibilidades
// Fuentes de consulta obligatoria
const FUENTES = [
  { value: 'procuraduria_siri',  label: 'Procuraduría — SIRI',          url: 'https://siri.procuraduria.gov.co', desc: 'Sistema de Información de Registro de Sanciones' },
  { value: 'contraloria',        label: 'Contraloría — SIRI',           url: 'https://www.contraloria.gov.co',  desc: 'Boletín de Responsables Fiscales' },
  { value: 'rama_judicial',      label: 'Rama Judicial',                url: 'https://www.ramajudicial.gov.co', desc: 'Consulta de antecedentes judiciales' },
  { value: 'policia',            label: 'Policía Nacional',             url: 'https://antecedentes.policia.gov.co', desc: 'Certificado de antecedentes judiciales' },
  { value: 'dian',               label: 'DIAN — RUT',                   url: 'https://www.dian.gov.co',         desc: 'Estado tributario' },
]

const RESULTADO_CONFIG = {
  limpio:       { label: 'Sin inhabilidades', color: '#059669', bg: 'rgba(5,150,105,0.12)',  Icon: CheckCircle },
  inhabilitado: { label: 'Inhabilitado',      color: '#DC2626', bg: 'rgba(220,38,38,0.12)', Icon: AlertTriangle },
  suspendido:   { label: 'Suspendido',        color: '#D97706', bg: 'rgba(217,119,6,0.12)', Icon: Clock },
  pendiente:    { label: 'Pendiente',         color: '#6366F1', bg: 'rgba(99,102,241,0.12)', Icon: Clock },
}

function SemaforoContratista({ consultas }) {
  if (!consultas || consultas.length === 0) return (
    <span style={{ fontSize:10, color:'rgba(167,243,208,0.35)', fontStyle:'italic' }}>Sin consultas</span>
  )
  const inhabilitado = consultas.some(c => c.resultado === 'inhabilitado')
  const suspendido   = consultas.some(c => c.resultado === 'suspendido')
  const vencidas     = consultas.filter(c => c.vigente_hasta && new Date(c.vigente_hasta) < new Date())

  if (inhabilitado) return <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(220,38,38,0.15)', color:'#F87171' }}>⛔ Inhabilitado</span>
  if (suspendido)   return <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(217,119,6,0.15)', color:'#FCD34D' }}>⚠ Suspendido</span>
  if (vencidas.length > 0) return <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(99,102,241,0.15)', color:'#A5B4FC' }}>🔄 Renovar ({vencidas.length})</span>
  return <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(5,150,105,0.15)', color:'#34D399' }}>✓ Vigente</span>
}

export default function Inhabilidades() {
  const [consultas, setConsultas]     = useState([])
  const [contratistas, setContratistas] = useState([])
  const [loading, setLoading]         = useState(true)
  const [buscar, setBuscar]           = useState('')
  const [filtroResultado, setFiltro]  = useState('')
  const [modal, setModal]             = useState(false)
  const [guardando, setGuardando]     = useState(false)

  const [form, setForm] = useState({
    contratista_id: '', fuente: '', fecha_consulta: new Date().toISOString().slice(0,10),
    resultado: 'limpio', detalle: '', vigente_hasta: '',
  })

  useEffect(() => { cargar() }, [filtroResultado])
  useEffect(() => {
    contratistasDB.listar({ limit: 500 }).then(r => setContratistas(r.data || []))
  }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await inhabDB.listar({ resultado: filtroResultado || undefined })
      setConsultas(data)
    } catch { toast.error('Error cargando consultas') }
    finally { setLoading(false) }
  }

  async function guardar() {
    if (!form.contratista_id || !form.fuente || !form.fecha_consulta) {
      toast.error('Completa contratista, fuente y fecha')
      return
    }
    setGuardando(true)
    try {
      await inhabDB.crear(form)
      toast.success('Consulta registrada')
      setModal(false)
      setForm({ contratista_id:'', fuente:'', fecha_consulta: new Date().toISOString().slice(0,10), resultado:'limpio', detalle:'', vigente_hasta:'' })
      cargar()
    } catch (e) { toast.error(e.message || 'Error') }
    finally { setGuardando(false) }
  }

  // Agrupar por contratista
  const porContratista = consultas.reduce((acc, c) => {
    const key = c.contratista_id
    if (!acc[key]) acc[key] = { contratista: c.contratistas, consultas: [] }
    acc[key].consultas.push(c)
    return acc
  }, {})

  const grupos = Object.values(porContratista).filter(g => {
    if (!buscar) return true
    const nombre = `${g.contratista?.nombres || ''} ${g.contratista?.apellidos || ''} ${g.contratista?.nit || ''} ${g.contratista?.cedula || ''}`.toLowerCase()
    return nombre.includes(buscar.toLowerCase())
  })

  const total       = consultas.length
  const inhabilitados = consultas.filter(c => c.resultado === 'inhabilitado').length
  const porVencer   = consultas.filter(c => c.vigente_hasta && new Date(c.vigente_hasta) < new Date(Date.now() + 30*864e5) && new Date(c.vigente_hasta) > new Date()).length
  const vencidas    = consultas.filter(c => c.vigente_hasta && new Date(c.vigente_hasta) < new Date()).length

  return (
    <div style={{ padding:'24px 28px', maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ color:'#ECFDF5', fontSize:20, fontWeight:700, margin:0, letterSpacing:'-0.02em' }}>
            Inhabilidades e Incompatibilidades
          </h1>
          <p style={{ color:'rgba(167,243,208,0.55)', fontSize:12, margin:'3px 0 0' }}>
            Art. 8 Ley 80/93 — Consulta obligatoria en SIRI, Contraloría y Rama Judicial
          </p>
        </div>
        <button onClick={() => setModal(true)} style={{
          display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
          background:'#059669', border:'none', borderRadius:7, color:'#fff',
          fontSize:12, fontWeight:600, cursor:'pointer',
        }}>
          <Plus size={14}/> Registrar consulta
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total consultas', val:total,         color:'#34D399', Icon:Shield },
          { label:'Inhabilitados',   val:inhabilitados, color:'#DC2626', Icon:AlertTriangle },
          { label:'Por vencer (30d)', val:porVencer,    color:'#D97706', Icon:Clock },
          { label:'Vencidas',        val:vencidas,      color:'#6366F1', Icon:AlertTriangle },
        ].map(({ label, val, color, Icon }) => (
          <div key={label} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${val > 0 && label !== 'Total consultas' ? `${color}44` : 'rgba(52,211,153,0.1)'}`, borderRadius:10, padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <Icon size={14} color={color}/>
              <span style={{ fontSize:10, color:'rgba(167,243,208,0.5)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</span>
            </div>
            <div style={{ fontSize:26, fontWeight:800, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Alerta si hay inhabilitados */}
      {inhabilitados > 0 && (
        <div style={{ background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:8, padding:'12px 16px', marginBottom:20, fontSize:12, color:'#FCA5A5', lineHeight:1.6 }}>
          <strong>⛔ ALERTA — Art. 8 Ley 80/93:</strong> Hay {inhabilitados} contratista(s) con inhabilidades activas. La celebración de contratos con personas inhabilitadas constituye causal de nulidad absoluta y puede generar responsabilidad disciplinaria y fiscal para el servidor público.
        </div>
      )}

      {/* Fuentes de consulta */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(52,211,153,0.08)', borderRadius:10, padding:'14px 16px', marginBottom:20 }}>
        <div style={{ fontSize:10, color:'rgba(167,243,208,0.4)', fontWeight:700, letterSpacing:'.08em', marginBottom:10 }}>FUENTES DE CONSULTA OBLIGATORIA — ART. 8 LEY 80/93</div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {FUENTES.map(f => (
            <a key={f.value} href={f.url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.15)', borderRadius:6, textDecoration:'none', color:'rgba(167,243,208,0.7)', fontSize:11 }}>
              <ExternalLink size={10}/>
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:10, marginBottom:20, alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, maxWidth:280 }}>
          <Search size={12} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'rgba(167,243,208,0.4)', pointerEvents:'none' }}/>
          <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar contratista..." style={{ width:'100%', padding:'6px 10px 6px 28px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:20, color:'#ECFDF5', fontSize:11, outline:'none', boxSizing:'border-box' }}/>
        </div>
        {[['','Todos'],['limpio','Limpios'],['inhabilitado','Inhabilitados'],['suspendido','Suspendidos'],['pendiente','Pendientes']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltro(v)} style={{ padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', background: filtroResultado === v ? '#059669' : 'rgba(255,255,255,0.06)', color: filtroResultado === v ? '#fff' : 'rgba(167,243,208,0.7)' }}>{l}</button>
        ))}
      </div>

      {/* Lista agrupada por contratista */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'rgba(167,243,208,0.4)', fontSize:13 }}>Cargando consultas...</div>
      ) : grupos.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'rgba(167,243,208,0.3)' }}>
          <Shield size={32} style={{ marginBottom:12, opacity:.3 }}/>
          <p style={{ margin:0 }}>No hay consultas de inhabilidades registradas</p>
          <p style={{ margin:'6px 0 0', fontSize:11 }}>Regístralas antes de cada proceso contractual</p>
        </div>
      ) : grupos.map(({ contratista, consultas: cs }) => (
        <div key={contratista?.id || Math.random()} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(52,211,153,0.1)', borderRadius:10, marginBottom:12, overflow:'hidden' }}>
          {/* Cabecera contratista */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid rgba(52,211,153,0.07)' }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'rgba(52,211,153,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#34D399', fontSize:12, fontWeight:700, flexShrink:0 }}>
              {(contratista?.nombres || '?')[0]}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ color:'#ECFDF5', fontSize:13, fontWeight:600 }}>
                {contratista?.nombres} {contratista?.apellidos}
              </div>
              <div style={{ fontSize:11, color:'rgba(167,243,208,0.45)' }}>
                {contratista?.cedula || contratista?.nit} · {contratista?.tipo_persona === 'juridica' ? 'Persona jurídica' : 'Persona natural'}
              </div>
            </div>
            <SemaforoContratista consultas={cs}/>
            <span style={{ fontSize:10, color:'rgba(167,243,208,0.4)' }}>{cs.length} consulta{cs.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Consultas */}
          <div style={{ padding:'10px 16px', display:'flex', flexDirection:'column', gap:8 }}>
            {cs.map(c => {
              const cfg = RESULTADO_CONFIG[c.resultado] || RESULTADO_CONFIG.limpio
              const vencida = c.vigente_hasta && new Date(c.vigente_hasta) < new Date()
              const proxima = c.vigente_hasta && !vencida && new Date(c.vigente_hasta) < new Date(Date.now() + 30*864e5)
              const fuente  = FUENTES.find(f => f.value === c.fuente)
              return (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 10px', background:'rgba(0,0,0,0.1)', borderRadius:7, border:`1px solid ${vencida ? 'rgba(220,38,38,0.2)' : 'rgba(52,211,153,0.06)'}` }}>
                  <cfg.Icon size={13} color={cfg.color} style={{ flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:12, color:'rgba(167,243,208,0.85)', fontWeight:500 }}>
                        {fuente?.label || c.fuente}
                      </span>
                      <span style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:8, background:cfg.bg, color:cfg.color }}>
                        {cfg.label}
                      </span>
                      {vencida && <span style={{ fontSize:10, fontWeight:700, color:'#F87171' }}>Vencida</span>}
                      {proxima && <span style={{ fontSize:10, fontWeight:700, color:'#FCD34D' }}>Vence pronto</span>}
                    </div>
                    {c.detalle && <div style={{ fontSize:11, color:'rgba(167,243,208,0.4)', marginTop:2 }}>{c.detalle}</div>}
                  </div>
                  <div style={{ textAlign:'right', fontSize:10, color:'rgba(167,243,208,0.4)', flexShrink:0 }}>
                    <div>Consultado: {c.fecha_consulta}</div>
                    {c.vigente_hasta && <div style={{ color: vencida ? '#F87171' : proxima ? '#FCD34D' : 'rgba(167,243,208,0.4)' }}>Vigente hasta: {c.vigente_hasta}</div>}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ padding:'6px 16px 10px', fontSize:10, color:'rgba(167,243,208,0.25)' }}>
            FUNDAMENTO: Art. 8 Ley 80/93 · Art. 38 Ley 734/02 · Consulta periódica obligatoria
          </div>
        </div>
      ))}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0D2918', border:'1px solid rgba(52,211,153,0.2)', borderRadius:12, padding:28, width:560, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h2 style={{ color:'#ECFDF5', margin:0, fontSize:16, fontWeight:700 }}>Registrar consulta de inhabilidades</h2>
                <p style={{ color:'rgba(167,243,208,0.5)', fontSize:11, margin:'3px 0 0' }}>Art. 8 Ley 80/93 — Obligación precontractual</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background:'transparent', border:'none', color:'rgba(167,243,208,0.5)', cursor:'pointer' }}><X size={18}/></button>
            </div>

            <div style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:11, color:'rgba(252,165,165,0.9)', lineHeight:1.6 }}>
              <strong>⚖ Art. 8 Ley 80/93:</strong> Antes de suscribir cualquier contrato, la entidad debe verificar que el contratista no se encuentre incurso en inhabilidades o incompatibilidades. Esta verificación debe renovarse periódicamente durante la ejecución.
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>Contratista *</label>
                <select value={form.contratista_id} onChange={e => setForm(f => ({ ...f, contratista_id: e.target.value }))} style={sel}>
                  <option value="">Seleccionar contratista...</option>
                  {contratistas.map(c => (
                    <option key={c.id} value={c.id}>{c.nombres} {c.apellidos} — {c.cedula || c.nit}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Fuente de consulta *</label>
                <select value={form.fuente} onChange={e => setForm(f => ({ ...f, fuente: e.target.value }))} style={sel}>
                  <option value="">Seleccionar fuente...</option>
                  {FUENTES.map(f => <option key={f.value} value={f.value}>{f.label} — {f.desc}</option>)}
                </select>
                {form.fuente && (
                  <a href={FUENTES.find(f => f.value === form.fuente)?.url} target="_blank" rel="noreferrer"
                    style={{ fontSize:10, color:'#34D399', display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
                    <ExternalLink size={10}/> Abrir portal de consulta
                  </a>
                )}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Fecha de consulta *</label>
                  <input type="date" value={form.fecha_consulta} onChange={e => setForm(f => ({ ...f, fecha_consulta: e.target.value }))} style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Vigente hasta</label>
                  <input type="date" value={form.vigente_hasta} onChange={e => setForm(f => ({ ...f, vigente_hasta: e.target.value }))} style={inp}/>
                </div>
              </div>
              <div>
                <label style={lbl}>Resultado *</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {Object.entries(RESULTADO_CONFIG).map(([v, cfg]) => (
                    <label key={v} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background: form.resultado === v ? cfg.bg : 'rgba(255,255,255,0.04)', border:`1px solid ${form.resultado === v ? cfg.color + '60' : 'rgba(52,211,153,0.12)'}`, borderRadius:6, cursor:'pointer', transition:'all .15s' }}>
                      <input type="radio" name="resultado" value={v} checked={form.resultado === v} onChange={e => setForm(f => ({ ...f, resultado: e.target.value }))} style={{ accentColor:cfg.color }}/>
                      <cfg.Icon size={12} color={cfg.color}/>
                      <span style={{ fontSize:11, color: form.resultado === v ? cfg.color : 'rgba(167,243,208,0.7)', fontWeight: form.resultado === v ? 600 : 400 }}>{cfg.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Detalle / observaciones</label>
                <textarea rows={3} value={form.detalle} onChange={e => setForm(f => ({ ...f, detalle: e.target.value }))} placeholder="Número de radicado, descripción de la sanción, etc." style={{ ...inp, resize:'vertical' }}/>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={() => setModal(false)} style={{ padding:'8px 18px', background:'transparent', border:'1px solid rgba(52,211,153,0.2)', borderRadius:7, color:'rgba(167,243,208,0.7)', fontSize:12, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando} style={{ padding:'8px 18px', background:'#059669', border:'none', borderRadius:7, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', opacity: guardando ? .6 : 1 }}>
                {guardando ? 'Guardando...' : 'Registrar consulta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl = { display:'block', fontSize:11, color:'rgba(167,243,208,0.55)', fontWeight:600, marginBottom:5, letterSpacing:'.04em' }
const inp = { width:'100%', padding:'8px 10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:6, color:'#ECFDF5', fontSize:12, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }
const sel = { ...inp, cursor:'pointer' }
