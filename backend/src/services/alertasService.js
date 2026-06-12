const { pool }  = require('../config/database');
const logger    = require('../utils/logger');
// const admin  = require('firebase-admin'); // descomentar con credenciales reales
// const sgMail = require('@sendgrid/mail');  // descomentar con API key real

/**
 * Servicio central de alertas:
 * - Calcula vencimientos de contratos y documentos
 * - Genera registros en tabla alertas
 * - Envía notificaciones push (Firebase) y correo (SendGrid)
 */

const DIAS_ALERTA = [30, 15, 5];

// ── Procesar todos los vencimientos ──────────────────────────
exports.procesarVencimientos = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Actualizar estado_vence de documentos
    await client.query(`
      UPDATE documentos SET
        estado_vence = CASE
          WHEN fecha_vencimiento < CURRENT_DATE THEN 'vencido'
          WHEN fecha_vencimiento <= CURRENT_DATE + 30 THEN 'proximo'
          ELSE 'vigente'
        END
      WHERE es_vigente = true AND fecha_vencimiento IS NOT NULL
    `);

    // 2. Alertas por vencimiento de CONTRATOS
    for (const dias of DIAS_ALERTA) {
      const tipo = `vencimiento_contrato_${dias}`;
      const { rows: contratos } = await client.query(`
        SELECT c.id, c.numero_contrato, c.fecha_fin, c.objeto,
               u.email AS supervisor_email, u.nombre AS supervisor_nombre,
               s.id AS supervisor_id
        FROM contratos c
        LEFT JOIN supervisores s ON s.id = c.supervisor_id
        LEFT JOIN usuarios u ON u.id = s.usuario_id
        WHERE c.fecha_fin = CURRENT_DATE + $1
          AND c.estado = 'en_ejecucion'
          AND NOT EXISTS (
            SELECT 1 FROM alertas a
            WHERE a.contrato_id = c.id AND a.tipo_alerta = $2
              AND a.creado_en >= CURRENT_DATE
          )`, [dias, tipo]
      );

      for (const c of contratos) {
        const mensaje = `El contrato ${c.numero_contrato} vence en ${dias} días (${c.fecha_fin}).`;
        await client.query(
          `INSERT INTO alertas (contrato_id, tipo_alerta, mensaje) VALUES ($1,$2,$3)`,
          [c.id, tipo, mensaje]
        );
        logger.info(`Alerta generada: ${tipo} — contrato ${c.numero_contrato}`);
        // await enviarPush(c.supervisor_id, `Contrato por vencer`, mensaje);
        // await enviarEmail(c.supervisor_email, `Contrato por vencer: ${c.numero_contrato}`, mensaje);
      }
    }

    // 3. Alertas por vencimiento de DOCUMENTOS
    for (const dias of DIAS_ALERTA) {
      const tipo = `vencimiento_documento_${dias}`;
      const { rows: docs } = await client.query(`
        SELECT d.id, d.nombre, d.fecha_vencimiento, d.categoria,
               c.numero_contrato, c.id AS contrato_id,
               u.email AS supervisor_email
        FROM documentos d
        JOIN contratos c ON c.id = d.contrato_id
        LEFT JOIN supervisores s ON s.id = c.supervisor_id
        LEFT JOIN usuarios u ON u.id = s.usuario_id
        WHERE d.fecha_vencimiento = CURRENT_DATE + $1
          AND d.es_vigente = true
          AND NOT EXISTS (
            SELECT 1 FROM alertas a
            WHERE a.documento_id = d.id AND a.tipo_alerta = $2
              AND a.creado_en >= CURRENT_DATE
          )`, [dias, tipo]
      );

      for (const d of docs) {
        const mensaje = `El documento "${d.nombre}" del contrato ${d.numero_contrato} vence en ${dias} días.`;
        await client.query(
          `INSERT INTO alertas (contrato_id, documento_id, tipo_alerta, mensaje) VALUES ($1,$2,$3,$4)`,
          [d.contrato_id, d.id, tipo, mensaje]
        );
      }
    }

    await client.query('COMMIT');
    logger.info('Proceso de vencimientos completado.');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error procesando vencimientos:', err);
  } finally {
    client.release();
  }
};

// ── Enviar notificación push individual ───────────────────────
exports.enviarPushAUsuario = async (usuarioId, titulo, cuerpo, datos = {}) => {
  try {
    // Obtener device_token activo del usuario
    const { rows } = await pool.query(
      `SELECT device_token FROM notificaciones_push
       WHERE usuario_id = $1 AND device_token IS NOT NULL
       ORDER BY enviada_en DESC LIMIT 1`, [usuarioId]
    );

    // Guardar en BD
    await pool.query(
      `INSERT INTO notificaciones_push (usuario_id, titulo, cuerpo, datos_extra)
       VALUES ($1, $2, $3, $4)`,
      [usuarioId, titulo, cuerpo, JSON.stringify(datos)]
    );

    // Envío real con Firebase (descomenta con credenciales):
    // if (rows.length && rows[0].device_token) {
    //   await admin.messaging().send({
    //     token: rows[0].device_token,
    //     notification: { title: titulo, body: cuerpo },
    //     data: datos
    //   });
    // }

    logger.info(`Push enviado a usuario ${usuarioId}: ${titulo}`);
  } catch (err) {
    logger.error('Error enviando push:', err);
  }
};

// ── Obtener alertas no leídas de un usuario ───────────────────
exports.obtenerNoLeidas = async (usuarioId) => {
  const { rows } = await pool.query(`
    SELECT a.*, c.numero_contrato, d.nombre AS documento_nombre
    FROM alertas a
    LEFT JOIN contratos c ON c.id = a.contrato_id
    LEFT JOIN documentos d ON d.id = a.documento_id
    LEFT JOIN supervisores s ON s.id = (
      SELECT supervisor_id FROM contratos WHERE id = a.contrato_id
    )
    LEFT JOIN usuarios u ON u.id = s.usuario_id
    WHERE u.id = $1 AND a.leida = false
    ORDER BY a.creado_en DESC LIMIT 50`, [usuarioId]
  );
  return rows;
};
