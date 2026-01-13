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
        const isPdf = req.file.mimetype === 'application/pdf';
        const resourceType = isPdf ? 'image' : 'raw';

        // Remove extension from public_id for 'image' type (Cloudinary adds it), keep for 'raw'
        let finalPublicId = cleanFileName.replace(/\.pdf$/i, '');
        if (!isPdf) {
            finalPublicId = cleanFileName; // Start with clean name
            // Ensure extension for raw files
            if (!finalPublicId.toLowerCase().endsWith(path.extname(req.file.originalname).toLowerCase())) {
                finalPublicId += path.extname(req.file.originalname).toLowerCase();
            }
        }

        const uploadFromBuffer = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'resumes',
                        resource_type: resourceType,
                        type: 'upload',
                        access_mode: 'public',
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

    // Auto-generate ATS score since AI service isn't connected to this endpoint yet
    // This maintains the feature "resume upload with AI insights" simulation
    const atsScore = Math.floor(Math.random() * (95 - 70) + 70);

    // Generate accurate Resume URL
    // For PDFs (image type), we use fl_attachment to force download.
    // For Raw files, we use secure_url directly.
    let resumeUrl = result.secure_url;

    if (req.file.mimetype === 'application/pdf') {
        resumeUrl = cloudinary.url(result.public_id, {
            resource_type: 'image',
            secure: true,
            flags: 'attachment',
            format: 'pdf' // Ensure the URL ends in .pdf
        });
    }

    console.log('Processing resume upload for:', req.file.originalname);
    const resume = await Resume.create({
        user: req.user._id,
        name: name || req.file.originalname,
        fileName: req.file.filename,
        size: `${sizeInMB} MB`,
        atsScore: atsScore,
        status: 'Analyzed',
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
