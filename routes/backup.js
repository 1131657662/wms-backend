const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/backup');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');

router.post('/create', auth, asyncHandler(ctrl.create));
router.get('/list', auth, asyncHandler(ctrl.list));
router.get('/download/:filename', auth, asyncHandler(ctrl.download));
router.post('/restore', auth, asyncHandler(ctrl.restore));
router.delete('/:filename', auth, asyncHandler(ctrl.remove));

module.exports = router;
