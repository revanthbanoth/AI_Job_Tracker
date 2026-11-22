const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const cleanEmail = email ? email.trim() : '';
    const user = await User.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });

    if (user && (await user.matchPassword(password))) {
        // Record last active time for inactivity nudge calculations
        user.lastActiveAt = new Date();
        await user.save();

        const token = generateToken(res, user._id);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            emailPreferences: user.emailPreferences,
            token
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const userExists = await User.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        const user = await User.create({
            name,
            email: cleanEmail,
            password: hashedPassword,
            unsubscribeToken: crypto.randomBytes(16).toString('hex'),
            lastActiveAt: new Date()
        });

        if (user) {
            // Dispatch 1. WELCOME (on signup) asynchronously
            emailService.sendWelcomeEmail(user).catch(err => {
                console.error('[EmailService] Failed to send Welcome email:', err.message);
            });

            const token = generateToken(res, user._id);
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                emailPreferences: user.emailPreferences,
                token
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email ? req.body.email.trim().toLowerCase() : user.email;
        let passwordChanged = false;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
            passwordChanged = true;
        }

        user.lastActiveAt = new Date();
        const updatedUser = await user.save();

        if (passwordChanged) {
            // Dispatch 3. PASSWORD CHANGED
            emailService.sendPasswordChangedEmail(updatedUser).catch(err => {
                console.error('[EmailService] Failed to send Password Changed email:', err.message);
            });
        }

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            emailPreferences: updatedUser.emailPreferences,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Verify user token using auth middleware
// @route   GET /api/auth/verify
// @access  Private
const verifyUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password').lean();

    if (user) {
        // Bump activity
        User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } }).exec();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            emailPreferences: user.emailPreferences,
            shareToken: user.shareToken,
            shareTokenEnabled: user.shareTokenEnabled,
        });
    } else {
        res.status(401);
        throw new Error('User not found');
    }
});

// @desc    Forgot Password - Request reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Please provide your registered email address');
    }

    const cleanEmail = email.trim();
    const user = await User.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });

    if (!user) {
        res.status(404);
        throw new Error('No account found with this email address');
    }

    // Direct password reset if password field is provided
    if (password) {
        if (password.length < 6) {
            res.status(400);
            throw new Error('Password must be at least 6 characters long');
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        user.lastActiveAt = new Date();
        await user.save();

        // Dispatch 3. PASSWORD CHANGED
        emailService.sendPasswordChangedEmail(user).catch(err => {
            console.error('[EmailService] Failed to send Password Changed email:', err.message);
        });

        const authToken = generateToken(res, user._id);
        return res.status(200).json({
            success: true,
            message: 'Password has been updated successfully!',
            _id: user._id,
            name: user.name,
            email: user.email,
            token: authToken,
        });
    }

    // Generate token and dispatch 2. PASSWORD RESET email
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    try {
        await emailService.sendPasswordResetEmail(user, resetToken);
    } catch (emailErr) {
        console.error('[forgotPassword] Error sending email:', emailErr);
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();
        res.status(500);
        throw new Error('Failed to send password reset email. Please try again later.');
    }

    res.status(200).json({
        success: true,
        message: 'Password reset instructions have been sent to your email address.',
    });
});

// @desc    Reset Password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
        res.status(400);
        throw new Error('Reset token is required');
    }

    if (!password || password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired password reset link. Please request a new one.');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    user.lastActiveAt = new Date();
    await user.save();

    // Dispatch 3. PASSWORD CHANGED
    emailService.sendPasswordChangedEmail(user).catch(err => {
        console.error('[EmailService] Failed to send Password Changed email:', err.message);
    });

    const authToken = generateToken(res, user._id);

    res.status(200).json({
        success: true,
        message: 'Password has been successfully updated!',
        _id: user._id,
        name: user.name,
        email: user.email,
        token: authToken,
    });
});

// @desc    Get or inspect email preferences
// @route   GET /api/auth/email-preferences
// @access  Public / Private (supports query token or auth header)
const getEmailPreferences = asyncHandler(async (req, res) => {
    const { token } = req.query;
    let user;

    if (token) {
        user = await User.findOne({ unsubscribeToken: token }).select('email name emailPreferences');
    } else if (req.user) {
        user = await User.findById(req.user._id).select('email name emailPreferences');
    }

    if (!user) {
        res.status(404);
        throw new Error('User or preference link not found');
    }

    res.json({
        success: true,
        email: user.email,
        name: user.name,
        emailPreferences: user.emailPreferences || {
            reminders: true,
            weeklySummary: true,
            inactivityNudge: true,
            statusUpdates: true,
        }
    });
});

