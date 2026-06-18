import { useState, useEffect } from 'react';
import { Heart, Plus, CheckCircle, XCircle, AlertTriangle, Clock, X, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { seguridadSocial as ssDB, contratos as contratosDB } from '../lib/db';
import SearchSelect from '../components/ui/SearchSelect';

const RIESGOS_ARL = [
  { value: 'I',   label: 'Clase I — Riesgo mínimo',  tarifa: '0.522%' },
  { value: 'II',  label: 'Clase II — Riesgo bajo',    tarifa: '1.044%' },
  { value: 'III', label: 'Clase III — Riesgo medio',  tarifa: '2.436%' },
  { value: 'IV',  label: 'Clase IV — Riesgo alto',    tarifa: '4.350%' },
  { value: 'V',   label: 'Clase V — Riesgo máximo',   tarifa: '6.960%' },
];

const CONCEPTOS = [
  { key: 'salud',   label: 'Salud',   porcentaje: '12.5%', legal: 'Art. 204 Ley 100/93' },
  { key: 'pension', label: 'Pensión', porcentaje: '16%',   legal: 'Art. 20 Ley 100/93' },
  { key: 'arl',     label: 'ARL',     porcentaje: 'Según clase', legal: 'Decreto 1295/94' },
];

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const fCOP = v => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(v || 0);

function EstadoBadge({ verificado }) {
  if (verificado === null || verificado === undefined) return <span className="badge badge-gray">Sin verificar</span>;
  return verificado
    ? <span className="badge badge-green"><CheckCircle size={9}/> Verificado</span>
    : <span className="badge badge-red"><XCircle size={9}/> No verificado</span>;
}

export default function SeguridadSocial() {
  const [lista, setLista]         = useState([]);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [filtroContrato, setFiltroContrato] = useState('');

  const anioActual = new Date().getFullYear();
  const mesActual  = new Date().getMonth() + 1;

  const [form, setForm] = useState({
    contrato_id: '', periodo_mes: mesActual, periodo_anio: anioActual,
    valor_ibc: '', clase_riesgo_arl: 'I',
    salud_valor: '', salud_verificado: false,
    pension_valor: '', pension_verificado: false,
    arl_valor: '', arl_verificado: false,
    numero_planilla: '', observaciones: '',
  });

  useEffect(() => { cargar(); }, [filtroContrato]);
  useEffect(() => { contratosDB.listar({ limit:200 }).then(r => setContratos(r.data || [])); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await ssDB.listar({ contrato_id: filtroContrato || undefined });
      setLista(data);
    } catch { toast.error('Error cargando verificaciones'); }
    finally { setLoading(false); }
  }

  function calcularAportes(ibc, claseRiesgo) {
    const v = parseFloat(ibc) || 0;
    const tarifas = { I:0.00522, II:0.01044, III:0.02436, IV:0.04350, V:0.06960 };
    return {
      salud:   Math.round(v * 0.125),
      pension: Math.round(v * 0.16),
      arl:     Math.round(v * (tarifas[claseRiesgo] || 0.00522)),
    };
  }

  const aportes = calcularAportes(form.valor_ibc, form.clase_riesgo_arl);

  async function guardar() {
    if (!form.contrato_id || !form.periodo_mes || !form.periodo_anio) {
      toast.error('Selecciona contrato y período');
      return;
    }
    setGuardando(true);
    try {
      await ssDB.crear({
        ...form,
        periodo_mes:   parseInt(form.periodo_mes),
        periodo_anio:  parseInt(form.periodo_anio),
        valor_ibc:     parseFloat(form.valor_ibc) || 0,
        salud_valor:   parseFloat(form.salud_valor)   || aportes.salud,
        pension_valor: parseFloat(form.pension_valor) || aportes.pension,
        arl_valor:     parseFloat(form.arl_valor)     || aportes.arl,
      });
      toast.success('Verificación registrada');
      setModal(false);
      cargar();
    } catch (e) { toast.error(e.message || 'Error guardando'); }
    finally { setGuardando(false); }
  }

  const totalCompletos = lista.filter(v => v.salud_verificado && v.pension_verificado && v.arl_verificado).length;
  const pendientes     = lista.filter(v => !v.salud_verificado || !v.pension_verificado || !v.arl_verificado).length;

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1>Seguridad Social</h1>
          <p>Art. 23 Ley 1150/07 · Decreto 1273/2018 — Verificación mensual obligatoria por contrato</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={13}/> Registrar verificación
        </button>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ flexShrink:0 }}>
        {[
          { label:'TOTAL PERÍODOS',  val: lista.length,      ic:'#059669', bg:'#D1FAE5', Icon: Heart },
          { label:'COMPLETOS',       val: totalCompletos,    ic:'#059669', bg:'#D1FAE5', Icon: CheckCircle },
          { label:'CON PENDIENTES',  val: pendientes,        ic:'#C2410C', bg:'#FFEDD5', Icon: AlertTriangle },
          { label:'ESTE MES',        val: lista.filter(v => v.periodo_mes === mesActual).length, ic:'#C2410C', bg:'#FFEDD5', Icon: Clock },
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
        <p style={{ margin:0, fontSize:12, color:'#78716C', lineHeight:1.6 }}>
          <strong>Art. 23 Ley 1150/2007 + Decreto 1273/2018:</strong> La entidad debe verificar mensualmente el pago de aportes a seguridad social (salud 12.5%, pensión 16%, ARL según clase de riesgo) sobre el IBC. Base mínima: 40% del valor mensual, máx. 25 SMLMV.
        </p>
      </div>

      {/* Tarifas */}
      <div className="card" style={{ flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'.08em', marginBottom:12 }}>TARIFAS LEGALES DE COTIZACIÓN</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {CONCEPTOS.map(c => (
            <div key={c.key} style={{ background:'#F8FAFC', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:2 }}>{c.label}</div>
              <div style={{ fontSize:20, fontWeight:800, color:'var(--forest)' }}>{c.porcentaje}</div>
              <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{c.legal}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtro */}
      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
        <SearchSelect
          value={filtroContrato}
          onChange={setFiltroContrato}
          options={contratos.map(c => ({ value: c.id, label: c.numero_contrato, sublabel: c.objeto?.substring(0,50) }))}
          placeholder="Todos los contratos"
          searchPlaceholder="Buscar contrato..."
          style={{ maxWidth: 340 }}
        />
      </div>

      {/* Tabla */}
      <div className="card" style={{ flex:1, minHeight:0, overflow:'auto' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Cargando...</div>
        ) : lista.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>
            <Heart size={32} style={{ margin:'0 auto 12px', display:'block', opacity:.25 }}/>
            <p style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Sin verificaciones registradas</p>
            <p style={{ fontSize:12 }}>Registra una verificación por cada período mensual de ejecución</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Contrato</th>
                <th>Período</th>
                <th>IBC</th>
                <th>Salud</th>
                <th>Pensión</th>
                <th>ARL</th>
                <th>Planilla</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(v => {
                const completo = v.salud_verificado && v.pension_verificado && v.arl_verificado;
                return (
                  <tr key={v.id}>
                    <td className="td-strong">{v.contratos?.numero_contrato || '—'}</td>
                    <td style={{ fontSize:12 }}>{MESES[(v.periodo_mes || 1) - 1]} {v.periodo_anio}</td>
                    <td style={{ fontSize:12, fontWeight:600, color:'#059669' }}>{fCOP(v.valor_ibc)}</td>
                    <td>
                      <div style={{ fontSize:11, color:'#475569', marginBottom:3 }}>{fCOP(v.salud_valor)}</div>
                      <EstadoBadge verificado={v.salud_verificado}/>
                    </td>
                    <td>
                      <div style={{ fontSize:11, color:'#475569', marginBottom:3 }}>{fCOP(v.pension_valor)}</div>
                      <EstadoBadge verificado={v.pension_verificado}/>
                    </td>
                    <td>
                      <div style={{ fontSize:11, color:'#475569', marginBottom:3 }}>{fCOP(v.arl_valor)}</div>
                      <EstadoBadge verificado={v.arl_verificado}/>
                    </td>
                    <td className="td-muted">{v.numero_planilla || '—'}</td>
                    <td>
                      {completo
                        ? <span className="badge badge-green">✓ Completo</span>
                        : <span className="badge badge-orange">⚠ Pendiente</span>
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
          <div className="modal" style={{ maxWidth:620 }}>
            <div className="modal-hdr">
              <div>
                <h2>Verificar Seguridad Social</h2>
                <p style={{ margin:0, fontSize:11, color:'#64748b' }}>Art. 23 Ley 1150/07 · Verificación mensual por contrato</p>
              </div>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={16}/></button>
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
                  <label className="form-label">Mes *</label>
                  <select className="form-select" value={form.periodo_mes} onChange={e => setForm(f => ({ ...f, periodo_mes: e.target.value }))}>
                    {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Año *</label>
                  <select className="form-select" value={form.periodo_anio} onChange={e => setForm(f => ({ ...f, periodo_anio: e.target.value }))}>
                    {[2023,2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">IBC — Ingreso Base de Cotización (COP)</label>
                  <input className="form-input" type="number" placeholder="Mín. 40% del valor mensual" value={form.valor_ibc} onChange={e => setForm(f => ({ ...f, valor_ibc: e.target.value }))}/>
                  <div style={{ fontSize:10, color:'#94a3b8', marginTop:3 }}>Base mínima: 40% del pago mensual · Máx: 25 SMLMV — Decreto 1273/2018</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Clase de riesgo ARL</label>
                  <select className="form-select" value={form.clase_riesgo_arl} onChange={e => setForm(f => ({ ...f, clase_riesgo_arl: e.target.value }))}>
                    {RIESGOS_ARL.map(r => <option key={r.value} value={r.value}>{r.label} ({r.tarifa})</option>)}
                  </select>
                </div>
              </div>

              {form.valor_ibc > 0 && (
                <div style={{ background:'#F5F5F4', border:'1px solid #D6D3D1', borderRadius:8, padding:'12px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#78716C', letterSpacing:'.06em', marginBottom:8 }}>APORTES CALCULADOS AUTOMÁTICAMENTE</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                    {[
                      { k:'salud',   l:'Salud (12.5%)',   v: aportes.salud },
                      { k:'pension', l:'Pensión (16%)',    v: aportes.pension },
                      { k:'arl',     l:`ARL (${RIESGOS_ARL.find(r => r.value === form.clase_riesgo_arl)?.tarifa})`, v: aportes.arl },
                    ].map(({ k, l, v }) => (
                      <div key={k} style={{ textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'#059669', marginBottom:3 }}>{l}</div>
                        <div style={{ fontSize:18, fontWeight:800, color:'#059669' }}>{fCOP(v)}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:10, color:'#059669', marginTop:8, textAlign:'center' }}>
                    Total: {fCOP(aportes.salud + aportes.pension + aportes.arl)}
                  </div>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {[
                  { k:'salud',   l:'Salud',   vk:'salud_valor' },
                  { k:'pension', l:'Pensión',  vk:'pension_valor' },
                  { k:'arl',     l:'ARL',      vk:'arl_valor' },
                ].map(({ k, l, vk }) => (
                  <div key={k} className="form-group" style={{ background:'#F8FAFC', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px' }}>
                    <label className="form-label">{l} verificado</label>
                    <input className="form-input" type="number" placeholder={String(aportes[k])} value={form[vk]} onChange={e => setForm(f => ({ ...f, [vk]: e.target.value }))} style={{ marginBottom:8 }}/>
                    <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:12 }}>
                      <input type="checkbox" checked={form[`${k}_verificado`]} onChange={e => setForm(f => ({ ...f, [`${k}_verificado`]: e.target.checked }))}/>
                      Pago verificado
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">N° planilla PILA</label>
                  <input className="form-input" type="text" placeholder="PILA-2025-001234" value={form.numero_planilla} onChange={e => setForm(f => ({ ...f, numero_planilla: e.target.value }))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <input className="form-input" type="text" value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}/>
                </div>
              </div>

              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Registrar verificación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
