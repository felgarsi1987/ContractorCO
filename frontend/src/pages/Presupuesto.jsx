import { useState, useEffect } from 'react';
import { Wallet, Plus, X, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { presupuesto as presDB, contratos as contratosDB } from '../lib/db';

const TIPO_CONFIG = {
  cdp: { label:'CDP', full:'Certificado de Disponibilidad Presupuestal', color:'#C2410C', bg:'#FFEDD5', legal:'Art. 71 Decreto 111/1996', desc:'Acredita que existe apropiación disponible para comprometer el gasto' },
  rp:  { label:'RP',  full:'Registro Presupuestal',                       color:'#059669', bg:'#D1FAE5', legal:'Art. 71 Decreto 111/1996', desc:'Garantiza que los recursos quedan reservados para el pago del contrato' },
  op:  { label:'OP',  full:'Orden de Pago',                               color:'#047857', bg:'#ECFDF5', legal:'Art. 36 Decreto 111/1996', desc:'Instrucción de pago al tesorero sobre los recursos apropiados' },
};

const FUENTES = ['Recursos propios','SGP','SGR','Crédito','Cofinanciación','Recursos de capital','Otros'];
const RUBROS_EJEMPLO = ['2-2-01-01-001','2-2-01-02-001','2-2-02-01-001','3-1-01-01-001'];

const fCOP = v => `$${Number(v || 0).toLocaleString('es-CO')}`;

function TipoBadge({ tipo }) {
  const cfg = TIPO_CONFIG[tipo];
  if (!cfg) return null;
  const cls = { cdp:'badge-purple', rp:'badge-green', op:'badge-orange' }[tipo] || 'badge-gray';
  return <span className={`badge ${cls}`}>{cfg.label}</span>;
}

export default function Presupuesto() {
  const [lista, setLista]         = useState([]);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [filtroTipo, setFiltroTipo]         = useState('');
  const [filtroContrato, setFiltroContrato] = useState('');

  const [form, setForm] = useState({
    tipo:'cdp', contrato_id:'', numero:'', fecha_expedicion: new Date().toISOString().slice(0,10),
    vigencia: String(new Date().getFullYear()), rubro_presupuestal:'',
    fuente_financiacion:'', valor:'', valor_afectado:'', observaciones:'', cdp_id:'',
  });

  useEffect(() => { cargar(); }, [filtroTipo, filtroContrato]);
  useEffect(() => { contratosDB.listar({ limit:200 }).then(r => setContratos(r.data || [])); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await presDB.listar({ tipo: filtroTipo || undefined, contrato_id: filtroContrato || undefined });
      setLista(data);
    } catch { toast.error('Error cargando registros'); }
    finally { setLoading(false); }
  }

  async function guardar() {
    if (!form.numero || !form.valor || !form.fecha_expedicion) {
      toast.error('Completa número, valor y fecha');
      return;
    }
    setGuardando(true);
    try {
      await presDB.crear({ ...form, valor: parseFloat(form.valor), valor_afectado: parseFloat(form.valor_afectado) || null, cdp_id: form.cdp_id || null });
      toast.success(`${TIPO_CONFIG[form.tipo]?.label} registrado`);
      setModal(false);
      setForm({ tipo:'cdp', contrato_id:'', numero:'', fecha_expedicion: new Date().toISOString().slice(0,10), vigencia: String(new Date().getFullYear()), rubro_presupuestal:'', fuente_financiacion:'', valor:'', valor_afectado:'', observaciones:'', cdp_id:'' });
      cargar();
    } catch (e) { toast.error(e.message || 'Error'); }
    finally { setGuardando(false); }
  }

  const valorCDP = lista.filter(i => i.tipo === 'cdp').reduce((s, i) => s + Number(i.valor || 0), 0);
  const valorRP  = lista.filter(i => i.tipo === 'rp').reduce((s, i) => s + Number(i.valor || 0), 0);

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1>Gestión Presupuestal</h1>
          <p>Decreto 111/1996 · Ley 819/2003 — CDP, Registro Presupuestal y Órdenes de Pago</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={13}/> Nuevo registro
        </button>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ flexShrink:0 }}>
        {[
          { label:'TOTAL CDP',    val:`$${(valorCDP/1e6).toFixed(1)}M`, ic:'#C2410C', bg:'#FFEDD5', Icon:Wallet },
          { label:'TOTAL RP',     val:`$${(valorRP/1e6).toFixed(1)}M`,  ic:'#059669', bg:'#D1FAE5', Icon:Wallet },
          { label:'ÓRDENES PAGO', val: lista.filter(i=>i.tipo==='op').length, ic:'#047857', bg:'#ECFDF5', Icon:Wallet },
          { label:'SIN RP',       val: lista.filter(i=>i.tipo==='cdp' && !lista.some(r=>r.tipo==='rp'&&r.cdp_id===i.id)).length, ic:'#9A3412', bg:'#FED7AA', Icon:Wallet },
        ].map(({ label, val, ic, bg, Icon }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon" style={{ background: bg }}><Icon size={16} style={{ color: ic }}/></div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{val}</div>
            <div className="kpi-card-bar" style={{ background: ic }}/>
          </div>
        ))}
      </div>

      {/* Info tipos */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, flexShrink:0 }}>
        {Object.entries(TIPO_CONFIG).map(([k, cfg]) => (
          <div key={k} className="card" style={{ padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span className="badge" style={{ background: cfg.bg, color: cfg.color, fontWeight:800 }}>{cfg.label}</span>
              <span style={{ fontSize:11, fontWeight:600, color:'#064E3B' }}>{cfg.full}</span>
            </div>
            <p style={{ margin:0, fontSize:11, color:'#64748b', lineHeight:1.5 }}>{cfg.desc}</p>
            <div style={{ fontSize:10, color:'#94a3b8', marginTop:4 }}>{cfg.legal}</div>
          </div>
        ))}
      </div>

      {/* Alerta normativa */}
      <div style={{ background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:8, padding:'10px 14px', flexShrink:0, fontSize:11, color:'#065F46', lineHeight:1.6 }}>
        <strong>Art. 71 Decreto 111/1996:</strong> Ningún compromiso del Presupuesto General de la Nación puede adquirirse sin la expedición previa del CDP. El RP afecta el presupuesto en el momento de la suscripción del contrato y garantiza los recursos para el pago.
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap', alignItems:'center' }}>
        {[['','Todos'],['cdp','CDP'],['rp','RP'],['op','OP']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltroTipo(v)}
            className={filtroTipo === v ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding:'5px 14px', fontSize:11 }}>{l}</button>
        ))}
        <select className="form-select" style={{ maxWidth:260 }} value={filtroContrato} onChange={e => setFiltroContrato(e.target.value)}>
          <option value="">Todos los contratos</option>
          {contratos.map(c => <option key={c.id} value={c.id}>{c.numero_contrato}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="card" style={{ flex:1, minHeight:0, overflow:'auto' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Cargando...</div>
        ) : lista.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'#9CA3AF' }}>
            <Wallet size={32} style={{ margin:'0 auto 12px', display:'block', opacity:.25 }}/>
            <p style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>No hay registros presupuestales</p>
            <p style={{ fontSize:12 }}>El CDP debe expedirse antes de comprometer cualquier recurso público</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th><th>Número</th><th>Contrato</th><th>Vigencia</th>
                <th>Rubro</th><th>Fuente</th><th>Valor</th><th>Fecha</th><th>Vinculado a</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(item => {
                const cfg = TIPO_CONFIG[item.tipo];
                const cdpVinculado = item.cdp_id ? lista.find(i => i.id === item.cdp_id) : null;
                return (
                  <tr key={item.id}>
                    <td><TipoBadge tipo={item.tipo}/></td>
                    <td className="td-strong">{item.numero}</td>
                    <td className="td-muted">{item.contratos?.numero_contrato || <em style={{ color:'#cbd5e1' }}>Sin contrato</em>}</td>
                    <td className="td-muted">{item.vigencia}</td>
                    <td className="td-muted">{item.rubro_presupuestal || '—'}</td>
                    <td className="td-muted">{item.fuente_financiacion || '—'}</td>
                    <td style={{ fontSize:12, fontWeight:700, color: cfg?.color }}>{fCOP(item.valor)}</td>
                    <td className="td-muted">{item.fecha_expedicion}</td>
                    <td>
                      {cdpVinculado
                        ? <span style={{ fontSize:10, color:'#C2410C', display:'flex', alignItems:'center', gap:4 }}><Link2 size={10}/> CDP {cdpVinculado.numero}</span>
                        : <span className="td-muted">—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth:600 }}>
            <div className="modal-hdr">
              <div>
                <h2>Nuevo Registro Presupuestal</h2>
                <p style={{ margin:0, fontSize:11, color:'#64748b' }}>Decreto 111/1996 · Ley 819/2003</p>
              </div>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={16}/></button>
            </div>
            <div style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:14 }}>
              {/* Selector tipo */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {Object.entries(TIPO_CONFIG).map(([k, cfg]) => (
                  <button key={k} type="button" onClick={() => setForm(f => ({ ...f, tipo: k }))}
                    style={{ padding:10, borderRadius:8, border:`2px solid ${form.tipo===k ? cfg.color : '#e2e8f0'}`, background: form.tipo===k ? cfg.bg : 'transparent', cursor:'pointer', transition:'all .15s' }}>
                    <div style={{ fontSize:14, fontWeight:800, color: form.tipo===k ? cfg.color : '#94a3b8', marginBottom:2 }}>{cfg.label}</div>
                    <div style={{ fontSize:9, color:'#94a3b8' }}>{cfg.full}</div>
                  </button>
                ))}
              </div>

              {form.tipo && (
                <div style={{ background:'#F5F5F4', border:'1px solid #E2E8F0', borderRadius:7, padding:'8px 12px', fontSize:11, color:'#475569' }}>
                  {TIPO_CONFIG[form.tipo].desc} — <strong>{TIPO_CONFIG[form.tipo].legal}</strong>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Número *</label>
                  <input className="form-input" type="text" placeholder="CDP-2026-001" value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha expedición *</label>
                  <input className="form-input" type="date" value={form.fecha_expedicion} onChange={e => setForm(f => ({ ...f, fecha_expedicion: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Vigencia</label>
                  <select className="form-select" value={form.vigencia} onChange={e => setForm(f => ({ ...f, vigencia: e.target.value }))}>
                    {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor (COP) *</label>
                  <input className="form-input" type="number" placeholder="0" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Rubro presupuestal</label>
                  <input className="form-input" type="text" list="rubros" placeholder="2-2-01-01-001" value={form.rubro_presupuestal} onChange={e => setForm(f => ({ ...f, rubro_presupuestal: e.target.value }))}/>
                  <datalist id="rubros">{RUBROS_EJEMPLO.map(r => <option key={r} value={r}/>)}</datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">Fuente de financiación</label>
                  <select className="form-select" value={form.fuente_financiacion} onChange={e => setForm(f => ({ ...f, fuente_financiacion: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {FUENTES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contrato asociado</label>
                  <select className="form-select" value={form.contrato_id} onChange={e => setForm(f => ({ ...f, contrato_id: e.target.value }))}>
                    <option value="">Sin contrato (pre-contractual)</option>
                    {contratos.map(c => <option key={c.id} value={c.id}>{c.numero_contrato}</option>)}
                  </select>
                </div>
                {form.tipo === 'rp' && (
                  <div className="form-group">
                    <label className="form-label">CDP que afecta</label>
                    <select className="form-select" value={form.cdp_id} onChange={e => setForm(f => ({ ...f, cdp_id: e.target.value }))}>
                      <option value="">Seleccionar CDP...</option>
                      {lista.filter(i => i.tipo === 'cdp').map(c => (
                        <option key={c.id} value={c.id}>CDP {c.numero} — {fCOP(c.valor)}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-input" rows={2} value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} style={{ resize:'vertical' }}/>
                </div>
              </div>

              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : `Registrar ${TIPO_CONFIG[form.tipo]?.label}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
