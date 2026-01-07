const express = require('express');
const router = express.Router();
const { authUser, registerUser, logoutUser, updateUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.route('/profile').put(protect, updateUserProfile);

module.exports = router;
