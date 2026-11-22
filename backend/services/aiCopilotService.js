const axios = require('axios');
const { matchSkills, extractBullets } = require('./atsEngine');

/**
 * Helper to call OpenAI API if key is configured
 */
async function callOpenAI(messages, temperature = 0.4) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                messages,
                temperature
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );
        return response.data?.choices?.[0]?.message?.content || null;
    } catch (err) {
        console.warn('OpenAI API call failed, falling back to internal generator:', err.message);
        return null;
    }
}

/**
 * Generates a tailored, professional cover letter.
 */
async function generateCoverLetter({
    candidateName = 'Applicant',
    company = 'the Company',
    position = 'the Role',
    jobDescription = '',
    resumeText = '',
    tone = 'Confident & Direct' // 'Confident & Direct' | 'Conversational' | 'Executive' | 'Technical'
}) {
    // 1. Try Live LLM if API Key is configured
    const prompt = `Write a compelling, tailored cover letter for ${candidateName} applying for ${position} at ${company}.
Tone: ${tone}.
Target Job Description:
${jobDescription.slice(0, 1500)}

Candidate Experience/Resume:
${resumeText.slice(0, 2000)}

Requirements:
- 3 to 4 concise, impactful paragraphs.
- Highlight 2 specific technical accomplishments or skills relevant to the role.
- No boilerplate filler or fluff. Professional opening and strong call to action.`;

    const liveLlmResponse = await callOpenAI([
        { role: 'system', content: 'You are an elite career strategist and executive resume writer.' },
        { role: 'user', content: prompt }
    ]);

    if (liveLlmResponse) {
        return {
            coverLetter: liveLlmResponse.trim(),
            generatedWith: 'openai'
        };
    }

    // 2. Intelligent Context-Aware Engine Fallback
    const detectedSkills = matchSkills(jobDescription);
    const topSkills = detectedSkills.slice(0, 4).map(s => s.canonical);
    const skillsString = topSkills.length > 0 ? topSkills.join(', ') : 'modern web technologies and scalable system architecture';

    const bullets = extractBullets(resumeText);
    const topBullet = bullets[0] || 'engineered high-performance features that accelerated team delivery and improved reliability';
    const cleanTopBullet = topBullet.replace(/^[•\-*]\s*/, '').replace(/^[A-Z]/, c => c.toLowerCase());

    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    let openingParagraph = '';
    let bodyTonePhrase = '';
    let signoffPhrase = '';

    if (tone === 'Conversational') {
        openingParagraph = `I was thrilled to come across the ${position} role at ${company}. Having spent the last several years building dependable software and working with ${skillsString}, I have long admired ${company}'s focus on high-impact engineering. I would love to bring that same energy to your team.`;
        bodyTonePhrase = `Throughout my career, I've found that the best solutions come from combining deep technical rigor with close collaboration across product and design.`;
        signoffPhrase = `I would welcome the opportunity to chat more about how my background can help ${company} continue to scale. Thank you for your time and consideration!`;
    } else if (tone === 'Executive') {
        openingParagraph = `I am writing to express my strong interest in the ${position} opportunity at ${company}. With a track record of driving technical strategy, optimizing delivery workflows, and scaling systems around ${skillsString}, I am well-prepared to make an immediate impact on your organization.`;
        bodyTonePhrase = `My approach centers on translating complex business objectives into resilient, maintainable technical execution while empowering engineers to produce their best work.`;
        signoffPhrase = `I look forward to discussing how my strategic vision and operational discipline can support ${company}'s long-term objectives.`;
    } else {
        // Confident & Direct
        openingParagraph = `I am writing to apply for the ${position} position at ${company}. With demonstrated expertise in ${skillsString} and a commitment to engineering excellence, I am confident in my ability to deliver substantial value to your engineering organization from day one.`;
        bodyTonePhrase = `In my past roles, I have consistently focused on measurable outcomes and technical reliability.`;
        signoffPhrase = `I welcome the opportunity to discuss how my qualifications align with your current technical initiatives. Thank you for your review.`;
    }

    const coverLetterText = `${candidateName}
${currentDate}

Hiring Team
${company}

Dear ${company} Hiring Team,

${openingParagraph}

${bodyTonePhrase} In my most recent experience, I ${cleanTopBullet}. This taught me the importance of building scalable systems that solve real customer problems while keeping latency low and code maintainability high.

The requirements outlined for the ${position} role strongly match my core strengths—particularly your focus on ${skillsString}. I thrive in environments that challenge engineers to take ownership of end-to-end features, make informed architectural trade-offs, and elevate engineering standards.

${signoffPhrase}

Sincerely,

${candidateName}`;

    return {
        coverLetter: coverLetterText,
        generatedWith: 'internal_engine'
    };
}

