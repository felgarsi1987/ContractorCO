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
