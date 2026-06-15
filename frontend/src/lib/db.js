/**
 * Capa de acceso a datos — Supabase
 * Reemplaza completamente la API REST de Node.js/Express
 * Usa las vistas y tablas del schema.sql existente
 */
import { supabase } from './supabase'

// ── AUTH ────────────────────────────────────────────────────
export const auth = {
  login: (email, password) =>
    supabase.auth.signInWithPassword({ email, password }),

  logout: () =>
    supabase.auth.signOut(),

  session: () =>
    supabase.auth.getSession(),

  onAuthChange: (cb) =>
    supabase.auth.onAuthStateChange(cb),

  resetPassword: (email) =>
    supabase.auth.resetPasswordForEmail(email),
}

// ── DASHBOARD ───────────────────────────────────────────────
export const dashboard = {
  getStats: async () => {
    const { data, error } = await supabase
      .from('v_dashboard')
      .select('*')
      .single()
    if (error) throw error
    return data
  },
}

// ── CONTRATOS ───────────────────────────────────────────────
export const contratos = {
  listar: async ({ page = 1, limit = 15, semaforo, buscar, tipo_contrato, supervisor_id } = {}) => {
    let q = supabase
      .from('v_contratos_completos')
      .select('*', { count: 'exact' })
      .order('fecha_fin', { ascending: true })
      .range((page - 1) * limit, page * limit - 1)

    if (semaforo)      q = q.eq('semaforo', semaforo)
    if (tipo_contrato) q = q.eq('tipo_contrato', tipo_contrato)
    if (supervisor_id) q = q.eq('supervisor_id', supervisor_id)
    if (buscar) {
      q = q.or(`numero_contrato.ilike.%${buscar}%,contratista_nombre.ilike.%${buscar}%,objeto.ilike.%${buscar}%`)
    }

    const { data, error, count } = await q
    if (error) throw error
    return { data, total: count }
  },

  obtener: async (id) => {
    const [{ data: contrato, error }, { data: docs }, { data: adiciones }] = await Promise.all([
      supabase.from('v_contratos_completos').select('*').eq('id', id).single(),
      supabase.from('documentos').select('*, subido_por_nombre:usuarios(nombre)').eq('contrato_id', id).eq('es_vigente', true).order('subido_en', { ascending: false }),
      supabase.from('adiciones_contratos').select('*, creado_por_nombre:usuarios(nombre)').eq('contrato_id', id).order('creado_en', { ascending: false }),
    ])
    if (error) throw error
    return { ...contrato, documentos: docs || [], adiciones: adiciones || [] }
  },

  crear: async (payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('contratos')
      .insert({ ...payload, creado_por: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  },

  actualizar: async (id, payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('contratos')
      .update({ ...payload, actualizado_por: user.id })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  agregarModificacion: async (contratoId, payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('adiciones_contratos')
      .insert({ ...payload, contrato_id: contratoId, creado_por: user.id })
      .select()
      .single()
    if (error) throw error

    // Actualizar valor/fecha en el contrato
    const updates = {}
    if (payload.valor_adicional) updates.valor_actual = supabase.rpc('incrementar_valor', { contrato_id: contratoId, monto: payload.valor_adicional })
    if (payload.nueva_fecha_fin) {
      await supabase.from('contratos').update({ fecha_fin: payload.nueva_fecha_fin }).eq('id', contratoId)
    }
    return data
  },

  estadisticas: async () => {
    const [porEstado, porTipo] = await Promise.all([
      supabase.from('contratos').select('estado').then(r => groupBy(r.data, 'estado')),
      supabase.from('contratos').select('tipo_contrato').then(r => groupBy(r.data, 'tipo_contrato')),
    ])
    return { por_estado: porEstado, por_tipo: porTipo }
  },
}

// ── CONTRATISTAS ─────────────────────────────────────────────
export const contratistas = {
  listar: async ({ page = 1, limit = 15, buscar, estado } = {}) => {
    let q = supabase
      .from('contratistas')
      .select(`*, contratos_activos:contratos(count)`, { count: 'exact' })
      .order('creado_en', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (estado) q = q.eq('estado', estado)
    if (buscar) q = q.or(`nombres.ilike.%${buscar}%,apellidos.ilike.%${buscar}%,cedula.ilike.%${buscar}%,nit.ilike.%${buscar}%`)

    const { data, error, count } = await q
    if (error) throw error
    return { data, total: count }
  },

  obtener: async (id) => {
    const { data, error } = await supabase
      .from('contratistas')
      .select('*, contratos(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  crear: async (payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('contratistas')
      .insert({ ...payload, creado_por: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  },

  actualizar: async (id, payload) => {
    const { data, error } = await supabase
      .from('contratistas')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
}

// ── DOCUMENTOS ───────────────────────────────────────────────
export const documentos = {
  listar: async ({ contrato_id, contratista_id, estado_vence, categoria } = {}) => {
    let q = supabase
      .from('documentos')
      .select('*, contratos(numero_contrato)')
      .eq('es_vigente', true)
      .order('subido_en', { ascending: false })

    if (contrato_id)    q = q.eq('contrato_id', contrato_id)
    if (contratista_id) q = q.eq('contratista_id', contratista_id)
    if (estado_vence)   q = q.eq('estado_vence', estado_vence)
    if (categoria)      q = q.eq('categoria', categoria)

    const { data, error } = await q
    if (error) throw error
    return data
  },

  subir: async (file, { contrato_id, contratista_id, nombre, categoria, fecha_vencimiento }) => {
    const { data: { user } } = await supabase.auth.getUser()
    const ext  = file.name.split('.').pop()
    const path = `${contrato_id || contratista_id}/${Date.now()}.${ext}`

    // 1. Subir archivo a Storage
    const { error: storageError } = await supabase.storage
      .from('documentos')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (storageError) throw storageError

    // 2. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('documentos')
      .getPublicUrl(path)

    // 3. Versionar: marcar doc anterior como no vigente
    if (contrato_id && categoria) {
      await supabase
        .from('documentos')
        .update({ es_vigente: false })
        .eq('contrato_id', contrato_id)
        .eq('categoria', categoria)
        .eq('es_vigente', true)
    }

    // 4. Insertar registro
    const { data, error } = await supabase
      .from('documentos')
      .insert({
        contrato_id:      contrato_id    || null,
        contratista_id:   contratista_id || null,
        nombre, categoria,
        url_archivo:      publicUrl,
        nombre_archivo:   file.name,
        tamano_bytes:     file.size,
        mime_type:        file.type,
        fecha_vencimiento: fecha_vencimiento || null,
        subido_por:       user.id,
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  eliminar: async (id) => {
    const { error } = await supabase
      .from('documentos')
      .update({ es_vigente: false })
      .eq('id', id)
    if (error) throw error
  },
}

// ── ALERTAS ──────────────────────────────────────────────────
export const alertas = {
  listar: async ({ leida, limit = 50 } = {}) => {
    let q = supabase
      .from('alertas')
      .select('*, contratos(numero_contrato), documentos(nombre)')
      .order('creado_en', { ascending: false })
      .limit(limit)

    if (leida !== undefined) q = q.eq('leida', leida)

    const { data, error } = await q
    if (error) throw error
    return data
  },

  marcarLeida: async (id) => {
    const { error } = await supabase
      .from('alertas')
      .update({ leida: true })
      .eq('id', id)
    if (error) throw error
  },

  marcarTodasLeidas: async () => {
    const { error } = await supabase
      .from('alertas')
      .update({ leida: true })
      .eq('leida', false)
    if (error) throw error
  },

  // Suscripción en tiempo real
  suscribir: (callback) =>
    supabase
      .channel('alertas-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alertas' }, callback)
      .subscribe(),
}

// ── SUPERVISORES ─────────────────────────────────────────────
export const supervisores = {
  listar: async () => {
    const { data, error } = await supabase
      .from('supervisores')
      .select(`
        *,
        usuario:usuarios(nombre, email, activo),
        contratos_activos:contratos(count),
        por_vencer:contratos(count)
      `)
      .eq('activo', true)
    if (error) throw error
    return data
  },

  crear: async ({ nombre, email, cargo, dependencia, telefono }) => {
    // Crear usuario Auth primero (requiere Service Role en producción)
    // Para el demo, insertar directamente en la tabla usuarios
    const { data, error } = await supabase
      .from('supervisores')
      .insert({ cargo, dependencia, telefono })
      .select()
      .single()
    if (error) throw error
    return data
  },
}

// ── AUDITORIA ─────────────────────────────────────────────────
export const auditoria = {
  listar: async ({ tabla, accion, desde, hasta, page = 1, limit = 50 } = {}) => {
    let q = supabase
      .from('auditoria')
      .select('*, usuario:usuarios(nombre)')
      .order('timestamp', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (tabla)  q = q.eq('tabla_afectada', tabla)
    if (accion) q = q.eq('accion', accion)
    if (desde)  q = q.gte('timestamp', desde)
    if (hasta)  q = q.lte('timestamp', hasta)

    const { data, error } = await q
    if (error) throw error
    return data
  },

  registrar: async ({ tabla, registro_id, accion, datos_anteriores, datos_nuevos }) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('auditoria').insert({
      usuario_id:       user?.id,
      tabla_afectada:   tabla,
      registro_id,
      accion,
      datos_anteriores,
      datos_nuevos,
    })
  },
}

// ── USUARIOS ──────────────────────────────────────────────────
export const usuarios = {
  listar: async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, activo, ultimo_acceso, creado_en')
      .order('creado_en')
    if (error) throw error
    return data
  },

  actualizar: async (id, payload) => {
    const { data, error } = await supabase
      .from('usuarios')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
}

// ── REPORTES ──────────────────────────────────────────────────
export const reportes = {
  contratos: async () => {
    const { data, error } = await supabase
      .from('v_contratos_completos')
      .select('*')
      .order('fecha_fin')
    if (error) throw error
    return data
  },

  vencimientos: async (dias = 30) => {
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() + dias)
    const { data, error } = await supabase
      .from('v_contratos_completos')
      .select('*')
      .lte('fecha_fin', fechaLimite.toISOString().slice(0, 10))
      .gte('fecha_fin', new Date().toISOString().slice(0, 10))
      .order('fecha_fin')
    if (error) throw error
    return data
  },
}

// ── STORAGE ───────────────────────────────────────────────────
export const storage = {
  getUrl: (path) => {
    const { data } = supabase.storage.from('documentos').getPublicUrl(path)
    return data.publicUrl
  },
}

// ── REALTIME ──────────────────────────────────────────────────
export const realtime = {
  suscribirContratos: (callback) =>
    supabase
      .channel('contratos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contratos' }, callback)
      .subscribe(),

  suscribirDocumentos: (contratoId, callback) =>
    supabase
      .channel(`docs-${contratoId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'documentos', filter: `contrato_id=eq.${contratoId}` }, callback)
      .subscribe(),

  desuscribir: (channel) =>
    supabase.removeChannel(channel),
}

// ── GARANTÍAS ─────────────────────────────────────────────
export const garantias = {
  listar: async ({ contrato_id, estado } = {}) => {
    let q = supabase.from('v_garantias').select('*').order('fecha_vencimiento')
    if (contrato_id) q = q.eq('contrato_id', contrato_id)
    if (estado)      q = q.eq('estado', estado)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  crear: async (payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('garantias')
      .insert({ ...payload, creado_por: user.id })
      .select().single()
    if (error) throw error
    return data
  },

  actualizar: async (id, payload) => {
    const { data, error } = await supabase
      .from('garantias').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

// ── ACTAS ─────────────────────────────────────────────────
export const actas = {
  listar: async ({ contrato_id, tipo_acta } = {}) => {
    let q = supabase.from('actas')
      .select('*, contratos(numero_contrato, objeto, fecha_fin, valor_actual), creado_por_nombre:usuarios(nombre)')
      .order('fecha_acta', { ascending: false })
    if (contrato_id) q = q.eq('contrato_id', contrato_id)
    if (tipo_acta)   q = q.eq('tipo_acta', tipo_acta)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  crear: async (payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('actas')
      .insert({ ...payload, creado_por: user.id })
      .select().single()
    if (error) throw error
    return data
  },

  firmar: async (id, campo) => {
    const { data: acta } = await supabase.from('actas').select('*').eq('id', id).single()
    const fechaCampo = `fecha_firma_${campo.replace('firmada_', '')}`
    const update = { [campo]: true, [fechaCampo]: new Date().toISOString().slice(0, 10) }
    const todasFirmadas = {
      firmada_supervisor:  acta.firmada_supervisor,
      firmada_contratista: acta.firmada_contratista,
      firmada_juridica:    acta.firmada_juridica,
      ...update,
    }
    if (todasFirmadas.firmada_supervisor && todasFirmadas.firmada_contratista && todasFirmadas.firmada_juridica) {
      update.estado = 'firmada'
    }
    const { data, error } = await supabase.from('actas').update(update).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

// ── SEGURIDAD SOCIAL ────────────────────────────────────────
export const seguridadSocial = {
  listar: async ({ contrato_id } = {}) => {
    let q = supabase
      .from('verificaciones_ss')
      .select('*, contratos(numero_contrato, objeto)')
      .order('periodo_anio', { ascending: false })
      .order('periodo_mes',  { ascending: false })
    if (contrato_id) q = q.eq('contrato_id', contrato_id)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  crear: async (payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('verificaciones_ss')
      .insert({ ...payload, verificado_por: user.id })
      .select().single()
    if (error) throw error
    return data
  },

  actualizar: async (id, payload) => {
    const { data, error } = await supabase
      .from('verificaciones_ss').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

// ── PRESUPUESTO (CDP / RP / OP) ──────────────────────────────
export const presupuesto = {
  listar: async ({ tipo, contrato_id } = {}) => {
    let q = supabase
      .from('registros_presupuestales')
      .select('*, contratos(numero_contrato)')
      .order('fecha_expedicion', { ascending: false })
    if (tipo)        q = q.eq('tipo', tipo)
    if (contrato_id) q = q.eq('contrato_id', contrato_id)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  crear: async (payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('registros_presupuestales')
      .insert({ ...payload, creado_por: user.id })
      .select().single()
    if (error) throw error
    return data
  },

  actualizar: async (id, payload) => {
    const { data, error } = await supabase
      .from('registros_presupuestales').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

// ── PAA — Plan Anual de Adquisiciones ───────────────────────
export const paa = {
  listar: async ({ vigencia, estado } = {}) => {
    let q = supabase
      .from('plan_adquisiciones')
      .select('*')
      .order('fecha_inicio_proceso', { ascending: true, nullsFirst: false })
    if (vigencia) q = q.eq('vigencia', vigencia)
    if (estado)   q = q.eq('estado', estado)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  crear: async (payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('plan_adquisiciones')
      .insert({ ...payload, creado_por: user.id })
      .select().single()
    if (error) throw error
    return data
  },

  actualizar: async (id, payload) => {
    const { data, error } = await supabase
      .from('plan_adquisiciones').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

// ── INHABILIDADES ────────────────────────────────────────────
export const inhabilidades = {
  listar: async ({ contratista_id, resultado } = {}) => {
    let q = supabase
      .from('consultas_inhabilidades')
      .select('*, contratistas(id, nombres, apellidos, cedula, nit, tipo_persona)')
      .order('fecha_consulta', { ascending: false })
    if (contratista_id) q = q.eq('contratista_id', contratista_id)
    if (resultado)      q = q.eq('resultado', resultado)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  crear: async (payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('consultas_inhabilidades')
      .insert({ ...payload, consultado_por: user.id })
      .select().single()
    if (error) throw error
    return data
  },
}

// ── INFORMES SUPERVISIÓN ────────────────────────────────────
export const informes = {
  listar: async ({ contrato_id, estado } = {}) => {
    let q = supabase
      .from('informes_supervision')
      .select('*, contratos(numero_contrato, objeto), supervisores(id)')
      .order('numero_informe', { ascending: false })
    if (contrato_id) q = q.eq('contrato_id', contrato_id)
    if (estado)      q = q.eq('estado', estado)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  crear: async (payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('informes_supervision')
      .insert({ ...payload })
      .select().single()
    if (error) throw error
    return data
  },

  aprobar: async (id) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('informes_supervision')
      .update({ estado: 'aprobado', aprobado_por: user.id, fecha_aprobacion: new Date().toISOString().slice(0, 10) })
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },

  actualizar: async (id, payload) => {
    const { data, error } = await supabase
      .from('informes_supervision').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

// ── PAGOS ───────────────────────────────────────────────────
export const pagos = {
  listar: async ({ contrato_id, estado } = {}) => {
    let q = supabase
      .from('pagos')
      .select('*, contratos(numero_contrato, objeto, valor_actual)')
      .order('creado_en', { ascending: false })
    if (contrato_id) q = q.eq('contrato_id', contrato_id)
    if (estado)      q = q.eq('estado', estado)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  crear: async (payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('pagos')
      .insert({ ...payload, creado_por: user.id })
      .select().single()
    if (error) throw error
    return data
  },

  actualizar: async (id, payload) => {
    const { data, error } = await supabase
      .from('pagos').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

// ── SOLICITUDES DE DOCUMENTOS ────────────────────────────────
export const solicitudes = {
  listar: async ({ contrato_id, estado, contratista_id } = {}) => {
    let q = supabase
      .from('solicitudes_documentos')
      .select(`
        *,
        contratos(numero_contrato, objeto, contratista_id,
          contratistas(id, nombres, apellidos, usuario_id)),
        creado_por_nombre:usuarios(nombre),
        items_checklist(id, nombre, estado, obligatorio, orden, base_legal, descripcion, comentario_rechazo,
          documentos_solicitud(id, nombre_archivo, url_publica, subido_en, version))
      `)
      .order('creado_en', { ascending: false })

    if (contrato_id) q = q.eq('contrato_id', contrato_id)
    if (estado)      q = q.eq('estado', estado)

    const { data, error } = await q
    if (error) throw error

    if (contratista_id) {
      return (data || []).filter(s =>
        s.contratos?.contratista_id === contratista_id ||
        s.contratos?.contratistas?.id === contratista_id
      )
    }
    return data || []
  },

  crear: async ({ contrato_id, titulo, tipo_solicitud, fecha_limite, periodo_mes, periodo_anio, notas, plantilla_id, items_custom }) => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: sol, error: solErr } = await supabase
      .from('solicitudes_documentos')
      .insert({ contrato_id, titulo, tipo_solicitud, fecha_limite: fecha_limite || null, periodo_mes: periodo_mes || null, periodo_anio: periodo_anio || null, notas, plantilla_id: plantilla_id || null, creado_por: user.id })
      .select().single()
    if (solErr) throw solErr

    let itemsToInsert = items_custom || []
    if (plantilla_id && !items_custom) {
      const { data: plantilla } = await supabase.from('plantillas_checklist').select('items').eq('id', plantilla_id).single()
      itemsToInsert = (plantilla?.items || []).map(it => ({ ...it, solicitud_id: sol.id }))
    } else {
      itemsToInsert = itemsToInsert.map(it => ({ ...it, solicitud_id: sol.id }))
    }

    if (itemsToInsert.length > 0) {
      const { error: itemErr } = await supabase.from('items_checklist').insert(itemsToInsert)
      if (itemErr) throw itemErr
    }

    return sol
  },

  aprobarItem: async (itemId, { aprobado, comentario_rechazo } = {}) => {
    const nuevoEstado = aprobado ? 'aprobado' : 'rechazado'
    const { data, error } = await supabase
      .from('items_checklist')
      .update({ estado: nuevoEstado, comentario_rechazo: comentario_rechazo || null, actualizado_en: new Date().toISOString() })
      .eq('id', itemId).select().single()
    if (error) throw error
    return data
  },

  subirDocumento: async (itemId, file, comentario = '') => {
    const { data: { user } } = await supabase.auth.getUser()
    const ext  = file.name.split('.').pop()
    const path = `solicitudes/${itemId}/${Date.now()}.${ext}`

    const { error: storageErr } = await supabase.storage
      .from('documentos')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (storageErr) throw storageErr

    const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(path)

    const { data: prevDocs } = await supabase.from('documentos_solicitud').select('version').eq('item_id', itemId).order('version', { ascending: false }).limit(1)
    const nextVersion = ((prevDocs?.[0]?.version) || 0) + 1

    const { data, error } = await supabase
      .from('documentos_solicitud')
      .insert({ item_id: itemId, subido_por: user.id, nombre_archivo: file.name, storage_path: path, url_publica: publicUrl, tamano_bytes: file.size, tipo_mime: file.type, version: nextVersion, comentario })
      .select().single()
    if (error) throw error

    await supabase.from('items_checklist').update({ estado: 'subido', actualizado_en: new Date().toISOString() }).eq('id', itemId)

    return data
  },
}

// ── PLANTILLAS CHECKLIST ─────────────────────────────────────
export const plantillas = {
  listar: async ({ tipo_solicitud } = {}) => {
    let q = supabase.from('plantillas_checklist').select('*').order('es_predeterminada', { ascending: false })
    if (tipo_solicitud) q = q.eq('tipo_solicitud', tipo_solicitud)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },
}

// ── NOTIFICACIONES (del contratista) ─────────────────────────
export const notificaciones = {
  listar: async ({ leida, limit = 50 } = {}) => {
    let q = supabase
      .from('notificaciones')
      .select('*, contratos(numero_contrato)')
      .order('creado_en', { ascending: false })
      .limit(limit)
    if (leida !== undefined) q = q.eq('leida', leida)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  marcarLeida: async (id) => {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
  },

  marcarTodasLeidas: async () => {
    await supabase.from('notificaciones').update({ leida: true }).eq('leida', false)
  },

  crear: async ({ usuario_id, contrato_id, tipo, titulo, cuerpo, referencia_id, referencia_tipo }) => {
    const { error } = await supabase.from('notificaciones').insert({ usuario_id, contrato_id, tipo, titulo, cuerpo, referencia_id, referencia_tipo })
    if (error) throw error
  },

  countNoLeidas: async () => {
    const { count, error } = await supabase.from('notificaciones').select('*', { count: 'exact', head: true }).eq('leida', false)
    if (error) return 0
    return count || 0
  },

  suscribir: (usuarioId, callback) =>
    supabase
      .channel(`notif-${usuarioId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${usuarioId}` }, callback)
      .subscribe(),
}

// ── MENSAJES POR CONTRATO ────────────────────────────────────
export const mensajes = {
  listar: async (contrato_id) => {
    const { data, error } = await supabase
      .from('mensajes_contrato')
      .select('*, autor:usuarios(nombre, rol)')
      .eq('contrato_id', contrato_id)
      .order('creado_en', { ascending: true })
    if (error) throw error
    return data || []
  },

  enviar: async ({ contrato_id, contenido, tipo = 'mensaje', adjunto_url }) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('mensajes_contrato')
      .insert({ contrato_id, autor_id: user.id, contenido, tipo, adjunto_url })
      .select('*, autor:usuarios(nombre, rol)').single()
    if (error) throw error
    return data
  },

  suscribir: (contrato_id, callback) =>
    supabase
      .channel(`msgs-${contrato_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_contrato', filter: `contrato_id=eq.${contrato_id}` }, callback)
      .subscribe(),
}

// ── Helpers ───────────────────────────────────────────────────
function groupBy(arr = [], key) {
  return Object.entries(
    arr.reduce((acc, item) => {
      const k = item[key] || 'sin_datos'
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})
  ).map(([name, total]) => ({ name, total }))
}
