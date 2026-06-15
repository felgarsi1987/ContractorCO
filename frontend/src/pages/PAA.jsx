import { useState, useEffect } from 'react'
import { CalendarDays, Plus, TrendingUp, AlertTriangle, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { paa as paaDB } from '../lib/db'

// Decreto 1082/2015 Art. 2.2.1.1.1.1.1 — Publicación obligatoria en SECOP II
const MODALIDADES = [
  { value: 'licitacion_publica',    label: 'Licitación Pública',           legal: 'Art. 30 Ley 80/93' },
  { value: 'seleccion_abreviada',   label: 'Selección Abreviada',          legal: 'Art. 2 Ley 1150/07' },
  { value: 'concurso_meritos',      label: 'Concurso de Méritos',          legal: 'Art. 2 Ley 1150/07' },
  { value: 'contratacion_directa',  label: 'Contratación Directa',         legal: 'Art. 2 Ley 1150/07' },
  { value: 'minima_cuantia',        label: 'Mínima Cuantía',               legal: 'Art. 2 Ley 1150/07' },
  { value: 'asociacion_publico_privada', label: 'Asociación Público-Privada', legal: 'Ley 1508/2012' },
]

const ESTADO_CONFIG = {
  planeado:   { label: 'Planeado',    color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  en_proceso: { label: 'En proceso',  color: '#D97706', bg: 'rgba(217,119,6,0.12)'  },
  contratado: { label: 'Contratado',  color: '#059669', bg: 'rgba(5,150,105,0.12)'  },
  desierto:   { label: 'Desierto',    color: '#DC2626', bg: 'rgba(220,38,38,0.12)'  },
  modificado: { label: 'Modificado',  color: '#0891B2', bg: 'rgba(8,145,178,0.12)'  },
}

const SECTORES = [
  'Tecnología', 'Consultoría', 'Infraestructura', 'Servicios', 'Suministros',
  'Salud', 'Educación', 'Transporte', 'Comunicaciones', 'Otro',
]

function BarraEjecucion({ items }) {
  const total      = items.length
  const contratado = items.filter(i => i.estado === 'contratado').length
  const enProceso  = items.filter(i => i.estado === 'en_proceso').length
  const pct        = total > 0 ? Math.round((contratado / total) * 100) : 0
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(167,243,208,0.5)', marginBottom:4 }}>
        <span>Ejecución PAA {new Date().getFullYear()}</span>
        <span>{pct}% contratado ({contratado}/{total})</span>
      </div>
      <div style={{ height:6, background:'rgba(255,255,255,0.08)', borderRadius:99, overflow:'hidden', display:'flex' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:'#059669', transition:'width .5s' }}/>
        <div style={{ height:'100%', width:`${total > 0 ? (enProceso/total*100) : 0}%`, background:'#D97706', transition:'width .5s' }}/>
      </div>
    </div>
  )
}

export default function PAA() {
  const [lista, setLista]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtroEstado, setFiltro] = useState('')
  const [filtroVigencia, setVigencia] = useState(String(new Date().getFullYear()))
  const [expandido, setExpandido] = useState(null)
  const [modal, setModal]         = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [form, setForm] = useState({
    vigencia: String(new Date().getFullYear()),
    rubro_presupuestal: '', fuente_financiacion: '', sector: '',
    objeto: '', modalidad_seleccion: '', valor_estimado: '',
    fecha_inicio_proceso: '', fecha_suscripcion_estimada: '',
    duracion_estimada_meses: '', estado: 'planeado', observaciones: '',
  })

  useEffect(() => { cargar() }, [filtroEstado, filtroVigencia])

  async function cargar() {
    setLoading(true)
    try {
      const data = await paaDB.listar({ vigencia: filtroVigencia, estado: filtroEstado || undefined })
      setLista(data)
    } catch { toast.error('Error cargando PAA') }
    finally { setLoading(false) }
  }

  async function guardar() {
    if (!form.objeto || !form.modalidad_seleccion || !form.valor_estimado) {
      toast.error('Completa objeto, modalidad y valor estimado')
      return
    }
    setGuardando(true)
    try {
      await paaDB.crear({ ...form, valor_estimado: parseFloat(form.valor_estimado), duracion_estimada_meses: parseInt(form.duracion_estimada_meses) || null })
      toast.success('Ítem PAA creado')
      setModal(false)
      setForm({ vigencia: String(new Date().getFullYear()), rubro_presupuestal:'', fuente_financiacion:'', sector:'', objeto:'', modalidad_seleccion:'', valor_estimado:'', fecha_inicio_proceso:'', fecha_suscripcion_estimada:'', duracion_estimada_meses:'', estado:'planeado', observaciones:'' })
      cargar()
    } catch (e) { toast.error(e.message || 'Error guardando') }
    finally { setGuardando(false) }
  }

  async function cambiarEstado(id, estado) {
    try {
      await paaDB.actualizar(id, { estado })
      toast.success('Estado actualizado')
      cargar()
    } catch { toast.error('Error') }
  }

  const valorTotal     = lista.reduce((s, i) => s + Number(i.valor_estimado || 0), 0)
  const valorContratado = lista.filter(i => i.estado === 'contratado').reduce((s, i) => s + Number(i.valor_estimado || 0), 0)
  const planeados      = lista.filter(i => i.estado === 'planeado').length
  const enProceso      = lista.filter(i => i.estado === 'en_proceso').length

  const vigencias = ['2023','2024','2025','2026','2027']

  return (
    <div style={{ padding:'24px 28px', maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ color:'#ECFDF5', fontSize:20, fontWeight:700, margin:0, letterSpacing:'-0.02em' }}>
            Plan Anual de Adquisiciones
          </h1>
          <p style={{ color:'rgba(167,243,208,0.55)', fontSize:12, margin:'3px 0 0' }}>
            Decreto 1082/2015 Art. 2.2.1.1.1.1.1 — Publicación obligatoria en SECOP II antes del 31 de enero
          </p>
        </div>
        <button onClick={() => setModal(true)} style={{
          display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
          background:'#059669', border:'none', borderRadius:7, color:'#fff',
          fontSize:12, fontWeight:600, cursor:'pointer',
        }}>
          <Plus size={14}/> Nuevo ítem
        </button>
      </div>

      {/* Barra de ejecución */}
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(52,211,153,0.1)', borderRadius:10, padding:'14px 18px', marginBottom:20 }}>
        <BarraEjecucion items={lista}/>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Valor total PAA', val:`$${(valorTotal/1e6).toFixed(1)}M`, color:'#A78BFA', Icon:CalendarDays },
          { label:'Valor contratado', val:`$${(valorContratado/1e6).toFixed(1)}M`, color:'#34D399', Icon:CheckCircle },
          { label:'Planeados',        val:planeados, color:'#6366F1', Icon:TrendingUp },
          { label:'En proceso',       val:enProceso, color:'#D97706', Icon:AlertTriangle },
        ].map(({ label, val, color, Icon }) => (
          <div key={label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(52,211,153,0.1)', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <Icon size={14} color={color}/>
              <span style={{ fontSize:10, color:'rgba(167,243,208,0.5)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</span>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Alerta normativa */}
      <div style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:11, color:'rgba(196,181,253,0.9)', lineHeight:1.6 }}>
        <strong>⚖ Decreto 1082/2015 Art. 2.2.1.1.1.1.1:</strong> Las entidades estatales deben elaborar el Plan Anual de Adquisiciones para cada vigencia fiscal, publicarlo en el SECOP II a más tardar el 31 de enero, y actualizarlo cada vez que se modifique.
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        <select value={filtroVigencia} onChange={e => setVigencia(e.target.value)} style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', background:'rgba(99,102,241,0.15)', color:'rgba(196,181,253,0.9)' }}>
          {vigencias.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        {[['','Todos'],['planeado','Planeados'],['en_proceso','En proceso'],['contratado','Contratados'],['desierto','Desiertos']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltro(v)} style={{
            padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'none',
            background: filtroEstado === v ? '#059669' : 'rgba(255,255,255,0.06)',
            color: filtroEstado === v ? '#fff' : 'rgba(167,243,208,0.7)',
          }}>{l}</button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'rgba(167,243,208,0.4)', fontSize:13 }}>Cargando PAA...</div>
      ) : lista.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'rgba(167,243,208,0.3)' }}>
          <CalendarDays size={32} style={{ marginBottom:12, opacity:.3 }}/>
          <p style={{ margin:0 }}>No hay ítems en el PAA {filtroVigencia}</p>
          <p style={{ margin:'6px 0 0', fontSize:11 }}>Créalos antes del 31 de enero y publícalos en SECOP II</p>
        </div>
      ) : lista.map((item, idx) => {
        const cfg = ESTADO_CONFIG[item.estado] || ESTADO_CONFIG.planeado
        const abierto = expandido === item.id
        const alertaFecha = item.fecha_inicio_proceso && new Date(item.fecha_inicio_proceso) < new Date()
          && item.estado === 'planeado'
        return (
          <div key={item.id} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${alertaFecha ? 'rgba(220,38,38,0.3)' : 'rgba(52,211,153,0.1)'}`, borderRadius:10, marginBottom:8, overflow:'hidden' }}>
            <div onClick={() => setExpandido(abierto ? null : item.id)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(52,211,153,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'rgba(167,243,208,0.5)', fontWeight:700, flexShrink:0 }}>
                {idx + 1}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ color:'#ECFDF5', fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.objeto}
                  </span>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:cfg.bg, color:cfg.color, flexShrink:0 }}>
                    {cfg.label}
                  </span>
                  {alertaFecha && (
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'rgba(220,38,38,0.15)', color:'#F87171', flexShrink:0 }}>
                      Atrasado
                    </span>
                  )}
                </div>
                <div style={{ fontSize:11, color:'rgba(167,243,208,0.45)' }}>
                  {MODALIDADES.find(m => m.value === item.modalidad_seleccion)?.label || item.modalidad_seleccion}
                  {item.sector && <> · {item.sector}</>}
                  {item.fecha_inicio_proceso && <> · Inicio: {item.fecha_inicio_proceso}</>}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:14, fontWeight:800, color:'#A78BFA' }}>
                  ${Number(item.valor_estimado).toLocaleString('es-CO')}
                </div>
                {item.duracion_estimada_meses && (
                  <div style={{ fontSize:10, color:'rgba(167,243,208,0.4)' }}>{item.duracion_estimada_meses} meses</div>
                )}
              </div>
              {abierto ? <ChevronUp size={14} color="rgba(167,243,208,0.4)"/> : <ChevronDown size={14} color="rgba(167,243,208,0.4)"/>}
            </div>

            {abierto && (
              <div style={{ borderTop:'1px solid rgba(52,211,153,0.08)', padding:'14px 16px', background:'rgba(0,0,0,0.12)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:14 }}>
                  {[
                    ['Rubro presupuestal', item.rubro_presupuestal],
                    ['Fuente financiación', item.fuente_financiacion],
                    ['Fecha suscripción est.', item.fecha_suscripcion_estimada],
                  ].filter(([,v]) => v).map(([k,v]) => (
                    <div key={k}>
                      <div style={{ fontSize:10, color:'rgba(167,243,208,0.35)', fontWeight:700, letterSpacing:'.06em', marginBottom:3 }}>{k.toUpperCase()}</div>
                      <div style={{ fontSize:12, color:'rgba(167,243,208,0.8)' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {item.observaciones && (
                  <div style={{ marginBottom:12, fontSize:12, color:'rgba(167,243,208,0.6)' }}>
                    <span style={{ fontSize:10, color:'rgba(167,243,208,0.35)', fontWeight:700, letterSpacing:'.06em' }}>OBSERVACIONES: </span>
                    {item.observaciones}
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:10, color:'rgba(167,243,208,0.3)' }}>
                    FUNDAMENTO: Decreto 1082/2015 Art. 2.2.1.1.1.1.1 · {MODALIDADES.find(m => m.value === item.modalidad_seleccion)?.legal}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {item.estado === 'planeado' && (
                      <button onClick={() => cambiarEstado(item.id, 'en_proceso')} style={{ padding:'5px 12px', background:'rgba(217,119,6,0.15)', border:'1px solid rgba(217,119,6,0.3)', borderRadius:6, color:'#FCD34D', fontSize:11, cursor:'pointer' }}>
                        Iniciar proceso
                      </button>
                    )}
                    {item.estado === 'en_proceso' && (
                      <button onClick={() => cambiarEstado(item.id, 'contratado')} style={{ padding:'5px 12px', background:'rgba(5,150,105,0.15)', border:'1px solid rgba(5,150,105,0.3)', borderRadius:6, color:'#34D399', fontSize:11, cursor:'pointer' }}>
                        Marcar contratado
                      </button>
                    )}
                    {(item.estado === 'planeado' || item.estado === 'en_proceso') && (
                      <button onClick={() => cambiarEstado(item.id, 'desierto')} style={{ padding:'5px 12px', background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.25)', borderRadius:6, color:'#F87171', fontSize:11, cursor:'pointer' }}>
                        Declarar desierto
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0D2918', border:'1px solid rgba(52,211,153,0.2)', borderRadius:12, padding:28, width:660, maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h2 style={{ color:'#ECFDF5', margin:0, fontSize:16, fontWeight:700 }}>Nuevo ítem PAA</h2>
                <p style={{ color:'rgba(167,243,208,0.5)', fontSize:11, margin:'3px 0 0' }}>Decreto 1082/2015 — Publicar en SECOP II</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background:'transparent', border:'none', color:'rgba(167,243,208,0.5)', cursor:'pointer' }}><X size={18}/></button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={lbl}>Vigencia *</label>
                <select value={form.vigencia} onChange={e => setForm(f => ({ ...f, vigencia: e.target.value }))} style={sel}>
                  {vigencias.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Sector</label>
                <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} style={sel}>
                  <option value="">Seleccionar...</option>
                  {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Objeto / descripción *</label>
                <textarea rows={3} value={form.objeto} onChange={e => setForm(f => ({ ...f, objeto: e.target.value }))} style={{ ...inp, resize:'vertical' }} placeholder="Descripción del bien, obra o servicio a contratar..."/>
              </div>
              <div>
                <label style={lbl}>Modalidad de selección *</label>
                <select value={form.modalidad_seleccion} onChange={e => setForm(f => ({ ...f, modalidad_seleccion: e.target.value }))} style={sel}>
                  <option value="">Seleccionar...</option>
                  {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                {form.modalidad_seleccion && (
                  <div style={{ fontSize:10, color:'rgba(167,243,208,0.4)', marginTop:3 }}>
                    {MODALIDADES.find(m => m.value === form.modalidad_seleccion)?.legal}
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>Valor estimado (COP) *</label>
                <input type="number" placeholder="0" value={form.valor_estimado} onChange={e => setForm(f => ({ ...f, valor_estimado: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Rubro presupuestal</label>
                <input type="text" placeholder="2-2-01-01-001" value={form.rubro_presupuestal} onChange={e => setForm(f => ({ ...f, rubro_presupuestal: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Fuente de financiación</label>
                <input type="text" placeholder="Recursos propios, SGP, SGR..." value={form.fuente_financiacion} onChange={e => setForm(f => ({ ...f, fuente_financiacion: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Fecha inicio proceso estimada</label>
                <input type="date" value={form.fecha_inicio_proceso} onChange={e => setForm(f => ({ ...f, fecha_inicio_proceso: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Fecha suscripción estimada</label>
                <input type="date" value={form.fecha_suscripcion_estimada} onChange={e => setForm(f => ({ ...f, fecha_suscripcion_estimada: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Duración estimada (meses)</label>
                <input type="number" min="1" placeholder="12" value={form.duracion_estimada_meses} onChange={e => setForm(f => ({ ...f, duracion_estimada_meses: e.target.value }))} style={inp}/>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Observaciones</label>
                <textarea rows={2} value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} style={{ ...inp, resize:'vertical' }}/>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={() => setModal(false)} style={{ padding:'8px 18px', background:'transparent', border:'1px solid rgba(52,211,153,0.2)', borderRadius:7, color:'rgba(167,243,208,0.7)', fontSize:12, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando} style={{ padding:'8px 18px', background:'#059669', border:'none', borderRadius:7, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', opacity: guardando ? .6 : 1 }}>
                {guardando ? 'Guardando...' : 'Agregar al PAA'}
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
