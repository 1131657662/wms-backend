const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/message');
const auth = require('../middleware/auth');

router.get('/list', auth, ctrl.list);
router.get('/unread-count', auth, ctrl.unreadCount);
router.put('/read-all', auth, ctrl.markAllRead);
router.put('/:id/read', auth, ctrl.markRead);
router.delete('/:id', auth, ctrl.remove);
router.post('/batch-delete', auth, ctrl.batchDelete);
router.post('/send', auth, ctrl.send);

module.exports = router;
