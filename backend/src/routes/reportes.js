const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/reportesController');
const { autenticar, autorizar } = require('../middleware/auth');
router.use(autenticar);
router.get('/contratos',   autorizar('admin','auditor'), ctrl.contratos);
router.get('/vencimientos',autorizar('admin','auditor','supervisor'), ctrl.vencimientos);
module.exports = router;
