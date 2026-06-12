/**
 * Capa de compatibilidad — redirige llamadas al SDK de Supabase
 * Permite que páginas existentes funcionen sin cambios
 */
import * as db from '../lib/db'

const api = {
  get: async (path) => {
    const [base, qs] = path.split('?')
    const params = Object.fromEntries(new URLSearchParams(qs || ''))

    if (base === '/dashboard')          return { data: await db.dashboard.getStats() }
    if (base === '/contratos')          return { data: await db.contratos.listar(params) }
    if (base.match(/^\/contratos\/.+/)) return { data: await db.contratos.obtener(base.split('/')[2]) }
    if (base === '/contratistas')       return { data: await db.contratistas.listar(params) }
    if (base === '/documentos')         return { data: await db.documentos.listar(params) }
    if (base === '/alertas')            return { data: await db.alertas.listar({ leida: params.leida === 'true' ? true : params.leida === 'false' ? false : undefined, limit: params.limit }) }
    if (base === '/supervisores')       return { data: await db.supervisores.listar() }
    if (base === '/auditoria')          return { data: await db.auditoria.listar(params) }
    if (base === '/usuarios')           return { data: await db.usuarios.listar() }
    if (base === '/reportes/contratos') return { data: await db.reportes.contratos() }
    if (base === '/reportes/vencimientos') return { data: await db.reportes.vencimientos(params.dias) }

    throw new Error(`Ruta no mapeada: ${path}`)
  },

  post: async (path, body) => {
    if (path === '/contratistas')  return { data: await db.contratistas.crear(body) }
    if (path === '/supervisores')  return { data: await db.supervisores.crear(body) }
    if (path === '/contratos')     return { data: await db.contratos.crear(body) }
    if (path === '/documentos/upload') {
      const file = body.get('archivo')
      return { data: await db.documentos.subir(file, {
        contrato_id:       body.get('contrato_id'),
        nombre:            body.get('nombre'),
        categoria:         body.get('categoria'),
        fecha_vencimiento: body.get('fecha_vencimiento'),
      })}
    }
    if (path === '/usuarios')      return { data: await db.usuarios.listar() }
    throw new Error(`POST no mapeado: ${path}`)
  },

  put: async (path, body) => {
    const parts = path.split('/')
    if (parts[1] === 'contratos' && parts[3] === 'modificaciones')
      return { data: await db.contratos.agregarModificacion(parts[2], body) }
    if (parts[1] === 'contratos' && parts[2])
      return { data: await db.contratos.actualizar(parts[2], body) }
    if (parts[1] === 'alertas' && parts[3] === 'leer')
      return { data: await db.alertas.marcarLeida(parts[2]) }
    if (parts[1] === 'usuarios' && parts[2])
      return { data: await db.usuarios.actualizar(parts[2], body) }
    throw new Error(`PUT no mapeado: ${path}`)
  },
}

export default api
