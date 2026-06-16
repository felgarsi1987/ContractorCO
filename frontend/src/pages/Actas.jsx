import { useState, useEffect } from 'react';
import { FileText, Plus, AlertTriangle, CheckCircle, Clock, X, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const TIPO_LABEL = {
  inicio:      'Acta de Inicio',
  suspension:  'Acta de Suspensión',
  reinicio:    'Acta de Reinicio',
  terminacion: 'Acta de Terminación',
  liquidacion: 'Acta de Liquidación',
};

const TIPO_COLOR = {
  inicio:      { bg: '#D1FAE5', ic: '#059669' },
  suspension:  { bg: '#ECFDF5', ic: '#047857' },
  reinicio:    { bg: '#D1FAE5', ic: '#059669' },
  terminacion: { bg: '#F0FDFA', ic: '#7C3AED' },
  liquidacion: { bg: '#FFE4E6', ic: '#BE123C' },
};

const FUNDAMENTO_ACTA = {
  inicio:      'Art. 41 Ley 80/93 — Debe suscribirse antes del inicio de la ejecución y del primer pago',
  suspension:  'Art. 19 Ley 80/93 — Solo procede por causas justificadas acordadas por las partes',
  reinicio:    'Art. 19 Ley 80/93 — Se suscribe al superar la causa que generó la suspensión',
  terminacion: 'Art. 17 Ley 80/93 — Cuando se cumple el objeto o por causales legales',
  liquidacion: 'Art. 60 Ley 80/93 — Plazo máximo: 4 meses desde terminación. Puede ser bilateral o unilateral.',
};

const ESTADO_LABEL = {
  borrador:        { label: 'Borrador',         cls: 'badge-gray'   },
  pendiente_firma: { label: 'Pendiente Firma',  cls: 'badge-orange' },
  firmada:         { label: 'Firmada',          cls: 'badge-green'  },
  unilateral:      { label: 'Unilateral',       cls: 'badge-red'    },
};

const fDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fCOP  = v => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);

const EMPTY = {
  contrato_id: '', tipo_acta: 'inicio', numero_acta: '', fecha_acta: '',
  descripcion: '', causa_suspension: '', dias_suspension: '',
  valor_ejecutado: '', saldo_favor_entidad: '', saldo_favor_contratista: '',
  es_unilateral: false,
};

