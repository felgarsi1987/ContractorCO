const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const { pool } = require('../config/database');
const { autenticar, autorizar } = require('../middleware/auth');
router.use(autenticar);
router.get('/', autorizar('admin'), async (req, res) => {
  const { rows } = await pool.query('SELECT id,nombre,email,rol,activo,ultimo_acceso,creado_en FROM usuarios ORDER BY creado_en');
  res.json(rows);
});
router.post('/', autorizar('admin'), async (req, res) => {
  const { nombre, email, rol, password } = req.body;
  const hash = await bcrypt.hash(password || 'Temporal2025*', 12);
  const { rows } = await pool.query(
    'INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES ($1,$2,$3,$4) RETURNING id,nombre,email,rol',
    [nombre, email, hash, rol]
  );
  res.status(201).json(rows[0]);
});
router.put('/:id', autorizar('admin'), async (req, res) => {
  const { nombre, rol, activo } = req.body;
  const { rows } = await pool.query(
    'UPDATE usuarios SET nombre=$1,rol=$2,activo=$3,actualizado_en=NOW() WHERE id=$4 RETURNING id,nombre,email,rol,activo',
    [nombre, rol, activo, req.params.id]
  );
  res.json(rows[0]);
});
module.exports = router;
