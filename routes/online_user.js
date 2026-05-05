const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const ctrl = require('../controllers/online_user');

router.get('/list', auth, requireAdmin, ctrl.list);
router.post('/kick', auth, requireAdmin, ctrl.kick);

module.exports = router;
