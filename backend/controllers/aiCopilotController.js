const asyncHandler = require('express-async-handler');
const {
    generateCoverLetter,
    tailorResumeBullets,
    draftFollowUpEmail,
    generateInterviewQuestions,
    evaluateInterviewAnswer
} = require('../services/aiCopilotService');

// @desc    Generate tailored cover letter
// @route   POST /api/ai/cover-letter
// @access  Private
const createCoverLetter = asyncHandler(async (req, res) => {
    const {
        candidateName = req.user?.name || 'Applicant',
        company,
        position,
        jobDescription,
        resumeText,
        tone
    } = req.body;

    if (!company || !position) {
        res.status(400);
        throw new Error('Please provide target company and position');
    }

    const result = await generateCoverLetter({
        candidateName,
        company,
        position,
        jobDescription,
        resumeText,
        tone
    });

    res.json(result);
});

// @desc    Tailor resume bullets for target role
// @route   POST /api/ai/tailor-bullets
// @access  Private
const tailorBullets = asyncHandler(async (req, res) => {
    const {
        resumeBullets,
        position,
        company,
        jobDescription
    } = req.body;

    const result = await tailorResumeBullets({
        resumeBullets,
        position,
        company,
        jobDescription
    });

    res.json(result);
});

// @desc    Draft follow-up or thank you email
// @route   POST /api/ai/draft-email
// @access  Private
const createEmailDraft = asyncHandler(async (req, res) => {
    const {
        type = 'thank_you',
        candidateName = req.user?.name || 'Candidate',
        interviewerName,
        company,
        position,
        keyTopicsDiscussed,
        notes
    } = req.body;

    const result = await draftFollowUpEmail({
        type,
        candidateName,
        interviewerName,
        company,
        position,
        keyTopicsDiscussed,
        notes
    });

    res.json(result);
});

// @desc    Generate interview questions from job description
// @route   POST /api/ai/interview-questions
// @access  Private
const getInterviewQuestions = asyncHandler(async (req, res) => {
    const {
        position,
        company,
        jobDescription
    } = req.body;

    const result = await generateInterviewQuestions({
        position,
        company,
        jobDescription
    });

    res.json(result);
});

// @desc    Evaluate candidate answer to interview question
// @route   POST /api/ai/evaluate-answer
// @access  Private
const evaluateAnswer = asyncHandler(async (req, res) => {
    const {
        question,
        answer,
        position
    } = req.body;

    if (!question || !answer) {
        res.status(400);
        throw new Error('Please provide both the question and your answer');
    }

    const result = await evaluateInterviewAnswer({
        question,
        answer,
        position
    });

    res.json(result);
});

module.exports = {
    createCoverLetter,
    tailorBullets,
    createEmailDraft,
    getInterviewQuestions,
    evaluateAnswer
};
