const express = require('express');
const router = express.Router();
const {
    getResumes,
    uploadResume,
    deleteResume
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getResumes)
    .post(protect, upload.single('resume'), uploadResume);

router.route('/:id')
    .delete(protect, deleteResume);

module.exports = router;
