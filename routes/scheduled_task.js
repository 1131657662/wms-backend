const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/scheduled_task');
const auth = require('../middleware/auth');

router.get('/list', auth, ctrl.list);
router.put('/:id', auth, ctrl.update);
router.post('/:id/trigger', auth, ctrl.trigger);
router.get('/log/list', auth, ctrl.logList);

module.exports = router;
