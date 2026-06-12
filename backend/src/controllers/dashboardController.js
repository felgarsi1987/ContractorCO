const { pool } = require('../config/database');

exports.obtener = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_dashboard');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error al obtener dashboard' }); }
};
