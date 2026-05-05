const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/print');

router.post('/:businessType/:businessId', auth, ctrl.print);

module.exports = router;
