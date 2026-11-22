const express = require('express');
const router = express.Router();
const {
    getApplications,
    addApplication,
    updateApplication,
    extractFromJobDescription,
    deleteApplication
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getApplications)
    .post(protect, addApplication);

router.post('/extract', protect, extractFromJobDescription);

router.route('/:id')
    .put(protect, updateApplication)
    .delete(protect, deleteApplication);

module.exports = router;
