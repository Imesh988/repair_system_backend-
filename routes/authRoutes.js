const express = require('express');
const { login, getMe, createAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/create-admin', createAdmin);   // Temporary – remove after use

module.exports = router;