const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/backup');
const auth = require('../middleware/auth');

router.post('/create', auth, ctrl.create);
router.get('/list', auth, ctrl.list);
router.get('/download/:filename', auth, ctrl.download);
router.post('/restore', auth, ctrl.restore);
router.delete('/:filename', auth, ctrl.remove);

module.exports = router;
