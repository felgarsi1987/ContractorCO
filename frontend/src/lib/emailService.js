/**
 * Servicio de emails — llama a la Supabase Edge Function send-email
 * La Edge Function usa Resend para el envío real.
 */
import { supabase } from './supabase'

const EDGE_FN = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/send-email`

async function callEdge(payload) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(EDGE_FN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token ?? process.env.REACT_APP_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error enviando email (${res.status})`)
  }
  return res.json()
}

// ── Verificar preferencia antes de enviar ─────────────────────
async function emailHabilitado(usuarioId, contratoId, tipoEmail) {
  const { data } = await supabase
    .from('preferencias_email')
    .select('habilitado')
    .eq('usuario_id', usuarioId)
    .eq('tipo_email', tipoEmail)
    .or(`contrato_id.eq.${contratoId},contrato_id.is.null`)
    .order('contrato_id', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Si no hay preferencia explícita, por defecto está habilitado
  return data?.habilitado !== false
}

// ── API pública ───────────────────────────────────────────────

export const emailService = {

  /**
   * Nueva solicitud de documentos → notifica al contratista
   */
  nuevaSolicitud: async ({ para, datos, contratoId, usuarioId }) => {
    if (usuarioId && !(await emailHabilitado(usuarioId, contratoId, 'nueva_solicitud'))) return null
    return callEdge({ para, tipo: 'nueva_solicitud', datos: { ...datos, contrato_id: contratoId } })
  },

  /**
   * Documento subido → notifica al supervisor
   */
  docSubido: async ({ para, datos, contratoId, usuarioId }) => {
    if (usuarioId && !(await emailHabilitado(usuarioId, contratoId, 'doc_subido'))) return null
    return callEdge({ para, tipo: 'doc_subido', datos: { ...datos, contrato_id: contratoId } })
  },

  /**
   * Documento aprobado → notifica al contratista
   */
  docAprobado: async ({ para, datos, contratoId, usuarioId }) => {
    if (usuarioId && !(await emailHabilitado(usuarioId, contratoId, 'doc_aprobado'))) return null
    return callEdge({ para, tipo: 'doc_aprobado', datos: { ...datos, contrato_id: contratoId } })
  },

  /**
   * Documento rechazado → notifica al contratista
   */
  docRechazado: async ({ para, datos, contratoId, usuarioId }) => {
    if (usuarioId && !(await emailHabilitado(usuarioId, contratoId, 'doc_rechazado'))) return null
    return callEdge({ para, tipo: 'doc_rechazado', datos: { ...datos, contrato_id: contratoId } })
  },

  /**
   * Recordatorio manual de documentos pendientes
   */
  recordatorio: async ({ para, datos, contratoId, usuarioId }) => {
    if (usuarioId && !(await emailHabilitado(usuarioId, contratoId, 'recordatorio'))) return null
    return callEdge({ para, tipo: 'recordatorio', datos: { ...datos, contrato_id: contratoId } })
  },

  /**
   * Alerta de vencimiento (contrato o documento)
   */
  alertaVencimiento: async ({ para, datos, contratoId, usuarioId }) => {
    if (usuarioId && !(await emailHabilitado(usuarioId, contratoId, 'alerta_vencimiento'))) return null
    return callEdge({ para, tipo: 'alerta_vencimiento', datos: { ...datos, contrato_id: contratoId } })
  },

  /**
   * Pago autorizado → notifica al contratista
   */
  pagoAutorizado: async ({ para, datos, contratoId, usuarioId }) => {
    if (usuarioId && !(await emailHabilitado(usuarioId, contratoId, 'pago_autorizado'))) return null
    return callEdge({ para, tipo: 'pago_autorizado', datos: { ...datos, contrato_id: contratoId } })
  },

  /**
   * Envío genérico (para casos especiales)
   */
  enviar: async ({ para, tipo, datos }) => {
    return callEdge({ para, tipo, datos })
  },
}

// ── Preferencias de email ─────────────────────────────────────

export const emailPrefs = {
  listar: async ({ usuarioId, contratoId } = {}) => {
    let q = supabase.from('preferencias_email').select('*')
    if (usuarioId)  q = q.eq('usuario_id', usuarioId)
    if (contratoId) q = q.eq('contrato_id', contratoId)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  toggle: async ({ usuarioId, contratoId, tipoEmail, habilitado }) => {
    const { data, error } = await supabase
      .from('preferencias_email')
      .upsert({
        usuario_id:  usuarioId,
        contrato_id: contratoId || null,
        tipo_email:  tipoEmail,
        habilitado,
        actualizado_en: new Date().toISOString(),
      }, { onConflict: 'usuario_id,contrato_id,tipo_email' })
      .select().single()
    if (error) throw error
    return data
  },

  // Carga mapa { tipoEmail: habilitado } para un contrato+usuario
  cargarMapa: async (usuarioId, contratoId) => {
    const { data } = await supabase
      .from('preferencias_email')
      .select('tipo_email, habilitado')
      .eq('usuario_id', usuarioId)
      .or(`contrato_id.eq.${contratoId},contrato_id.is.null`)
    const mapa = {}
    for (const p of (data || [])) mapa[p.tipo_email] = p.habilitado
    return mapa
  },
}

// ── Historial de emails ───────────────────────────────────────

export const emailHistorial = {
  listar: async ({ contratoId, tipoEmail, limit = 100 } = {}) => {
    let q = supabase
      .from('historial_emails')
      .select('*, enviado_por_nombre:usuarios(nombre)')
      .order('enviado_en', { ascending: false })
      .limit(limit)
    if (contratoId) q = q.eq('contrato_id', contratoId)
    if (tipoEmail)  q = q.eq('tipo_email', tipoEmail)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },
}

// ── Tipos de email disponibles ────────────────────────────────
export const TIPOS_EMAIL = [
  { key: 'nueva_solicitud',    label: 'Nueva solicitud de documentos', icon: '📋', desc: 'Cuando el supervisor solicita documentos al contratista' },
  { key: 'doc_subido',         label: 'Documento subido',              icon: '📤', desc: 'Cuando el contratista sube un documento' },
  { key: 'doc_aprobado',       label: 'Documento aprobado',            icon: '✅', desc: 'Cuando se aprueba un documento' },
  { key: 'doc_rechazado',      label: 'Documento rechazado',           icon: '❌', desc: 'Cuando se rechaza un documento con motivo' },
  { key: 'recordatorio',       label: 'Recordatorio de vencimiento',   icon: '⏰', desc: 'Recordatorio manual o automático antes del plazo' },
  { key: 'alerta_vencimiento', label: 'Alerta de vencimiento',         icon: '⚠️', desc: 'Contratos y documentos próximos a vencer' },
  { key: 'pago_autorizado',    label: 'Pago autorizado',               icon: '💰', desc: 'Cuando se autoriza un pago al contratista' },
]
