import { useState, useEffect } from 'react';
import { Shield, Plus, AlertTriangle, CheckCircle, Clock, X, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const TIPO_LABEL = {
  cumplimiento:            'Cumplimiento',
  buen_manejo_anticipo:    'Buen Manejo del Anticipo',
  pago_salarios:           'Pago de Salarios y Prestaciones',
  estabilidad_obra:        'Estabilidad de la Obra',
  calidad_suministro:      'Calidad del Suministro',
  responsabilidad_civil:   'Responsabilidad Civil',
  responsabilidad_servidores: 'Responsabilidad de Servidores',
};

const PORCENTAJE_REF = {
  cumplimiento:            '10% del valor del contrato (mínimo)',
  buen_manejo_anticipo:    '100% del valor del anticipo',
  pago_salarios:           '5% del valor del contrato — vigencia: contrato + 3 años',
  estabilidad_obra:        '10–30% del valor — vigencia según ley',
  calidad_suministro:      '10% del valor del contrato',
  responsabilidad_civil:   'Según estudio de riesgo',
  responsabilidad_servidores: 'Según cargo del servidor',
};

const FUNDAMENTO = {
  cumplimiento:            'Art. 2.2.1.2.3.1.3 Decreto 1082/15',
  buen_manejo_anticipo:    'Art. 2.2.1.2.3.1.4 Decreto 1082/15',
  pago_salarios:           'Art. 2.2.1.2.3.1.5 Decreto 1082/15',
  estabilidad_obra:        'Art. 2.2.1.2.3.1.6 Decreto 1082/15',
  calidad_suministro:      'Art. 2.2.1.2.3.1.7 Decreto 1082/15',
  responsabilidad_civil:   'Art. 2.2.1.2.3.1.8 Decreto 1082/15',
  responsabilidad_servidores: 'Art. 52 Ley 80/93',
};

const fCOP = v =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);

const fDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function SemaforoBadge({ dias, estado }) {
  if (estado === 'vencida' || dias < 0)  return <span className="badge badge-red">Vencida</span>;
  if (dias <= 15)  return <span className="badge badge-red">{dias}d restantes</span>;
  if (dias <= 30)  return <span className="badge badge-orange">{dias}d restantes</span>;
  return <span className="badge badge-green">Vigente · {dias}d</span>;
}

const EMPTY = {
  contrato_id: '', tipo_garantia: 'cumplimiento', aseguradora: '',
  numero_poliza: '', valor_asegurado: '', porcentaje: '',
  fecha_inicio: '', fecha_vencimiento: '', observaciones: '',
};

