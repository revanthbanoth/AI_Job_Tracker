const express = require('express');
const router = express.Router();
const { authUser, registerUser, logoutUser, updateUserProfile, verifyUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.get('/verify', protect, verifyUser);
router.route('/profile').put(protect, updateUserProfile);

module.exports = router;
