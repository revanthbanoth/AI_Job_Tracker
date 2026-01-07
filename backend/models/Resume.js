const mongoose = require('mongoose');

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
    atsScore: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'Analyzed'
    }
}, {
    timestamps: true
});

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
