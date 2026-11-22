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

    const user = await User.findOne({ email });

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

    const userExists = await User.findOne({ email });

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

    // If only email is provided, return account confirmation
    res.status(200).json({
        success: true,
        message: 'Account verified successfully',
        name: user.name,
        email: user.email,
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