/**
 * Tailors resume bullets specifically for a target job.
 */
async function tailorResumeBullets({
    resumeBullets = [],
    position = 'Software Engineer',
    company = 'the Company',
    jobDescription = ''
}) {
    if (!resumeBullets || resumeBullets.length === 0) {
        resumeBullets = [
            'Worked on web application frontend using modern JavaScript and React.',
            'Built REST APIs for database operations and user management.',
            'Assisted in deployment pipelines and participated in sprint planning.'
        ];
    }

    const prompt = `Rewrite the following ${resumeBullets.length} resume bullet points to specifically target the role of ${position} at ${company}.
Target Job Description:
${jobDescription.slice(0, 1000)}

Original Bullets:
${resumeBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Format your response as a JSON array of objects:
[
  { "original": "...", "tailored": "...", "rationale": "..." }
]`;

    const liveLlmResponse = await callOpenAI([
        { role: 'system', content: 'You are an ATS optimization specialist. Output only valid JSON.' },
        { role: 'user', content: prompt }
    ]);

    if (liveLlmResponse) {
        try {
            const parsed = JSON.parse(liveLlmResponse.replace(/```json/g, '').replace(/```/g, '').trim());
            if (Array.isArray(parsed) && parsed.length > 0) {
                return { tailoredBullets: parsed, generatedWith: 'openai' };
            }
        } catch (e) {
            // Fallthrough to rule engine
        }
    }

    // Context-Aware Rule Fallback
    const detectedSkills = matchSkills(jobDescription);
    const keySkill1 = detectedSkills[0]?.canonical || 'TypeScript';
    const keySkill2 = detectedSkills[1]?.canonical || 'React';
    const keySkill3 = detectedSkills[2]?.canonical || 'cloud services';

    const actionKeywords = [
        `Architected and shipped scalable features using ${keySkill1} and ${keySkill2}, improving page rendering speeds by 32% and reducing customer-reported defects.`,
        `Engineered robust RESTful microservices integrated with ${keySkill3}, achieving 99.9% uptime and handling 15,000+ daily transactions with sub-80ms latency.`,
        `Spearheaded automated CI/CD and testing initiatives, reducing deployment cycle times by 40% and mentoring 4 engineers on code hygiene and architecture patterns.`
    ];

    const tailoredBullets = resumeBullets.slice(0, 3).map((original, i) => ({
        original,
        tailored: actionKeywords[i % actionKeywords.length],
        rationale: `Replaced passive phrasing with strong action verb and quantified outcome aligned with ${position} at ${company}.`
    }));

    return {
        tailoredBullets,
        generatedWith: 'internal_engine'
    };
}

/**
 * Drafts follow-up and thank-you emails.
 */
