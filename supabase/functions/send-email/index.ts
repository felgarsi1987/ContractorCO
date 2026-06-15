// Supabase Edge Function: send-email
// Usa Resend (https://resend.com) — configurar RESEND_API_KEY en Supabase Secrets
// Deploy: supabase functions deploy send-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY") ?? ""
const FROM_EMAIL      = Deno.env.get("FROM_EMAIL") ?? "ContralControl <notificaciones@resend.dev>"
const SUPABASE_URL    = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

// ── Plantillas HTML ──────────────────────────────────────────

const BASE_STYLE = `
  <style>
    body { margin:0; padding:0; background:#F0FDF4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrap { max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
    .header { background:linear-gradient(135deg,#0D3321 0%,#0A2A1B 100%); padding:28px 32px; }
    .logo { display:flex; align-items:center; gap:10px; }
    .logo-icon { width:36px; height:36px; background:linear-gradient(135deg,#059669,#34D399); border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:18px; }
    .logo-text { color:#fff; font-size:16px; font-weight:700; letter-spacing:-0.02em; }
    .logo-sub { color:rgba(167,243,208,0.6); font-size:10px; letter-spacing:.08em; text-transform:uppercase; }
    .body { padding:32px; }
    .title { font-size:22px; font-weight:700; color:#0D3321; margin:0 0 8px; }
    .subtitle { font-size:14px; color:#64748b; margin:0 0 24px; }
    .info-box { background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:16px 20px; margin:16px 0; }
    .info-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #D1FAE5; font-size:13px; }
    .info-row:last-child { border-bottom:none; }
    .info-label { color:#64748b; font-weight:500; }
    .info-value { color:#0D3321; font-weight:600; }
    .btn-primary { display:inline-block; padding:12px 28px; background:linear-gradient(135deg,#059669,#34D399); color:#fff; text-decoration:none; border-radius:8px; font-weight:700; font-size:14px; margin:20px 0; }
    .alert-box { border-radius:8px; padding:14px 18px; margin:16px 0; font-size:13px; }
    .alert-red { background:#FEF2F2; border:1px solid #FECACA; color:#991b1b; }
    .alert-orange { background:#FFFBEB; border:1px solid #FDE68A; color:#92400e; }
    .alert-green { background:#F0FDF4; border:1px solid #BBF7D0; color:#065f46; }
    .alert-blue { background:#EFF6FF; border:1px solid #BFDBFE; color:#1e40af; }
    .item-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid #E2E8F0; font-size:13px; }
    .item-row:last-child { border-bottom:none; }
    .badge { display:inline-block; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:700; }
    .badge-pending { background:#FEF9C3; color:#92400e; }
    .badge-ok { background:#D1FAE5; color:#065f46; }
    .badge-err { background:#FEE2E2; color:#991b1b; }
    .footer { background:#F8FAFC; padding:20px 32px; border-top:1px solid #E2E8F0; text-align:center; }
    .footer p { margin:4px 0; font-size:11px; color:#94a3b8; }
    .divider { height:1px; background:#E2E8F0; margin:20px 0; }
  </style>
`

