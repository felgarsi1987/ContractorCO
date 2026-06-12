const express  = require('express');
const router   = express.Router();
const { pool } = require('../config/database');
const { autenticar } = require('../middleware/auth');
const svc      = require('../services/alertasService');
router.use(autenticar);
router.get('/', async (req, res) => {
  const { leida, limit = 20 } = req.query;
  const filtros = []; const params = []; let p = 1;
  if (leida !== undefined) { filtros.push(`a.leida = $${p++}`); params.push(leida === 'true'); }
  const where = filtros.length ? 'WHERE ' + filtros.join(' AND ') : '';
  const { rows } = await pool.query(
    `SELECT a.*, c.numero_contrato, d.nombre as documento_nombre FROM alertas a
     LEFT JOIN contratos c ON c.id = a.contrato_id
     LEFT JOIN documentos d ON d.id = a.documento_id
     ${where} ORDER BY a.creado_en DESC LIMIT $${p}`,
    [...params, parseInt(limit)]
  );
  res.json(rows);
});
router.put('/:id/leer', async (req, res) => {
  await pool.query('UPDATE alertas SET leida = true WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});
router.post('/procesar', async (req, res) => {
  await svc.procesarVencimientos();
  res.json({ ok: true });
});
module.exports = router;
