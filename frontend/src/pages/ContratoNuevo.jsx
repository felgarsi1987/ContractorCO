import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { contratos as contratosDB, contratistas as contratistasDB, supervisores as supervisoresDB } from '../lib/db';
import toast from 'react-hot-toast';

const TIPOS = [
  { value:'prestacion_servicios', label:'Prestación de Servicios' },
  { value:'obra',                 label:'Obra' },
  { value:'suministro',           label:'Suministro' },
  { value:'consultoria',          label:'Consultoría' },
  { value:'interadministrativo',  label:'Interadministrativo' },
  { value:'otro',                 label:'Otro' },
];

const STEPS = ['Información básica', 'Partes del contrato', 'Condiciones económicas', 'Revisión final'];

export default function ContratoNuevo() {
  const navigate = useNavigate();
  const [step, setStep]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [contratistas, setContratistas] = useState([]);
  const [supervisores,  setSupervisores]  = useState([]);
  const [form, setForm] = useState({
    numero_contrato:'', objeto:'', tipo_contrato:'prestacion_servicios',
    contratista_id:'', supervisor_id:'',
    valor_inicial:'', fecha_inicio:'', fecha_fin:'',
    numero_secop:'', cdp:'', rp:'', observaciones:'',
  });

  useEffect(() => {
    contratistasDB.listar({ limit:200 }).then(r => setContratistas(r.data||[])).catch(()=>{});
    supervisoresDB.listar().then(r => setSupervisores(r||[])).catch(()=>{});
  }, []);

  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const validarStep = () => {
    if (step === 0) {
      if (!form.numero_contrato) return toast.error('N° de contrato requerido');
      if (!form.objeto)          return toast.error('Objeto del contrato requerido');
      if (!form.tipo_contrato)   return toast.error('Tipo de contrato requerido');
    }
    if (step === 1) {
      if (!form.contratista_id)  return toast.error('Selecciona el contratista');
    }
    if (step === 2) {
      if (!form.valor_inicial || isNaN(form.valor_inicial) || +form.valor_inicial <= 0)
        return toast.error('Valor debe ser mayor a cero');
      if (!form.fecha_inicio)    return toast.error('Fecha de inicio requerida');
      if (!form.fecha_fin)       return toast.error('Fecha de terminación requerida');
      if (form.fecha_fin <= form.fecha_inicio)
        return toast.error('Fecha fin debe ser posterior al inicio');
    }
    return true;
  };

  const siguiente = () => { if (validarStep() === true) setStep(s => s+1); };

  const crear = async () => {
    setLoading(true);
    try {
      const nuevo = await contratosDB.crear({
        ...form,
        valor_inicial: +form.valor_inicial,
        valor_actual:  +form.valor_inicial,
        supervisor_id: form.supervisor_id || null,
        numero_secop:  form.numero_secop  || null,
        cdp:           form.cdp           || null,
        rp:            form.rp            || null,
        observaciones: form.observaciones || null,
        estado: 'borrador',
      });
      toast.success('Contrato creado correctamente');
      navigate(`/contratos/${nuevo.id}`);
    } catch(e) {
      const msg = e?.message || 'Error al crear contrato';
      if (msg.includes('unique') || msg.includes('numero_contrato'))
        toast.error('Ya existe un contrato con ese número.');
      else toast.error(msg);
    } finally { setLoading(false); }
  };

  const contratistaSel = contratistas.find(c => c.id === form.contratista_id);
  const supervisorSel  = supervisores.find(s => s.id === form.supervisor_id);

  return (
    <div className="page" style={{ maxWidth:760, margin:'0 auto' }}>
      {/* Header */}
      <div className="page-hdr">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/contratos')} style={{ marginBottom:10 }}>
            <ArrowLeft size={13}/> Volver a contratos
          </button>
          <h1>Nuevo Contrato</h1>
          <p>Registro de contrato en el sistema institucional</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="card" style={{ padding:'16px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:0 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length-1 ? 1 : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%',
                  background: i < step ? 'var(--emerald)' : i === step ? 'var(--forest)' : 'var(--border)',
                  color: i <= step ? '#fff' : 'var(--text-muted)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:700, flexShrink:0, transition:'all .2s',
                }}>
                  {i < step ? <CheckCircle size={14}/> : i+1}
                </div>
                <span style={{ fontSize:11, fontWeight: i === step ? 700 : 400, color: i === step ? 'var(--forest)' : 'var(--text-muted)', whiteSpace:'nowrap' }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length-1 && (
                <div style={{ flex:1, height:2, background: i < step ? 'var(--emerald)' : 'var(--border)', margin:'0 10px', minWidth:20, transition:'background .2s' }}/>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenido del step */}
      <div className="card" style={{ padding:24 }}>
        {step === 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <h2 style={{ fontSize:15, fontWeight:600, color:'var(--forest)', marginBottom:4 }}>Información básica del contrato</h2>
            <div className="grid-2">
              <div className="field">
                <label>Número de contrato *</label>
                <input className="input-field" value={form.numero_contrato} onChange={e=>set('numero_contrato',e.target.value)} placeholder="Ej: PSS-2025-001"/>
              </div>
              <div className="field">
                <label>Tipo de contrato *</label>
                <select className="select-field" value={form.tipo_contrato} onChange={e=>set('tipo_contrato',e.target.value)}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Objeto del contrato *</label>
              <textarea className="input-field" rows={4} value={form.objeto}
                onChange={e=>set('objeto',e.target.value)}
                placeholder="Describe el objeto del contrato de forma clara y completa..."
                style={{ resize:'vertical' }}/>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Número SECOP II</label>
                <input className="input-field" value={form.numero_secop} onChange={e=>set('numero_secop',e.target.value)} placeholder="CO1.PCCNTR.XXXXXXX"/>
              </div>
              <div className="field">
                <label>CDP (Certificado de Disponibilidad)</label>
                <input className="input-field" value={form.cdp} onChange={e=>set('cdp',e.target.value)} placeholder="Ej: 2025-0001"/>
              </div>
            </div>
            <div className="field">
              <label>Observaciones</label>
              <textarea className="input-field" rows={2} value={form.observaciones}
                onChange={e=>set('observaciones',e.target.value)}
                placeholder="Observaciones adicionales (opcional)"
                style={{ resize:'vertical' }}/>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <h2 style={{ fontSize:15, fontWeight:600, color:'var(--forest)', marginBottom:4 }}>Partes del contrato</h2>
            <div className="field">
              <label>Contratista *</label>
              <select className="select-field" value={form.contratista_id} onChange={e=>set('contratista_id',e.target.value)}>
                <option value="">Seleccionar contratista...</option>
                {contratistas.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombres} {c.apellidos||''}{c.razon_social?` — ${c.razon_social}`:''} · {c.cedula||c.nit||''}
                  </option>
                ))}
              </select>
              {contratistaSel && (
                <div style={{ marginTop:8, padding:'10px 12px', background:'var(--bg-app)', borderRadius:6, border:'1px solid var(--border)', fontSize:12 }}>
                  <div style={{ fontWeight:600, color:'var(--forest)' }}>{contratistaSel.nombres} {contratistaSel.apellidos||''}</div>
                  <div style={{ color:'var(--text-muted)', marginTop:2 }}>
                    {contratistaSel.tipo_persona === 'natural' ? 'CC' : 'NIT'} {contratistaSel.cedula||contratistaSel.nit||'—'} · {contratistaSel.email||'—'}
                  </div>
                </div>
              )}
              {contratistas.length === 0 && (
                <div style={{ marginTop:8, fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
                  Sin contratistas registrados. <button className="btn-ghost" style={{ fontSize:12 }} onClick={() => navigate('/contratistas')}>Ir a Contratistas →</button>
                </div>
              )}
            </div>
            <div className="field">
              <label>Supervisor asignado</label>
              <select className="select-field" value={form.supervisor_id} onChange={e=>set('supervisor_id',e.target.value)}>
                <option value="">Sin asignar por ahora</option>
                {supervisores.map(s => (
                  <option key={s.id} value={s.id}>{s.usuario?.nombre||s.nombre} — {s.dependencia}</option>
                ))}
              </select>
              {supervisorSel && (
                <div style={{ marginTop:8, padding:'10px 12px', background:'var(--bg-app)', borderRadius:6, border:'1px solid var(--border)', fontSize:12 }}>
                  <div style={{ fontWeight:600, color:'var(--forest)' }}>{supervisorSel.usuario?.nombre||supervisorSel.nombre}</div>
                  <div style={{ color:'var(--text-muted)', marginTop:2 }}>{supervisorSel.cargo} · {supervisorSel.dependencia}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <h2 style={{ fontSize:15, fontWeight:600, color:'var(--forest)', marginBottom:4 }}>Condiciones económicas y temporales</h2>
            <div className="grid-2">
              <div className="field">
                <label>Valor inicial del contrato (COP) *</label>
                <input className="input-field" type="number" min="0" value={form.valor_inicial}
                  onChange={e=>set('valor_inicial',e.target.value)} placeholder="Ej: 8400000"/>
                {form.valor_inicial && !isNaN(form.valor_inicial) && +form.valor_inicial > 0 && (
                  <div style={{ fontSize:11, color:'var(--emerald)', marginTop:4, fontWeight:600 }}>
                    {new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(+form.valor_inicial)}
                  </div>
                )}
              </div>
              <div className="field">
                <label>Registro Presupuestal (RP)</label>
                <input className="input-field" value={form.rp} onChange={e=>set('rp',e.target.value)} placeholder="Ej: 2025-0001"/>
              </div>
              <div className="field">
                <label>Fecha de inicio *</label>
                <input className="input-field" type="date" value={form.fecha_inicio} onChange={e=>set('fecha_inicio',e.target.value)}/>
              </div>
              <div className="field">
                <label>Fecha de terminación *</label>
                <input className="input-field" type="date" value={form.fecha_fin} onChange={e=>set('fecha_fin',e.target.value)}
                  min={form.fecha_inicio || undefined}/>
              </div>
            </div>
            {form.fecha_inicio && form.fecha_fin && form.fecha_fin > form.fecha_inicio && (
              <div style={{ padding:'10px 14px', background:'var(--bg-app)', borderRadius:6, border:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)' }}>
                Duración: <strong style={{ color:'var(--forest)' }}>
                  {Math.round((new Date(form.fecha_fin)-new Date(form.fecha_inicio))/(1000*60*60*24))} días calendario
                </strong>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <h2 style={{ fontSize:15, fontWeight:600, color:'var(--forest)', marginBottom:4 }}>Resumen y confirmación</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                ['N° Contrato', form.numero_contrato],
                ['Tipo', TIPOS.find(t=>t.value===form.tipo_contrato)?.label||'—'],
                ['Contratista', contratistaSel ? `${contratistaSel.nombres} ${contratistaSel.apellidos||''}` : '—'],
                ['Supervisor', supervisorSel?.usuario?.nombre || 'Sin asignar'],
                ['Valor', form.valor_inicial ? new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(+form.valor_inicial) : '—'],
                ['SECOP II', form.numero_secop||'—'],
                ['Inicio', form.fecha_inicio || '—'],
                ['Terminación', form.fecha_fin || '—'],
              ].map(([k,v]) => (
                <div key={k} style={{ padding:'10px 12px', background:'var(--bg-app)', borderRadius:6, border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 }}>{k}</div>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--forest)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ gridColumn:'span 2', padding:'10px 14px', background:'var(--bg-app)', borderRadius:6, border:'1px solid var(--border)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Objeto</div>
              <div style={{ fontSize:13, color:'var(--forest)', lineHeight:1.6 }}>{form.objeto}</div>
            </div>
            <div style={{ padding:'12px 14px', background:'#ECFDF5', borderRadius:6, border:'1px solid var(--border-mid)', fontSize:12, color:'var(--emerald-dark)' }}>
              ✓ El contrato se creará con estado <strong>Borrador</strong>. Podrás cambiar a <strong>En Ejecución</strong> desde el detalle.
            </div>
          </div>
        )}
      </div>

      {/* Navegación entre pasos */}
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        {step > 0 && (
          <button className="btn btn-secondary" onClick={() => setStep(s=>s-1)}>
            ← Paso anterior
          </button>
        )}
        {step < STEPS.length-1 ? (
          <button className="btn btn-primary" onClick={siguiente}>
            Siguiente paso →
          </button>
        ) : (
          <button className="btn btn-primary" onClick={crear} disabled={loading} style={{ minWidth:160, justifyContent:'center' }}>
            {loading ? 'Creando...' : <><Save size={13}/> Crear Contrato</>}
          </button>
        )}
      </div>
    </div>
  );
}
