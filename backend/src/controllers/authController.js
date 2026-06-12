const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { pool } = require('../config/database');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = true', [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });

    const usuario = rows[0];
    const valid = await bcrypt.compare(password, usuario.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [usuario.id]);

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en autenticación' });
  }
};

exports.me = async (req, res) => {
  res.json(req.usuario);
};

exports.cambiarPassword = async (req, res) => {
  try {
    const { password_actual, password_nuevo } = req.body;
    const { rows } = await pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [req.usuario.id]);
    const valid = await bcrypt.compare(password_actual, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

    const hash = await bcrypt.hash(password_nuevo, 12);
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hash, req.usuario.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};
