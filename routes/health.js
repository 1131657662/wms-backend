const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/health');
const auth = require('../middleware/auth');

router.get('/status', auth, ctrl.status);

module.exports = router;
