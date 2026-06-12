const { pool } = require('../config/database');

exports.listar = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, u.nombre, u.email, u.activo,
        (SELECT COUNT(*) FROM contratos c WHERE c.supervisor_id = s.id AND c.estado = 'en_ejecucion') as contratos_activos,
        (SELECT COUNT(*) FROM contratos c WHERE c.supervisor_id = s.id AND c.fecha_fin <= CURRENT_DATE + 30 AND c.estado = 'en_ejecucion') as por_vencer
       FROM supervisores s JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.activo = true ORDER BY u.nombre`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error al listar supervisores' }); }
};

exports.crear = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { nombre, email, cargo, dependencia, telefono } = req.body;
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Supervisor2025*', 12);
    const { rows: [u] } = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1,$2,$3,'supervisor') RETURNING id`,
      [nombre, email, hash]
    );
    const { rows: [s] } = await client.query(
      `INSERT INTO supervisores (usuario_id, cargo, dependencia, telefono) VALUES ($1,$2,$3,$4) RETURNING *`,
      [u.id, cargo, dependencia, telefono||null]
    );
    await client.query('COMMIT');
    res.status(201).json({ ...s, nombre, email });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'Email ya registrado' });
    res.status(500).json({ error: 'Error al crear supervisor' });
  } finally { client.release(); }
};
