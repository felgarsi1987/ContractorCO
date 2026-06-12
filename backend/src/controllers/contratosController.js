const { pool }         = require('../config/database');
const { v4: uuidv4 }   = require('uuid');
const Joi              = require('joi');

// ── Validación ────────────────────────────────────────────────
const schemaContrato = Joi.object({
  contratista_id:  Joi.string().uuid().required(),
  supervisor_id:   Joi.string().uuid().optional(),
  numero_contrato: Joi.string().max(60).required(),
  objeto:          Joi.string().min(10).required(),
  tipo_contrato:   Joi.string().valid(
    'prestacion_servicios','obra','suministro',
    'consultoria','interadministrativo','otro'
  ).required(),
  valor_inicial:   Joi.number().positive().required(),
  fecha_inicio:    Joi.date().iso().required(),
  fecha_fin:       Joi.date().iso().greater(Joi.ref('fecha_inicio')).required(),
  numero_secop:    Joi.string().max(100).optional(),
  cdp:             Joi.string().max(50).optional(),
  rp:              Joi.string().max(50).optional(),
  observaciones:   Joi.string().optional()
});

// ── Listar contratos (con filtros y paginación) ───────────────
exports.listar = async (req, res) => {
  try {
    const {
      estado, supervisor_id, contratista_id,
      semaforo, tipo_contrato,
      page = 1, limit = 20,
      buscar
    } = req.query;

    const offset = (page - 1) * limit;
    const filtros = [];
    const params  = [];
    let p = 1;

    // Supervisor solo ve sus propios contratos
    if (req.usuario.rol === 'supervisor') {
      const { rows } = await pool.query(
        'SELECT id FROM supervisores WHERE usuario_id = $1', [req.usuario.id]
      );
      if (rows.length) {
        filtros.push(`c.supervisor_id = $${p++}`);
        params.push(rows[0].id);
      }
    }
    // Contratista solo ve sus contratos
    if (req.usuario.rol === 'contratista') {
      const { rows } = await pool.query(
        'SELECT id FROM contratistas WHERE usuario_id = $1', [req.usuario.id]
      );
      if (rows.length) {
        filtros.push(`c.contratista_id = $${p++}`);
        params.push(rows[0].id);
      }
    }

    if (estado)         { filtros.push(`c.estado = $${p++}`);          params.push(estado); }
    if (supervisor_id)  { filtros.push(`c.supervisor_id = $${p++}`);   params.push(supervisor_id); }
    if (contratista_id) { filtros.push(`c.contratista_id = $${p++}`);  params.push(contratista_id); }
    if (tipo_contrato)  { filtros.push(`c.tipo_contrato = $${p++}`);   params.push(tipo_contrato); }
    if (semaforo === 'vencido')  filtros.push(`c.fecha_fin < CURRENT_DATE AND c.estado = 'en_ejecucion'`);
    if (semaforo === 'proximo')  filtros.push(`c.fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND c.estado = 'en_ejecucion'`);
    if (semaforo === 'vigente')  filtros.push(`c.fecha_fin > CURRENT_DATE + INTERVAL '30 days' AND c.estado = 'en_ejecucion'`);
    if (buscar) {
      filtros.push(`(c.numero_contrato ILIKE $${p} OR c.objeto ILIKE $${p} OR (ct.nombres || ' ' || ct.apellidos) ILIKE $${p})`);
      params.push(`%${buscar}%`); p++;
    }

    const where = filtros.length ? 'WHERE ' + filtros.join(' AND ') : '';

    const queryCount = `SELECT COUNT(*) FROM contratos c
      JOIN contratistas ct ON ct.id = c.contratista_id ${where}`;
    const queryData = `
      SELECT c.*, 
        ct.nombres || ' ' || COALESCE(ct.apellidos,'') AS contratista_nombre,
        ct.cedula AS contratista_cedula,
        u.nombre AS supervisor_nombre,
        s.dependencia AS supervisor_dependencia,
        (c.fecha_fin - CURRENT_DATE) AS dias_restantes,
        CASE
          WHEN c.fecha_fin < CURRENT_DATE THEN 'vencido'
          WHEN c.fecha_fin <= CURRENT_DATE + 30 THEN 'proximo'
          ELSE 'vigente'
        END AS semaforo,
        (SELECT COUNT(*) FROM documentos d WHERE d.contrato_id = c.id AND d.es_vigente = true) AS total_documentos,
        (SELECT COUNT(*) FROM documentos d WHERE d.contrato_id = c.id AND d.estado_vence = 'vencido' AND d.es_vigente = true) AS docs_vencidos
      FROM contratos c
      JOIN contratistas ct ON ct.id = c.contratista_id
      LEFT JOIN supervisores s ON s.id = c.supervisor_id
      LEFT JOIN usuarios u ON u.id = s.usuario_id
      ${where}
      ORDER BY c.fecha_fin ASC
      LIMIT $${p} OFFSET $${p + 1}`;

    params.push(parseInt(limit), parseInt(offset));

    const [{ rows: [{ count }] }, { rows }] = await Promise.all([
      pool.query(queryCount, params.slice(0, -2)),
      pool.query(queryData, params)
    ]);

    res.json({
      data: rows,
      total: parseInt(count),
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar contratos' });
  }
};

// ── Obtener un contrato por ID ────────────────────────────────
exports.obtener = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        ct.nombres || ' ' || COALESCE(ct.apellidos,'') AS contratista_nombre,
        ct.cedula, ct.email AS contratista_email, ct.telefono AS contratista_telefono,
        ct.tipo_persona, ct.estado AS contratista_estado,
        u.nombre AS supervisor_nombre, u.email AS supervisor_email,
        s.cargo, s.dependencia,
        ucr.nombre AS creado_por_nombre,
        (c.fecha_fin - CURRENT_DATE) AS dias_restantes
      FROM contratos c
      JOIN contratistas ct ON ct.id = c.contratista_id
      LEFT JOIN supervisores s ON s.id = c.supervisor_id
      LEFT JOIN usuarios u ON u.id = s.usuario_id
      LEFT JOIN usuarios ucr ON ucr.id = c.creado_por
      WHERE c.id = $1`, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: 'Contrato no encontrado' });

    // Documentos asociados
    const { rows: docs } = await pool.query(
      `SELECT * FROM documentos WHERE contrato_id = $1 AND es_vigente = true ORDER BY subido_en DESC`,
      [req.params.id]
    );

    // Adiciones / modificaciones
    const { rows: adiciones } = await pool.query(
      `SELECT a.*, u.nombre AS creado_por_nombre FROM adiciones_contratos a
       JOIN usuarios u ON u.id = a.creado_por
       WHERE a.contrato_id = $1 ORDER BY a.creado_en DESC`,
      [req.params.id]
    );

    res.json({ ...rows[0], documentos: docs, adiciones });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener contrato' });
  }
};

// ── Crear contrato ────────────────────────────────────────────
exports.crear = async (req, res) => {
  const { error, value } = schemaContrato.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar número único
    const existe = await client.query(
      'SELECT id FROM contratos WHERE numero_contrato = $1', [value.numero_contrato]
    );
    if (existe.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Ya existe un contrato con ese número' });
    }

    const { rows } = await client.query(`
      INSERT INTO contratos
        (contratista_id, supervisor_id, numero_contrato, objeto, tipo_contrato,
         valor_inicial, valor_actual, fecha_inicio, fecha_fin,
         numero_secop, cdp, rp, observaciones, estado, creado_por)
      VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,'borrador',$13)
      RETURNING *`,
      [
        value.contratista_id, value.supervisor_id || null,
        value.numero_contrato, value.objeto, value.tipo_contrato,
        value.valor_inicial, value.fecha_inicio, value.fecha_fin,
        value.numero_secop || null, value.cdp || null, value.rp || null,
        value.observaciones || null, req.usuario.id
      ]
    );

    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error al crear contrato' });
  } finally {
    client.release();
  }
};

// ── Actualizar contrato ───────────────────────────────────────
exports.actualizar = async (req, res) => {
  try {
    const campos = [];
    const vals   = [];
    let p = 1;
    const permitidos = [
      'supervisor_id','objeto','tipo_contrato','estado',
      'numero_secop','observaciones','fecha_fin_real'
    ];

    for (const campo of permitidos) {
      if (req.body[campo] !== undefined) {
        campos.push(`${campo} = $${p++}`);
        vals.push(req.body[campo]);
      }
    }

    if (!campos.length) return res.status(400).json({ error: 'Sin campos para actualizar' });

    campos.push(`actualizado_por = $${p++}`, `actualizado_en = NOW()`);
    vals.push(req.usuario.id, req.params.id);

    const { rows } = await pool.query(
      `UPDATE contratos SET ${campos.join(', ')} WHERE id = $${p} RETURNING *`,
      vals
    );

    if (!rows.length) return res.status(404).json({ error: 'Contrato no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar contrato' });
  }
};

// ── Agregar modificación / adición ────────────────────────────
exports.agregarModificacion = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { tipo_modificacion, valor_adicional, dias_adicionales, nueva_fecha_fin, justificacion, resolucion } = req.body;

    // Registrar adición
    const { rows: [adicion] } = await client.query(
      `INSERT INTO adiciones_contratos
        (contrato_id, tipo_modificacion, valor_adicional, dias_adicionales,
         nueva_fecha_fin, justificacion, resolucion, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, tipo_modificacion, valor_adicional || 0,
       dias_adicionales || 0, nueva_fecha_fin || null, justificacion, resolucion || null, req.usuario.id]
    );

    // Actualizar contrato
    const updates = [];
    if (valor_adicional)  updates.push(`valor_actual = valor_actual + ${parseFloat(valor_adicional)}`);
    if (nueva_fecha_fin)  updates.push(`fecha_fin = '${nueva_fecha_fin}'`);
    if (updates.length) {
      await client.query(
        `UPDATE contratos SET ${updates.join(', ')}, actualizado_en = NOW() WHERE id = $1`,
        [req.params.id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(adicion);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error al registrar modificación' });
  } finally {
    client.release();
  }
};

// ── Estadísticas por tipo y estado ───────────────────────────
exports.estadisticas = async (req, res) => {
  try {
    const [porEstado, porTipo, porMes] = await Promise.all([
      pool.query(`SELECT estado, COUNT(*) as total, SUM(valor_actual) as valor
                  FROM contratos GROUP BY estado ORDER BY total DESC`),
      pool.query(`SELECT tipo_contrato, COUNT(*) as total, SUM(valor_actual) as valor
                  FROM contratos GROUP BY tipo_contrato ORDER BY total DESC`),
      pool.query(`SELECT TO_CHAR(fecha_inicio, 'YYYY-MM') as mes, COUNT(*) as total
                  FROM contratos WHERE fecha_inicio >= NOW() - INTERVAL '12 months'
                  GROUP BY mes ORDER BY mes`)
    ]);

    res.json({
      por_estado: porEstado.rows,
      por_tipo:   porTipo.rows,
      por_mes:    porMes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
