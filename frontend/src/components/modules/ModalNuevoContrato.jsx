import { useState, useEffect } from 'react'
import { contratos as contratosDB, contratistas as contratistasDB, supervisores as supervisoresDB } from '../../lib/db'
import toast from 'react-hot-toast'

const TIPOS = [
  { value:'prestacion_servicios', label:'Prestación de Servicios' },
  { value:'obra',                 label:'Obra' },
  { value:'suministro',           label:'Suministro' },
  { value:'consultoria',          label:'Consultoría' },
  { value:'interadministrativo',  label:'Interadministrativo' },
  { value:'otro',                 label:'Otro' },
]

export default function ModalNuevoContrato({ onClose, onCreated }) {
  const [form, setForm] = useState({
    numero_contrato:'', objeto:'', tipo_contrato:'prestacion_servicios',
    valor_inicial:'', fecha_inicio:'', fecha_fin:'',
    contratista_id:'', supervisor_id:'', numero_secop:'', observaciones:''
  })
  const [contratistas, setContratistas] = useState([])
  const [supervisores,  setSupervisores]  = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    contratistasDB.listar({ limit: 100 }).then(r => setContratistas(r.data || []))
    supervisoresDB.listar().then(r => setSupervisores(r || []))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.numero_contrato || !form.objeto || !form.contratista_id || !form.fecha_inicio || !form.fecha_fin)
      return toast.error('Completa los campos obligatorios')
    if (!form.valor_inicial || isNaN(form.valor_inicial))
      return toast.error('Ingresa un valor válido')
    setLoading(true)
    try {
      await contratosDB.crear({
        ...form,
        valor_inicial: parseFloat(form.valor_inicial),
        valor_actual:  parseFloat(form.valor_inicial),
        supervisor_id: form.supervisor_id || null,
        estado: 'borrador',
      })
      toast.success('Contrato creado correctamente')
      onCreated()
      onClose()
    } catch(e) {
      toast.error(e.message || 'Error al crear contrato')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h3>Nuevo Contrato</h3>
          <button className="btn-icon" onClick={onClose}><span className="ms ms-sm">close</span></button>
        </div>
        <div className="modal-body" style={{ maxHeight:'65vh', overflowY:'auto' }}>
          <div className="grid-2">
            <div className="field">
              <label>N° Contrato *</label>
              <input className="input" placeholder="PSS-2025-001" value={form.numero_contrato} onChange={e=>set('numero_contrato',e.target.value)} />
            </div>
            <div className="field">
              <label>Tipo de contrato *</label>
              <select className="select" style={{width:'100%'}} value={form.tipo_contrato} onChange={e=>set('tipo_contrato',e.target.value)}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="field" style={{ gridColumn:'span 2' }}>
              <label>Objeto del contrato *</label>
              <textarea className="input" rows={3} style={{ resize:'vertical' }} value={form.objeto} onChange={e=>set('objeto',e.target.value)} />
            </div>
            <div className="field">
              <label>Contratista *</label>
              <select className="select" style={{width:'100%'}} value={form.contratista_id} onChange={e=>set('contratista_id',e.target.value)}>
                <option value="">Seleccionar...</option>
                {contratistas.map(c => (
                  <option key={c.id} value={c.id}>{c.nombres} {c.apellidos || c.razon_social || ''}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Supervisor</label>
              <select className="select" style={{width:'100%'}} value={form.supervisor_id} onChange={e=>set('supervisor_id',e.target.value)}>
                <option value="">Sin asignar</option>
                {supervisores.map(s => (
                  <option key={s.id} value={s.id}>{s.usuario?.nombre || s.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Valor inicial (COP) *</label>
              <input className="input" type="number" placeholder="8400000" value={form.valor_inicial} onChange={e=>set('valor_inicial',e.target.value)} />
            </div>
            <div className="field">
              <label>N° SECOP II</label>
              <input className="input" placeholder="CO1.PCCNTR.XXXXXXX" value={form.numero_secop} onChange={e=>set('numero_secop',e.target.value)} />
            </div>
            <div className="field">
              <label>Fecha de inicio *</label>
              <input className="input" type="date" value={form.fecha_inicio} onChange={e=>set('fecha_inicio',e.target.value)} />
            </div>
            <div className="field">
              <label>Fecha de terminación *</label>
              <input className="input" type="date" value={form.fecha_fin} onChange={e=>set('fecha_fin',e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn:'span 2' }}>
              <label>Observaciones</label>
              <textarea className="input" rows={2} style={{ resize:'vertical' }} value={form.observaciones} onChange={e=>set('observaciones',e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading
              ? <span className="ms animate-spin" style={{fontSize:18}}>refresh</span>
              : <><span className="ms ms-sm">save</span>Crear Contrato</>}
          </button>
        </div>
      </div>
    </div>
  )
}
