import { useState, useEffect } from 'react'
import { DollarSign, Plus, CheckCircle, XCircle, Clock, AlertTriangle, X, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { pagos as pagosDB, contratos as contratosDB } from '../lib/db'

// Requisitos previos al pago — Art. 23 Ley 1150/2007 + Decreto 1082/2015
const REQUISITOS = [
  { key: 'paz_salvo_ss',     label: 'Paz y salvo seguridad social',       legal: 'Art. 23 Ley 1150/07 + Art. 50 Ley 789/02', required: true },
  { key: 'garantias_vigentes', label: 'Garantías vigentes aprobadas',      legal: 'Decreto 1082/15 Art. 2.2.1.2.3.1',         required: true },
  { key: 'informe_supervisor', label: 'Informe de supervisión del período', legal: 'Art. 83 Ley 1474/2011',                    required: true },
  { key: 'factura',           label: 'Factura o cuenta de cobro',          legal: 'Estatuto Tributario Art. 615',              required: true },
  { key: 'certificado_arl',   label: 'Certificado afiliación ARL',         legal: 'Art. 23 Ley 1150/07',                      required: true },
  { key: 'cdp_rp',           label: 'CDP / RP vigentes',                  legal: 'Ley 819/2003 Art. 7',                      required: true },
]

const ESTADO_PAGO = {
  pendiente:   { label:'Pendiente',   color:'#D97706', bg:'rgba(217,119,6,0.12)' },
  en_proceso:  { label:'En proceso',  color:'#2563EB', bg:'rgba(37,99,235,0.12)' },
  pagado:      { label:'Pagado',      color:'#059669', bg:'rgba(5,150,105,0.12)' },
  rechazado:   { label:'Rechazado',   color:'#DC2626', bg:'rgba(220,38,38,0.12)' },
}

function RequisitoBadge({ cumplido, label, legal }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', background: cumplido ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)', border:`1px solid ${cumplido ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`, borderRadius:6 }}>
      {cumplido
        ? <CheckCircle size={13} color="#34D399" style={{ flexShrink:0, marginTop:1 }}/>
        : <XCircle    size={13} color="#F87171" style={{ flexShrink:0, marginTop:1 }}/>
      }
      <div>
        <div style={{ fontSize:11, fontWeight:600, color: cumplido ? 'rgba(167,243,208,0.9)' : '#FCA5A5' }}>{label}</div>
        <div style={{ fontSize:10, color:'rgba(167,243,208,0.35)', marginTop:1 }}>{legal}</div>
      </div>
    </div>
  )
}

