const express = require('express');
const router = express.Router();
const { analyzeResume } = require('../controllers/analysisController');
const { protect } = require('../middleware/authMiddleware');

// Protect the route so only logged in users can use credits/analysis
router.post('/analyze-resume', protect, analyzeResume);

module.exports = router;
