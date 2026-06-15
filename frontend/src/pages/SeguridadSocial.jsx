import { useState, useEffect } from 'react'
import { Heart, Plus, CheckCircle, XCircle, AlertTriangle, Clock, X, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { seguridadSocial as ssDB, contratos as contratosDB } from '../lib/db'

// Art. 23 Ley 1150/2007 + Decreto 1273/2018
// El contratista debe acreditar pagos al sistema de seguridad social
const RIESGOS_ARL = [
  { value: 'I',   label: 'Clase I — Riesgo mínimo',   tarifa: '0.522%' },
  { value: 'II',  label: 'Clase II — Riesgo bajo',     tarifa: '1.044%' },
  { value: 'III', label: 'Clase III — Riesgo medio',   tarifa: '2.436%' },
  { value: 'IV',  label: 'Clase IV — Riesgo alto',     tarifa: '4.350%' },
  { value: 'V',   label: 'Clase V — Riesgo máximo',    tarifa: '6.960%' },
]

const CONCEPTOS = [
  { key: 'salud',   label: 'Salud',   porcentaje: '12.5%', base: 'IBC', legal: 'Art. 204 Ley 100/93' },
  { key: 'pension', label: 'Pensión', porcentaje: '16%',   base: 'IBC', legal: 'Art. 20 Ley 100/93' },
  { key: 'arl',     label: 'ARL',     porcentaje: 'Según clase de riesgo', base: 'IBC', legal: 'Decreto 1295/94' },
]

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function EstadoBadge({ verificado }) {
  if (verificado === null || verificado === undefined)
    return <span style={{ fontSize:10, color:'rgba(167,243,208,0.4)', fontStyle:'italic' }}>Sin verificar</span>
  return verificado
    ? <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(5,150,105,0.15)', color:'#34D399', display:'inline-flex', alignItems:'center', gap:4 }}><CheckCircle size={9}/>Verificado</span>
    : <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(220,38,38,0.15)', color:'#F87171', display:'inline-flex', alignItems:'center', gap:4 }}><XCircle size={9}/>No verificado</span>
}

export default function SeguridadSocial() {
  const [lista, setLista]         = useState([])
  const [contratos, setContratos] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [filtroContrato, setFiltroContrato] = useState('')

  const anioActual = new Date().getFullYear()
  const mesActual  = new Date().getMonth() + 1

  const [form, setForm] = useState({
    contrato_id: '', periodo_mes: mesActual, periodo_anio: anioActual,
    valor_ibc: '', clase_riesgo_arl: 'I',
    salud_valor: '', salud_verificado: false,
    pension_valor: '', pension_verificado: false,
    arl_valor: '', arl_verificado: false,
    numero_planilla: '', observaciones: '',
  })

  useEffect(() => { cargar() }, [filtroContrato])
  useEffect(() => { contratosDB.listar({ limit:200 }).then(r => setContratos(r.data || [])) }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await ssDB.listar({ contrato_id: filtroContrato || undefined })
      setLista(data)
    } catch { toast.error('Error cargando verificaciones') }
    finally { setLoading(false) }
  }

  function calcularAportes(ibc, claseRiesgo) {
    const v = parseFloat(ibc) || 0
    const tarifasARL = { I:0.00522, II:0.01044, III:0.02436, IV:0.04350, V:0.06960 }
    return {
      salud:   Math.round(v * 0.125),
      pension: Math.round(v * 0.16),
      arl:     Math.round(v * (tarifasARL[claseRiesgo] || 0.00522)),
    }
  }

  const aportes = calcularAportes(form.valor_ibc, form.clase_riesgo_arl)

  async function guardar() {
    if (!form.contrato_id || !form.periodo_mes || !form.periodo_anio) {
      toast.error('Selecciona contrato y período')
      return
    }
    setGuardando(true)
    try {
      await ssDB.crear({
        ...form,
        periodo_mes:  parseInt(form.periodo_mes),
        periodo_anio: parseInt(form.periodo_anio),
        valor_ibc:    parseFloat(form.valor_ibc) || 0,
        salud_valor:   parseFloat(form.salud_valor)   || aportes.salud,
        pension_valor: parseFloat(form.pension_valor) || aportes.pension,
        arl_valor:     parseFloat(form.arl_valor)     || aportes.arl,
      })
      toast.success('Verificación registrada')
      setModal(false)
      cargar()
    } catch (e) { toast.error(e.message || 'Error guardando') }
    finally { setGuardando(false) }
  }

  const totalVerificados = lista.filter(v => v.salud_verificado && v.pension_verificado && v.arl_verificado).length
  const pendientes = lista.filter(v => !v.salud_verificado || !v.pension_verificado || !v.arl_verificado).length
  const sinVerificar = lista.filter(v => v.salud_verificado === null).length

  return (
    <div style={{ padding:'24px 28px', maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ color:'#ECFDF5', fontSize:20, fontWeight:700, margin:0, letterSpacing:'-0.02em' }}>
            Seguridad Social
          </h1>
          <p style={{ color:'rgba(167,243,208,0.55)', fontSize:12, margin:'3px 0 0' }}>
            Art. 23 Ley 1150/07 · Decreto 1273/2018 — Verificación mensual obligatoria por contrato
          </p>
        </div>
        <button onClick={() => setModal(true)} style={{
          display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
          background:'#059669', border:'none', borderRadius:7, color:'#fff',
          fontSize:12, fontWeight:600, cursor:'pointer',
        }}>
          <Plus size={14}/> Registrar verificación
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total períodos',    val: lista.length,     color:'#34D399', Icon: Heart },
          { label:'Completos',         val: totalVerificados, color:'#059669', Icon: CheckCircle },
          { label:'Con pendientes',    val: pendientes,       color:'#D97706', Icon: AlertTriangle },
          { label:'Sin verificar',     val: sinVerificar,     color:'#6366F1', Icon: Clock },
        ].map(({ label, val, color, Icon }) => (
          <div key={label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(52,211,153,0.1)', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <Icon size={14} color={color}/>
              <span style={{ fontSize:10, color:'rgba(167,243,208,0.5)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</span>
            </div>
            <div style={{ fontSize:26, fontWeight:800, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Alerta normativa */}
      <div style={{ background:'rgba(217,119,6,0.08)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:11, color:'rgba(253,230,138,0.9)', lineHeight:1.6, display:'flex', gap:10 }}>
        <Shield size={14} style={{ flexShrink:0, marginTop:1 }}/>
        <span>
          <strong>Art. 23 Ley 1150/2007 + Decreto 1273/2018:</strong> La entidad contratante debe verificar mensualmente el pago de aportes al sistema de seguridad social (salud, pensión y ARL) sobre el Ingreso Base de Cotización. La base mínima es el 40% del valor mensual del contrato, sin superar 25 SMLMV.
        </span>
      </div>

      {/* Tabla de conceptos legales */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(52,211,153,0.08)', borderRadius:10, padding:'14px 16px', marginBottom:20 }}>
        <div style={{ fontSize:10, color:'rgba(167,243,208,0.4)', fontWeight:700, letterSpacing:'.08em', marginBottom:10 }}>TARIFAS LEGALES DE COTIZACIÓN</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {CONCEPTOS.map(c => (
            <div key={c.key} style={{ background:'rgba(255,255,255,0.04)', borderRadius:7, padding:'10px 12px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#ECFDF5', marginBottom:3 }}>{c.label}</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#34D399' }}>{c.porcentaje}</div>
              <div style={{ fontSize:10, color:'rgba(167,243,208,0.4)', marginTop:2 }}>{c.legal} · Base: {c.base}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtro */}
      <div style={{ marginBottom:16 }}>
        <select value={filtroContrato} onChange={e => setFiltroContrato(e.target.value)}
          style={{ padding:'6px 12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:7, color:'#ECFDF5', fontSize:12, outline:'none', minWidth:280 }}>
          <option value="">Todos los contratos</option>
          {contratos.map(c => <option key={c.id} value={c.id}>{c.numero_contrato} — {c.objeto?.substring(0,40)}</option>)}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'rgba(167,243,208,0.4)', fontSize:13 }}>Cargando verificaciones...</div>
      ) : lista.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'rgba(167,243,208,0.3)' }}>
          <Heart size={32} style={{ marginBottom:12, opacity:.3 }}/>
          <p style={{ margin:0 }}>No hay verificaciones de seguridad social</p>
          <p style={{ margin:'6px 0 0', fontSize:11 }}>Registra una verificación por cada período mensual de ejecución</p>
        </div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ fontSize:10, color:'rgba(167,243,208,0.4)', fontWeight:700, letterSpacing:'.06em' }}>
                {['Contrato','Período','IBC','Salud','Pensión','ARL','Planilla','Estado'].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:'1px solid rgba(52,211,153,0.1)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map(v => {
                const completo = v.salud_verificado && v.pension_verificado && v.arl_verificado
                return (
                  <tr key={v.id} style={{ borderBottom:'1px solid rgba(52,211,153,0.06)', background: completo ? 'transparent' : 'rgba(217,119,6,0.04)' }}>
                    <td style={{ padding:'10px 12px', fontSize:12, color:'#ECFDF5', fontWeight:500 }}>
                      {v.contratos?.numero_contrato || '—'}
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:12, color:'rgba(167,243,208,0.8)' }}>
                      {MESES[(v.periodo_mes || 1) - 1]} {v.periodo_anio}
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:12, color:'rgba(167,243,208,0.7)' }}>
                      ${Number(v.valor_ibc || 0).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ fontSize:11, color:'rgba(167,243,208,0.7)' }}>${Number(v.salud_valor || 0).toLocaleString('es-CO')}</div>
                      <EstadoBadge verificado={v.salud_verificado}/>
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ fontSize:11, color:'rgba(167,243,208,0.7)' }}>${Number(v.pension_valor || 0).toLocaleString('es-CO')}</div>
                      <EstadoBadge verificado={v.pension_verificado}/>
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ fontSize:11, color:'rgba(167,243,208,0.7)' }}>${Number(v.arl_valor || 0).toLocaleString('es-CO')}</div>
                      <EstadoBadge verificado={v.arl_verificado}/>
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:11, color:'rgba(167,243,208,0.6)' }}>
                      {v.numero_planilla || '—'}
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      {completo
                        ? <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(5,150,105,0.15)', color:'#34D399' }}>✓ Completo</span>
                        : <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(220,38,38,0.12)', color:'#F87171' }}>⚠ Pendiente</span>
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
          <div style={{ background:'#0D2918', border:'1px solid rgba(52,211,153,0.2)', borderRadius:12, padding:28, width:620, maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h2 style={{ color:'#ECFDF5', margin:0, fontSize:16, fontWeight:700 }}>Verificar Seguridad Social</h2>
                <p style={{ color:'rgba(167,243,208,0.5)', fontSize:11, margin:'3px 0 0' }}>Art. 23 Ley 1150/07 · Verificación mensual por contrato</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background:'transparent', border:'none', color:'rgba(167,243,208,0.5)', cursor:'pointer' }}><X size={18}/></button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Contrato *</label>
                <select value={form.contrato_id} onChange={e => setForm(f => ({ ...f, contrato_id: e.target.value }))} style={sel}>
                  <option value="">Seleccionar contrato...</option>
                  {contratos.map(c => <option key={c.id} value={c.id}>{c.numero_contrato} — {c.objeto?.substring(0,50)}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Mes *</label>
                <select value={form.periodo_mes} onChange={e => setForm(f => ({ ...f, periodo_mes: e.target.value }))} style={sel}>
                  {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Año *</label>
                <select value={form.periodo_anio} onChange={e => setForm(f => ({ ...f, periodo_anio: e.target.value }))} style={sel}>
                  {[2023,2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>IBC — Ingreso Base de Cotización (COP)</label>
                <input type="number" placeholder="Mín. 40% del valor mensual" value={form.valor_ibc}
                  onChange={e => setForm(f => ({ ...f, valor_ibc: e.target.value }))} style={inp}/>
                <div style={{ fontSize:10, color:'rgba(167,243,208,0.35)', marginTop:3 }}>
                  Base mínima: 40% del pago mensual · Máx: 25 SMLMV — Decreto 1273/2018
                </div>
              </div>
              <div>
                <label style={lbl}>Clase de riesgo ARL</label>
                <select value={form.clase_riesgo_arl} onChange={e => setForm(f => ({ ...f, clase_riesgo_arl: e.target.value }))} style={sel}>
                  {RIESGOS_ARL.map(r => <option key={r.value} value={r.value}>{r.label} ({r.tarifa})</option>)}
                </select>
              </div>
            </div>

            {/* Cálculo automático */}
            {form.valor_ibc > 0 && (
              <div style={{ background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.15)', borderRadius:8, padding:'12px 14px', margin:'14px 0' }}>
                <div style={{ fontSize:10, color:'rgba(167,243,208,0.4)', fontWeight:700, letterSpacing:'.06em', marginBottom:8 }}>APORTES CALCULADOS AUTOMÁTICAMENTE</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {[
                    { k:'salud',   l:'Salud (12.5%)',   v:aportes.salud },
                    { k:'pension', l:'Pensión (16%)',    v:aportes.pension },
                    { k:'arl',     l:`ARL (${RIESGOS_ARL.find(r=>r.value===form.clase_riesgo_arl)?.tarifa})`, v:aportes.arl },
                  ].map(({ k, l, v }) => (
                    <div key={k} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:10, color:'rgba(167,243,208,0.45)', marginBottom:3 }}>{l}</div>
                      <div style={{ fontSize:16, fontWeight:800, color:'#34D399' }}>${v.toLocaleString('es-CO')}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:10, color:'rgba(167,243,208,0.35)', marginTop:8, textAlign:'center' }}>
                  Total aportes: ${(aportes.salud + aportes.pension + aportes.arl).toLocaleString('es-CO')}
                </div>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
              {[
                { k:'salud',   l:'Salud verificado',   vk:'salud_valor' },
                { k:'pension', l:'Pensión verificado',  vk:'pension_valor' },
                { k:'arl',     l:'ARL verificado',      vk:'arl_valor' },
              ].map(({ k, l, vk }) => (
                <div key={k} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(52,211,153,0.12)', borderRadius:7, padding:'10px 12px' }}>
                  <label style={{ ...lbl, marginBottom:6 }}>{l}</label>
                  <input type="number" placeholder={String(aportes[k])} value={form[vk]}
                    onChange={e => setForm(f => ({ ...f, [vk]: e.target.value }))} style={{ ...inp, marginBottom:8 }}/>
                  <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                    <input type="checkbox" checked={form[`${k}_verificado`]}
                      onChange={e => setForm(f => ({ ...f, [`${k}_verificado`]: e.target.checked }))}
                      style={{ accentColor:'#34D399' }}/>
                    <span style={{ fontSize:11, color:'rgba(167,243,208,0.7)' }}>Pago verificado</span>
                  </label>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
              <div>
                <label style={lbl}>N° planilla PILA</label>
                <input type="text" placeholder="PILA-2025-001234" value={form.numero_planilla}
                  onChange={e => setForm(f => ({ ...f, numero_planilla: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Observaciones</label>
                <input type="text" value={form.observaciones}
                  onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} style={inp}/>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding:'8px 18px', background:'transparent', border:'1px solid rgba(52,211,153,0.2)', borderRadius:7, color:'rgba(167,243,208,0.7)', fontSize:12, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando} style={{ padding:'8px 18px', background:'#059669', border:'none', borderRadius:7, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', opacity: guardando ? .6 : 1 }}>
                {guardando ? 'Guardando...' : 'Registrar verificación'}
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
