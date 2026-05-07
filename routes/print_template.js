const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const ctrl = require('../controllers/print_template');

router.get('/by-page/:pageCode', auth, ctrl.byPage);
router.get('/list', auth, requireAdmin, ctrl.list);
router.post('', auth, requireAdmin, ctrl.create);
router.put('/:id', auth, requireAdmin, ctrl.update);
router.delete('/:id', auth, requireAdmin, ctrl.remove);

module.exports = router;
