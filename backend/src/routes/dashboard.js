const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/dashboardController');
const { autenticar } = require('../middleware/auth');
router.use(autenticar);
router.get('/', ctrl.obtener);
module.exports = router;
