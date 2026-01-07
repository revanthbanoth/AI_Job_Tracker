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
        enum: ['Applied', 'Interviewing', 'Offer', 'Rejected']
    },
    jobUrl: {
        type: String
    },
    logo: {
        type: String // Initials or URL
    }
}, {
    timestamps: true
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
