const express = require('express');
const router = express.Router();
const {
    authUser,
    registerUser,
    logoutUser,
    updateUserProfile,
    verifyUser,
    forgotPassword,
    resetPassword,
    getEmailPreferences,
    updateEmailPreferences,
    unsubscribeUser,
    deleteAccount,
    testEmailDelivery,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.get('/test-email', testEmailDelivery);
router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify', protect, verifyUser);
router.route('/profile')
    .put(protect, updateUserProfile)
    .delete(protect, deleteAccount);

router.get('/email-preferences', getEmailPreferences);
router.post('/email-preferences', updateEmailPreferences);
router.get('/unsubscribe', unsubscribeUser);

module.exports = router;
