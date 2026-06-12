const jwt    = require('jsonwebtoken');
const { pool } = require('../config/database');

// ── Verificar token JWT ───────────────────────────────────────
const autenticar = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ error: 'Token requerido' });

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query(
      'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = $1',
      [decoded.id]
    );

    if (!rows.length || !rows[0].activo)
      return res.status(401).json({ error: 'Usuario inactivo o inexistente' });

    req.usuario = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token expirado' });
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// ── Autorización por rol ──────────────────────────────────────
const autorizar = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.rol))
    return res.status(403).json({ error: 'No tiene permisos para esta acción' });
  next();
};

// ── Middleware de auditoría automática ────────────────────────
const registrarAuditoria = (tabla, accion) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    if (res.statusCode < 400 && req.usuario) {
      try {
        await pool.query(
          `INSERT INTO auditoria (usuario_id, tabla_afectada, registro_id, accion,
           datos_nuevos, ip_origen, user_agent)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            req.usuario.id, tabla, req.params.id || null, accion,
            JSON.stringify(req.body),
            req.ip, req.headers['user-agent']
          ]
        );
      } catch (_) {}
    }
    return originalJson(data);
  };
  next();
};

module.exports = { autenticar, autorizar, registrarAuditoria };
