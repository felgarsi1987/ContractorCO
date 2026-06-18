import { useState, useEffect } from 'react';
import { DollarSign, Plus, CheckCircle, XCircle, Clock, AlertTriangle, X, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { pagos as pagosDB, contratos as contratosDB } from '../lib/db';
import SearchSelect from '../components/ui/SearchSelect';

const REQUISITOS = [
  { key:'paz_salvo_ss',      label:'Paz y salvo seguridad social',        legal:'Art. 23 Ley 1150/07 + Art. 50 Ley 789/02' },
  { key:'garantias_vigentes',label:'Garantías vigentes aprobadas',        legal:'Decreto 1082/15 Art. 2.2.1.2.3.1' },
  { key:'informe_supervisor',label:'Informe de supervisión del período',  legal:'Art. 83 Ley 1474/2011' },
  { key:'factura',           label:'Factura o cuenta de cobro',           legal:'Estatuto Tributario Art. 615' },
  { key:'certificado_arl',   label:'Certificado afiliación ARL',          legal:'Art. 23 Ley 1150/07' },
  { key:'cdp_rp',            label:'CDP / RP vigentes',                   legal:'Ley 819/2003 Art. 7' },
];

const ESTADO_PAGO = {
  pendiente:  { label:'Pendiente',  cls:'badge-orange' },
  en_proceso: { label:'En proceso', cls:'badge-blue' },
  pagado:     { label:'Pagado',     cls:'badge-green' },
  rechazado:  { label:'Rechazado',  cls:'badge-red' },
};

const fCOP = v => `$${Number(v||0).toLocaleString('es-CO')}`;

function RequisitoBadge({ cumplido, label, legal }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', background: cumplido ? '#D1FAE5' : '#FFEDD5', border:`1px solid ${cumplido ? '#A7F3D0' : '#FED7AA'}`, borderRadius:6 }}>
      {cumplido
        ? <CheckCircle size={13} style={{ color:'#059669', flexShrink:0, marginTop:1 }}/>
        : <XCircle    size={13} style={{ color:'#C2410C', flexShrink:0, marginTop:1 }}/>
      }
      <div>
        <div style={{ fontSize:11, fontWeight:600, color: cumplido ? '#059669' : '#9A3412' }}>{label}</div>
        <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{legal}</div>
      </div>
    </div>
  );
}

