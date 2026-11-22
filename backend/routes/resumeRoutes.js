const express = require('express');
const router = express.Router();
const {
    getResumes,
    uploadResume,
    scoreResumeAgainstJob,
    updateBulletFixStatus,
    getScoreHistory,
    deleteResume,
    downloadResume
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getResumes)
    .post(protect, upload.single('resume'), uploadResume);

router.route('/:id')
    .delete(protect, deleteResume);

router.post('/:id/score', protect, scoreResumeAgainstJob);
router.put('/:id/bullets/:index', protect, updateBulletFixStatus);
router.get('/:id/history', protect, getScoreHistory);
router.get('/:id/download', protect, downloadResume);

module.exports = router;
