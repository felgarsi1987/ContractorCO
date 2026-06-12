const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/auditoriaController');
const { autenticar, autorizar } = require('../middleware/auth');
router.use(autenticar);
router.get('/', autorizar('admin','auditor'), ctrl.listar);
module.exports = router;
