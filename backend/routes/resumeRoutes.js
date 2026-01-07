const express = require('express');
const router = express.Router();
const {
    getResumes,
    uploadResume,
    deleteResume
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getResumes)
    .post(protect, uploadResume);

router.route('/:id')
    .delete(protect, deleteResume);

module.exports = router;
