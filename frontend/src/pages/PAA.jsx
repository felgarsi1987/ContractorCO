import { useState, useEffect } from 'react';
import { CalendarDays, Plus, TrendingUp, AlertTriangle, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { paa as paaDB } from '../lib/db';

const MODALIDADES = [
  { value:'licitacion_publica',       label:'Licitación Pública',            legal:'Art. 30 Ley 80/93' },
  { value:'seleccion_abreviada',      label:'Selección Abreviada',           legal:'Art. 2 Ley 1150/07' },
  { value:'concurso_meritos',         label:'Concurso de Méritos',           legal:'Art. 2 Ley 1150/07' },
  { value:'contratacion_directa',     label:'Contratación Directa',          legal:'Art. 2 Ley 1150/07' },
  { value:'minima_cuantia',           label:'Mínima Cuantía',                legal:'Art. 2 Ley 1150/07' },
  { value:'asociacion_publico_privada',label:'Asociación Público-Privada',   legal:'Ley 1508/2012' },
];

const ESTADO_CONFIG = {
  planeado:   { label:'Planeado',   cls:'badge-purple' },
  en_proceso: { label:'En proceso', cls:'badge-orange' },
  contratado: { label:'Contratado', cls:'badge-green' },
  desierto:   { label:'Desierto',   cls:'badge-red' },
  modificado: { label:'Modificado', cls:'badge-blue' },
};

const SECTORES = ['Tecnología','Consultoría','Infraestructura','Servicios','Suministros','Salud','Educación','Transporte','Comunicaciones','Otro'];

const fCOP = v => `$${Number(v||0).toLocaleString('es-CO')}`;
const fM   = v => `$${(Number(v||0)/1e6).toFixed(1)}M`;

export default function PAA() {
  const [lista, setLista]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtroEstado, setFiltro] = useState('');
  const [filtroVigencia, setVigencia] = useState(String(new Date().getFullYear()));
  const [expandido, setExpandido] = useState(null);
  const [modal, setModal]         = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    vigencia: String(new Date().getFullYear()),
    rubro_presupuestal:'', fuente_financiacion:'', sector:'',
    objeto:'', modalidad_seleccion:'', valor_estimado:'',
    fecha_inicio_proceso:'', fecha_suscripcion_estimada:'',
    duracion_estimada_meses:'', estado:'planeado', observaciones:'',
  });

  useEffect(() => { cargar(); }, [filtroEstado, filtroVigencia]);

  async function cargar() {
    setLoading(true);
    try {
      const data = await paaDB.listar({ vigencia: filtroVigencia, estado: filtroEstado || undefined });
      setLista(data);
    } catch { toast.error('Error cargando PAA'); }
    finally { setLoading(false); }
  }

  async function guardar() {
    if (!form.objeto || !form.modalidad_seleccion || !form.valor_estimado) {
      toast.error('Completa objeto, modalidad y valor estimado');
      return;
    }
    setGuardando(true);
    try {
      await paaDB.crear({ ...form, valor_estimado: parseFloat(form.valor_estimado), duracion_estimada_meses: parseInt(form.duracion_estimada_meses) || null });
      toast.success('Ítem PAA creado');
      setModal(false);
      setForm({ vigencia: String(new Date().getFullYear()), rubro_presupuestal:'', fuente_financiacion:'', sector:'', objeto:'', modalidad_seleccion:'', valor_estimado:'', fecha_inicio_proceso:'', fecha_suscripcion_estimada:'', duracion_estimada_meses:'', estado:'planeado', observaciones:'' });
      cargar();
    } catch (e) { toast.error(e.message || 'Error guardando'); }
    finally { setGuardando(false); }
  }

  async function cambiarEstado(id, estado) {
    try {
      await paaDB.actualizar(id, { estado });
      toast.success('Estado actualizado');
      cargar();
    } catch { toast.error('Error'); }
  }

  const valorTotal      = lista.reduce((s, i) => s + Number(i.valor_estimado || 0), 0);
  const valorContratado = lista.filter(i => i.estado==='contratado').reduce((s, i) => s + Number(i.valor_estimado || 0), 0);
  const planeados       = lista.filter(i => i.estado==='planeado').length;
  const enProceso       = lista.filter(i => i.estado==='en_proceso').length;
  const pctEj = lista.length > 0 ? Math.round((lista.filter(i=>i.estado==='contratado').length / lista.length) * 100) : 0;

  const vigencias = ['2023','2024','2025','2026','2027'];

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1>Plan Anual de Adquisiciones</h1>
          <p>Decreto 1082/2015 Art. 2.2.1.1.1.1.1 — Publicación obligatoria en SECOP II antes del 31 de enero</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={13}/> Nuevo ítem
        </button>
      </div>

      {/* Barra ejecución */}
      <div className="card" style={{ flexShrink:0, padding:'12px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748b', marginBottom:6 }}>
          <span>Ejecución PAA {filtroVigencia}</span>
          <span>{pctEj}% contratado ({lista.filter(i=>i.estado==='contratado').length}/{lista.length})</span>
        </div>
        <div style={{ height:6, background:'#E2E8F0', borderRadius:99, overflow:'hidden', display:'flex' }}>
          <div style={{ height:'100%', width:`${pctEj}%`, background:'#059669', transition:'width .5s' }}/>
          <div style={{ height:'100%', width:`${lista.length > 0 ? (enProceso/lista.length*100) : 0}%`, background:'#059669', transition:'width .5s' }}/>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ flexShrink:0 }}>
        {[
          { label:'VALOR TOTAL PAA',   val: fM(valorTotal),      ic:'#C2410C', bg:'#FFEDD5', Icon:CalendarDays },
          { label:'VALOR CONTRATADO',  val: fM(valorContratado), ic:'#059669', bg:'#D1FAE5', Icon:CheckCircle },
          { label:'PLANEADOS',         val: planeados,           ic:'#C2410C', bg:'#EEF2FF', Icon:TrendingUp },
          { label:'EN PROCESO',        val: enProceso,           ic:'#C2410C', bg:'#FFEDD5', Icon:AlertTriangle },
        ].map(({ label, val, ic, bg, Icon }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon" style={{ background: bg }}><Icon size={16} style={{ color: ic }}/></div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{val}</div>
            <div className="kpi-card-bar" style={{ background: ic }}/>
          </div>
        ))}
      </div>

      {/* Alerta normativa */}
      <div style={{ background:'#F5F5F4', border:'1px solid #D6D3D1', borderRadius:8, padding:'10px 14px', flexShrink:0, fontSize:11, color:'#78716C', lineHeight:1.6 }}>
        <strong>Decreto 1082/2015 Art. 2.2.1.1.1.1.1:</strong> Las entidades estatales deben elaborar el Plan Anual de Adquisiciones para cada vigencia fiscal, publicarlo en el SECOP II a más tardar el 31 de enero, y actualizarlo cada vez que se modifique.
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap', alignItems:'center' }}>
        <select className="form-select" style={{ maxWidth:120 }} value={filtroVigencia} onChange={e => setVigencia(e.target.value)}>
          {vigencias.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        {[['','Todos'],['planeado','Planeados'],['en_proceso','En proceso'],['contratado','Contratados'],['desierto','Desiertos']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltro(v)}
            className={filtroEstado === v ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding:'5px 14px', fontSize:11 }}>{l}</button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:8 }}>
        {loading ? (
          <div className="card" style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Cargando PAA...</div>
        ) : lista.length === 0 ? (
          <div className="card" style={{ padding:60, textAlign:'center', color:'#9CA3AF' }}>
            <CalendarDays size={32} style={{ margin:'0 auto 12px', display:'block', opacity:.25 }}/>
            <p style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>No hay ítems en el PAA {filtroVigencia}</p>
            <p style={{ fontSize:12 }}>Créalos antes del 31 de enero y publícalos en SECOP II</p>
          </div>
        ) : lista.map((item, idx) => {
          const cfg = ESTADO_CONFIG[item.estado] || ESTADO_CONFIG.planeado;
          const abierto = expandido === item.id;
          const atrasado = item.fecha_inicio_proceso && new Date(item.fecha_inicio_proceso) < new Date() && item.estado === 'planeado';
          return (
            <div key={item.id} className="card" style={{ padding:0, border: atrasado ? '1px solid #D1FAE5' : undefined }}>
              <div onClick={() => setExpandido(abierto ? null : item.id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'#F5F5F4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#64748b', fontWeight:700, flexShrink:0 }}>
                  {idx + 1}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                    <span style={{ color:'#1F2937', fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.objeto}</span>
                    <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                    {atrasado && <span className="badge badge-red">Atrasado</span>}
                  </div>
                  <div style={{ fontSize:11, color:'#64748b' }}>
                    {MODALIDADES.find(m => m.value === item.modalidad_seleccion)?.label || item.modalidad_seleccion}
                    {item.sector && <> · {item.sector}</>}
                    {item.fecha_inicio_proceso && <> · Inicio: {item.fecha_inicio_proceso}</>}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#C2410C' }}>{fCOP(item.valor_estimado)}</div>
                  {item.duracion_estimada_meses && <div style={{ fontSize:10, color:'#94a3b8' }}>{item.duracion_estimada_meses} meses</div>}
                </div>
                {abierto ? <ChevronUp size={14} color="#94a3b8"/> : <ChevronDown size={14} color="#94a3b8"/>}
              </div>

              {abierto && (
                <div style={{ borderTop:'1px solid var(--border)', padding:'14px 16px', background:'#F8FAFC' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:14 }}>
                    {[
                      ['RUBRO PRESUPUESTAL', item.rubro_presupuestal],
                      ['FUENTE FINANCIACIÓN', item.fuente_financiacion],
                      ['FECHA SUSCRIPCIÓN EST.', item.fecha_suscripcion_estimada],
                    ].filter(([,v]) => v).map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, letterSpacing:'.06em', marginBottom:3 }}>{k}</div>
                        <div style={{ fontSize:12, color:'#1F2937' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {item.observaciones && (
                    <p style={{ fontSize:12, color:'#475569', margin:'0 0 12px', lineHeight:1.6 }}>{item.observaciones}</p>
                  )}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:10, color:'#94a3b8' }}>
                      Decreto 1082/2015 Art. 2.2.1.1.1.1.1 · {MODALIDADES.find(m => m.value === item.modalidad_seleccion)?.legal}
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      {item.estado === 'planeado' && (
                        <button className="btn btn-secondary" style={{ padding:'5px 12px', fontSize:11 }} onClick={() => cambiarEstado(item.id, 'en_proceso')}>Iniciar proceso</button>
                      )}
                      {item.estado === 'en_proceso' && (
                        <button className="btn btn-primary" style={{ padding:'5px 12px', fontSize:11 }} onClick={() => cambiarEstado(item.id, 'contratado')}>Marcar contratado</button>
                      )}
                      {(item.estado === 'planeado' || item.estado === 'en_proceso') && (
                        <button className="btn btn-secondary" style={{ padding:'5px 12px', fontSize:11, color:'#475569', borderColor:'#e2e8f0' }} onClick={() => cambiarEstado(item.id, 'desierto')}>Declarar desierto</button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth:660 }}>
            <div className="modal-hdr">
              <div>
                <h2>Nuevo ítem PAA</h2>
                <p style={{ margin:0, fontSize:11, color:'#64748b' }}>Decreto 1082/2015 — Publicar en SECOP II</p>
              </div>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={16}/></button>
            </div>
            <div style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Vigencia *</label>
                  <select className="form-select" value={form.vigencia} onChange={e => setForm(f => ({ ...f, vigencia: e.target.value }))}>
                    {vigencias.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Sector</label>
                  <select className="form-select" value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Objeto / descripción *</label>
                  <textarea className="form-input" rows={3} value={form.objeto} onChange={e => setForm(f => ({ ...f, objeto: e.target.value }))} placeholder="Descripción del bien, obra o servicio a contratar..." style={{ resize:'vertical' }}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Modalidad de selección *</label>
                  <select className="form-select" value={form.modalidad_seleccion} onChange={e => setForm(f => ({ ...f, modalidad_seleccion: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  {form.modalidad_seleccion && <div style={{ fontSize:10, color:'#94a3b8', marginTop:3 }}>{MODALIDADES.find(m => m.value === form.modalidad_seleccion)?.legal}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Valor estimado (COP) *</label>
                  <input className="form-input" type="number" placeholder="0" value={form.valor_estimado} onChange={e => setForm(f => ({ ...f, valor_estimado: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Rubro presupuestal</label>
                  <input className="form-input" type="text" placeholder="2-2-01-01-001" value={form.rubro_presupuestal} onChange={e => setForm(f => ({ ...f, rubro_presupuestal: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Fuente de financiación</label>
                  <input className="form-input" type="text" placeholder="Recursos propios, SGP, SGR..." value={form.fuente_financiacion} onChange={e => setForm(f => ({ ...f, fuente_financiacion: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha inicio proceso estimada</label>
                  <input className="form-input" type="date" value={form.fecha_inicio_proceso} onChange={e => setForm(f => ({ ...f, fecha_inicio_proceso: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha suscripción estimada</label>
                  <input className="form-input" type="date" value={form.fecha_suscripcion_estimada} onChange={e => setForm(f => ({ ...f, fecha_suscripcion_estimada: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Duración estimada (meses)</label>
                  <input className="form-input" type="number" min="1" placeholder="12" value={form.duracion_estimada_meses} onChange={e => setForm(f => ({ ...f, duracion_estimada_meses: e.target.value }))}/>
                </div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-input" rows={2} value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} style={{ resize:'vertical' }}/>
                </div>
              </div>

              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Agregar al PAA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
