const asyncHandler = require('express-async-handler');
const axios = require('axios');

// Fallback logic if AI service fails or is not configured
const fallbackAnalysis = (resumeText, jobDescription) => {
    const skills = [
        'javascript', 'python', 'java', 'c++', 'react', 'node.js', 'sql', 'aws', 'docker',
        'kubernetes', 'typescript', 'html', 'css', 'git', 'linux', 'agile', 'scrum',
        'machine learning', 'data analysis', 'communication', 'leadership'
    ];

    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDescription.toLowerCase();

    const matchedSkills = skills.filter(skill => resumeLower.includes(skill) && jobLower.includes(skill));
    const allJobSkills = skills.filter(skill => jobLower.includes(skill));
    const missingSkills = allJobSkills.filter(skill => !resumeLower.includes(skill));

    // Calculate simple score
    let matchScore = 0;
    if (allJobSkills.length > 0) {
        matchScore = Math.round((matchedSkills.length / allJobSkills.length) * 100);
    } else {
        // If no skills found in JD, fall back to simple text overlap
        // Very basic Jaccard index on words
        const resumeWords = new Set(resumeLower.split(/\W+/));
        const jobWords = new Set(jobLower.split(/\W+/));
        const intersection = new Set([...resumeWords].filter(x => jobWords.has(x)));
        matchScore = Math.round((intersection.size / jobWords.size) * 100);
    }

    // Standardize suggestions
    const suggestions = missingSkills.length > 0
        ? [`Consider adding experience with ${missingSkills.slice(0, 3).join(', ')}.`]
        : ['Your skills align well with the job description. Focus on soft skills in your interview.'];

    return {
        match_score: matchScore || 10, // Minimum 10 if analysis runs
        matched_skills: matchedSkills,
        missing_skills: missingSkills,
        suggestions: suggestions
    };
};

const analyzeResume = asyncHandler(async (req, res) => {
    const { resume_text, job_description } = req.body;

    if (!resume_text || !job_description) {
        res.status(400);
        throw new Error('Please provide resume text and job description');
    }

    // Attempt AI Service Call if URL is configured
    const aiServiceUrl = process.env.AI_SERVICE_URL;

    if (aiServiceUrl && aiServiceUrl !== 'http://localhost:8000') {
        try {
            console.log(`Forwarding analysis request to: ${aiServiceUrl}/analyze-resume`);
            const response = await axios.post(`${aiServiceUrl}/analyze-resume`, {
                resume_text,
                job_description
            });
            return res.json(response.data);
        } catch (error) {
            console.warn("AI Service unavailable, falling back to internal logic:", error.message);
            // Fallthrough to fallback logic instead of erroring out
        }
    }

    // INTERNAL FALLBACK LOGIC (Robustness Rule)
    console.log("Using internal fallback analysis logic.");
    const result = fallbackAnalysis(resume_text, job_description);
    res.json(result);
});

module.exports = { analyzeResume };
