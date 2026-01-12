const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');

// @desc    Get user applications
// @route   GET /api/applications
// @access  Private
const getApplications = asyncHandler(async (req, res) => {
    const applications = await Application.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .lean();
    res.json(applications);
});

// @desc    Add new application
// @route   POST /api/applications
// @access  Private
const addApplication = asyncHandler(async (req, res) => {
    const { company, position, status, jobUrl } = req.body;

    const application = await Application.create({
        user: req.user._id,
        company,
        position,
        status,
        jobUrl,
        logo: company.charAt(0).toUpperCase() // Simple logo generation
    });

    if (application) {
        res.status(201).json(application);
    } else {
        res.status(400);
        throw new Error('Invalid application data');
    }
});

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private
const deleteApplication = asyncHandler(async (req, res) => {
    const application = await Application.findById(req.params.id);

    if (application) {
        // Check if user owns the application
        if (application.user.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('User not authorized');
        }

        await application.deleteOne();
        res.json({ message: 'Application removed' });
    } else {
        res.status(404);
        throw new Error('Application not found');
    }
});

module.exports = {
    getApplications,
    addApplication,
    deleteApplication
};
