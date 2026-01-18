const asyncHandler = require('express-async-handler');
const Resume = require('../models/Resume');
const cloudinary = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');

// @desc    Get user resumes
// @route   GET /api/resumes
// @access  Private
const getResumes = asyncHandler(async (req, res) => {
    const resumes = await Resume.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .lean();
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

    let result;
    try {
        // Sanitize filename to prevent URL issues (401 errors on raw files with special chars)
        const cleanFileName = req.file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
        // For 'auto' resource_type (usually images/PDFs), Cloudinary adds the extension automatically.
        // We strip .pdf from the end of public_id to avoid double extension (file.pdf.pdf)
        // Determine resource type and public ID based on file type
        // Use 'raw' for proper file handling (avoids image-specific transformation errors)
        const resourceType = 'raw';
        const isPdf = req.file.mimetype === 'application/pdf';

        // Ensure extension is in public_id for raw files
        let finalPublicId = cleanFileName;
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (!finalPublicId.toLowerCase().endsWith(ext)) {
            finalPublicId += ext;
        }

        const uploadFromBuffer = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'resumes',
                        resource_type: resourceType,
                        type: 'private',
                        resource_type: 'raw',
                        // access_mode: 'public', // REMOVED: Must be private
                        public_id: finalPublicId,
                        use_filename: true,
                        unique_filename: true
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary Upload Error:', error);
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );
                // Write buffer to stream
                const Readable = require('stream').Readable;
                const bufferStream = new Readable();
                bufferStream.push(buffer);
                bufferStream.push(null);
                bufferStream.pipe(stream);
            });
        };

        result = await uploadFromBuffer(req.file.buffer);

    } catch (error) {
        console.error('Upload Failed:', error);
        res.status(500);

        // Handle specific Cloudinary config error
        if (error.message && error.message.includes('Must supply api_key')) {
            throw new Error('Server Config Error: Cloudinary API Key missing. Please check Render environment variables.');
        }

        throw new Error('Image upload failed: ' + error.message);
    }

    const { name } = req.body;
    // Calculate realistic size string
    const sizeInMB = (req.file.size / 1024 / 1024).toFixed(2);

    // Initial ATS score is 0 until analyzed against a job description
    const atsScore = 0;

    // Generate accurate Resume URL
    // For PDFs (image type), we use fl_attachment to force download.
    // For Raw files, we use secure_url directly if public, but for private we need signature.

    resumeUrl = cloudinary.url(result.public_id, {
        resource_type: 'raw',
        type: 'private', // Match private upload
        secure: true,
        sign_url: true
    });

    console.log('Processing resume upload for:', req.file.originalname);
    const resume = await Resume.create({
        user: req.user._id,
        name: name || req.file.originalname,
        fileName: req.file.filename || req.file.originalname,
        size: `${sizeInMB} MB`,
        atsScore: atsScore,
        status: 'Uploaded', // Changed from Analyzed to Uploaded
        resumeUrl: resumeUrl

    }); // Closing Resume.create

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

// @desc    Download resume (Redirect to Cloudinary)
// @route   GET /api/resumes/:id/download
// @access  Private
const downloadResume = asyncHandler(async (req, res) => {
    const resume = await Resume.findById(req.params.id);

    if (resume && resume.resumeUrl) {
        // Check authorization if strictly private
        if (resume.user.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized');
        }
        res.redirect(resume.resumeUrl);
    } else {
        res.status(404);
        throw new Error('Resume not found');
    }
});

module.exports = {
    getResumes,
    uploadResume,
    deleteResume,
    downloadResume
};
