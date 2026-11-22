const express = require('express');
const router = express.Router();
const {
    authUser,
    registerUser,
    logoutUser,
    updateUserProfile,
    verifyUser,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify', protect, verifyUser);
router.route('/profile').put(protect, updateUserProfile);

module.exports = router;
