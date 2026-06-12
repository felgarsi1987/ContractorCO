const { pool } = require('../config/database');
const crypto   = require('crypto');

// En producción usar AWS S3 — aquí guardamos path local para dev
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

exports.listar = async (req, res) => {
  try {
    const { contrato_id, contratista_id, estado_vence, page = 1, limit = 20 } = req.query;
    const filtros = ['es_vigente = true']; const params = []; let p = 1;
    if (contrato_id)    { filtros.push(`contrato_id = $${p++}`);    params.push(contrato_id); }
    if (contratista_id) { filtros.push(`contratista_id = $${p++}`); params.push(contratista_id); }
    if (estado_vence)   { filtros.push(`estado_vence = $${p++}`);   params.push(estado_vence); }
    const where = 'WHERE ' + filtros.join(' AND ');
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT d.*, u.nombre as subido_por_nombre FROM documentos d
       LEFT JOIN usuarios u ON u.id = d.subido_por
       ${where} ORDER BY d.subido_en DESC LIMIT $${p} OFFSET $${p+1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error al listar documentos' }); }
};

exports.subir = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
    const { contrato_id, contratista_id, nombre, categoria, fecha_vencimiento } = req.body;
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // Versionar si ya existe un doc de la misma categoría en el contrato
    let version = 1;
    if (contrato_id && categoria) {
      await pool.query(
        `UPDATE documentos SET es_vigente = false WHERE contrato_id = $1 AND categoria = $2 AND es_vigente = true`,
        [contrato_id, categoria]
      );
      const { rows: prev } = await pool.query(
        `SELECT MAX(version) as v FROM documentos WHERE contrato_id = $1 AND categoria = $2`,
        [contrato_id, categoria]
      );
      version = (prev[0].v || 0) + 1;
    }

    const url = `/uploads/${Date.now()}_${req.file.originalname}`;
    const { rows } = await pool.query(
      `INSERT INTO documentos (contrato_id, contratista_id, nombre, categoria, url_archivo, nombre_archivo,
        tamano_bytes, mime_type, fecha_vencimiento, version, hash_archivo, subido_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [contrato_id||null, contratista_id||null, nombre, categoria, url,
       req.file.originalname, req.file.size, req.file.mimetype,
       fecha_vencimiento||null, version, hash, req.usuario.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error al subir documento' }); }
};

exports.eliminar = async (req, res) => {
  try {
    await pool.query('UPDATE documentos SET es_vigente = false WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Error al eliminar documento' }); }
};
