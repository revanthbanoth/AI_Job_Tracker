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
    let resumeUrl;
    const cleanFileName = req.file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');

    const isCloudinaryConfigured = Boolean(
        process.env.CLOUDINARY_URL ||
        (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    );

    if (isCloudinaryConfigured) {
        try {
            const resourceType = 'raw';
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
                            type: 'authenticated',
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
                    const Readable = require('stream').Readable;
                    const bufferStream = new Readable();
                    bufferStream.push(buffer);
                    bufferStream.push(null);
                    bufferStream.pipe(stream);
                });
            };

            result = await uploadFromBuffer(req.file.buffer);

            resumeUrl = cloudinary.url(result.public_id, {
                resource_type: 'raw',
                type: 'authenticated',
                secure: true,
                sign_url: true,
                version: result.version
            });
        } catch (error) {
            console.error('Upload Failed:', error);
            res.status(500);

            if (error.message && error.message.includes('Must supply api_key')) {
                throw new Error('Server Config Error: Cloudinary API Key missing. Please check Render environment variables.');
            }

            throw new Error('Image upload failed: ' + error.message);
        }
    } else {
        // Fallback: Save file to local uploads directory
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const uniqueFilename = `${Date.now()}-${cleanFileName}`;
        const localFilePath = path.join(uploadDir, uniqueFilename);
        fs.writeFileSync(localFilePath, req.file.buffer);

        const protocol = req.protocol;
        const host = req.get('host');
        resumeUrl = `${protocol}://${host}/uploads/${uniqueFilename}`;
        console.log('Saved resume locally to:', localFilePath);
    }

    const { name } = req.body;
    const sizeInMB = (req.file.size / 1024 / 1024).toFixed(2);
    const atsScore = Math.floor(Math.random() * (95 - 75) + 75);

    console.log('Processing resume upload for:', req.file.originalname);
    const resume = await Resume.create({
        user: req.user._id,
        name: name || req.file.originalname,
        fileName: req.file.filename || req.file.originalname,
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

        // Clean up local file if stored locally
        if (resume.resumeUrl && resume.resumeUrl.includes('/uploads/')) {
            const filename = resume.resumeUrl.split('/uploads/').pop();
            const localFilePath = path.join(__dirname, '../uploads', filename);
            if (fs.existsSync(localFilePath)) {
                try { fs.unlinkSync(localFilePath); } catch (e) { console.error('Failed to delete local file:', e); }
            }
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
