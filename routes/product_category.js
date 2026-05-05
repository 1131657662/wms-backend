const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/product_category');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/role');

router.get('/tree', auth, hasPermission('basic:view'), ctrl.tree);
router.get('/list', auth, hasPermission('basic:view'), ctrl.list);
router.get('/:id', auth, hasPermission('basic:view'), ctrl.detail);
router.post('/', auth, hasPermission('basic:edit'), ctrl.create);
router.put('/:id', auth, hasPermission('basic:edit'), ctrl.update);
router.delete('/:id', auth, hasPermission('basic:edit'), ctrl.remove);

module.exports = router;
