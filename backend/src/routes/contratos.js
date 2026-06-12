// ── routes/contratos.js ───────────────────────────────────────
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/contratosController');
const { autenticar, autorizar, registrarAuditoria } = require('../middleware/auth');

router.use(autenticar);

router.get ('/',              ctrl.listar);
router.get ('/estadisticas',  ctrl.estadisticas);
router.get ('/:id',           ctrl.obtener);
router.post('/',              autorizar('admin','supervisor'), registrarAuditoria('contratos','crear'),    ctrl.crear);
router.put ('/:id',           autorizar('admin','supervisor'), registrarAuditoria('contratos','actualizar'), ctrl.actualizar);
router.post('/:id/modificaciones', autorizar('admin'),         registrarAuditoria('adiciones_contratos','crear'), ctrl.agregarModificacion);

module.exports = router;