export default function Garantias() {
  const [garantias,  setGarantias]  = useState([]);
  const [contratos,  setContratos]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState(EMPTY);
  const [filtroEstado, setFiltro]   = useState('');
  const [expandido,  setExpandido]  = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const [{ data: g }, { data: c }] = await Promise.all([
        supabase.from('v_garantias').select('*').order('fecha_vencimiento'),
        supabase.from('contratos').select('id, numero_contrato, objeto').eq('estado', 'en_ejecucion').order('numero_contrato'),
      ]);
      setGarantias(g || []);
      setContratos(c || []);
    } catch { toast.error('Error al cargar garantías'); }
    finally { setLoading(false); }
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.contrato_id || !form.aseguradora || !form.numero_poliza || !form.fecha_inicio || !form.fecha_vencimiento) {
      return toast.error('Completa los campos obligatorios');
    }
    if (new Date(form.fecha_vencimiento) <= new Date(form.fecha_inicio)) {
      return toast.error('La fecha de vencimiento debe ser posterior a la de inicio');
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('garantias').insert({
        contrato_id:      form.contrato_id,
        tipo_garantia:    form.tipo_garantia,
        aseguradora:      form.aseguradora.trim(),
        numero_poliza:    form.numero_poliza.trim(),
        valor_asegurado:  parseFloat(form.valor_asegurado) || 0,
        porcentaje:       parseFloat(form.porcentaje) || null,
        fecha_inicio:     form.fecha_inicio,
        fecha_vencimiento: form.fecha_vencimiento,
        observaciones:    form.observaciones.trim() || null,
      });
      if (error) throw error;
      toast.success('Garantía registrada');
      setShowModal(false);
      setForm(EMPTY);
      cargar();
    } catch (err) { toast.error(err.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const filtradas = filtroEstado
    ? garantias.filter(g => g.estado_semaforo === filtroEstado || g.estado === filtroEstado)
    : garantias;

  const stats = {
    total:     garantias.length,
    vigentes:  garantias.filter(g => g.estado === 'vigente' && g.dias_para_vencer > 30).length,
    porVencer: garantias.filter(g => g.estado === 'vigente' && g.dias_para_vencer <= 30).length,
    vencidas:  garantias.filter(g => g.estado === 'vencida' || g.dias_para_vencer < 0).length,
  };

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1>Garantías y Pólizas</h1>
          <p>Control de garantías contractuales · Decreto 1082/15</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={13}/> Registrar Garantía
        </button>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ flexShrink: 0 }}>
        {[
          { label: 'TOTAL PÓLIZAS',   val: stats.total,     ic: '#059669', bg: '#D1FAE5', bar: '#059669' },
          { label: 'VIGENTES',        val: stats.vigentes,  ic: '#059669', bg: '#D1FAE5', bar: '#059669' },
          { label: 'POR VENCER',      val: stats.porVencer, ic: '#7C3AED', bg: '#EDE9FE', bar: '#7C3AED' },
          { label: 'VENCIDAS',        val: stats.vencidas,  ic: '#5B21B6', bg: '#DDD6FE', bar: '#064E3B' },
        ].map(({ label, val, ic, bg, bar }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon" style={{ background: bg }}>
              <Shield size={16} style={{ color: ic }}/>
            </div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{val}</div>
            <div className="kpi-card-bar" style={{ background: bar }}/>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {[
          { key: '',          label: 'Todas' },
          { key: 'vigente',   label: 'Vigentes' },
          { key: 'por_vencer',label: 'Por Vencer' },
          { key: 'vencida',   label: 'Vencidas' },
        ].map(({ key, label }) => (
          <button key={key}
            className={`btn ${filtroEstado === key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '5px 12px' }}
            onClick={() => setFiltro(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="card" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Cargando...</div>
        ) : filtradas.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
            <Shield size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: .25 }}/>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Sin garantías registradas</p>
            <p style={{ fontSize: 12 }}>Registra las pólizas exigidas por el Decreto 1082/15</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo de Garantía</th>
                  <th>Contrato</th>
                  <th>Aseguradora</th>
                  <th>N° Póliza</th>
                  <th>Valor Asegurado</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(g => (
                  <>
                    <tr key={g.id} onClick={() => setExpandido(expandido === g.id ? null : g.id)}
                      style={{ cursor: 'pointer' }}>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--forest)' }}>
                          {TIPO_LABEL[g.tipo_garantia] || g.tipo_garantia}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                          {FUNDAMENTO[g.tipo_garantia]}
                        </div>
                      </td>
                      <td className="td-strong">{g.numero_contrato}</td>
                      <td style={{ fontSize: 12, color: '#475569' }}>{g.aseguradora}</td>
                      <td style={{ fontSize: 12, fontFamily: 'monospace', color: '#334155' }}>{g.numero_poliza}</td>
                      <td style={{ fontWeight: 600, color: '#059669', fontSize: 12 }}>{fCOP(g.valor_asegurado)}</td>
                      <td style={{ fontSize: 12, color: '#475569' }}>{fDate(g.fecha_vencimiento)}</td>
                      <td><SemaforoBadge dias={g.dias_para_vencer} estado={g.estado}/></td>
                      <td>
                        <ChevronDown size={13} style={{ color: '#94a3b8', transform: expandido === g.id ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}/>
                      </td>
                    </tr>
                    {expandido === g.id && (
                      <tr key={g.id + '-detail'}>
                        <td colSpan={8} style={{ padding: '0 16px 16px', background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, paddingTop: 12 }}>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Referencia Legal</div>
                              <div style={{ fontSize: 12, color: '#334155' }}>{FUNDAMENTO[g.tipo_garantia]}</div>
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{PORCENTAJE_REF[g.tipo_garantia]}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Vigencia</div>
                              <div style={{ fontSize: 12, color: '#334155' }}>{fDate(g.fecha_inicio)} → {fDate(g.fecha_vencimiento)}</div>
                              {g.porcentaje && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{g.porcentaje}% del valor del contrato</div>}
                            </div>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Contratista</div>
                              <div style={{ fontSize: 12, color: '#334155' }}>{g.contratista_nombre}</div>
                              {g.observaciones && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>{g.observaciones}</div>}
                            </div>
                          </div>
                          {(g.dias_para_vencer <= 30 && g.estado !== 'vencida') && (
                            <div style={{ marginTop: 12, padding: '8px 12px', background: '#ECFDF5', borderRadius: 8, borderLeft: '3px solid #059669', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                              <AlertTriangle size={14} style={{ color: '#059669', flexShrink: 0 }}/>
                              <span style={{ color: '#064E3B' }}>Esta póliza vence en <strong>{g.dias_para_vencer} días</strong>. Gestiona la renovación con la aseguradora antes del vencimiento para evitar incumplimiento del Art. 2.2.1.2.3.1 Decreto 1082/15.</span>
                            </div>
                          )}
                          {g.estado === 'vencida' && (
                            <div style={{ marginTop: 12, padding: '8px 12px', background: '#D1FAE5', borderRadius: 8, borderLeft: '3px solid #064E3B', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                              <AlertTriangle size={14} style={{ color: '#064E3B', flexShrink: 0 }}/>
                              <span style={{ color: '#7F1D1D' }}><strong>Póliza vencida.</strong> El contrato puede estar incurso en causal de incumplimiento. Exige renovación inmediata y notifica al ordenador del gasto.</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-hdr">
              <h2>Registrar Garantía</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>
            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 24px 24px' }}>

              {/* Contrato */}
              <div className="form-group">
                <label className="form-label">Contrato *</label>
                <select className="form-select" value={form.contrato_id} onChange={e => setForm(f => ({ ...f, contrato_id: e.target.value }))} required>
                  <option value="">— Selecciona un contrato —</option>
                  {contratos.map(c => <option key={c.id} value={c.id}>{c.numero_contrato} · {c.objeto?.slice(0, 50)}</option>)}
                </select>
              </div>

              {/* Tipo */}
              <div className="form-group">
                <label className="form-label">Tipo de Garantía *</label>
                <select className="form-select" value={form.tipo_garantia} onChange={e => setForm(f => ({ ...f, tipo_garantia: e.target.value }))}>
                  {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {form.tipo_garantia && (
                  <div style={{ marginTop: 6, padding: '6px 10px', background: '#F0FDF4', borderRadius: 6, fontSize: 11, color: '#166534' }}>
                    📋 {PORCENTAJE_REF[form.tipo_garantia]} — {FUNDAMENTO[form.tipo_garantia]}
                  </div>
                )}
              </div>

              {/* Aseguradora y Póliza */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Aseguradora *</label>
                  <input className="form-input" value={form.aseguradora} onChange={e => setForm(f => ({ ...f, aseguradora: e.target.value }))} placeholder="Ej: Seguros Bolívar S.A." required/>
                </div>
                <div className="form-group">
                  <label className="form-label">N° Póliza *</label>
                  <input className="form-input" value={form.numero_poliza} onChange={e => setForm(f => ({ ...f, numero_poliza: e.target.value }))} placeholder="Ej: SB-2025-00123" required/>
                </div>
              </div>

              {/* Valor y porcentaje */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Valor Asegurado (COP) *</label>
                  <input className="form-input" type="number" value={form.valor_asegurado} onChange={e => setForm(f => ({ ...f, valor_asegurado: e.target.value }))} placeholder="0" required/>
                </div>
                <div className="form-group">
                  <label className="form-label">% sobre contrato</label>
                  <input className="form-input" type="number" step="0.01" value={form.porcentaje} onChange={e => setForm(f => ({ ...f, porcentaje: e.target.value }))} placeholder="Ej: 10"/>
                </div>
              </div>

              {/* Fechas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Fecha Inicio *</label>
                  <input className="form-input" type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} required/>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha Vencimiento *</label>
                  <input className="form-input" type="date" value={form.fecha_vencimiento} onChange={e => setForm(f => ({ ...f, fecha_vencimiento: e.target.value }))} required/>
                </div>
              </div>

              {/* Observaciones */}
              <div className="form-group">
                <label className="form-label">Observaciones</label>
                <textarea className="form-input" rows={2} value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} placeholder="Amparos incluidos, condiciones especiales..."/>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Registrar Garantía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
