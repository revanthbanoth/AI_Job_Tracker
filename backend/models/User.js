const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    shareToken: {
        type: String,
        default: null
    },
    shareTokenEnabled: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpire: {
        type: Date,
        default: null
    },
    unsubscribeToken: {
        type: String,
        default: () => require('crypto').randomBytes(16).toString('hex'),
        unique: true,
        sparse: true
    },
    emailPreferences: {
        reminders: { type: Boolean, default: true },
        weeklySummary: { type: Boolean, default: true },
        inactivityNudge: { type: Boolean, default: true },
        statusUpdates: { type: Boolean, default: true }
    },
    lastActiveAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});


userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