export default function Actas() {
  const [actas,      setActas]      = useState([]);
  const [contratos,  setContratos]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState(EMPTY);
  const [filtroTipo, setFiltroTipo] = useState('');

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const [{ data: a }, { data: c }] = await Promise.all([
        supabase.from('actas')
          .select(`*, contratos(numero_contrato, objeto, fecha_fin, valor_actual), creado_por_nombre:usuarios(nombre)`)
          .order('fecha_acta', { ascending: false }),
        supabase.from('contratos')
          .select('id, numero_contrato, objeto, fecha_fin, valor_actual')
          .in('estado', ['en_ejecucion', 'terminado'])
          .order('numero_contrato'),
      ]);
      setActas(a || []);
      setContratos(c || []);
    } catch { toast.error('Error al cargar actas'); }
    finally { setLoading(false); }
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.contrato_id || !form.fecha_acta || !form.descripcion) {
      return toast.error('Completa los campos obligatorios');
    }
    if (form.tipo_acta === 'suspension' && !form.causa_suspension) {
      return toast.error('Las actas de suspensión requieren causa justificada (Art. 19 Ley 80)');
    }
    setSaving(true);
    try {
      const payload = {
        contrato_id:   form.contrato_id,
        tipo_acta:     form.tipo_acta,
        numero_acta:   form.numero_acta.trim() || null,
        fecha_acta:    form.fecha_acta,
        descripcion:   form.descripcion.trim(),
        estado:        'pendiente_firma',
      };
      if (form.tipo_acta === 'suspension') {
        payload.causa_suspension = form.causa_suspension.trim();
        payload.dias_suspension  = parseInt(form.dias_suspension) || 0;
      }
      if (form.tipo_acta === 'liquidacion') {
        payload.valor_ejecutado           = parseFloat(form.valor_ejecutado) || 0;
        payload.saldo_favor_entidad       = parseFloat(form.saldo_favor_entidad) || 0;
        payload.saldo_favor_contratista   = parseFloat(form.saldo_favor_contratista) || 0;
        payload.es_unilateral             = form.es_unilateral;
        if (form.es_unilateral) payload.estado = 'unilateral';
      }

      const { error } = await supabase.from('actas').insert(payload);
      if (error) throw error;
      toast.success('Acta registrada');
      setShowModal(false);
      setForm(EMPTY);
      cargar();
    } catch (err) { toast.error(err.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const firmar = async (id, campo) => {
    try {
      const { data: acta } = await supabase.from('actas').select('*').eq('id', id).single();
      const update = { [campo]: true, [`fecha_${campo.replace('firmada_', 'firma_')}`]: new Date().toISOString().slice(0, 10) };
      // Si todas las firmas están listas → estado firmada
      const firmadas = {
        firmada_supervisor:  acta.firmada_supervisor,
        firmada_contratista: acta.firmada_contratista,
        firmada_juridica:    acta.firmada_juridica,
        ...update,
      };
      if (firmadas.firmada_supervisor && firmadas.firmada_contratista && firmadas.firmada_juridica) {
        update.estado = 'firmada';
      }
      const { error } = await supabase.from('actas').update(update).eq('id', id);
      if (error) throw error;
      toast.success('Firma registrada');
      cargar();
    } catch { toast.error('Error al registrar firma'); }
  };

  // Alertas de liquidación vencida (4 meses Art. 60)
  const liquidacionesAlerta = actas.filter(a => {
    if (a.tipo_acta !== 'liquidacion' && a.contratos?.estado === 'terminado') {
      const plazo = new Date(a.contratos.fecha_fin);
      plazo.setMonth(plazo.getMonth() + 4);
      return plazo < new Date() && a.estado !== 'firmada';
    }
    return false;
  });

  const filtradas = filtroTipo ? actas.filter(a => a.tipo_acta === filtroTipo) : actas;

  const stats = Object.fromEntries(
    ['inicio', 'suspension', 'reinicio', 'terminacion', 'liquidacion'].map(t => [t, actas.filter(a => a.tipo_acta === t).length])
  );

  const contratoSeleccionado = contratos.find(c => c.id === form.contrato_id);

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1>Actas Contractuales</h1>
          <p>Gestión de actas · Arts. 19, 41, 60 Ley 80/93</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={13}/> Nueva Acta
        </button>
      </div>

      {/* Alerta legal — liquidaciones vencidas */}
      {liquidacionesAlerta.length > 0 && (
        <div style={{ background: '#DDD6FE', border: '1px solid #C4B5FD', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', flexShrink: 0 }}>
          <AlertTriangle size={16} style={{ color: '#064E3B', flexShrink: 0, marginTop: 2 }}/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7F1D1D' }}>
              {liquidacionesAlerta.length} contrato{liquidacionesAlerta.length > 1 ? 's' : ''} con plazo de liquidación vencido
            </div>
            <div style={{ fontSize: 12, color: '#991B1B', marginTop: 2 }}>
              El Art. 60 Ley 80/93 establece un plazo máximo de 4 meses para liquidar desde la terminación. Puede derivar en responsabilidad disciplinaria del supervisor.
            </div>
          </div>
        </div>
      )}

      {/* KPIs por tipo */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        {Object.entries(TIPO_LABEL).map(([key, label]) => {
          const { bg, ic } = TIPO_COLOR[key];
          return (
            <button key={key}
              onClick={() => setFiltroTipo(filtroTipo === key ? '' : key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 8, border: '1px solid',
                borderColor: filtroTipo === key ? ic : '#E2E8F0',
                background: filtroTipo === key ? bg : '#fff',
                cursor: 'pointer', fontSize: 12, fontWeight: 600, color: filtroTipo === key ? ic : '#475569',
                transition: 'all 150ms ease',
              }}>
              <span style={{ background: bg, color: ic, borderRadius: 999, padding: '1px 8px', fontSize: 11 }}>
                {stats[key] || 0}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {/* Listado */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Cargando actas...</div>
        ) : filtradas.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: .25 }}/>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Sin actas registradas</p>
            <p style={{ fontSize: 12 }}>Las actas son el soporte legal de cada etapa del contrato</p>
          </div>
        ) : filtradas.map(acta => {
          const { bg, ic } = TIPO_COLOR[acta.tipo_acta] || TIPO_COLOR.inicio;
          const est = ESTADO_LABEL[acta.estado] || ESTADO_LABEL.borrador;
          const plazoLiquidacion = acta.contratos?.fecha_fin
            ? new Date(new Date(acta.contratos.fecha_fin).setMonth(new Date(acta.contratos.fecha_fin).getMonth() + 4))
            : null;
          const liquidacionVencida = acta.tipo_acta === 'liquidacion' && plazoLiquidacion && plazoLiquidacion < new Date() && acta.estado !== 'firmada';

          return (
            <div key={acta.id} className="card" style={{ padding: 16, borderLeft: `4px solid ${ic}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                {/* Encabezado */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={16} style={{ color: ic }}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}>{TIPO_LABEL[acta.tipo_acta]}</span>
                      {acta.numero_acta && <span style={{ fontSize: 11, color: '#94a3b8' }}>N° {acta.numero_acta}</span>}
                      <span className={`badge ${est.cls}`}>{est.label}</span>
                      {liquidacionVencida && <span className="badge badge-red">⚠ Plazo vencido</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>
                      <strong>{acta.contratos?.numero_contrato}</strong> · {fDate(acta.fecha_acta)}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{acta.descripcion}</div>
                  </div>
                </div>

                {/* Firmas */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Control de Firmas</div>
                  {[
                    { campo: 'firmada_supervisor',   label: 'Supervisor',   val: acta.firmada_supervisor },
                    { campo: 'firmada_contratista',  label: 'Contratista',  val: acta.firmada_contratista },
                    { campo: 'firmada_juridica',     label: 'Jurídica',     val: acta.firmada_juridica },
                  ].map(({ campo, label, val }) => (
                    <div key={campo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {val
                          ? <CheckCircle size={12} style={{ color: '#059669' }}/>
                          : <Clock size={12} style={{ color: '#059669' }}/>}
                        <span style={{ fontSize: 11, color: val ? '#059669' : '#92400E' }}>{label}</span>
                      </div>
                      {!val && acta.estado !== 'firmada' && acta.estado !== 'unilateral' && (
                        <button
                          style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer' }}
                          onClick={() => firmar(acta.id, campo)}>
                          Firmar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalles extra: suspensión o liquidación */}
              {acta.tipo_acta === 'suspension' && acta.causa_suspension && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: '#ECFDF5', borderRadius: 6, fontSize: 12, color: '#064E3B' }}>
                  <strong>Causa:</strong> {acta.causa_suspension}
                  {acta.dias_suspension > 0 && <span> · <strong>{acta.dias_suspension} días</strong> de suspensión</span>}
                </div>
              )}
              {acta.tipo_acta === 'liquidacion' && acta.valor_ejecutado && (
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {[
                    { label: 'Valor Ejecutado',        val: fCOP(acta.valor_ejecutado) },
                    { label: 'Saldo a Favor Entidad',  val: fCOP(acta.saldo_favor_entidad) },
                    { label: 'Saldo a Favor Contrat.', val: fCOP(acta.saldo_favor_contratista) },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ background: '#F8FAFC', borderRadius: 6, padding: '8px 12px' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Referencia legal */}
              <div style={{ marginTop: 10, fontSize: 10, color: '#94a3b8', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                📋 {FUNDAMENTO_ACTA[acta.tipo_acta]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-hdr">
              <h2>Nueva Acta</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>
            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 24px 24px' }}>

              {/* Tipo de acta */}
              <div className="form-group">
                <label className="form-label">Tipo de Acta *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  {Object.entries(TIPO_LABEL).map(([key, label]) => {
                    const { bg, ic } = TIPO_COLOR[key];
                    const sel = form.tipo_acta === key;
                    return (
                      <button key={key} type="button"
                        style={{ padding: '8px 6px', borderRadius: 8, border: `1.5px solid ${sel ? ic : '#E2E8F0'}`, background: sel ? bg : '#fff', color: sel ? ic : '#475569', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => setForm(f => ({ ...f, tipo_acta: key }))}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                {form.tipo_acta && (
                  <div style={{ marginTop: 8, padding: '6px 10px', background: '#F0FDF4', borderRadius: 6, fontSize: 11, color: '#166534' }}>
                    📋 {FUNDAMENTO_ACTA[form.tipo_acta]}
                  </div>
                )}
              </div>

              {/* Contrato */}
              <div className="form-group">
                <label className="form-label">Contrato *</label>
                <select className="form-select" value={form.contrato_id} onChange={e => setForm(f => ({ ...f, contrato_id: e.target.value }))} required>
                  <option value="">— Selecciona un contrato —</option>
                  {contratos.map(c => <option key={c.id} value={c.id}>{c.numero_contrato} · {c.objeto?.slice(0, 50)}</option>)}
                </select>
                {contratoSeleccionado && form.tipo_acta === 'liquidacion' && (
                  <div style={{ marginTop: 6, padding: '6px 10px', background: '#ECFDF5', borderRadius: 6, fontSize: 11, color: '#064E3B' }}>
                    ⚠ Plazo máximo de liquidación: {new Date(new Date(contratoSeleccionado.fecha_fin).setMonth(new Date(contratoSeleccionado.fecha_fin).getMonth() + 4)).toLocaleDateString('es-CO')} (4 meses desde terminación)
                  </div>
                )}
              </div>

              {/* N° Acta y fecha */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">N° Acta</label>
                  <input className="form-input" value={form.numero_acta} onChange={e => setForm(f => ({ ...f, numero_acta: e.target.value }))} placeholder="ACTA-INI-001-2025"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha del Acta *</label>
                  <input className="form-input" type="date" value={form.fecha_acta} onChange={e => setForm(f => ({ ...f, fecha_acta: e.target.value }))} required/>
                </div>
              </div>

              {/* Descripción */}
              <div className="form-group">
                <label className="form-label">Descripción *</label>
                <textarea className="form-input" rows={3} value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder={form.tipo_acta === 'inicio' ? 'Se da inicio a la ejecución del contrato conforme a las obligaciones pactadas...' :
                    form.tipo_acta === 'suspension' ? 'Se suspende la ejecución del contrato por...' :
                    'Descripción del acta...'} required/>
              </div>

              {/* Campos adicionales para suspensión */}
              {form.tipo_acta === 'suspension' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Causa de Suspensión * (Art. 19 Ley 80)</label>
                    <textarea className="form-input" rows={2} value={form.causa_suspension}
                      onChange={e => setForm(f => ({ ...f, causa_suspension: e.target.value }))}
                      placeholder="Causa justificada que motiva la suspensión..." required/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Días de Suspensión (estimados)</label>
                    <input className="form-input" type="number" value={form.dias_suspension}
                      onChange={e => setForm(f => ({ ...f, dias_suspension: e.target.value }))} placeholder="30"/>
                  </div>
                </>
              )}

              {/* Campos adicionales para liquidación */}
              {form.tipo_acta === 'liquidacion' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Valor Ejecutado</label>
                      <input className="form-input" type="number" value={form.valor_ejecutado}
                        onChange={e => setForm(f => ({ ...f, valor_ejecutado: e.target.value }))} placeholder="0"/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Saldo Favor Entidad</label>
                      <input className="form-input" type="number" value={form.saldo_favor_entidad}
                        onChange={e => setForm(f => ({ ...f, saldo_favor_entidad: e.target.value }))} placeholder="0"/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Saldo Favor Contratista</label>
                      <input className="form-input" type="number" value={form.saldo_favor_contratista}
                        onChange={e => setForm(f => ({ ...f, saldo_favor_contratista: e.target.value }))} placeholder="0"/>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.es_unilateral}
                      onChange={e => setForm(f => ({ ...f, es_unilateral: e.target.checked }))}/>
                    <span>Liquidación unilateral (contratista no firma — Art. 60 párr. 2 Ley 80)</span>
                  </label>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Acta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