function wrapEmail(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${BASE_STYLE}</head><body>
<div class="wrap">
  <div class="header">
    <div class="logo">
      <div class="logo-icon">🌿</div>
      <div><div class="logo-text">ContralControl</div><div class="logo-sub">Colombia · Contratos</div></div>
    </div>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>Este es un correo automático del sistema ContralControl.</p>
    <p>Si no deseas recibir estas notificaciones, comunícate con el administrador.</p>
    <p style="margin-top:8px;color:#cbd5e1;">© ${new Date().getFullYear()} ContralControl · Gestión de Contratos Colombia</p>
  </div>
</div>
</body></html>`
}

// ── Templates por tipo ──────────────────────────────────────

function tplNuevaSolicitud(d: any) {
  return wrapEmail(`
    <div class="alert-box alert-blue">📋 Nueva solicitud de documentos</div>
    <h1 class="title">Tienes documentos pendientes</h1>
    <p class="subtitle">El supervisor ha solicitado los siguientes documentos para tu contrato.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Contrato</span><span class="info-value">${d.numero_contrato || '—'}</span></div>
      <div class="info-row"><span class="info-label">Solicitud</span><span class="info-value">${d.titulo || '—'}</span></div>
      <div class="info-row"><span class="info-label">Fecha límite</span><span class="info-value" style="color:#D97706">${d.fecha_limite || 'Sin límite'}</span></div>
      <div class="info-row"><span class="info-label">Documentos requeridos</span><span class="info-value">${d.total_items || 0}</span></div>
    </div>
    ${d.notas ? `<div class="alert-box alert-blue"><strong>Instrucciones:</strong> ${d.notas}</div>` : ''}
    ${d.items?.length > 0 ? `
      <p style="font-size:13px;font-weight:700;color:#0D3321;margin:16px 0 8px">Documentos solicitados:</p>
      ${d.items.map((i: any) => `
        <div class="item-row">
          <span style="font-size:16px">${i.obligatorio ? '📄' : '📎'}</span>
          <div>
            <div style="font-weight:600;color:#1e293b">${i.nombre}</div>
            ${i.base_legal ? `<div style="font-size:11px;color:#94a3b8">${i.base_legal}</div>` : ''}
          </div>
          <span class="badge ${i.obligatorio ? 'badge-err' : 'badge-pending'}" style="margin-left:auto">${i.obligatorio ? 'Obligatorio' : 'Opcional'}</span>
        </div>`).join('')}
    ` : ''}
    <a href="${d.portal_url || '#'}" class="btn-primary">Subir documentos ahora →</a>
  `)
}

function tplDocSubido(d: any) {
  return wrapEmail(`
    <div class="alert-box alert-blue">📤 Documento subido por el contratista</div>
    <h1 class="title">Nuevo documento para revisar</h1>
    <p class="subtitle">El contratista acaba de subir un documento que requiere tu revisión.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Contrato</span><span class="info-value">${d.numero_contrato || '—'}</span></div>
      <div class="info-row"><span class="info-label">Contratista</span><span class="info-value">${d.contratista_nombre || '—'}</span></div>
      <div class="info-row"><span class="info-label">Documento</span><span class="info-value">${d.nombre_item || '—'}</span></div>
      <div class="info-row"><span class="info-label">Archivo</span><span class="info-value">${d.nombre_archivo || '—'}</span></div>
      <div class="info-row"><span class="info-label">Versión</span><span class="info-value">v${d.version || 1}</span></div>
    </div>
    <a href="${d.solicitudes_url || '#'}" class="btn-primary">Revisar y aprobar →</a>
  `)
}

function tplDocAprobado(d: any) {
  return wrapEmail(`
    <div class="alert-box alert-green">✅ Documento aprobado</div>
    <h1 class="title">¡Tu documento fue aprobado!</h1>
    <p class="subtitle">El supervisor ha revisado y aprobado el siguiente documento.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Contrato</span><span class="info-value">${d.numero_contrato || '—'}</span></div>
      <div class="info-row"><span class="info-label">Documento</span><span class="info-value">${d.nombre_item || '—'}</span></div>
      <div class="info-row"><span class="info-label">Solicitud</span><span class="info-value">${d.titulo_solicitud || '—'}</span></div>
    </div>
    ${d.pendientes > 0
      ? `<div class="alert-box alert-orange">⏳ Aún tienes <strong>${d.pendientes} documento(s)</strong> pendientes de subir en esta solicitud.</div>
         <a href="${d.portal_url || '#'}" class="btn-primary">Ver documentos pendientes →</a>`
      : `<div class="alert-box alert-green">🎉 ¡Todos los documentos de esta solicitud han sido aprobados!</div>`
    }
  `)
}

function tplDocRechazado(d: any) {
  return wrapEmail(`
    <div class="alert-box alert-red">❌ Documento rechazado — acción requerida</div>
    <h1 class="title">Debes corregir un documento</h1>
    <p class="subtitle">El supervisor rechazó un documento. Lee el motivo y vuelve a subirlo.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Contrato</span><span class="info-value">${d.numero_contrato || '—'}</span></div>
      <div class="info-row"><span class="info-label">Documento rechazado</span><span class="info-value">${d.nombre_item || '—'}</span></div>
      <div class="info-row"><span class="info-label">Solicitud</span><span class="info-value">${d.titulo_solicitud || '—'}</span></div>
    </div>
    <div class="alert-box alert-red"><strong>Motivo del rechazo:</strong><br><br>${d.comentario_rechazo || 'Sin comentario adicional.'}</div>
    <a href="${d.portal_url || '#'}" class="btn-primary">Corregir y volver a subir →</a>
    <p style="font-size:12px;color:#64748b;margin-top:8px">Por favor corrige el documento y súbelo nuevamente desde tu portal.</p>
  `)
}

function tplRecordatorio(d: any) {
  const urgencia = d.dias_restantes <= 1 ? 'alert-red' : d.dias_restantes <= 3 ? 'alert-orange' : 'alert-blue'
  const emoji = d.dias_restantes <= 1 ? '🚨' : d.dias_restantes <= 3 ? '⚠️' : '⏰'
  return wrapEmail(`
    <div class="alert-box ${urgencia}">${emoji} Recordatorio — faltan ${d.dias_restantes} día(s)</div>
    <h1 class="title">Documentos pendientes por vencer</h1>
    <p class="subtitle">Tienes documentos requeridos que aún no has subido. La fecha límite se acerca.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Contrato</span><span class="info-value">${d.numero_contrato || '—'}</span></div>
      <div class="info-row"><span class="info-label">Solicitud</span><span class="info-value">${d.titulo_solicitud || '—'}</span></div>
      <div class="info-row"><span class="info-label">Fecha límite</span><span class="info-value" style="color:#DC2626;font-weight:700">${d.fecha_limite || '—'}</span></div>
      <div class="info-row"><span class="info-label">Días restantes</span><span class="info-value" style="color:${d.dias_restantes <= 1 ? '#DC2626' : d.dias_restantes <= 3 ? '#D97706' : '#2563EB'};font-weight:700">${d.dias_restantes} día(s)</span></div>
    </div>
    ${d.items_pendientes?.length > 0 ? `
      <p style="font-size:13px;font-weight:700;color:#0D3321;margin:16px 0 8px">Documentos pendientes:</p>
      ${d.items_pendientes.map((i: any) => `
        <div class="item-row">
          <span style="font-size:16px">📄</span>
          <span style="font-weight:600;color:#1e293b">${i.nombre}</span>
          <span class="badge badge-pending" style="margin-left:auto">Pendiente</span>
        </div>`).join('')}
    ` : ''}
    <a href="${d.portal_url || '#'}" class="btn-primary">Subir documentos ahora →</a>
  `)
}

function tplAlertaVencimiento(d: any) {
  return wrapEmail(`
    <div class="alert-box ${d.tipo?.includes('vencido') ? 'alert-red' : 'alert-orange'}">${d.tipo?.includes('vencido') ? '🚨' : '⚠️'} Alerta de vencimiento</div>
    <h1 class="title">${d.tipo?.includes('vencido') ? 'Contrato / documento vencido' : `Vence en ${d.dias || '—'} días`}</h1>
    <p class="subtitle">${d.mensaje || 'Se generó una alerta automática de vencimiento.'}</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Contrato</span><span class="info-value">${d.numero_contrato || '—'}</span></div>
      ${d.documento ? `<div class="info-row"><span class="info-label">Documento</span><span class="info-value">${d.documento}</span></div>` : ''}
      <div class="info-row"><span class="info-label">Fecha vencimiento</span><span class="info-value" style="color:#DC2626">${d.fecha_vencimiento || '—'}</span></div>
    </div>
    <a href="${d.contratos_url || '#'}" class="btn-primary">Ver contrato →</a>
  `)
}

function tplPagoAutorizado(d: any) {
  return wrapEmail(`
    <div class="alert-box alert-green">💰 Pago autorizado</div>
    <h1 class="title">¡Tu pago ha sido autorizado!</h1>
    <p class="subtitle">El supervisor ha autorizado un pago correspondiente a tu contrato.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Contrato</span><span class="info-value">${d.numero_contrato || '—'}</span></div>
      <div class="info-row"><span class="info-label">Período</span><span class="info-value">${d.periodo || '—'}</span></div>
      <div class="info-row"><span class="info-label">Valor</span><span class="info-value" style="color:#059669;font-size:18px;font-weight:800">$${Number(d.valor || 0).toLocaleString('es-CO')}</span></div>
      ${d.concepto ? `<div class="info-row"><span class="info-label">Concepto</span><span class="info-value">${d.concepto}</span></div>` : ''}
    </div>
    <div class="alert-box alert-green">El pago será procesado por el área financiera de la entidad.</div>
  `)
}

// ── Router de plantillas ─────────────────────────────────────

function renderTemplate(tipo: string, datos: any): { html: string; asunto: string } {
  switch (tipo) {
    case 'nueva_solicitud':   return { html: tplNuevaSolicitud(datos),   asunto: `📋 Nueva solicitud de documentos — Contrato ${datos.numero_contrato || ''}` }
    case 'doc_subido':        return { html: tplDocSubido(datos),        asunto: `📤 Documento subido — ${datos.contratista_nombre || 'Contratista'} · ${datos.numero_contrato || ''}` }
    case 'doc_aprobado':      return { html: tplDocAprobado(datos),      asunto: `✅ Documento aprobado — ${datos.nombre_item || ''}` }
    case 'doc_rechazado':     return { html: tplDocRechazado(datos),     asunto: `❌ Documento rechazado — acción requerida · ${datos.numero_contrato || ''}` }
    case 'recordatorio':      return { html: tplRecordatorio(datos),     asunto: `⏰ Recordatorio: ${datos.dias_restantes} día(s) para vencer — ${datos.numero_contrato || ''}` }
    case 'alerta_vencimiento':return { html: tplAlertaVencimiento(datos),asunto: `⚠️ Alerta de vencimiento — ${datos.numero_contrato || ''}` }
    case 'pago_autorizado':   return { html: tplPagoAutorizado(datos),   asunto: `💰 Pago autorizado — $${Number(datos.valor||0).toLocaleString('es-CO')} · ${datos.numero_contrato || ''}` }
    default:
      return {
        html: wrapEmail(`<h1 class="title">${datos.titulo || 'Notificación'}</h1><p>${datos.cuerpo || ''}</p>`),
        asunto: datos.asunto || 'Notificación ContralControl'
      }
  }
}

// ── Handler principal ────────────────────────────────────────

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { para, tipo, datos, registrar = true } = body

    if (!para || !tipo) {
      return new Response(JSON.stringify({ error: 'Faltan campos: para, tipo' }), { status: 400, headers: corsHeaders })
    }

    const { html, asunto } = renderTemplate(tipo, datos || {})

    // Enviar con Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(para) ? para : [para],
        subject: asunto,
        html,
      }),
    })

    const resendData = await resendRes.json()
    const exito = resendRes.ok

    // Registrar en historial
    if (registrar && SUPABASE_URL && SUPABASE_KEY) {
      const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
      await sb.from('historial_emails').insert({
        para: Array.isArray(para) ? para.join(', ') : para,
        asunto,
        tipo_email: tipo,
        contrato_id:   datos?.contrato_id || null,
        referencia_id: datos?.referencia_id || null,
        estado:        exito ? 'enviado' : 'error',
        error_mensaje: exito ? null : JSON.stringify(resendData),
        enviado_por:   datos?.enviado_por || null,
      })
    }

    return new Response(JSON.stringify({ ok: exito, resend: resendData }), {
      status: exito ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
