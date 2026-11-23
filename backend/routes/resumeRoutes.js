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

// Safe Multer upload wrapper with explicit CORS and client-safe error messages
const handleMulterUpload = (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
        if (err) {
            console.error('[ResumeUpload] Multer processing error:', err.message);
            if (req.headers.origin) {
                res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            }
            return res.status(400).json({
                message: err.code === 'LIMIT_FILE_SIZE'
                    ? 'The uploaded file is too large. Maximum allowed size is 10MB.'
                    : (err.message || 'File upload failed. Please try again.')
            });
        }
        next();
    });
};

router.route('/')
    .get(protect, getResumes)
    .post(protect, handleMulterUpload, uploadResume);

router.route('/:id')
    .delete(protect, deleteResume);

router.post('/:id/score', protect, scoreResumeAgainstJob);
router.put('/:id/bullets/:index', protect, updateBulletFixStatus);
router.get('/:id/history', protect, getScoreHistory);
router.get('/:id/download', protect, downloadResume);
router.get('/:id/file', protect, downloadResume);

module.exports = router;