export default function Pagos() {
  const [lista, setLista]         = useState([]);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modal, setModal]         = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [detalleId, setDetalleId] = useState(null);

  const [form, setForm] = useState({
    contrato_id:'', numero_pago:'', concepto:'', valor:'',
    periodo_inicio:'', periodo_fin:'', numero_factura:'',
    requisitos:{ paz_salvo_ss:false, garantias_vigentes:false, informe_supervisor:false, factura:false, certificado_arl:false, cdp_rp:false },
    observaciones:'',
  });

  useEffect(() => { cargar(); }, [filtroEstado]);
  useEffect(() => { contratosDB.listar({ limit:200 }).then(r => setContratos(r.data || [])); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await pagosDB.listar({ estado: filtroEstado || undefined });
      setLista(data);
    } catch { toast.error('Error cargando pagos'); }
    finally { setLoading(false); }
  }

  const requisitosOk = Object.values(form.requisitos).every(Boolean);

  async function guardar() {
    if (!form.contrato_id || !form.valor || !form.concepto) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    if (!requisitosOk) {
      toast.error('Debes verificar todos los requisitos previos al pago');
      return;
    }
    setGuardando(true);
    try {
      await pagosDB.crear({
        contrato_id: form.contrato_id, numero_pago: parseInt(form.numero_pago) || 1,
        concepto: form.concepto, valor: parseFloat(form.valor),
        periodo_inicio: form.periodo_inicio || null, periodo_fin: form.periodo_fin || null,
        numero_factura: form.numero_factura || null,
        requisitos_verificados: form.requisitos,
        observaciones: form.observaciones || null, estado:'pendiente',
      });
      toast.success('Pago registrado exitosamente');
      setModal(false);
      resetForm();
      cargar();
    } catch (e) { toast.error(e.message || 'Error registrando pago'); }
    finally { setGuardando(false); }
  }

  async function cambiarEstado(id, estado) {
    try {
      await pagosDB.actualizar(id, { estado });
      toast.success(`Pago marcado como ${ESTADO_PAGO[estado]?.label}`);
      cargar();
    } catch { toast.error('Error actualizando estado'); }
  }

  function resetForm() {
    setForm({ contrato_id:'', numero_pago:'', concepto:'', valor:'', periodo_inicio:'', periodo_fin:'', numero_factura:'', requisitos:{ paz_salvo_ss:false, garantias_vigentes:false, informe_supervisor:false, factura:false, certificado_arl:false, cdp_rp:false }, observaciones:'' });
  }

  const total      = lista.length;
  const pendientes = lista.filter(p => p.estado === 'pendiente').length;
  const pagados    = lista.filter(p => p.estado === 'pagado').length;
  const valorTotal = lista.filter(p => p.estado === 'pagado').reduce((s, p) => s + (p.valor || 0), 0);

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1>Pagos Contractuales</h1>
          <p>Art. 23 Ley 1150/07 · Verificación de requisitos previos obligatoria</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={13}/> Registrar Pago
        </button>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ flexShrink:0 }}>
        {[
          { label:'TOTAL PAGOS',   val: total,      ic:'#059669', bg:'#D1FAE5', Icon:DollarSign },
          { label:'PENDIENTES',    val: pendientes, ic:'#C2410C', bg:'#FFEDD5', Icon:Clock },
          { label:'PAGADOS',       val: pagados,    ic:'#059669', bg:'#D1FAE5', Icon:CheckCircle },
          { label:'VALOR PAGADO',  val: `$${(valorTotal/1e6).toFixed(1)}M`, ic:'#C2410C', bg:'#FFEDD5', Icon:DollarSign },
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
      <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'10px 14px', flexShrink:0, display:'flex', gap:10, alignItems:'flex-start' }}>
        <Shield size={14} style={{ color:'#78716C', flexShrink:0, marginTop:1 }}/>
        <p style={{ margin:0, fontSize:11, color:'#78716C', lineHeight:1.6 }}>
          <strong>Art. 23 Ley 1150/2007:</strong> Ningún pago podrá realizarse sin verificar previamente el cumplimiento de aportes a seguridad social (salud, pensión y ARL). La entidad responde solidariamente por los aportes no pagados.
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
        {[['','Todos'],['pendiente','Pendientes'],['en_proceso','En proceso'],['pagado','Pagados'],['rechazado','Rechazados']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltroEstado(v)}
            className={filtroEstado === v ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding:'5px 14px', fontSize:11 }}>{l}</button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ flex:1, minHeight:0, overflow:'auto', display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? (
          <div className="card" style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Cargando pagos...</div>
        ) : lista.length === 0 ? (
          <div className="card" style={{ padding:60, textAlign:'center', color:'#9CA3AF' }}>
            <DollarSign size={32} style={{ margin:'0 auto 12px', display:'block', opacity:.25 }}/>
            <p style={{ fontSize:14, fontWeight:600, margin:0 }}>No hay pagos registrados</p>
          </div>
        ) : lista.map(pago => {
          const cfg = ESTADO_PAGO[pago.estado] || ESTADO_PAGO.pendiente;
          const req = pago.requisitos_verificados || {};
          const requisitosCompletos = REQUISITOS.every(r => req[r.key]);
          return (
            <div key={pago.id} className="card" style={{ padding:0, border: !requisitosCompletos ? '1px solid #D1FAE5' : undefined }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ color:'#1F2937', fontSize:13, fontWeight:600 }}>
                      Pago #{pago.numero_pago} — {pago.contratos?.numero_contrato || '—'}
                    </span>
                    <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                    {!requisitosCompletos && <span className="badge badge-red"><AlertTriangle size={9}/> Requisitos incompletos</span>}
                  </div>
                  <div style={{ fontSize:11, color:'#64748b' }}>
                    {pago.concepto}
                    {pago.periodo_inicio && <> · {pago.periodo_inicio} → {pago.periodo_fin}</>}
                    {pago.numero_factura && <> · Factura: {pago.numero_factura}</>}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:16, fontWeight:800, color:'#059669' }}>{fCOP(pago.valor)}</div>
                  <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{new Date(pago.creado_en).toLocaleDateString('es-CO')}</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => setDetalleId(detalleId === pago.id ? null : pago.id)}
                    className="btn btn-secondary" style={{ padding:'5px 10px', fontSize:11 }}>
                    Requisitos
                  </button>
                  {pago.estado === 'pendiente' && (
                    <button onClick={() => cambiarEstado(pago.id, 'pagado')}
                      className="btn btn-primary" style={{ padding:'5px 10px', fontSize:11 }}>
                      Marcar pagado
                    </button>
                  )}
                </div>
              </div>

              {detalleId === pago.id && (
                <div style={{ borderTop:'1px solid var(--border)', padding:'14px 16px', background:'#F8FAFC' }}>
                  <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, letterSpacing:'.06em', marginBottom:10 }}>
                    REQUISITOS PREVIOS AL PAGO — ART. 23 LEY 1150/2007
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                    {REQUISITOS.map(r => <RequisitoBadge key={r.key} cumplido={req[r.key]} label={r.label} legal={r.legal}/>)}
                  </div>
                  {pago.observaciones && (
                    <div style={{ marginTop:12, fontSize:12, color:'#475569' }}>
                      <strong style={{ fontSize:10, color:'#94a3b8', letterSpacing:'.06em' }}>OBSERVACIONES: </strong>
                      {pago.observaciones}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && (setModal(false), resetForm())}>
          <div className="modal" style={{ maxWidth:660 }}>
            <div className="modal-hdr">
              <div>
                <h2>Registrar Pago</h2>
                <p style={{ margin:0, fontSize:11, color:'#64748b' }}>Verificación de requisitos previos obligatoria</p>
              </div>
              <button className="btn-icon" onClick={() => { setModal(false); resetForm(); }}><X size={16}/></button>
            </div>
            <div style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Contrato *</label>
                  <SearchSelect
                    value={form.contrato_id}
                    onChange={v => setForm(f => ({ ...f, contrato_id: v }))}
                    options={contratos.map(c => ({ value: c.id, label: c.numero_contrato, sublabel: c.objeto?.substring(0,60) }))}
                    placeholder="Seleccionar contrato..."
                    searchPlaceholder="Buscar por número u objeto..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">N° pago</label>
                  <input className="form-input" type="number" min="1" placeholder="1" value={form.numero_pago} onChange={e => setForm(f => ({ ...f, numero_pago: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor * (COP)</label>
                  <input className="form-input" type="number" placeholder="0" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}/>
                </div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Concepto *</label>
                  <input className="form-input" type="text" placeholder="Pago mes 1 — servicios de consultoría..." value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Período inicio</label>
                  <input className="form-input" type="date" value={form.periodo_inicio} onChange={e => setForm(f => ({ ...f, periodo_inicio: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Período fin</label>
                  <input className="form-input" type="date" value={form.periodo_fin} onChange={e => setForm(f => ({ ...f, periodo_fin: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">N° factura / cuenta de cobro</label>
                  <input className="form-input" type="text" value={form.numero_factura} onChange={e => setForm(f => ({ ...f, numero_factura: e.target.value }))}/>
                </div>
              </div>

              {/* Verificación requisitos */}
              <div>
                <div style={{ fontSize:11, color:'#94a3b8', fontWeight:700, letterSpacing:'.06em', marginBottom:8 }}>
                  VERIFICACIÓN DE REQUISITOS PREVIOS — ART. 23 LEY 1150/2007 *
                </div>
                {!requisitosOk && (
                  <div style={{ background:'#FFEDD5', border:'1px solid #FED7AA', borderRadius:6, padding:'8px 12px', marginBottom:10, fontSize:11, color:'#9A3412' }}>
                    ⚠ Todos los requisitos deben estar verificados antes de procesar el pago
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {REQUISITOS.map(r => (
                    <label key={r.key} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', background:'#F8FAFC', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer' }}>
                      <input type="checkbox" checked={form.requisitos[r.key]}
                        onChange={e => setForm(f => ({ ...f, requisitos: { ...f.requisitos, [r.key]: e.target.checked } }))}
                        style={{ accentColor:'var(--forest)', marginTop:1, flexShrink:0 }}/>
                      <div>
                        <div style={{ fontSize:11, color:'#475569', fontWeight:500 }}>{r.label}</div>
                        <div style={{ fontSize:10, color:'#94a3b8' }}>{r.legal}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones</label>
                <textarea className="form-input" rows={2} value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} style={{ resize:'vertical' }}/>
              </div>

              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setModal(false); resetForm(); }}>Cancelar</button>
                <button type="button" onClick={guardar} disabled={guardando || !requisitosOk}
                  className={requisitosOk ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ opacity: !requisitosOk ? .5 : 1, cursor: !requisitosOk ? 'not-allowed' : 'pointer' }}>
                  {guardando ? 'Guardando...' : requisitosOk ? 'Registrar pago' : 'Requisitos incompletos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
