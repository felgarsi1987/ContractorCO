import { useState, useEffect } from 'react';
import { Shield, Plus, AlertTriangle, CheckCircle, Clock, Search, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { inhabilidades as inhabDB, contratistas as contratistasDB } from '../lib/db';

const FUENTES = [
  { value:'procuraduria_siri', label:'Procuraduría — SIRI',   url:'https://siri.procuraduria.gov.co',       desc:'Sistema de Información de Registro de Sanciones' },
  { value:'contraloria',       label:'Contraloría — SIRI',    url:'https://www.contraloria.gov.co',          desc:'Boletín de Responsables Fiscales' },
  { value:'rama_judicial',     label:'Rama Judicial',         url:'https://www.ramajudicial.gov.co',         desc:'Consulta de antecedentes judiciales' },
  { value:'policia',           label:'Policía Nacional',      url:'https://antecedentes.policia.gov.co',     desc:'Certificado de antecedentes judiciales' },
  { value:'dian',              label:'DIAN — RUT',            url:'https://www.dian.gov.co',                 desc:'Estado tributario' },
];

const RESULTADO_CONFIG = {
  limpio:       { label:'Sin inhabilidades', cls:'badge-green',  Icon:CheckCircle },
  inhabilitado: { label:'Inhabilitado',      cls:'badge-red',    Icon:AlertTriangle },
  suspendido:   { label:'Suspendido',        cls:'badge-orange', Icon:Clock },
  pendiente:    { label:'Pendiente',         cls:'badge-purple', Icon:Clock },
};

function SemaforoContratista({ consultas }) {
  if (!consultas?.length) return <span className="badge badge-gray">Sin consultas</span>;
  const inhabilitado = consultas.some(c => c.resultado === 'inhabilitado');
  const suspendido   = consultas.some(c => c.resultado === 'suspendido');
  const vencidas     = consultas.filter(c => c.vigente_hasta && new Date(c.vigente_hasta) < new Date());
  if (inhabilitado) return <span className="badge badge-red">⛔ Inhabilitado</span>;
  if (suspendido)   return <span className="badge badge-orange">⚠ Suspendido</span>;
  if (vencidas.length > 0) return <span className="badge badge-purple">Renovar ({vencidas.length})</span>;
  return <span className="badge badge-green">✓ Vigente</span>;
}

export default function Inhabilidades() {
  const [consultas, setConsultas]       = useState([]);
  const [contratistas, setContratistas] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [buscar, setBuscar]             = useState('');
  const [filtroResultado, setFiltro]    = useState('');
  const [modal, setModal]               = useState(false);
  const [guardando, setGuardando]       = useState(false);

  const [form, setForm] = useState({
    contratista_id:'', fuente:'', fecha_consulta: new Date().toISOString().slice(0,10),
    resultado:'limpio', detalle:'', vigente_hasta:'',
  });

  useEffect(() => { cargar(); }, [filtroResultado]);
  useEffect(() => { contratistasDB.listar({ limit:500 }).then(r => setContratistas(r.data || [])); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await inhabDB.listar({ resultado: filtroResultado || undefined });
      setConsultas(data);
    } catch { toast.error('Error cargando consultas'); }
    finally { setLoading(false); }
  }

  async function guardar() {
    if (!form.contratista_id || !form.fuente || !form.fecha_consulta) {
      toast.error('Completa contratista, fuente y fecha');
      return;
    }
    setGuardando(true);
    try {
      await inhabDB.crear(form);
      toast.success('Consulta registrada');
      setModal(false);
      setForm({ contratista_id:'', fuente:'', fecha_consulta: new Date().toISOString().slice(0,10), resultado:'limpio', detalle:'', vigente_hasta:'' });
      cargar();
    } catch (e) { toast.error(e.message || 'Error'); }
    finally { setGuardando(false); }
  }

  const porContratista = consultas.reduce((acc, c) => {
    const key = c.contratista_id;
    if (!acc[key]) acc[key] = { contratista: c.contratistas, consultas: [] };
    acc[key].consultas.push(c);
    return acc;
  }, {});

  const grupos = Object.values(porContratista).filter(g => {
    if (!buscar) return true;
    const nombre = `${g.contratista?.nombres||''} ${g.contratista?.apellidos||''} ${g.contratista?.nit||''} ${g.contratista?.cedula||''}`.toLowerCase();
    return nombre.includes(buscar.toLowerCase());
  });

  const total        = consultas.length;
  const inhabilitados = consultas.filter(c => c.resultado === 'inhabilitado').length;
  const porVencer    = consultas.filter(c => c.vigente_hasta && new Date(c.vigente_hasta) < new Date(Date.now() + 30*864e5) && new Date(c.vigente_hasta) > new Date()).length;
  const vencidas     = consultas.filter(c => c.vigente_hasta && new Date(c.vigente_hasta) < new Date()).length;

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1>Inhabilidades e Incompatibilidades</h1>
          <p>Art. 8 Ley 80/93 — Consulta obligatoria en SIRI, Contraloría y Rama Judicial</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={13}/> Registrar consulta
        </button>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ flexShrink:0 }}>
        {[
          { label:'TOTAL CONSULTAS',  val:total,         ic:'#059669', bg:'#D1FAE5', Icon:Shield },
          { label:'INHABILITADOS',    val:inhabilitados, ic:'#064E3B', bg:'#D1FAE5', Icon:AlertTriangle },
          { label:'POR VENCER (30D)', val:porVencer,     ic:'#047857', bg:'#ECFDF5', Icon:Clock },
          { label:'VENCIDAS',         val:vencidas,      ic:'#0D9488', bg:'#CCFBF1', Icon:AlertTriangle },
        ].map(({ label, val, ic, bg, Icon }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon" style={{ background: bg }}><Icon size={16} style={{ color: ic }}/></div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{val}</div>
            <div className="kpi-card-bar" style={{ background: ic }}/>
          </div>
        ))}
      </div>

      {/* Alerta inhabilitados */}
      {inhabilitados > 0 && (
        <div style={{ background:'#F0FDF4', border:'1px solid #A7F3D0', borderRadius:8, padding:'12px 16px', flexShrink:0, fontSize:12, color:'#991B1B', lineHeight:1.6 }}>
          <strong>⛔ ALERTA — Art. 8 Ley 80/93:</strong> Hay {inhabilitados} contratista(s) con inhabilidades activas. La celebración de contratos con personas inhabilitadas constituye causal de nulidad absoluta y puede generar responsabilidad disciplinaria y fiscal.
        </div>
      )}

      {/* Fuentes */}
      <div className="card" style={{ flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'.08em', marginBottom:10 }}>FUENTES DE CONSULTA OBLIGATORIA — ART. 8 LEY 80/93</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {FUENTES.map(f => (
            <a key={f.value} href={f.url} target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'#F8FAFC', border:'1px solid var(--border)', borderRadius:6, textDecoration:'none', color:'var(--forest)', fontSize:11 }}>
              <ExternalLink size={10}/>{f.label}
            </a>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:10, flexShrink:0, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', maxWidth:280 }}>
          <Search size={12} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}/>
          <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar contratista..."
            className="form-input" style={{ paddingLeft:28 }}/>
        </div>
        {[['','Todos'],['limpio','Limpios'],['inhabilitado','Inhabilitados'],['suspendido','Suspendidos'],['pendiente','Pendientes']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltro(v)}
            className={filtroResultado === v ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding:'5px 14px', fontSize:11 }}>{l}</button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:12 }}>
        {loading ? (
          <div className="card" style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Cargando consultas...</div>
        ) : grupos.length === 0 ? (
          <div className="card" style={{ padding:60, textAlign:'center', color:'#9CA3AF' }}>
            <Shield size={32} style={{ margin:'0 auto 12px', display:'block', opacity:.25 }}/>
            <p style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>No hay consultas de inhabilidades</p>
            <p style={{ fontSize:12 }}>Regístralas antes de cada proceso contractual</p>
          </div>
        ) : grupos.map(({ contratista, consultas: cs }) => (
          <div key={contratista?.id || Math.random()} className="card" style={{ padding:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'#D1FAE5', display:'flex', alignItems:'center', justifyContent:'center', color:'#059669', fontSize:12, fontWeight:700, flexShrink:0 }}>
                {(contratista?.nombres || '?')[0]}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#064E3B' }}>{contratista?.nombres} {contratista?.apellidos}</div>
                <div style={{ fontSize:11, color:'#64748b' }}>{contratista?.cedula || contratista?.nit} · {contratista?.tipo_persona === 'juridica' ? 'Persona jurídica' : 'Persona natural'}</div>
              </div>
              <SemaforoContratista consultas={cs}/>
              <span style={{ fontSize:10, color:'#94a3b8' }}>{cs.length} consulta{cs.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ padding:'10px 16px', display:'flex', flexDirection:'column', gap:8 }}>
              {cs.map(c => {
                const cfg = RESULTADO_CONFIG[c.resultado] || RESULTADO_CONFIG.limpio;
                const vencida = c.vigente_hasta && new Date(c.vigente_hasta) < new Date();
                const proxima = c.vigente_hasta && !vencida && new Date(c.vigente_hasta) < new Date(Date.now() + 30*864e5);
                const fuente  = FUENTES.find(f => f.value === c.fuente);
                return (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 10px', background:'#F8FAFC', borderRadius:7, border: vencida ? '1px solid #A7F3D0' : '1px solid var(--border)' }}>
                    <cfg.Icon size={13} style={{ color: cfg.cls.includes('red') ? '#064E3B' : cfg.cls.includes('orange') ? '#047857' : '#059669', flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:12, color:'#064E3B', fontWeight:500 }}>{fuente?.label || c.fuente}</span>
                        <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                        {vencida && <span className="badge badge-red">Vencida</span>}
                        {proxima && <span className="badge badge-orange">Vence pronto</span>}
                      </div>
                      {c.detalle && <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{c.detalle}</div>}
                    </div>
                    <div style={{ textAlign:'right', fontSize:10, color:'#94a3b8', flexShrink:0 }}>
                      <div>Consultado: {c.fecha_consulta}</div>
                      {c.vigente_hasta && <div style={{ color: vencida ? '#064E3B' : proxima ? '#047857' : '#94a3b8' }}>Vigente hasta: {c.vigente_hasta}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding:'6px 16px 10px', fontSize:10, color:'#94a3b8' }}>
              Art. 8 Ley 80/93 · Art. 38 Ley 734/02 · Consulta periódica obligatoria
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth:560 }}>
            <div className="modal-hdr">
              <div>
                <h2>Registrar consulta de inhabilidades</h2>
                <p style={{ margin:0, fontSize:11, color:'#64748b' }}>Art. 8 Ley 80/93 — Obligación precontractual</p>
              </div>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={16}/></button>
            </div>
            <div style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'#F0FDF4', border:'1px solid #A7F3D0', borderRadius:8, padding:'10px 14px', fontSize:11, color:'#991B1B', lineHeight:1.6 }}>
                <strong>Art. 8 Ley 80/93:</strong> Antes de suscribir cualquier contrato, la entidad debe verificar que el contratista no se encuentre incurso en inhabilidades o incompatibilidades.
              </div>

              <div className="form-group">
                <label className="form-label">Contratista *</label>
                <select className="form-select" value={form.contratista_id} onChange={e => setForm(f => ({ ...f, contratista_id: e.target.value }))}>
                  <option value="">Seleccionar contratista...</option>
                  {contratistas.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos} — {c.cedula || c.nit}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fuente de consulta *</label>
                <select className="form-select" value={form.fuente} onChange={e => setForm(f => ({ ...f, fuente: e.target.value }))}>
                  <option value="">Seleccionar fuente...</option>
                  {FUENTES.map(f => <option key={f.value} value={f.value}>{f.label} — {f.desc}</option>)}
                </select>
                {form.fuente && (
                  <a href={FUENTES.find(f => f.value === form.fuente)?.url} target="_blank" rel="noreferrer"
                    style={{ fontSize:10, color:'var(--forest)', display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
                    <ExternalLink size={10}/> Abrir portal de consulta
                  </a>
                )}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Fecha de consulta *</label>
                  <input className="form-input" type="date" value={form.fecha_consulta} onChange={e => setForm(f => ({ ...f, fecha_consulta: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Vigente hasta</label>
                  <input className="form-input" type="date" value={form.vigente_hasta} onChange={e => setForm(f => ({ ...f, vigente_hasta: e.target.value }))}/>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resultado *</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {Object.entries(RESULTADO_CONFIG).map(([v, cfg]) => {
                    const colorMap = { 'badge-green':'#059669', 'badge-red':'#064E3B', 'badge-orange':'#047857', 'badge-purple':'#0D9488' };
                    const color = colorMap[cfg.cls] || '#64748b';
                    const active = form.resultado === v;
                    return (
                      <label key={v} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background: active ? '#F8FAFC' : 'white', border:`1px solid ${active ? color : '#E2E8F0'}`, borderRadius:6, cursor:'pointer' }}>
                        <input type="radio" name="resultado" value={v} checked={active} onChange={e => setForm(f => ({ ...f, resultado: e.target.value }))} style={{ accentColor: color }}/>
                        <cfg.Icon size={12} style={{ color }}/>
                        <span style={{ fontSize:11, color: active ? color : '#64748b', fontWeight: active ? 600 : 400 }}>{cfg.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detalle / observaciones</label>
                <textarea className="form-input" rows={3} value={form.detalle} onChange={e => setForm(f => ({ ...f, detalle: e.target.value }))} placeholder="N° de radicado, descripción de la sanción..." style={{ resize:'vertical' }}/>
              </div>

              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Registrar consulta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
