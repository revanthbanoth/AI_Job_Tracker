const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const Application = require('../models/Application');

// @desc    Get user's share link settings
// @route   GET /api/share/settings
// @access  Private
const getShareSettings = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('shareToken shareTokenEnabled name');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json({
        shareToken: user.shareToken || null,
        shareTokenEnabled: !!user.shareTokenEnabled,
        shareUrl: user.shareToken && user.shareTokenEnabled ? `/share/${user.shareToken}` : null
    });
});

// @desc    Generate or regenerate a read-only share token
// @route   POST /api/share/generate
// @access  Private
const generateShareToken = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const token = crypto.randomBytes(16).toString('hex');
    user.shareToken = token;
    user.shareTokenEnabled = true;
    await user.save();

    res.json({
        message: 'Share link generated successfully',
        shareToken: token,
        shareTokenEnabled: true,
        shareUrl: `/share/${token}`
    });
});

// @desc    Revoke or disable share link
// @route   POST /api/share/revoke
// @access  Private
const revokeShareToken = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.shareTokenEnabled = false;
    await user.save();

    res.json({
        message: 'Share link disabled',
        shareToken: user.shareToken,
        shareTokenEnabled: false,
        shareUrl: null
    });
});

// @desc    Get public read-only candidate progress for mentor / coach
// @route   GET /api/share/view/:token
// @access  Public
const getPublicProgress = asyncHandler(async (req, res) => {
    const { token } = req.params;

    if (!token || token.length < 10) {
        return res.status(400).json({ message: 'Invalid share token provided.' });
    }

    const user = await User.findOne({ shareToken: token, shareTokenEnabled: true }).select('name createdAt');

    if (!user) {
        return res.status(404).json({
            message: 'This shareable progress link has expired or was revoked by the candidate.'
        });
    }

    // Fetch user applications (excluding personal contact details)
    const applications = await Application.find({ user: user._id })
        .select('company position status location salary source createdAt updatedAt statusTimeline interviewDate deadlineDate')
        .sort({ createdAt: -1 })
        .lean();

    const total = applications.length;
    const interviews = applications.filter(a => a.status === 'Interviewing' || a.status === 'Interview').length;
    const offers = applications.filter(a => a.status === 'Offer').length;
    const applied = applications.filter(a => a.status === 'Applied').length;
    const screening = applications.filter(a => a.status === 'Screening').length;
    const wishlist = applications.filter(a => a.status === 'Wishlist').length;
    const closed = applications.filter(a => a.status === 'Rejected').length;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = applications.filter(a => new Date(a.createdAt) > oneWeekAgo).length;

    // First name only for privacy
    const firstName = user.name ? user.name.split(' ')[0] : 'Candidate';

    res.json({
        candidateFirstName: firstName,
        memberSince: user.createdAt,
        stats: {
            total,
            interviews,
            offers,
            applied,
            screening,
            wishlist,
            closed,
            thisWeek,
            responseRate: total > 0 ? Math.round(((interviews + offers) / total) * 100) : 0,
            interviewRate: total > 0 ? Math.round((interviews / total) * 100) : 0
        },
        pipeline: applications.map(app => ({
            id: app._id,
            company: app.company,
            position: app.position,
            status: app.status,
            location: app.location || 'Remote / Unspecified',
            source: app.source || 'Direct',
            createdAt: app.createdAt,
            updatedAt: app.updatedAt,
            interviewDate: app.interviewDate,
            deadlineDate: app.deadlineDate
        }))
    });
});

module.exports = {
    getShareSettings,
    generateShareToken,
    revokeShareToken,
    getPublicProgress
};
