const asyncHandler = require('express-async-handler');
const axios = require('axios');

const analyzeResume = asyncHandler(async (req, res) => {
    const { resume_text, job_description } = req.body;

    // Use environment variable for AI service URL
    // Default to localhost for development, but REQUIRE it for production
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    if (!resume_text || !job_description) {
        res.status(400);
        throw new Error('Please provide resume text and job description');
    }

    try {
        console.log(`Forwarding analysis request to: ${aiServiceUrl}/analyze-resume`);

        const response = await axios.post(`${aiServiceUrl}/analyze-resume`, {
            resume_text,
            job_description
        });

        res.json(response.data);
    } catch (error) {
        console.error("AI Service Error:", error.message);
        if (error.response) {
            console.error("AI Service Response:", error.response.data);
        }
        res.status(503);
        throw new Error('AI Service unavailable or failed to process request');
    }
});

module.exports = { analyzeResume };
