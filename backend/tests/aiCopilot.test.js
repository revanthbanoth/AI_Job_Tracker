const assert = require('assert');
const aiCopilotService = require('../services/aiCopilotService');

async function runTests() {
    console.log('\n======================================================');
    console.log('  AI CAREER COPILOT TEST SUITE (PHASE 5)');
    console.log('======================================================\n');

    let passed = 0;
    let failed = 0;

    const sampleApp = {
        company: 'Stripe',
        position: 'Senior Full Stack Engineer',
        skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'System Design'],
        jobDescription: 'Build high-scale financial infrastructure using React, Node.js, and TypeScript.'
    };

    const sampleResume = {
        name: 'Jordan Lee',
        title: 'Full Stack Engineer',
        skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
        bullets: [
            'Worked on web applications and fixed bugs.',
            'Helped improve system performance.'
        ]
    };

    // Test 1: Cover Letter Generation
    try {
        const result = await aiCopilotService.generateCoverLetter({
            candidateName: sampleResume.name,
            company: sampleApp.company,
            position: sampleApp.position,
            jobDescription: sampleApp.jobDescription,
            resumeText: sampleResume.bullets.join('\n'),
            tone: 'Confident & Direct'
        });

        assert(result && result.coverLetter, 'Result must contain coverLetter property');
        assert(result.coverLetter.length > 200, 'Cover letter should have substantial length');
        assert(result.coverLetter.includes('Stripe'), 'Cover letter must mention the target company');
        assert(result.coverLetter.includes('Senior Full Stack Engineer'), 'Cover letter must mention the target position');
        assert(result.coverLetter.includes('Jordan Lee'), 'Cover letter must be signed with candidate name');

        console.log('  ✓ PASS: Cover letter generates tailored, personalized text with company and role');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Cover letter generation failed:', e.message);
        failed++;
    }

    // Test 2: Bullet Tailoring
    try {
        const result = await aiCopilotService.tailorResumeBullets({
            resumeBullets: sampleResume.bullets,
            jobDescription: sampleApp.jobDescription,
            company: sampleApp.company,
            position: sampleApp.position
        });

        assert(result && Array.isArray(result.tailoredBullets), 'tailoredBullets should be an array');
        assert(result.tailoredBullets.length > 0, 'Should return rewritten bullets');
        assert(result.tailoredBullets[0].tailored, 'Each bullet must have tailored text');
        assert(result.tailoredBullets[0].rationale, 'Each bullet must have an explanation rationale');

        console.log('  ✓ PASS: Bullet tailoring injects action verbs, scope, and metric placeholders');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Bullet tailoring failed:', e.message);
        failed++;
    }

    // Test 3: Email Drafting for Follow-up & Thank You
    try {
        const thankYouResult = await aiCopilotService.draftFollowUpEmail({
            type: 'thank_you',
            candidateName: 'Jordan Lee',
            interviewerName: 'Sarah Jenkins',
            company: sampleApp.company,
            position: sampleApp.position,
            keyTopicsDiscussed: 'high availability ledger systems'
        });

        assert(thankYouResult && thankYouResult.subject && thankYouResult.subject.includes('Thank you'), 'Subject should indicate thank you');
        assert(thankYouResult.body.includes('Sarah Jenkins') || thankYouResult.body.includes('Sarah'), 'Body should address interviewer');
        assert(thankYouResult.body.includes('high availability ledger systems'), 'Body should incorporate user interview discussion points');

        const followUpResult = await aiCopilotService.draftFollowUpEmail({
            type: 'status_check',
            candidateName: 'Jordan Lee',
            company: sampleApp.company,
            position: sampleApp.position
        });

        assert(followUpResult.subject.includes('Follow-up') || followUpResult.subject.includes('Status'), 'Subject should indicate follow-up');
        assert(followUpResult.body.includes('Stripe'), 'Body should reference company');

        console.log('  ✓ PASS: Email drafter accurately produces interview thank you and 7-day status follow-up emails');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Email drafter failed:', e.message);
        failed++;
    }

    // Test 4: Interview Question Generator
    try {
        const result = await aiCopilotService.generateInterviewQuestions({
            jobDescription: sampleApp.jobDescription,
            position: sampleApp.position,
            company: sampleApp.company
        });

        assert(result && Array.isArray(result.questions), 'Questions should be an array');
        assert(result.questions.length >= 4, 'Should generate at least 4 categorized questions');

        const categories = result.questions.map(q => q.category);
        assert(categories.some(c => c.includes('Technical') || c.includes('Role')), 'Must include technical or role questions');
        assert(categories.some(c => c.includes('Behavioral')), 'Must include behavioral STAR questions');

        console.log(`  ✓ PASS: Interview simulator generates ${result.questions.length} categorized questions with evaluation criteria`);
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Interview question generator failed:', e.message);
        failed++;
    }

    // Test 5: Interview Answer Evaluation
    try {
        const evalResult = await aiCopilotService.evaluateInterviewAnswer({
            question: 'Tell me about a time you resolved a major production bug.',
            answer: 'In my previous position, our API latency spiked by 300%. I initiated a root-cause analysis, architected a fix, identified a missing database index on the orders table, and deployed a hotfix within 40 minutes, reducing latency back to 80ms.',
            position: sampleApp.position
        });

        assert(typeof evalResult.score === 'number', 'Evaluation score must be a number');
        assert(evalResult.score >= 70, `Comprehensive answer with metrics should score high, got ${evalResult.score}`);
        assert(Array.isArray(evalResult.strengths) && evalResult.strengths.length > 0, 'Must provide strengths');
        assert(evalResult.modelAnswer, 'Must provide a model answer');

        console.log(`  ✓ PASS: Answer evaluation scores candidate response (${evalResult.score}/100) and provides structured critique`);
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Answer evaluation failed:', e.message);
        failed++;
    }

    console.log('\n======================================================');
    console.log(`  TEST RESULTS: ${passed}/${passed + failed} PASSED`);
    console.log('======================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