async function draftFollowUpEmail({
    type = 'thank_you', // 'thank_you' | 'status_check' | 'offer_negotiation' | 'withdrawal'
    candidateName = 'Candidate',
    interviewerName = 'Interviewer',
    company = 'Company',
    position = 'Role',
    keyTopicsDiscussed = '',
    notes = ''
}) {
    const prompt = `Draft a professional email for a job candidate.
Email Type: ${type}
Candidate: ${candidateName}
Interviewer/Contact: ${interviewerName}
Company: ${company}
Position: ${position}
Key Topics Discussed: ${keyTopicsDiscussed}
Additional Notes: ${notes}

Return a JSON object with "subject" and "body" fields.`;

    const liveLlmResponse = await callOpenAI([
        { role: 'system', content: 'You are an executive career communication coach. Output valid JSON with "subject" and "body".' },
        { role: 'user', content: prompt }
    ]);

    if (liveLlmResponse) {
        try {
            const parsed = JSON.parse(liveLlmResponse.replace(/```json/g, '').replace(/```/g, '').trim());
            if (parsed.subject && parsed.body) {
                return { ...parsed, generatedWith: 'openai' };
            }
        } catch (e) {
            // Fallthrough
        }
    }

    // Context-Aware Template Engine Fallback
    let subject = '';
    let body = '';

    if (type === 'thank_you') {
        subject = `Thank you for the conversation – ${position} interview | ${candidateName}`;
        body = `Hi ${interviewerName},

Thank you very much for taking the time to speak with me today about the ${position} role at ${company}.

I truly enjoyed our discussion${keyTopicsDiscussed ? `, particularly regarding ${keyTopicsDiscussed}` : ''}. The engineering challenges your team is addressing further confirmed my excitement about the opportunity to contribute to ${company}'s goals.

Our conversation reinforced my confidence that my background in building reliable, scalable systems will allow me to make an immediate positive impact on the team.

Please let me know if there are any additional details or references I can provide. I look forward to the next steps!

Warm regards,

${candidateName}`;
    } else if (type === 'status_check') {
        subject = `Follow-up regarding ${position} application – ${candidateName}`;
        body = `Hi ${interviewerName || `${company} Recruiting Team`},

I hope you're having a productive week!

I am checking in to follow up on my application for the ${position} role. I remain very enthusiastic about the work ${company} is doing and would love to know if there are any updates regarding the hiring timeline.

Please let me know if you need any further information or work samples from my side.

Thank you again for your time and guidance.

Best regards,

${candidateName}`;
    } else if (type === 'offer_negotiation') {
        subject = `Offer Follow-Up & Discussion – ${candidateName} | ${position}`;
        body = `Hi ${interviewerName || `${company} Team`},

Thank you so much for extending the offer to join ${company} as a ${position}! I am genuinely thrilled about the team and the opportunity ahead.

Before formalizing my acceptance, I wanted to discuss the compensation package. Based on my industry experience and the scope of the responsibilities we outlined, I would like to explore if there is flexibility around the base salary${notes ? ` (specifically regarding ${notes})` : ''} or equity structure.

I am deeply committed to joining ${company} and making a long-term impact. If you have time for a brief call to align on this, please let me know when you might be available.

Thank you again for your support throughout this process!

Sincerely,

${candidateName}`;
    } else {
        // Withdrawal / Decline
        subject = `Application Update – ${candidateName} | ${position}`;
        body = `Hi ${interviewerName || `${company} Team`},

I want to express my sincere gratitude for the opportunity to interview for the ${position} position at ${company}. I thoroughly enjoyed meeting the team and learning about your mission.

After careful consideration, I am writing to inform you that I have accepted another opportunity that aligns closely with my current career path. As such, I would like to withdraw my candidacy for this position.

I have immense respect for ${company} and hope our paths cross again in the future. Wishing you and the team continued success!

Best regards,

${candidateName}`;
    }

    return {
        subject,
        body,
        generatedWith: 'internal_engine'
    };
}

/**
 * Generates tailored interview questions and evaluates practice answers.
 */
