import { useState, useEffect } from 'react'
import { FileText, Plus, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { informes as informesDB, contratos as contratosDB } from '../lib/db'

const ESTADO_CONFIG = {
  borrador:  { label:'Borrador',  color:'#D97706', bg:'rgba(217,119,6,0.12)' },
  enviado:   { label:'Enviado',   color:'#2563EB', bg:'rgba(37,99,235,0.12)' },
  aprobado:  { label:'Aprobado',  color:'#059669', bg:'rgba(5,150,105,0.12)' },
}

function CumplimientoBar({ valor }) {
  const color = valor >= 80 ? '#059669' : valor >= 50 ? '#D97706' : '#DC2626'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.08)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${valor}%`, background:color, borderRadius:99, transition:'width .4s' }}/>
      </div>
      <span style={{ fontSize:12, fontWeight:700, color, minWidth:36 }}>{valor}%</span>
    </div>
  )
}

export default function InformesSupervisión() {
  const [lista, setLista] = useState([])
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [expandido, setExpandido] = useState(null)
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [form, setForm] = useState({
    contrato_id: '', supervisor_id: '', periodo_inicio: '', periodo_fin: '',
    numero_informe: '', actividades: '', cumplimiento_objeto: 80,
    valor_pagado_periodo: '', observaciones: '', recomendaciones: '',
    requiere_accion: false, estado: 'borrador',
  })

  useEffect(() => {
    cargar()
    contratosDB.listar({ limit: 200 }).then(r => setContratos(r.data || []))
  }, [filtroEstado])

  async function cargar() {
    setLoading(true)
    try {
      const data = await informesDB.listar({ estado: filtroEstado || undefined })
      setLista(data)
    } catch { toast.error('Error cargando informes') }
    finally { setLoading(false) }
  }

  async function guardar() {
    if (!form.contrato_id || !form.periodo_inicio || !form.periodo_fin || !form.actividades || !form.numero_informe) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setGuardando(true)
    try {
      await informesDB.crear({
        ...form,
        numero_informe: parseInt(form.numero_informe),
        cumplimiento_objeto: parseInt(form.cumplimiento_objeto),
        valor_pagado_periodo: parseFloat(form.valor_pagado_periodo) || 0,
      })
      toast.success('Informe creado')
      setModal(false)
      setForm({ contrato_id:'', supervisor_id:'', periodo_inicio:'', periodo_fin:'', numero_informe:'', actividades:'', cumplimiento_objeto:80, valor_pagado_periodo:'', observaciones:'', recomendaciones:'', requiere_accion:false, estado:'borrador' })
      cargar()
    } catch (e) {
      toast.error(e.message || 'Error guardando informe')
    } finally { setGuardando(false) }
  }

  async function aprobar(id) {
    try {
      await informesDB.aprobar(id)
      toast.success('Informe aprobado')
      cargar()
    } catch { toast.error('Error aprobando informe') }
  }

  const total    = lista.length
  const borradores = lista.filter(i => i.estado === 'borrador').length
  const aprobados  = lista.filter(i => i.estado === 'aprobado').length
  const requieren  = lista.filter(i => i.requiere_accion).length

  return (
    <div style={{ padding:'24px 28px', maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ color:'#ECFDF5', fontSize:20, fontWeight:700, margin:0, letterSpacing:'-0.02em' }}>
            Informes de Supervisión
          </h1>
          <p style={{ color:'rgba(167,243,208,0.55)', fontSize:12, margin:'3px 0 0' }}>
            Art. 83 Ley 1474/2011 — Obligación mensual del supervisor designado
          </p>
        </div>
        <button onClick={() => setModal(true)} style={{
          display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
          background:'#059669', border:'none', borderRadius:7, color:'#fff',
          fontSize:12, fontWeight:600, cursor:'pointer',
        }}>
          <Plus size={14}/> Nuevo Informe
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total informes', val:total, color:'#34D399', Icon:FileText },
          { label:'Borradores',     val:borradores, color:'#D97706', Icon:Clock },
          { label:'Aprobados',      val:aprobados,  color:'#059669', Icon:CheckCircle },
          { label:'Requieren acción', val:requieren, color:'#DC2626', Icon:AlertTriangle },
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

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['', 'Todos'], ['borrador','Borradores'], ['enviado','Enviados'], ['aprobado','Aprobados']].map(([v, l]) => (
          <button key={v} onClick={() => setFiltroEstado(v)} style={{
            padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'none',
            background: filtroEstado === v ? '#059669' : 'rgba(255,255,255,0.06)',
            color: filtroEstado === v ? '#fff' : 'rgba(167,243,208,0.7)',
          }}>{l}</button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'rgba(167,243,208,0.4)', fontSize:13 }}>Cargando informes...</div>
      ) : lista.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'rgba(167,243,208,0.3)', fontSize:13 }}>
          <FileText size={32} style={{ marginBottom:12, opacity:.3 }}/>
          <p style={{ margin:0 }}>No hay informes de supervisión registrados</p>
          <p style={{ margin:'6px 0 0', fontSize:11 }}>El Art. 83 Ley 1474/2011 exige informe mensual durante la ejecución</p>
        </div>
      ) : lista.map(inf => {
        const cfg = ESTADO_CONFIG[inf.estado] || ESTADO_CONFIG.borrador
        const abierto = expandido === inf.id
        return (
          <div key={inf.id} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${inf.requiere_accion ? 'rgba(220,38,38,0.35)' : 'rgba(52,211,153,0.1)'}`, borderRadius:10, marginBottom:10, overflow:'hidden' }}>
            <div
              onClick={() => setExpandido(abierto ? null : inf.id)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' }}
            >
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <span style={{ color:'#ECFDF5', fontSize:13, fontWeight:600 }}>
                    Informe #{inf.numero_informe} — {inf.contratos?.numero_contrato || '—'}
                  </span>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:cfg.bg, color:cfg.color }}>
                    {cfg.label}
                  </span>
                  {inf.requiere_accion && (
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(220,38,38,0.15)', color:'#F87171' }}>
                      ⚠ Acción requerida
                    </span>
                  )}
                </div>
                <div style={{ fontSize:11, color:'rgba(167,243,208,0.5)' }}>
                  Período: {inf.periodo_inicio} → {inf.periodo_fin}
                  {inf.valor_pagado_periodo > 0 && (
                    <> · Pagado: ${Number(inf.valor_pagado_periodo).toLocaleString('es-CO')}</>
                  )}
                </div>
              </div>
              <div style={{ width:160 }}>
                <CumplimientoBar valor={inf.cumplimiento_objeto}/>
              </div>
              {abierto ? <ChevronUp size={14} color="rgba(167,243,208,0.4)"/> : <ChevronDown size={14} color="rgba(167,243,208,0.4)"/>}
            </div>

            {abierto && (
              <div style={{ borderTop:'1px solid rgba(52,211,153,0.08)', padding:'14px 16px', background:'rgba(0,0,0,0.15)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:10, color:'rgba(167,243,208,0.4)', fontWeight:700, letterSpacing:'.06em', marginBottom:4 }}>ACTIVIDADES DESARROLLADAS</div>
                    <p style={{ color:'rgba(167,243,208,0.8)', fontSize:12, margin:0, lineHeight:1.6 }}>{inf.actividades}</p>
                  </div>
                  {inf.observaciones && (
                    <div>
                      <div style={{ fontSize:10, color:'rgba(167,243,208,0.4)', fontWeight:700, letterSpacing:'.06em', marginBottom:4 }}>OBSERVACIONES</div>
                      <p style={{ color:'rgba(167,243,208,0.8)', fontSize:12, margin:0, lineHeight:1.6 }}>{inf.observaciones}</p>
                    </div>
                  )}
                  {inf.recomendaciones && (
                    <div>
                      <div style={{ fontSize:10, color:'rgba(167,243,208,0.4)', fontWeight:700, letterSpacing:'.06em', marginBottom:4 }}>RECOMENDACIONES</div>
                      <p style={{ color:'rgba(167,243,208,0.8)', fontSize:12, margin:0, lineHeight:1.6 }}>{inf.recomendaciones}</p>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:10, color:'rgba(167,243,208,0.3)' }}>
                    FUNDAMENTO LEGAL: Art. 83 Ley 1474/2011 — Supervisión e interventoría contractual
                  </div>
                  {inf.estado !== 'aprobado' && (
                    <button onClick={() => aprobar(inf.id)} style={{
                      padding:'6px 14px', background:'rgba(5,150,105,0.15)', border:'1px solid rgba(5,150,105,0.3)',
                      borderRadius:6, color:'#34D399', fontSize:11, fontWeight:600, cursor:'pointer',
                    }}>
                      <CheckCircle size={11} style={{ marginRight:5 }}/>Aprobar informe
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Modal nuevo informe */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0D2918', border:'1px solid rgba(52,211,153,0.2)', borderRadius:12, padding:28, width:640, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h2 style={{ color:'#ECFDF5', margin:0, fontSize:16, fontWeight:700 }}>Nuevo Informe de Supervisión</h2>
                <p style={{ color:'rgba(167,243,208,0.5)', fontSize:11, margin:'3px 0 0' }}>Art. 83 Ley 1474/2011 — Frecuencia mensual obligatoria</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background:'transparent', border:'none', color:'rgba(167,243,208,0.5)', cursor:'pointer' }}><X size={18}/></button>
            </div>

            <div style={{ background:'rgba(37,99,235,0.1)', border:'1px solid rgba(37,99,235,0.25)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:11, color:'rgba(147,197,253,0.9)', lineHeight:1.6 }}>
              <strong>⚖ Obligación legal:</strong> El Art. 83 Ley 1474/2011 establece que el supervisor debe rendir informe mensual sobre la ejecución del contrato, el cumplimiento del objeto, el avance financiero y las novedades presentadas.
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
                <label style={lbl}>Período inicio *</label>
                <input type="date" value={form.periodo_inicio} onChange={e => setForm(f => ({ ...f, periodo_inicio: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Período fin *</label>
                <input type="date" value={form.periodo_fin} onChange={e => setForm(f => ({ ...f, periodo_fin: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>N° informe *</label>
                <input type="number" min="1" placeholder="1" value={form.numero_informe} onChange={e => setForm(f => ({ ...f, numero_informe: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Valor pagado en el período</label>
                <input type="number" placeholder="0" value={form.valor_pagado_periodo} onChange={e => setForm(f => ({ ...f, valor_pagado_periodo: e.target.value }))} style={inp}/>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={lbl}>% Cumplimiento del objeto *</label>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <input type="range" min="0" max="100" value={form.cumplimiento_objeto}
                  onChange={e => setForm(f => ({ ...f, cumplimiento_objeto: e.target.value }))}
                  style={{ flex:1, accentColor:'#34D399' }}/>
                <span style={{ color:'#34D399', fontWeight:700, fontSize:14, minWidth:40 }}>{form.cumplimiento_objeto}%</span>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Actividades desarrolladas *</label>
              <textarea rows={4} placeholder="Describe las actividades ejecutadas en el período..." value={form.actividades}
                onChange={e => setForm(f => ({ ...f, actividades: e.target.value }))} style={{ ...inp, resize:'vertical' }}/>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={lbl}>Observaciones</label>
                <textarea rows={3} value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} style={{ ...inp, resize:'vertical' }}/>
              </div>
              <div>
                <label style={lbl}>Recomendaciones</label>
                <textarea rows={3} value={form.recomendaciones} onChange={e => setForm(f => ({ ...f, recomendaciones: e.target.value }))} style={{ ...inp, resize:'vertical' }}/>
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                <input type="checkbox" checked={form.requiere_accion} onChange={e => setForm(f => ({ ...f, requiere_accion: e.target.checked }))}
                  style={{ accentColor:'#DC2626', width:14, height:14 }}/>
                <span style={{ color:'rgba(167,243,208,0.8)', fontSize:12 }}>Requiere acción inmediata de la entidad</span>
              </label>
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding:'8px 18px', background:'transparent', border:'1px solid rgba(52,211,153,0.2)', borderRadius:7, color:'rgba(167,243,208,0.7)', fontSize:12, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando} style={{ padding:'8px 18px', background:'#059669', border:'none', borderRadius:7, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', opacity: guardando ? .6 : 1 }}>
                {guardando ? 'Guardando...' : 'Crear informe'}
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
