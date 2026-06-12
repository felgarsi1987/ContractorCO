const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');
const { autenticar } = require('../middleware/auth');
router.post('/login',           ctrl.login);
router.get ('/me',              autenticar, ctrl.me);
router.put ('/cambiar-password',autenticar, ctrl.cambiarPassword);
module.exports = router;
