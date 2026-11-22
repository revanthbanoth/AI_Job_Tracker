const mongoose = require('mongoose');

const applicationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    company: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: 'Applied'
    },
    jobUrl: {
        type: String
    },
    logo: {
        type: String // Initials or URL
    },
    location: {
        type: String
    },
    salary: {
        type: String
    },
    source: {
        type: String
    },
    skills: [{
        type: String
    }],
    contacts: [{
        name: String,
        role: String,
        email: String,
        phone: String
    }],
    statusTimeline: [{
        status: { type: String, required: true },
        date: { type: Date, default: Date.now },
        notes: String
    }],
    resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume'
    }
}, {
    timestamps: true
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
