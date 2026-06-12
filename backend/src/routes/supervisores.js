const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/supervisoresController');
const { autenticar, autorizar } = require('../middleware/auth');
router.use(autenticar);
router.get ('/', ctrl.listar);
router.post('/', autorizar('admin'), ctrl.crear);
module.exports = router;
