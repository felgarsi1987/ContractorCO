import { useState, useEffect } from 'react'
import { Wallet, Plus, CheckCircle, AlertTriangle, X, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { presupuesto as presDB, contratos as contratosDB } from '../lib/db'

// Ley 819/2003 Art. 7 — Consistencia fiscal
// Decreto 111/1996 — Estatuto Orgánico del Presupuesto
const TIPO_CONFIG = {
  cdp: {
    label: 'CDP',
    full:  'Certificado de Disponibilidad Presupuestal',
    color: '#6366F1', bg: 'rgba(99,102,241,0.12)',
    legal: 'Art. 71 Decreto 111/1996',
    desc:  'Acredita que existe apropiación disponible para comprometer el gasto',
  },
  rp: {
    label: 'RP',
    full:  'Registro Presupuestal',
    color: '#059669', bg: 'rgba(5,150,105,0.12)',
    legal: 'Art. 71 Decreto 111/1996',
    desc:  'Garantiza que los recursos quedan reservados para el pago del contrato',
  },
  op: {
    label: 'OP',
    full:  'Orden de Pago',
    color: '#D97706', bg: 'rgba(217,119,6,0.12)',
    legal: 'Art. 36 Decreto 111/1996',
    desc:  'Instrucción de pago al tesorero sobre los recursos apropiados',
  },
}

const FUENTES = ['Recursos propios','SGP','SGR','Crédito','Cofinanciación','Recursos de capital','Otros']
const RUBROS_EJEMPLO = ['2-2-01-01-001','2-2-01-02-001','2-2-02-01-001','3-1-01-01-001']

function TipoBadge({ tipo }) {
  const cfg = TIPO_CONFIG[tipo]
  if (!cfg) return null
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:10, background:cfg.bg, color:cfg.color }}>
      {cfg.label}
    </span>
  )
}

