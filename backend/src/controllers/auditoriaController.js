const { pool } = require('../config/database');

exports.listar = async (req, res) => {
  try {
    const { tabla, accion, usuario_id, desde, hasta, page = 1, limit = 50 } = req.query;
    const filtros = []; const params = []; let p = 1;
    if (tabla)      { filtros.push(`tabla_afectada = $${p++}`); params.push(tabla); }
    if (accion)     { filtros.push(`accion = $${p++}`);         params.push(accion); }
    if (usuario_id) { filtros.push(`a.usuario_id = $${p++}`);   params.push(usuario_id); }
    if (desde)      { filtros.push(`timestamp >= $${p++}`);     params.push(desde); }
    if (hasta)      { filtros.push(`timestamp <= $${p++}`);     params.push(hasta); }
    const where = filtros.length ? 'WHERE ' + filtros.join(' AND ') : '';
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT a.*, u.nombre as usuario_nombre FROM auditoria a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       ${where} ORDER BY a.timestamp DESC LIMIT $${p} OFFSET $${p+1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error al listar auditoría' }); }
};
