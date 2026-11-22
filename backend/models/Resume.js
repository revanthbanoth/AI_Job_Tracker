const mongoose = require('mongoose');

const deductionSchema = mongoose.Schema({
    category: { type: String, required: true },
    pointsDeducted: { type: Number, required: true },
    reason: { type: String, required: true },
    fix: { type: String, required: true }
}, { _id: false });

const bulletFixSchema = mongoose.Schema({
    original: { type: String, required: true },
    suggestion: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { _id: false });

const scoreHistorySchema = mongoose.Schema({
    date: { type: Date, default: Date.now },
    score: { type: Number, required: true },
    healthScore: { type: Number },
    matchScore: { type: Number },
    scoreType: { type: String, default: 'Health' }, // 'Health' | 'JobMatch' | 'Combined'
    targetRole: { type: String, default: 'General ATS Screen' }
}, { _id: false });

const resumeSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    fileName: {
        type: String, // e.g., "my_resume.pdf"
    },
    size: {
        type: String, // e.g., "1.2 MB"
    },
    fileHash: {
        type: String // SHA-256 hash of extracted text/buffer for caching
    },
    extractedText: {
        type: String
    },
    atsScore: {
        type: Number,
        default: 75
    },
    healthScore: {
        type: Number,
        default: 75
    },
    matchScore: {
        type: Number,
        default: null
    },
    healthBreakdown: {
        type: Object,
        default: {}
    },
    matchBreakdown: {
        type: Object,
        default: {}
    },
    deductions: [deductionSchema],
    recognizedSkills: [{
        type: String
    }],
    matchedKeywords: [{
        canonical: String,
        category: String,
        inBullets: Boolean
    }],
    missingKeywords: [{
        canonical: String,
        category: String,
        importance: String
    }],
    bulletFixes: [bulletFixSchema],
    formatAnomalies: [{
        type: Object
    }],
    scoreHistory: [scoreHistorySchema],
    targetRole: {
        type: String,
        default: ''
    },
    targetJobDescription: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        default: 'Analyzed'
    },
    resumeUrl: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
