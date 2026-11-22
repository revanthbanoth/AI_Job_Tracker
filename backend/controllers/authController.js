const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const cleanEmail = email ? email.trim() : '';
    const user = await User.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });

    if (user && (await user.matchPassword(password))) {
        const token = generateToken(res, user._id);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
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
    console.log('Register Request:', { name, email, password }); // Debug log

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
            email,
            password: hashedPassword
        });

        if (user) {
            const token = generateToken(res, user._id);
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
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
        user.email = req.body.email || user.email;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();
        console.log('Profile updated for user:', updatedUser._id);

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
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
    // If we reach here, the 'protect' middleware has already verified the token
    // and attached the user to req.user
    const user = await User.findById(req.user._id).select('-password').lean();

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            // We can optionally refresh the token here if needed, but for now just verification
        });
    } else {
        res.status(401);
        throw new Error('User not found');
    }
});

// @desc    Direct Password Reset (No email required)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Please provide your registered email address');
    }

    // Case-insensitive user lookup
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } });

    if (!user) {
        res.status(404);
        throw new Error('No account found with this email address');
    }

    // If password is provided, reset it directly
    if (password) {
        if (password.length < 6) {
            res.status(400);
            throw new Error('Password must be at least 6 characters long');
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;

        await user.save();

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

    // If only email is provided, generate token and dispatch real reset email
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save();

    const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const html = `
    <div style="font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF8F5; padding: 40px 20px; color: #2D2522;">
        <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #EFEAE4; padding: 36px 32px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #D4663A; font-size: 24px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: -0.5px;">AI Job Tracker</h1>
                <p style="color: #8C827A; font-size: 13px; margin: 0;">Password Reset Request</p>
            </div>
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">Hello <strong>${user.name || 'there'}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #5C524B; margin-bottom: 24px;">
                We received a request to reset your password for your AI Job Tracker account. Click the button below to set a new password:
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" target="_blank" style="background-color: #D4663A; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 3px 12px rgba(212, 102, 58, 0.3);">
                    Reset Password
                </a>
            </div>
            <p style="font-size: 12px; color: #8C827A; line-height: 1.5; margin-bottom: 12px;">
                If the button above doesn't work, copy and paste this link into your browser:
            </p>
            <p style="font-size: 11px; word-break: break-all; color: #D4663A; background: #FAF8F5; padding: 10px; border-radius: 6px; border: 1px solid #EFEAE4;">
                <a href="${resetUrl}" style="color: #D4663A; text-decoration: none;">${resetUrl}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #EFEAE4; margin: 28px 0;" />
            <p style="font-size: 12px; color: #8C827A; line-height: 1.5; margin: 0;">
                This link will expire in <strong>30 minutes</strong>.<br />
                If you didn't request a password reset, you can safely ignore this email — your account remains secure.
            </p>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #A69E97;">
            © ${new Date().getFullYear()} AI Job Tracker. All rights reserved.
        </div>
    </div>
    `;

    const text = `Hello ${user.name || 'there'},\n\nWe received a request to reset your password for AI Job Tracker.\n\nUse the link below to reset your password (valid for 30 minutes):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;

    try {
        await sendEmail({
            to: user.email,
            subject: 'AI Job Tracker - Password Reset Request',
            html,
            text,
        });
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

    // Hash the token provided in the URL to compare against the hashed token in database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired password reset link. Please request a new one.');
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    // Generate fresh auth token
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

module.exports = {
    authUser,
    registerUser,
    logoutUser,
    updateUserProfile,
    verifyUser,
    forgotPassword,
    resetPassword,
};
