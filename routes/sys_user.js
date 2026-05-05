const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sys_user');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/list', auth, requireAdmin, ctrl.list);
router.post('/', auth, requireAdmin, ctrl.create);
router.put('/:id', auth, requireAdmin, ctrl.update);
router.delete('/:id', auth, requireAdmin, ctrl.remove);
router.post('/:id/reset-password', auth, requireAdmin, ctrl.resetPassword);

module.exports = router;
