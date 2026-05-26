const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctrl = require('../controllers/user');
const { asyncHandler } = require('../utils/asyncHandler');
const auth = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

router.get('/profile', auth, asyncHandler(ctrl.profile));
router.get('/security-logs', auth, asyncHandler(ctrl.securityLogs));
router.put('/profile', auth, asyncHandler(ctrl.updateProfile));
router.post('/change-password', auth, asyncHandler(ctrl.changePassword));
router.post('/upload-avatar', auth, upload.single('avatar'), asyncHandler(ctrl.uploadAvatar));

module.exports = router;
