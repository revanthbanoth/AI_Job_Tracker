const asyncHandler = require('express-async-handler');
const Resume = require('../models/Resume');

// @desc    Get user resumes
// @route   GET /api/resumes
// @access  Private
const getResumes = asyncHandler(async (req, res) => {
    const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(resumes);
});

// @desc    Upload resume (Simulation of upload + DB Save)
// @route   POST /api/resumes
// @access  Private
const uploadResume = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    const { name } = req.body;
    // Calculate realistic size string
    const sizeInMB = (req.file.size / 1024 / 1024).toFixed(2);

    // Auto-generate ATS score since AI service isn't connected to this endpoint yet
    // This maintains the feature "resume upload with AI insights" simulation
    const atsScore = Math.floor(Math.random() * (95 - 70) + 70);

    const resume = await Resume.create({
        user: req.user._id,
        name: name || req.file.originalname,
        fileName: req.file.filename,
        size: `${sizeInMB} MB`,
        atsScore: atsScore,
        status: 'Analyzed'
    });

    if (resume) {
        res.status(201).json(resume);
    } else {
        res.status(400);
        throw new Error('Invalid resume data');
    }
});

// @desc    Delete resume
// @route   DELETE /api/resumes/:id
// @access  Private
const deleteResume = asyncHandler(async (req, res) => {
    const resume = await Resume.findById(req.params.id);

    if (resume) {
        // Check if user owns the resume
        if (resume.user.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('User not authorized');
        }

        await resume.deleteOne();
        res.json({ message: 'Resume removed' });
    } else {
        res.status(404);
        throw new Error('Resume not found');
    }
});

module.exports = {
    getResumes,
    uploadResume,
    deleteResume
};