// @desc    Update email preferences
// @route   POST /api/auth/email-preferences
// @access  Public / Private
const updateEmailPreferences = asyncHandler(async (req, res) => {
    const { token, preferences } = req.body;
    let user;

    if (token) {
        user = await User.findOne({ unsubscribeToken: token });
    } else if (req.user) {
        user = await User.findById(req.user._id);
    }

    if (!user) {
        res.status(404);
        throw new Error('User or token not found');
    }

    if (preferences && typeof preferences === 'object') {
        user.emailPreferences = {
            ...user.emailPreferences,
            ...preferences
        };
        await user.save();
    }

    res.json({
        success: true,
        message: 'Email preferences updated successfully',
        emailPreferences: user.emailPreferences
    });
});

// @desc    Single-click Unsubscribe from non-security emails
// @route   GET /api/auth/unsubscribe
// @access  Public
const unsubscribeUser = asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
        res.status(400);
        throw new Error('Unsubscribe token is required');
    }

    const user = await User.findOne({ unsubscribeToken: token });

    if (!user) {
        res.status(404);
        throw new Error('Invalid or expired unsubscribe link');
    }

    user.emailPreferences = {
        reminders: false,
        weeklySummary: false,
        inactivityNudge: false,
        statusUpdates: false,
    };
    await user.save();

    res.status(200).json({
        success: true,
        message: 'You have been successfully unsubscribed from all optional JobTracker emails.',
        email: user.email
    });
});

// @desc    Delete user account and all associated data
// @route   DELETE /api/auth/profile
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Dispatch 13. ACCOUNT DELETED before records are purged
    try {
        await emailService.sendAccountDeletedEmail(user);
    } catch (err) {
        console.error('[EmailService] Account deleted email notice error:', err.message);
    }

    // Delete user's applications, resumes, and user document
    await Application.deleteMany({ user: user._id });
    await Resume.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
        success: true,
        message: 'Your JobTracker account and all data have been completely deleted.'
    });
});

// @desc    Test real email delivery and diagnose SMTP configuration
// @route   GET /api/auth/test-email
// @access  Public
const testEmailDelivery = asyncHandler(async (req, res) => {
    const sendEmail = require('../utils/sendEmail');
    const to = req.query.to || process.env.EMAIL_USER;
    const hasUser = Boolean(process.env.EMAIL_USER);
    const hasPass = Boolean(process.env.EMAIL_PASS);

    if (!hasUser || !hasPass) {
        return res.status(400).json({
            success: false,
            error: 'Missing email credentials. Set EMAIL_USER and EMAIL_PASS in Render environment variables.',
            config: {
                hasEmailUser: hasUser,
                hasEmailPass: hasPass,
                service: process.env.EMAIL_SERVICE || 'gmail'
            }
        });
    }

    try {
        const result = await sendEmail({
            to,
            subject: 'AI Job Tracker - Live Email Verification',
            text: `Hello! This is a test email confirming that your JobTracker email service is properly configured and actively delivering real emails from Render.\n\nSent at: ${new Date().toISOString()}`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #FAF6F0; border-radius: 8px;">
                <h2 style="color: #1F1B16; font-family: Georgia, serif;">JobTracker Email Delivery Active</h2>
                <p style="color: #1F1B16; font-size: 14px;">This email confirms that your live Gmail SMTP credentials are functioning correctly on Render.</p>
                <p style="color: #8C827A; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
            </div>`
        });

        res.status(200).json({
            success: true,
            message: `Verification email sent successfully to ${to}`,
            details: result
        });
    } catch (err) {
        console.error('[testEmailDelivery] Error:', err);
        res.status(500).json({
            success: false,
            error: err.message,
            code: err.code || 'UNKNOWN_ERROR',
            tip: err.message.includes('Username and Password not accepted') 
                ? 'Check that your 16-character Gmail App Password in Render does not have extra spaces or typos.' 
                : 'Check network access and SMTP credentials in Render.'
        });
    }
});

module.exports = {
    authUser,
    registerUser,
    logoutUser,
    updateUserProfile,
    verifyUser,
    forgotPassword,
    resetPassword,
    getEmailPreferences,
    updateEmailPreferences,
    unsubscribeUser,
    deleteAccount,
    testEmailDelivery,
};
