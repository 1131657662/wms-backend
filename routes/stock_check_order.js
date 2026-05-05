const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/stock_check_order');

router.get('/list', auth, ctrl.list);
router.get('/export', auth, ctrl.exportCheckOrders);
router.get('/:id', auth, ctrl.detail);
router.post('/', auth, ctrl.create);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);
router.post('/:id/confirm', auth, ctrl.confirm);
router.post('/:id/adjust', auth, ctrl.adjust);

module.exports = router;
