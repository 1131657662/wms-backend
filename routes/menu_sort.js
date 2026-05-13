const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/menu_sort');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');

router.get('/list', auth, asyncHandler(ctrl.list));
router.post('/sort', auth, asyncHandler(ctrl.save));

module.exports = router;
