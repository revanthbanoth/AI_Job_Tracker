const express = require('express');
const router = express.Router();
const {
    createCoverLetter,
    tailorBullets,
    createEmailDraft,
    getInterviewQuestions,
    evaluateAnswer
} = require('../controllers/aiCopilotController');
const { protect } = require('../middleware/authMiddleware');

router.post('/cover-letter', protect, createCoverLetter);
router.post('/tailor-bullets', protect, tailorBullets);
router.post('/draft-email', protect, createEmailDraft);
router.post('/interview-questions', protect, getInterviewQuestions);
router.post('/evaluate-answer', protect, evaluateAnswer);

module.exports = router;