export default function Presupuesto() {
  const [lista, setLista]         = useState([])
  const [contratos, setContratos] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroContrato, setFiltroContrato] = useState('')

  const [form, setForm] = useState({
    tipo: 'cdp', contrato_id: '', numero: '', fecha_expedicion: new Date().toISOString().slice(0,10),
    vigencia: String(new Date().getFullYear()), rubro_presupuestal: '',
    fuente_financiacion: '', valor: '', valor_afectado: '',
    observaciones: '', cdp_id: '',
  })

  useEffect(() => { cargar() }, [filtroTipo, filtroContrato])
  useEffect(() => { contratosDB.listar({ limit:200 }).then(r => setContratos(r.data || [])) }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await presDB.listar({ tipo: filtroTipo || undefined, contrato_id: filtroContrato || undefined })
      setLista(data)
    } catch { toast.error('Error cargando registros') }
    finally { setLoading(false) }
  }

  async function guardar() {
    if (!form.numero || !form.valor || !form.fecha_expedicion) {
      toast.error('Completa número, valor y fecha')
      return
    }
    setGuardando(true)
    try {
      await presDB.crear({
        ...form,
        valor:          parseFloat(form.valor),
        valor_afectado: parseFloat(form.valor_afectado) || null,
        cdp_id:         form.cdp_id || null,
      })
      toast.success(`${TIPO_CONFIG[form.tipo]?.label} registrado`)
      setModal(false)
      setForm({ tipo:'cdp', contrato_id:'', numero:'', fecha_expedicion: new Date().toISOString().slice(0,10), vigencia: String(new Date().getFullYear()), rubro_presupuestal:'', fuente_financiacion:'', valor:'', valor_afectado:'', observaciones:'', cdp_id:'' })
      cargar()
    } catch (e) { toast.error(e.message || 'Error') }
    finally { setGuardando(false) }
  }

  const valorCDP = lista.filter(i => i.tipo === 'cdp').reduce((s, i) => s + Number(i.valor || 0), 0)
  const valorRP  = lista.filter(i => i.tipo === 'rp').reduce((s, i) => s + Number(i.valor || 0), 0)
  const cdps = lista.filter(i => i.tipo === 'cdp')

  return (
    <div style={{ padding:'24px 28px', maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ color:'#ECFDF5', fontSize:20, fontWeight:700, margin:0, letterSpacing:'-0.02em' }}>
            Gestión Presupuestal
          </h1>
          <p style={{ color:'rgba(167,243,208,0.55)', fontSize:12, margin:'3px 0 0' }}>
            Decreto 111/1996 · Ley 819/2003 — CDP, Registro Presupuestal y Órdenes de Pago
          </p>
        </div>
        <button onClick={() => setModal(true)} style={{
          display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
          background:'#059669', border:'none', borderRadius:7, color:'#fff',
          fontSize:12, fontWeight:600, cursor:'pointer',
        }}>
          <Plus size={14}/> Nuevo registro
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total CDP',   val:`$${(valorCDP/1e6).toFixed(1)}M`, color:'#6366F1', count: lista.filter(i=>i.tipo==='cdp').length },
          { label:'Total RP',    val:`$${(valorRP/1e6).toFixed(1)}M`,  color:'#059669', count: lista.filter(i=>i.tipo==='rp').length },
          { label:'Órdenes pago',val: lista.filter(i=>i.tipo==='op').length, color:'#D97706', count: null },
          { label:'Sin RP',      val: lista.filter(i=>i.tipo==='cdp' && !lista.some(r=>r.tipo==='rp' && r.cdp_id===i.id)).length, color:'#DC2626', count: null },
        ].map(({ label, val, color, count }) => (
          <div key={label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(52,211,153,0.1)', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:10, color:'rgba(167,243,208,0.5)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:800, color }}>{val}</div>
            {count !== null && <div style={{ fontSize:10, color:'rgba(167,243,208,0.35)', marginTop:2 }}>{count} registros</div>}
          </div>
        ))}
      </div>

      {/* Info tipos */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
        {Object.entries(TIPO_CONFIG).map(([k, cfg]) => (
          <div key={k} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${cfg.color}33`, borderRadius:8, padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:11, fontWeight:800, padding:'2px 8px', borderRadius:6, background:cfg.bg, color:cfg.color }}>{cfg.label}</span>
              <span style={{ fontSize:11, color:'rgba(167,243,208,0.7)', fontWeight:600 }}>{cfg.full}</span>
            </div>
            <p style={{ margin:0, fontSize:11, color:'rgba(167,243,208,0.5)', lineHeight:1.5 }}>{cfg.desc}</p>
            <div style={{ fontSize:10, color:'rgba(167,243,208,0.3)', marginTop:4 }}>{cfg.legal}</div>
          </div>
        ))}
      </div>

      {/* Alerta normativa */}
      <div style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:11, color:'rgba(196,181,253,0.9)', lineHeight:1.6 }}>
        <strong>⚖ Art. 71 Decreto 111/1996:</strong> Ningún compromiso del Presupuesto General de la Nación puede adquirirse sin la expedición previa del CDP. El RP afecta el presupuesto en el momento de la suscripción del contrato y garantiza los recursos para el pago.
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {[['','Todos'],['cdp','CDP'],['rp','RP'],['op','OP']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltroTipo(v)} style={{ padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', background: filtroTipo === v ? '#059669' : 'rgba(255,255,255,0.06)', color: filtroTipo === v ? '#fff' : 'rgba(167,243,208,0.7)' }}>{l}</button>
        ))}
        <select value={filtroContrato} onChange={e => setFiltroContrato(e.target.value)}
          style={{ padding:'5px 12px', borderRadius:20, fontSize:11, background:'rgba(255,255,255,0.06)', border:'none', color:'rgba(167,243,208,0.7)', cursor:'pointer', outline:'none' }}>
          <option value="">Todos los contratos</option>
          {contratos.map(c => <option key={c.id} value={c.id}>{c.numero_contrato}</option>)}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'rgba(167,243,208,0.4)', fontSize:13 }}>Cargando...</div>
      ) : lista.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'rgba(167,243,208,0.3)' }}>
          <Wallet size={32} style={{ marginBottom:12, opacity:.3 }}/>
          <p style={{ margin:0 }}>No hay registros presupuestales</p>
          <p style={{ margin:'6px 0 0', fontSize:11 }}>El CDP debe expedirse antes de comprometer cualquier recurso público</p>
        </div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ fontSize:10, color:'rgba(167,243,208,0.4)', fontWeight:700, letterSpacing:'.06em' }}>
                {['Tipo','Número','Contrato','Vigencia','Rubro','Fuente','Valor','Fecha','Vinculado a'].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:'1px solid rgba(52,211,153,0.1)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map(item => {
                const cfg = TIPO_CONFIG[item.tipo]
                const cdpVinculado = item.cdp_id ? lista.find(i => i.id === item.cdp_id) : null
                return (
                  <tr key={item.id} style={{ borderBottom:'1px solid rgba(52,211,153,0.06)' }}>
                    <td style={{ padding:'10px 12px' }}><TipoBadge tipo={item.tipo}/></td>
                    <td style={{ padding:'10px 12px', fontSize:12, fontWeight:700, color:'#ECFDF5' }}>{item.numero}</td>
                    <td style={{ padding:'10px 12px', fontSize:11, color:'rgba(167,243,208,0.7)' }}>
                      {item.contratos?.numero_contrato || <span style={{ color:'rgba(167,243,208,0.3)', fontStyle:'italic' }}>Sin contrato</span>}
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:11, color:'rgba(167,243,208,0.6)' }}>{item.vigencia}</td>
                    <td style={{ padding:'10px 12px', fontSize:11, color:'rgba(167,243,208,0.6)' }}>{item.rubro_presupuestal || '—'}</td>
                    <td style={{ padding:'10px 12px', fontSize:11, color:'rgba(167,243,208,0.6)' }}>{item.fuente_financiacion || '—'}</td>
                    <td style={{ padding:'10px 12px', fontSize:12, fontWeight:700, color: cfg?.color }}>
                      ${Number(item.valor).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:11, color:'rgba(167,243,208,0.6)' }}>{item.fecha_expedicion}</td>
                    <td style={{ padding:'10px 12px' }}>
                      {cdpVinculado
                        ? <span style={{ fontSize:10, color:'#6366F1', display:'flex', alignItems:'center', gap:4 }}><Link2 size={10}/> CDP {cdpVinculado.numero}</span>
                        : item.tipo !== 'cdp' ? <span style={{ fontSize:10, color:'rgba(167,243,208,0.25)' }}>—</span> : null
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0D2918', border:'1px solid rgba(52,211,153,0.2)', borderRadius:12, padding:28, width:600, maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h2 style={{ color:'#ECFDF5', margin:0, fontSize:16, fontWeight:700 }}>Nuevo Registro Presupuestal</h2>
                <p style={{ color:'rgba(167,243,208,0.5)', fontSize:11, margin:'3px 0 0' }}>Decreto 111/1996 · Ley 819/2003</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background:'transparent', border:'none', color:'rgba(167,243,208,0.5)', cursor:'pointer' }}><X size={18}/></button>
            </div>

            {/* Selector de tipo */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:18 }}>
              {Object.entries(TIPO_CONFIG).map(([k, cfg]) => (
                <button key={k} onClick={() => setForm(f => ({ ...f, tipo: k }))} style={{
                  padding:'10px', borderRadius:8, border:`2px solid ${form.tipo === k ? cfg.color : 'rgba(52,211,153,0.15)'}`,
                  background: form.tipo === k ? cfg.bg : 'transparent', cursor:'pointer', transition:'all .15s',
                }}>
                  <div style={{ fontSize:14, fontWeight:800, color: form.tipo === k ? cfg.color : 'rgba(167,243,208,0.5)', marginBottom:2 }}>{cfg.label}</div>
                  <div style={{ fontSize:9, color:'rgba(167,243,208,0.4)' }}>{cfg.full}</div>
                </button>
              ))}
            </div>

            {form.tipo && (
              <div style={{ background:`${TIPO_CONFIG[form.tipo].bg}`, border:`1px solid ${TIPO_CONFIG[form.tipo].color}44`, borderRadius:7, padding:'8px 12px', marginBottom:16, fontSize:11, color:'rgba(167,243,208,0.8)' }}>
                {TIPO_CONFIG[form.tipo].desc} — <strong>{TIPO_CONFIG[form.tipo].legal}</strong>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={lbl}>Número *</label>
                <input type="text" placeholder="CDP-2026-001" value={form.numero}
                  onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Fecha expedición *</label>
                <input type="date" value={form.fecha_expedicion}
                  onChange={e => setForm(f => ({ ...f, fecha_expedicion: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Vigencia</label>
                <select value={form.vigencia} onChange={e => setForm(f => ({ ...f, vigencia: e.target.value }))} style={sel}>
                  {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Valor (COP) *</label>
                <input type="number" placeholder="0" value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Rubro presupuestal</label>
                <input type="text" list="rubros" placeholder="2-2-01-01-001" value={form.rubro_presupuestal}
                  onChange={e => setForm(f => ({ ...f, rubro_presupuestal: e.target.value }))} style={inp}/>
                <datalist id="rubros">{RUBROS_EJEMPLO.map(r => <option key={r} value={r}/>)}</datalist>
              </div>
              <div>
                <label style={lbl}>Fuente de financiación</label>
                <select value={form.fuente_financiacion} onChange={e => setForm(f => ({ ...f, fuente_financiacion: e.target.value }))} style={sel}>
                  <option value="">Seleccionar...</option>
                  {FUENTES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Contrato asociado</label>
                <select value={form.contrato_id} onChange={e => setForm(f => ({ ...f, contrato_id: e.target.value }))} style={sel}>
                  <option value="">Sin contrato (pre-contractual)</option>
                  {contratos.map(c => <option key={c.id} value={c.id}>{c.numero_contrato}</option>)}
                </select>
              </div>
              {form.tipo === 'rp' && (
                <div>
                  <label style={lbl}>CDP que afecta</label>
                  <select value={form.cdp_id} onChange={e => setForm(f => ({ ...f, cdp_id: e.target.value }))} style={sel}>
                    <option value="">Seleccionar CDP...</option>
                    {lista.filter(i => i.tipo === 'cdp').map(c => (
                      <option key={c.id} value={c.id}>CDP {c.numero} — ${Number(c.valor).toLocaleString('es-CO')}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Observaciones</label>
                <textarea rows={2} value={form.observaciones}
                  onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} style={{ ...inp, resize:'vertical' }}/>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={() => setModal(false)} style={{ padding:'8px 18px', background:'transparent', border:'1px solid rgba(52,211,153,0.2)', borderRadius:7, color:'rgba(167,243,208,0.7)', fontSize:12, cursor:'pointer' }}>Cancelar</button>
              <button onClick={guardar} disabled={guardando} style={{ padding:'8px 18px', background:'#059669', border:'none', borderRadius:7, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', opacity: guardando ? .6 : 1 }}>
                {guardando ? 'Guardando...' : `Registrar ${TIPO_CONFIG[form.tipo]?.label}`}
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
