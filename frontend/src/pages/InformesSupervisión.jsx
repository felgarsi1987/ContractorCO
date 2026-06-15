import { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { informes as informesDB, contratos as contratosDB } from '../lib/db';

const ESTADO_CONFIG = {
  borrador: { label:'Borrador', cls:'badge-orange' },
  enviado:  { label:'Enviado',  cls:'badge-blue' },
  aprobado: { label:'Aprobado', cls:'badge-green' },
};

function CumplimientoBar({ valor }) {
  const color = valor >= 80 ? '#059669' : valor >= 50 ? '#D97706' : '#DC2626';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:6, background:'#E2E8F0', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${valor}%`, background:color, borderRadius:99, transition:'width .4s' }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:700, color, minWidth:36 }}>{valor}%</span>
    </div>
  );
}

export default function InformesSupervisión() {
  const [lista, setLista]         = useState([]);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [expandido, setExpandido] = useState(null);
  const [modal, setModal]         = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    contrato_id:'', supervisor_id:'', periodo_inicio:'', periodo_fin:'',
    numero_informe:'', actividades:'', cumplimiento_objeto:80,
    valor_pagado_periodo:'', observaciones:'', recomendaciones:'',
    requiere_accion:false, estado:'borrador',
  });

  useEffect(() => {
    cargar();
    contratosDB.listar({ limit:200 }).then(r => setContratos(r.data || []));
  }, [filtroEstado]);

  async function cargar() {
    setLoading(true);
    try {
      const data = await informesDB.listar({ estado: filtroEstado || undefined });
      setLista(data);
    } catch { toast.error('Error cargando informes'); }
    finally { setLoading(false); }
  }

  async function guardar() {
    if (!form.contrato_id || !form.periodo_inicio || !form.periodo_fin || !form.actividades || !form.numero_informe) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    setGuardando(true);
    try {
      await informesDB.crear({
        ...form,
        numero_informe: parseInt(form.numero_informe),
        cumplimiento_objeto: parseInt(form.cumplimiento_objeto),
        valor_pagado_periodo: parseFloat(form.valor_pagado_periodo) || 0,
      });
      toast.success('Informe creado');
      setModal(false);
      setForm({ contrato_id:'', supervisor_id:'', periodo_inicio:'', periodo_fin:'', numero_informe:'', actividades:'', cumplimiento_objeto:80, valor_pagado_periodo:'', observaciones:'', recomendaciones:'', requiere_accion:false, estado:'borrador' });
      cargar();
    } catch (e) { toast.error(e.message || 'Error guardando informe'); }
    finally { setGuardando(false); }
  }

  async function aprobar(id) {
    try {
      await informesDB.aprobar(id);
      toast.success('Informe aprobado');
      cargar();
    } catch { toast.error('Error aprobando informe'); }
  }

  const total      = lista.length;
  const borradores = lista.filter(i => i.estado === 'borrador').length;
  const aprobados  = lista.filter(i => i.estado === 'aprobado').length;
  const requieren  = lista.filter(i => i.requiere_accion).length;

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1>Informes de Supervisión</h1>
          <p>Art. 83 Ley 1474/2011 — Obligación mensual del supervisor designado</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={13}/> Nuevo Informe
        </button>
      </div>

      <div className="grid-4" style={{ flexShrink:0 }}>
        {[
          { label:'TOTAL INFORMES',   val:total,      ic:'#059669', bg:'#D1FAE5', Icon:FileText },
          { label:'BORRADORES',       val:borradores, ic:'#D97706', bg:'#FEF9C3', Icon:Clock },
          { label:'APROBADOS',        val:aprobados,  ic:'#059669', bg:'#D1FAE5', Icon:CheckCircle },
          { label:'REQUIEREN ACCIÓN', val:requieren,  ic:'#DC2626', bg:'#FEE2E2', Icon:AlertTriangle },
        ].map(({ label, val, ic, bg, Icon }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon" style={{ background: bg }}><Icon size={16} style={{ color: ic }}/></div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{val}</div>
            <div className="kpi-card-bar" style={{ background: ic }}/>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
        {[['','Todos'],['borrador','Borradores'],['enviado','Enviados'],['aprobado','Aprobados']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltroEstado(v)}
            className={filtroEstado === v ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding:'5px 14px', fontSize:11 }}>{l}</button>
        ))}
      </div>

      <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? (
          <div className="card" style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Cargando informes...</div>
        ) : lista.length === 0 ? (
          <div className="card" style={{ padding:60, textAlign:'center', color:'#9CA3AF' }}>
            <FileText size={32} style={{ margin:'0 auto 12px', display:'block', opacity:.25 }}/>
            <p style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>No hay informes de supervisión</p>
            <p style={{ fontSize:12 }}>El Art. 83 Ley 1474/2011 exige informe mensual durante la ejecución</p>
          </div>
        ) : lista.map(inf => {
          const cfg = ESTADO_CONFIG[inf.estado] || ESTADO_CONFIG.borrador;
          const abierto = expandido === inf.id;
          return (
            <div key={inf.id} className="card" style={{ padding:0, border: inf.requiere_accion ? '1px solid #FECACA' : undefined }}>
              <div onClick={() => setExpandido(abierto ? null : inf.id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ color:'#1e293b', fontSize:13, fontWeight:600 }}>
                      Informe #{inf.numero_informe} — {inf.contratos?.numero_contrato || '—'}
                    </span>
                    <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                    {inf.requiere_accion && <span className="badge badge-red">Acción requerida</span>}
                  </div>
                  <div style={{ fontSize:11, color:'#64748b' }}>
                    Período: {inf.periodo_inicio} {'->'} {inf.periodo_fin}
                    {inf.valor_pagado_periodo > 0 && <> · Pagado: ${Number(inf.valor_pagado_periodo).toLocaleString('es-CO')}</>}
                  </div>
                </div>
                <div style={{ width:160 }}>
                  <CumplimientoBar valor={inf.cumplimiento_objeto}/>
                </div>
                {abierto ? <ChevronUp size={14} color="#94a3b8"/> : <ChevronDown size={14} color="#94a3b8"/>}
              </div>

              {abierto && (
                <div style={{ borderTop:'1px solid var(--border)', padding:'14px 16px', background:'#F8FAFC' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, letterSpacing:'.06em', marginBottom:4 }}>ACTIVIDADES DESARROLLADAS</div>
                      <p style={{ color:'#475569', fontSize:12, margin:0, lineHeight:1.6 }}>{inf.actividades}</p>
                    </div>
                    {inf.observaciones && (
                      <div>
                        <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, letterSpacing:'.06em', marginBottom:4 }}>OBSERVACIONES</div>
                        <p style={{ color:'#475569', fontSize:12, margin:0, lineHeight:1.6 }}>{inf.observaciones}</p>
                      </div>
                    )}
                    {inf.recomendaciones && (
                      <div>
                        <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, letterSpacing:'.06em', marginBottom:4 }}>RECOMENDACIONES</div>
                        <p style={{ color:'#475569', fontSize:12, margin:0, lineHeight:1.6 }}>{inf.recomendaciones}</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:10, color:'#94a3b8' }}>Art. 83 Ley 1474/2011 — Supervisión e interventoría contractual</div>
                    {inf.estado !== 'aprobado' && (
                      <button onClick={() => aprobar(inf.id)} className="btn btn-primary" style={{ padding:'6px 14px', fontSize:11, display:'flex', alignItems:'center', gap:5 }}>
                        <CheckCircle size={11}/> Aprobar informe
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth:640 }}>
            <div className="modal-hdr">
              <div>
                <h2>Nuevo Informe de Supervisión</h2>
                <p style={{ margin:0, fontSize:11, color:'#64748b' }}>Art. 83 Ley 1474/2011 — Frecuencia mensual obligatoria</p>
              </div>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={16}/></button>
            </div>
            <div style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'10px 14px', fontSize:11, color:'#1e40af', lineHeight:1.6 }}>
                <strong>Obligación legal:</strong> El Art. 83 Ley 1474/2011 establece que el supervisor debe rendir informe mensual sobre la ejecución del contrato, el cumplimiento del objeto, el avance financiero y las novedades presentadas.
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Contrato *</label>
                  <select className="form-select" value={form.contrato_id} onChange={e => setForm(f => ({ ...f, contrato_id: e.target.value }))}>
                    <option value="">Seleccionar contrato...</option>
                    {contratos.map(c => <option key={c.id} value={c.id}>{c.numero_contrato} — {c.objeto?.substring(0,50)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Período inicio *</label>
                  <input className="form-input" type="date" value={form.periodo_inicio} onChange={e => setForm(f => ({ ...f, periodo_inicio: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Período fin *</label>
                  <input className="form-input" type="date" value={form.periodo_fin} onChange={e => setForm(f => ({ ...f, periodo_fin: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">N° informe *</label>
                  <input className="form-input" type="number" min="1" placeholder="1" value={form.numero_informe} onChange={e => setForm(f => ({ ...f, numero_informe: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor pagado en el período</label>
                  <input className="form-input" type="number" placeholder="0" value={form.valor_pagado_periodo} onChange={e => setForm(f => ({ ...f, valor_pagado_periodo: e.target.value }))}/>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">% Cumplimiento del objeto *</label>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <input type="range" min="0" max="100" value={form.cumplimiento_objeto}
                    onChange={e => setForm(f => ({ ...f, cumplimiento_objeto: e.target.value }))}
                    style={{ flex:1, accentColor:'var(--forest)' }}/>
                  <span style={{ color:'var(--forest)', fontWeight:700, fontSize:14, minWidth:40 }}>{form.cumplimiento_objeto}%</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Actividades desarrolladas *</label>
                <textarea className="form-input" rows={4} placeholder="Describe las actividades ejecutadas en el período..." value={form.actividades}
                  onChange={e => setForm(f => ({ ...f, actividades: e.target.value }))} style={{ resize:'vertical' }}/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-input" rows={3} value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} style={{ resize:'vertical' }}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Recomendaciones</label>
                  <textarea className="form-input" rows={3} value={form.recomendaciones} onChange={e => setForm(f => ({ ...f, recomendaciones: e.target.value }))} style={{ resize:'vertical' }}/>
                </div>
              </div>

              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                <input type="checkbox" checked={form.requiere_accion} onChange={e => setForm(f => ({ ...f, requiere_accion: e.target.checked }))}
                  style={{ accentColor:'#DC2626', width:14, height:14 }}/>
                <span style={{ color:'#475569', fontSize:12 }}>Requiere acción inmediata de la entidad</span>
              </label>

              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Crear informe'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
