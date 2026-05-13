const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/message');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');

router.get('/list', auth, asyncHandler(ctrl.list));
router.get('/unread-count', auth, asyncHandler(ctrl.unreadCount));
router.put('/read-all', auth, asyncHandler(ctrl.markAllRead));
router.put('/:id/read', auth, asyncHandler(ctrl.markRead));
router.delete('/:id', auth, asyncHandler(ctrl.remove));
router.post('/batch-delete', auth, asyncHandler(ctrl.batchDelete));
router.post('/send', auth, asyncHandler(ctrl.send));

module.exports = router;
