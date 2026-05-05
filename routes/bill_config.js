const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const ctrl = require('../controllers/bill_config');

router.get('/list', auth, requireAdmin, ctrl.list);
router.put('/:id', auth, requireAdmin, ctrl.update);

module.exports = router;
