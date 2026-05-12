const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/user');
const auth = require('../middleware/auth');

router.get('/profile', auth, ctrl.profile);
router.get('/security-logs', auth, ctrl.securityLogs);
router.put('/profile', auth, ctrl.updateProfile);
router.post('/change-password', auth, ctrl.changePassword);
router.post('/upload-avatar', auth, ctrl.uploadAvatar);

module.exports = router;
