const asyncHandler = require('express-async-handler');
const Resume = require('../models/Resume');
const cloudinary = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');
const { parseDocument } = require('../services/documentParser');
const { analyzeResumeDeterministic } = require('../services/atsEngine');

// @desc    Get user resumes
// @route   GET /api/resumes
// @access  Private
const getResumes = asyncHandler(async (req, res) => {
    const resumes = await Resume.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .lean();
    res.json(resumes);
});

// @desc    Upload resume with deterministic ATS analysis
// @route   POST /api/resumes
// @access  Private
const uploadResume = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    let resumeUrl;
    const cleanFileName = req.file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');

    // Parse the document content and inspect for structural layout anomalies
    const parsedDoc = await parseDocument(req.file.buffer, req.file.mimetype, req.file.originalname);

    // Run pure deterministic ATS Resume Health engine
    const atsResult = analyzeResumeDeterministic(
        parsedDoc.text,
        '', // Initial upload has no target JD
        parsedDoc.formatAnomalies,
        parsedDoc.wordCount,
        parsedDoc.pageCount
    );

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

            const result = await uploadFromBuffer(req.file.buffer);

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

    console.log(`Deterministic ATS Health Score for ${req.file.originalname}: ${atsResult.healthScore}/100`);

    const resume = await Resume.create({
        user: req.user._id,
        name: name || req.file.originalname,
        fileName: req.file.originalname,
        size: `${sizeInMB} MB`,
        fileHash: atsResult.fileHash,
        extractedText: parsedDoc.text,
        atsScore: atsResult.overallScore,
        healthScore: atsResult.healthScore,
        matchScore: null,
        healthBreakdown: atsResult.healthBreakdown,
        matchBreakdown: {},
        deductions: atsResult.deductions,
        recognizedSkills: atsResult.recognizedSkills,
        matchedKeywords: [],
        missingKeywords: [],
        bulletFixes: atsResult.bulletFixes,
        formatAnomalies: parsedDoc.formatAnomalies,
        scoreHistory: [{
            date: new Date(),
            score: atsResult.healthScore,
            healthScore: atsResult.healthScore,
            matchScore: null,
            scoreType: 'Health',
            targetRole: 'Initial ATS Health Screen'
        }],
        status: 'Analyzed',
        resumeUrl: resumeUrl
    });

    if (resume) {
        res.status(201).json(resume);
    } else {
        res.status(400);
        throw new Error('Invalid resume data');
    }
});

// @desc    Calculate deterministic ATS score against target job description
// @route   POST /api/resumes/:id/score
// @access  Private
const scoreResumeAgainstJob = asyncHandler(async (req, res) => {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
        res.status(404);
        throw new Error('Resume not found');
    }

    if (resume.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const { jobDescription = '', targetRole = '' } = req.body;

    const resumeText = resume.extractedText || resume.name || '';
    const formatAnomalies = resume.formatAnomalies || [];
    const wordCount = resumeText.split(/\s+/).filter(Boolean).length;
    const pageCount = Math.max(1, Math.ceil(wordCount / 450));

    const atsResult = analyzeResumeDeterministic(
        resumeText,
        jobDescription,
        formatAnomalies,
        wordCount,
        pageCount
    );

    resume.targetRole = targetRole || resume.targetRole || '';
    resume.targetJobDescription = jobDescription;
    resume.healthScore = atsResult.healthScore;
    resume.matchScore = atsResult.matchScore;
    resume.atsScore = atsResult.overallScore;
    resume.healthBreakdown = atsResult.healthBreakdown;
    resume.matchBreakdown = atsResult.matchBreakdown || {};
    resume.deductions = atsResult.deductions;
    resume.matchedKeywords = atsResult.matchedKeywords;
    resume.missingKeywords = atsResult.missingKeywords;
    resume.recognizedSkills = atsResult.recognizedSkills;

    if (atsResult.bulletFixes && atsResult.bulletFixes.length > 0) {
        resume.bulletFixes = atsResult.bulletFixes;
    }

    // Append to score history
    resume.scoreHistory.push({
        date: new Date(),
        score: atsResult.overallScore,
        healthScore: atsResult.healthScore,
        matchScore: atsResult.matchScore,
        scoreType: atsResult.matchScore !== null ? 'Combined' : 'Health',
        targetRole: targetRole || 'Target Role Match'
    });

    await resume.save();

    res.json(resume);
});

// @desc    Update bullet fix suggestion status (accept / reject)
// @route   PUT /api/resumes/:id/bullets/:index
// @access  Private
const updateBulletFixStatus = asyncHandler(async (req, res) => {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
        res.status(404);
        throw new Error('Resume not found');
    }

    if (resume.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const index = parseInt(req.params.index, 10);
    const { status } = req.body; // 'accepted' | 'rejected'

    if (resume.bulletFixes && resume.bulletFixes[index]) {
        resume.bulletFixes[index].status = status;
        await resume.save();
        res.json({ message: `Suggestion ${status}`, bulletFixes: resume.bulletFixes });
    } else {
        res.status(400);
        throw new Error('Bullet fix suggestion index not found');
    }
});

// @desc    Get score history for resume
// @route   GET /api/resumes/:id/history
// @access  Private
const getScoreHistory = asyncHandler(async (req, res) => {
    const resume = await Resume.findById(req.params.id).select('scoreHistory name');

    if (!resume) {
        res.status(404);
        throw new Error('Resume not found');
    }

    if (resume.user && resume.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized');
    }

    res.json(resume.scoreHistory || []);
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

// @desc    Download resume
// @route   GET /api/resumes/:id/download
// @access  Private
const downloadResume = asyncHandler(async (req, res) => {
    const resume = await Resume.findById(req.params.id);

    if (resume && resume.resumeUrl) {
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
    scoreResumeAgainstJob,
    updateBulletFixStatus,
    getScoreHistory,
    deleteResume,
    downloadResume
};