async function generateInterviewQuestions({
    position = 'Software Engineer',
    company = 'Company',
    jobDescription = ''
}) {
    const prompt = `Generate 5 targeted, high-probability interview questions for a candidate interviewing for ${position} at ${company}.
Job Description Context:
${jobDescription.slice(0, 1200)}

Return a JSON array of objects:
[
  {
    "id": 1,
    "category": "Technical Architecture" | "Behavioral (STAR)" | "Problem Solving" | "Role Specific",
    "question": "...",
    "interviewerGoal": "What the interviewer is evaluating",
    "keyTalkingPoints": ["Point 1", "Point 2", "Point 3"]
  }
]`;

    const liveLlmResponse = await callOpenAI([
        { role: 'system', content: 'You are a principal technical interviewer at Google and Meta. Output valid JSON only.' },
        { role: 'user', content: prompt }
    ]);

    if (liveLlmResponse) {
        try {
            const parsed = JSON.parse(liveLlmResponse.replace(/```json/g, '').replace(/```/g, '').trim());
            if (Array.isArray(parsed) && parsed.length > 0) {
                return { questions: parsed, generatedWith: 'openai' };
            }
        } catch (e) {
            // Fallthrough
        }
    }

    // Context-Aware Default Questions
    const detectedSkills = matchSkills(jobDescription);
    const topSkill = detectedSkills[0]?.canonical || 'TypeScript & React';
    const secondSkill = detectedSkills[1]?.canonical || 'distributed backend services';

    const questions = [
        {
            id: 1,
            category: 'Technical Architecture',
            question: `How would you architect a scalable, high-throughput feature in ${topSkill} that handles sudden traffic spikes while maintaining strict sub-100ms response times?`,
            interviewerGoal: 'Tests system design fundamentals, caching layers (Redis/CDN), and asynchronous event processing.',
            keyTalkingPoints: [
                'Decompose the problem into stateless processing and asynchronous queues',
                'Implement multi-tier caching and database indexing strategies',
                'Graceful degradation and circuit breakers under load'
            ]
        },
        {
            id: 2,
            category: 'Behavioral (STAR)',
            question: `Tell me about a time you had a technical disagreement with a teammate or product manager regarding architecture trade-offs. How did you resolve it?`,
            interviewerGoal: 'Evaluates emotional intelligence, data-driven reasoning, and cross-functional leadership.',
            keyTalkingPoints: [
                'State the Situation and Task clearly without placing blame',
                'Describe how you used benchmarks or user data to evaluate options objectively',
                'Highlight the positive Result and ongoing collaborative relationship'
            ]
        },
        {
            id: 3,
            category: 'Problem Solving & Reliability',
            question: `Describe a situation where a critical production bug occurred. Walk me through how you diagnosed, mitigated, and permanently prevented recurrence.`,
            interviewerGoal: 'Assesses incident management discipline, root-cause analysis, and post-mortem best practices.',
            keyTalkingPoints: [
                'Prioritizing immediate mitigation (rollback/hotfix) over investigation during downtime',
                'Using telemetry, logs, and APM tools to isolate the root cause',
                'Writing an automated regression test and blameless post-mortem'
            ]
        },
        {
            id: 4,
            category: 'Role Specific',
            question: `In the context of ${company}'s products, what technical challenge or scaling bottleneck do you foresee our engineering team tackling in the next 12 months?`,
            interviewerGoal: 'Shows whether the candidate did homework on company domain and understands business constraints.',
            keyTalkingPoints: [
                'Connect technology decisions to user experience and unit economics',
                'Address data volume, compliance, or developer velocity bottlenecks',
                'Demonstrate customer empathy and curiosity'
            ]
        },
        {
            id: 5,
            category: 'Collaboration & Mentorship',
            question: `How do you approach code reviews to balance code quality, security, and developer velocity without creating friction?`,
            interviewerGoal: 'Evaluates culture addition, mentoring ability, and team hygiene.',
            keyTalkingPoints: [
                'Automating linting and formatting via CI so human reviews focus on design',
                'Distinguishing between blocking concerns (bugs/security) and non-blocking suggestions',
                'Providing constructive examples and celebrating clean implementations'
            ]
        }
    ];

    return {
        questions,
        generatedWith: 'internal_engine'
    };
}

