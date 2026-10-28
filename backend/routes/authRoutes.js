const express = require('express');
const {
  register,
  login,
  me,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { uploadProfileImage } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.put('/profile', protect, uploadProfileImage, updateProfile);
router.patch('/password', protect, changePassword);

module.exports = router;
