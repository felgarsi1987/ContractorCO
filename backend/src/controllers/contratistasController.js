const { pool } = require('../config/database');
const Joi      = require('joi');

const schema = Joi.object({
  nombres:       Joi.string().required(),
  apellidos:     Joi.string().optional(),
  cedula:        Joi.string().optional(),
  nit:           Joi.string().optional(),
  tipo_persona:  Joi.string().valid('natural','juridica').required(),
  razon_social:  Joi.string().optional(),
  telefono:      Joi.string().optional(),
  email:         Joi.string().email().optional(),
  direccion:     Joi.string().optional(),
  municipio:     Joi.string().optional(),
  departamento:  Joi.string().optional(),
  banco:         Joi.string().optional(),
  tipo_cuenta:   Joi.string().optional(),
  numero_cuenta: Joi.string().optional(),
});

exports.listar = async (req, res) => {
  try {
    const { buscar, estado, page = 1, limit = 20 } = req.query;
    const filtros = []; const params = []; let p = 1;
    if (estado) { filtros.push(`estado = $${p++}`); params.push(estado); }
    if (buscar) {
      filtros.push(`(nombres ILIKE $${p} OR apellidos ILIKE $${p} OR cedula ILIKE $${p} OR nit ILIKE $${p} OR razon_social ILIKE $${p})`);
      params.push(`%${buscar}%`); p++;
    }
    const where = filtros.length ? 'WHERE ' + filtros.join(' AND ') : '';
    const offset = (page - 1) * limit;
    const [count, data] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM contratistas ${where}`, params),
      pool.query(`SELECT c.*, (SELECT COUNT(*) FROM contratos ct WHERE ct.contratista_id = c.id AND ct.estado = 'en_ejecucion') as contratos_activos
        FROM contratistas c ${where} ORDER BY c.creado_en DESC LIMIT $${p} OFFSET $${p+1}`,
        [...params, parseInt(limit), parseInt(offset)])
    ]);
    res.json({ data: data.rows, total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { res.status(500).json({ error: 'Error al listar contratistas' }); }
};

exports.obtener = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM contratistas WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Contratista no encontrado' });
    const { rows: contratos } = await pool.query(
      'SELECT id, numero_contrato, objeto, valor_actual, estado, fecha_fin FROM contratos WHERE contratista_id = $1 ORDER BY creado_en DESC',
      [req.params.id]
    );
    res.json({ ...rows[0], contratos });
  } catch (err) { res.status(500).json({ error: 'Error al obtener contratista' }); }
};

exports.crear = async (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  try {
    const campos = Object.keys(value);
    const vals   = Object.values(value);
    const placeholders = campos.map((_, i) => `$${i+1}`).join(',');
    const { rows } = await pool.query(
      `INSERT INTO contratistas (${campos.join(',')}, creado_por) VALUES (${placeholders}, $${campos.length+1}) RETURNING *`,
      [...vals, req.usuario.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Cédula o NIT ya registrado' });
    res.status(500).json({ error: 'Error al crear contratista' });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const permitidos = ['nombres','apellidos','telefono','email','direccion','municipio','departamento','banco','tipo_cuenta','numero_cuenta','estado'];
    const campos = []; const vals = []; let p = 1;
    for (const c of permitidos) {
      if (req.body[c] !== undefined) { campos.push(`${c} = $${p++}`); vals.push(req.body[c]); }
    }
    if (!campos.length) return res.status(400).json({ error: 'Sin campos para actualizar' });
    vals.push(req.params.id);
    const { rows } = await pool.query(`UPDATE contratistas SET ${campos.join(', ')}, actualizado_en = NOW() WHERE id = $${p} RETURNING *`, vals);
    if (!rows.length) return res.status(404).json({ error: 'Contratista no encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error al actualizar contratista' }); }
};