export default function Pagos() {
  const [lista, setLista] = useState([])
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [detalleId, setDetalleId] = useState(null)

  const [form, setForm] = useState({
    contrato_id: '', numero_pago: '', concepto: '', valor: '',
    periodo_inicio: '', periodo_fin: '', numero_factura: '',
    requisitos: { paz_salvo_ss: false, garantias_vigentes: false, informe_supervisor: false, factura: false, certificado_arl: false, cdp_rp: false },
    observaciones: '',
  })

  useEffect(() => { cargar() }, [filtroEstado])
  useEffect(() => { contratosDB.listar({ limit: 200 }).then(r => setContratos(r.data || [])) }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await pagosDB.listar({ estado: filtroEstado || undefined })
      setLista(data)
    } catch { toast.error('Error cargando pagos') }
    finally { setLoading(false) }
  }

  const requisitosOk = Object.values(form.requisitos).every(Boolean)

  async function guardar() {
    if (!form.contrato_id || !form.valor || !form.concepto) {
      toast.error('Completa los campos obligatorios')
      return
    }
    if (!requisitosOk) {
      toast.error('Debes verificar todos los requisitos previos al pago')
      return
    }
    setGuardando(true)
    try {
      await pagosDB.crear({
        contrato_id: form.contrato_id,
        numero_pago: parseInt(form.numero_pago) || 1,
        concepto:    form.concepto,
        valor:       parseFloat(form.valor),
        periodo_inicio: form.periodo_inicio || null,
        periodo_fin:    form.periodo_fin    || null,
        numero_factura: form.numero_factura || null,
        requisitos_verificados: form.requisitos,
        observaciones: form.observaciones || null,
        estado: 'pendiente',
      })
      toast.success('Pago registrado exitosamente')
      setModal(false)
      resetForm()
      cargar()
    } catch (e) {
      toast.error(e.message || 'Error registrando pago')
    } finally { setGuardando(false) }
  }

  async function cambiarEstado(id, estado) {
    try {
      await pagosDB.actualizar(id, { estado })
      toast.success(`Pago marcado como ${ESTADO_PAGO[estado]?.label}`)
      cargar()
    } catch { toast.error('Error actualizando estado') }
  }

  function resetForm() {
    setForm({ contrato_id:'', numero_pago:'', concepto:'', valor:'', periodo_inicio:'', periodo_fin:'', numero_factura:'', requisitos:{ paz_salvo_ss:false, garantias_vigentes:false, informe_supervisor:false, factura:false, certificado_arl:false, cdp_rp:false }, observaciones:'' })
  }

  const total      = lista.length
  const pendientes = lista.filter(p => p.estado === 'pendiente').length
  const pagados    = lista.filter(p => p.estado === 'pagado').length
  const valorTotal = lista.filter(p => p.estado === 'pagado').reduce((s, p) => s + (p.valor || 0), 0)

  const detalle = lista.find(p => p.id === detalleId)

  return (
    <div style={{ padding:'24px 28px', maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ color:'#ECFDF5', fontSize:20, fontWeight:700, margin:0, letterSpacing:'-0.02em' }}>
            Pagos Contractuales
          </h1>
          <p style={{ color:'rgba(167,243,208,0.55)', fontSize:12, margin:'3px 0 0' }}>
            Art. 23 Ley 1150/07 · Verificación de requisitos previos obligatoria
          </p>
        </div>
        <button onClick={() => setModal(true)} style={{
          display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
          background:'#059669', border:'none', borderRadius:7, color:'#fff',
          fontSize:12, fontWeight:600, cursor:'pointer',
        }}>
          <Plus size={14}/> Registrar Pago
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total pagos',    val: total,      color:'#34D399',  Icon: DollarSign, format: v => v },
          { label:'Pendientes',     val: pendientes, color:'#D97706',  Icon: Clock,      format: v => v },
          { label:'Pagados',        val: pagados,    color:'#059669',  Icon: CheckCircle,format: v => v },
          { label:'Valor pagado',   val: valorTotal, color:'#A78BFA',  Icon: DollarSign, format: v => `$${(v/1e6).toFixed(1)}M` },
        ].map(({ label, val, color, Icon, format }) => (
          <div key={label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(52,211,153,0.1)', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <Icon size={14} color={color}/>
              <span style={{ fontSize:10, color:'rgba(167,243,208,0.5)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</span>
            </div>
            <div style={{ fontSize:26, fontWeight:800, color }}>{format(val)}</div>
          </div>
        ))}
      </div>

      {/* Alerta normativa */}
      <div style={{ background:'rgba(217,119,6,0.08)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:11, color:'rgba(253,230,138,0.9)', lineHeight:1.6, display:'flex', gap:10 }}>
        <Shield size={14} style={{ flexShrink:0, marginTop:1 }}/>
        <span>
          <strong>Art. 23 Ley 1150/2007:</strong> Ningún pago podrá realizarse sin verificar previamente el cumplimiento de aportes a seguridad social (salud, pensión y ARL). La entidad responde solidariamente por los aportes no pagados.
        </span>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['','Todos'],['pendiente','Pendientes'],['en_proceso','En proceso'],['pagado','Pagados'],['rechazado','Rechazados']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltroEstado(v)} style={{
            padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'none',
            background: filtroEstado === v ? '#059669' : 'rgba(255,255,255,0.06)',
            color: filtroEstado === v ? '#fff' : 'rgba(167,243,208,0.7)',
          }}>{l}</button>
        ))}
      </div>

      {/* Lista pagos */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'rgba(167,243,208,0.4)', fontSize:13 }}>Cargando pagos...</div>
      ) : lista.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'rgba(167,243,208,0.3)', fontSize:13 }}>
          <DollarSign size={32} style={{ marginBottom:12, opacity:.3 }}/>
          <p style={{ margin:0 }}>No hay pagos registrados</p>
        </div>
      ) : lista.map(pago => {
        const cfg = ESTADO_PAGO[pago.estado] || ESTADO_PAGO.pendiente
        const req = pago.requisitos_verificados || {}
        const requisitosCompletos = REQUISITOS.every(r => req[r.key])
        return (
          <div key={pago.id} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${!requisitosCompletos ? 'rgba(220,38,38,0.3)' : 'rgba(52,211,153,0.1)'}`, borderRadius:10, marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <span style={{ color:'#ECFDF5', fontSize:13, fontWeight:600 }}>
                    Pago #{pago.numero_pago} — {pago.contratos?.numero_contrato || '—'}
                  </span>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:cfg.bg, color:cfg.color }}>
                    {cfg.label}
                  </span>
                  {!requisitosCompletos && (
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(220,38,38,0.15)', color:'#F87171' }}>
                      ⚠ Requisitos incompletos
                    </span>
                  )}
                </div>
                <div style={{ fontSize:11, color:'rgba(167,243,208,0.5)' }}>
                  {pago.concepto}
                  {pago.periodo_inicio && <> · {pago.periodo_inicio} → {pago.periodo_fin}</>}
                  {pago.numero_factura && <> · Factura: {pago.numero_factura}</>}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:16, fontWeight:800, color:'#34D399' }}>
                  ${Number(pago.valor).toLocaleString('es-CO')}
                </div>
                <div style={{ fontSize:10, color:'rgba(167,243,208,0.4)', marginTop:2 }}>
                  {new Date(pago.creado_en).toLocaleDateString('es-CO')}
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => setDetalleId(detalleId === pago.id ? null : pago.id)}
                  style={{ padding:'5px 10px', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:6, color:'#34D399', fontSize:11, cursor:'pointer' }}>
                  Requisitos
                </button>
                {pago.estado === 'pendiente' && (
                  <button onClick={() => cambiarEstado(pago.id, 'pagado')}
                    style={{ padding:'5px 10px', background:'rgba(5,150,105,0.15)', border:'1px solid rgba(5,150,105,0.3)', borderRadius:6, color:'#34D399', fontSize:11, cursor:'pointer' }}>
                    Marcar pagado
                  </button>
                )}
              </div>
            </div>

            {detalleId === pago.id && (
              <div style={{ borderTop:'1px solid rgba(52,211,153,0.08)', padding:'14px 16px', background:'rgba(0,0,0,0.15)' }}>
                <div style={{ fontSize:10, color:'rgba(167,243,208,0.4)', fontWeight:700, letterSpacing:'.06em', marginBottom:10 }}>
                  REQUISITOS PREVIOS AL PAGO — ART. 23 LEY 1150/2007
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                  {REQUISITOS.map(r => (
                    <RequisitoBadge key={r.key} cumplido={req[r.key]} label={r.label} legal={r.legal}/>
                  ))}
                </div>
                {pago.observaciones && (
                  <div style={{ marginTop:12, fontSize:12, color:'rgba(167,243,208,0.6)' }}>
                    <strong style={{ color:'rgba(167,243,208,0.4)', fontSize:10, letterSpacing:'.06em' }}>OBSERVACIONES: </strong>
                    {pago.observaciones}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Modal nuevo pago */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0D2918', border:'1px solid rgba(52,211,153,0.2)', borderRadius:12, padding:28, width:660, maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h2 style={{ color:'#ECFDF5', margin:0, fontSize:16, fontWeight:700 }}>Registrar Pago</h2>
                <p style={{ color:'rgba(167,243,208,0.5)', fontSize:11, margin:'3px 0 0' }}>Verificación de requisitos previos obligatoria</p>
              </div>
              <button onClick={() => { setModal(false); resetForm() }} style={{ background:'transparent', border:'none', color:'rgba(167,243,208,0.5)', cursor:'pointer' }}><X size={18}/></button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Contrato *</label>
                <select value={form.contrato_id} onChange={e => setForm(f => ({ ...f, contrato_id: e.target.value }))} style={sel}>
                  <option value="">Seleccionar contrato...</option>
                  {contratos.map(c => (
                    <option key={c.id} value={c.id}>{c.numero_contrato} — {c.objeto?.substring(0,50)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>N° pago</label>
                <input type="number" min="1" placeholder="1" value={form.numero_pago} onChange={e => setForm(f => ({ ...f, numero_pago: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Valor * (COP)</label>
                <input type="number" placeholder="0" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} style={inp}/>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Concepto *</label>
                <input type="text" placeholder="Pago mes 1 — servicios de consultoría..." value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Período inicio</label>
                <input type="date" value={form.periodo_inicio} onChange={e => setForm(f => ({ ...f, periodo_inicio: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Período fin</label>
                <input type="date" value={form.periodo_fin} onChange={e => setForm(f => ({ ...f, periodo_fin: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>N° factura / cuenta de cobro</label>
                <input type="text" value={form.numero_factura} onChange={e => setForm(f => ({ ...f, numero_factura: e.target.value }))} style={inp}/>
              </div>
            </div>

            {/* Verificación de requisitos */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'rgba(167,243,208,0.4)', fontWeight:700, letterSpacing:'.06em', marginBottom:10 }}>
                VERIFICACIÓN DE REQUISITOS PREVIOS — ART. 23 LEY 1150/2007 *
              </div>
              {!requisitosOk && (
                <div style={{ background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:6, padding:'8px 12px', marginBottom:10, fontSize:11, color:'#FCA5A5' }}>
                  ⚠ Todos los requisitos deben estar verificados antes de procesar el pago
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {REQUISITOS.map(r => (
                  <label key={r.key} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(52,211,153,0.12)', borderRadius:6, cursor:'pointer' }}>
                    <input type="checkbox" checked={form.requisitos[r.key]}
                      onChange={e => setForm(f => ({ ...f, requisitos: { ...f.requisitos, [r.key]: e.target.checked } }))}
                      style={{ accentColor:'#34D399', marginTop:1, flexShrink:0 }}/>
                    <div>
                      <div style={{ fontSize:11, color:'rgba(167,243,208,0.85)', fontWeight:500 }}>{r.label}</div>
                      <div style={{ fontSize:10, color:'rgba(167,243,208,0.35)' }}>{r.legal}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={lbl}>Observaciones</label>
              <textarea rows={2} value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} style={{ ...inp, resize:'vertical' }}/>
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setModal(false); resetForm() }} style={{ padding:'8px 18px', background:'transparent', border:'1px solid rgba(52,211,153,0.2)', borderRadius:7, color:'rgba(167,243,208,0.7)', fontSize:12, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando || !requisitosOk} style={{ padding:'8px 18px', background: requisitosOk ? '#059669' : 'rgba(52,211,153,0.2)', border:'none', borderRadius:7, color: requisitosOk ? '#fff' : 'rgba(167,243,208,0.4)', fontSize:12, fontWeight:600, cursor: requisitosOk ? 'pointer' : 'not-allowed', transition:'all .2s' }}>
                {guardando ? 'Guardando...' : requisitosOk ? 'Registrar pago' : 'Requisitos incompletos'}
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
