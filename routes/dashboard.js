const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/dashboard');

router.get('', auth, ctrl.stats);
router.get('/analysis', auth, ctrl.analysis);
router.get('/workplace', auth, ctrl.workplace);

module.exports = router;
