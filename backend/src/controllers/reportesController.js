const { pool } = require('../config/database');

exports.contratos = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_contratos_completos ORDER BY fecha_fin');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error al generar reporte' }); }
};

exports.vencimientos = async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM v_contratos_completos
       WHERE fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + $1 AND semaforo != 'vencido'
       ORDER BY fecha_fin`,
      [parseInt(dias)]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error al generar reporte de vencimientos' }); }
};
