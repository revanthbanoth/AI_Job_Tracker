const express = require('express');
const router = express.Router();
const {
    getShareSettings,
    generateShareToken,
    revokeShareToken,
    getPublicProgress
} = require('../controllers/shareController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes (for candidate)
router.get('/settings', protect, getShareSettings);
router.post('/generate', protect, generateShareToken);
router.post('/revoke', protect, revokeShareToken);

// Public route (for mentor / viewer)
router.get('/view/:token', getPublicProgress);

module.exports = router;
