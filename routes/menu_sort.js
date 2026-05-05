const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/menu_sort');
const auth = require('../middleware/auth');

router.get('/list', auth, ctrl.list);
router.post('/sort', auth, ctrl.save);

module.exports = router;
