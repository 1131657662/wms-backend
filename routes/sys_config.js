const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sys_config');
const auth = require('../middleware/auth');

router.get('/list', auth, ctrl.list);
router.get('/groups', auth, ctrl.groups);
router.put('/update', auth, ctrl.update);

module.exports = router;
