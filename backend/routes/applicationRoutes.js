const express = require('express');
const router = express.Router();
const {
    getApplications,
    addApplication,
    deleteApplication
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getApplications)
    .post(protect, addApplication);

router.route('/:id')
    .delete(protect, deleteApplication);

module.exports = router;