/**
 * Evaluates candidate's typed answer to an interview question.
 */
async function evaluateInterviewAnswer({
    question = '',
    answer = '',
    position = 'Software Engineer'
}) {
    if (!answer || answer.trim().length < 20) {
        return {
            score: 30,
            strengths: ['Attempted the question'],
            improvements: ['Your answer is too brief. Provide a complete STAR response with context and measurable results.'],
            modelAnswer: 'A strong answer should establish the context, detail your specific technical actions, and quantify the resulting impact.'
        };
    }

    const prompt = `Evaluate the candidate's answer to this interview question for a ${position} role.
Question: "${question}"
Candidate's Answer: "${answer}"

Return a JSON object:
{
  "score": number (0-100),
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "modelAnswer": "A polished, executive version of how to articulate this answer"
}`;

    const liveLlmResponse = await callOpenAI([
        { role: 'system', content: 'You are an expert interview coach. Output valid JSON only.' },
        { role: 'user', content: prompt }
    ]);

    if (liveLlmResponse) {
        try {
            const parsed = JSON.parse(liveLlmResponse.replace(/```json/g, '').replace(/```/g, '').trim());
            if (typeof parsed.score === 'number') {
                return { ...parsed, generatedWith: 'openai' };
            }
        } catch (e) {
            // Fallthrough
        }
    }

    // Heuristic Answer Evaluator Fallback
    const words = answer.split(/\s+/).filter(Boolean);
    const hasMetrics = /\d+%|\$\d+|\b\d+x\b|\b\d+\s*(?:users|days|weeks|ms|team members)/i.test(answer);
    const hasActionVerbs = /(?:architected|spearheaded|engineered|optimized|designed|implemented|resolved|led|reduced)/i.test(answer);
    const hasStarKeywords = /(?:situation|task|challenge|approach|result|outcome|learned|impact)/i.test(answer);

    let score = 65;
    const strengths = [];
    const improvements = [];

    if (words.length > 60) {
        score += 10;
        strengths.push('Provided substantial detail and thorough technical context.');
    } else {
        improvements.push('Expand on your specific technical contributions—aim for 3 to 4 detailed sentences.');
    }

    if (hasActionVerbs) {
        score += 10;
        strengths.push('Led with proactive action verbs demonstrating technical ownership.');
    } else {
        improvements.push('Incorporate strong active verbs (e.g. "Architected", "Engineered", "Spearheaded") to highlight ownership.');
    }

    if (hasMetrics) {
        score += 15;
        strengths.push('Included concrete, quantified metrics demonstrating real business impact.');
    } else {
        improvements.push('Quantify the outcome (e.g., % latency reduction, number of active users, or time saved).');
    }

    const modelAnswer = `In my previous role, I tackled a similar challenge by first evaluating the system bottlenecks using APM profiling. I architected a multi-tiered solution using modern caching and asynchronous queues, which allowed our team to handle a 3x traffic increase while maintaining sub-100ms response times. By holding a blameless post-mortem, we also codified automated regression tests to permanently prevent similar regressions.`;

    return {
        score: Math.min(98, Math.max(45, score)),
        strengths: strengths.length > 0 ? strengths : ['Good baseline understanding of the core concept.'],
        improvements: improvements.length > 0 ? improvements : ['Maintain this level of structured clarity in live conversations.'],
        modelAnswer,
        generatedWith: 'internal_engine'
    };
}

module.exports = {
    generateCoverLetter,
    tailorResumeBullets,
    draftFollowUpEmail,
    generateInterviewQuestions,
    evaluateInterviewAnswer
};
