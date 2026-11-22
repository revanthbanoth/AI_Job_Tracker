const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
    computeHash,
    cleanText,
    matchSkills,
    extractBullets,
    detectSections,
    extractContacts,
    detectBuzzwords,
    computeResumeHealth,
    computeJobMatch,
    analyzeResumeDeterministic
} = require('../services/atsEngine');

console.log('======================================================');
console.log('  DETERMINISTIC ATS ENGINE TEST SUITE');
console.log('======================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✓ PASS: ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✗ FAIL: ${name}`);
        console.error(`    ${err.message}`);
        if (err.stack) {
            console.error(err.stack.split('\n').slice(1, 3).join('\n'));
        }
    }
}

// Load fixture resumes
const seniorResumePath = path.join(__dirname, 'fixtures/senior_engineer_resume.txt');
const weakResumePath = path.join(__dirname, 'fixtures/weak_bullets_resume.txt');

const seniorResumeText = fs.readFileSync(seniorResumePath, 'utf-8');
const weakResumeText = fs.readFileSync(weakResumePath, 'utf-8');

const targetJdText = `
Role: Senior Software Engineer
Company: Stripe
We are seeking a Senior Software Engineer to design, architect, and scale our core payments infrastructure.
Requirements:
- 5+ years of software engineering experience with Node.js and TypeScript.
- Strong proficiency in React, PostgreSQL, Docker, and Kubernetes.
- Experience building scalable RESTful APIs and distributed microservices.
- Preferred skills: Kafka, Redis, AWS.
- Bachelor's degree in Computer Science or related field.
- Excellent communication and cross-functional leadership skills.
`;

// TEST 1: Strict Determinism Guarantee Across Consecutive Runs
runTest('Strict Determinism Guarantee: 10 consecutive runs yield identical numerical scores', () => {
    const runs = [];
    for (let i = 0; i < 10; i++) {
        const result = analyzeResumeDeterministic(seniorResumeText, targetJdText, [], 450, 1);
        runs.push(result);
    }

    const firstRun = runs[0];
    assert.strictEqual(typeof firstRun.healthScore, 'number');
    assert.strictEqual(typeof firstRun.matchScore, 'number');
    assert.strictEqual(typeof firstRun.overallScore, 'number');

    for (let i = 1; i < runs.length; i++) {
        assert.strictEqual(runs[i].healthScore, firstRun.healthScore, `Health score differed on run ${i}`);
        assert.strictEqual(runs[i].matchScore, firstRun.matchScore, `Match score differed on run ${i}`);
        assert.strictEqual(runs[i].overallScore, firstRun.overallScore, `Overall score differed on run ${i}`);
        assert.strictEqual(runs[i].fileHash, firstRun.fileHash, `File hash differed on run ${i}`);
        assert.strictEqual(runs[i].deductions.length, firstRun.deductions.length, `Deductions count differed on run ${i}`);
    }
});

// TEST 2: High Quality Resume Scores in Excellent Range
runTest('High Quality Resume achieves high health score (>= 85/100)', () => {
    const result = analyzeResumeDeterministic(seniorResumeText, '', [], 380, 1);
    assert.ok(result.healthScore >= 85, `Expected >= 85, got ${result.healthScore}`);
    assert.strictEqual(result.healthBreakdown.contact.score, 10, 'Should have full contact score (email, phone, linkedin, github)');
    assert.strictEqual(result.healthBreakdown.sections.score, 15, 'Should have full sections score');
});

// TEST 3: Weak Resume Receives Proper Deductions
runTest('Weak Resume incurs targeted deductions for pronouns, buzzwords, and missing metrics', () => {
    const result = analyzeResumeDeterministic(weakResumeText, '', [], 120, 1);
    assert.ok(result.healthScore < 65, `Expected health score < 65, got ${result.healthScore}`);

    // Check specific deductions
    const pronounDeduction = result.deductions.find(d => d.reason.includes('First-person pronouns'));
    assert.ok(pronounDeduction, 'Should have first-person pronoun deduction');
    assert.strictEqual(pronounDeduction.pointsDeducted, 4);

    const buzzwordDeduction = result.deductions.find(d => d.category === 'Language & Fluff');
    assert.ok(buzzwordDeduction, 'Should have buzzword fluff deduction for rockstar/hard worker');

    const contactDeduction = result.deductions.find(d => d.category === 'Contact & Links');
    assert.ok(contactDeduction, 'Should have contact deduction for missing phone/linkedin');
});

// TEST 4: Skills Taxonomy Synonyms & Aliases Resolution
runTest('Skills Taxonomy accurately resolves aliases (JS -> JavaScript, TS -> TypeScript, K8s -> Kubernetes)', () => {
    const sampleSkillsText = 'Proficient in JS, TS, K8s, Postgres, AWS, and Py.';
    const matched = matchSkills(sampleSkillsText);
    const canonicalNames = matched.map(m => m.canonical);

    assert.ok(canonicalNames.includes('JavaScript'), 'JS should resolve to JavaScript');
    assert.ok(canonicalNames.includes('TypeScript'), 'TS should resolve to TypeScript');
    assert.ok(canonicalNames.includes('Kubernetes'), 'K8s should resolve to Kubernetes');
    assert.ok(canonicalNames.includes('PostgreSQL'), 'Postgres should resolve to PostgreSQL');
    assert.ok(canonicalNames.includes('Amazon Web Services'), 'AWS should resolve to Amazon Web Services');
    assert.ok(canonicalNames.includes('Python'), 'Py should resolve to Python');
});

// TEST 5: Job Match Deterministic Weighting
runTest('Combined score follows exact 30% Health + 70% Match deterministic formula', () => {
    const result = analyzeResumeDeterministic(seniorResumeText, targetJdText, [], 450, 1);

    const expectedCombined = Math.round((result.healthScore * 0.3) + (result.matchScore * 0.7));
    assert.strictEqual(result.overallScore, expectedCombined, `Combined score ${result.overallScore} must equal 30% H + 70% M (${expectedCombined})`);
    assert.ok(result.matchedKeywords.length >= 4, 'Should identify matched required keywords');
});

// TEST 6: Bullet Fix Suggestions
runTest('Bullet quality engine generates actionable rewrite suggestions for weak bullets', () => {
    const result = analyzeResumeDeterministic(weakResumeText, '', [], 120, 1);
    assert.ok(result.bulletFixes.length > 0, 'Should generate bullet fix suggestions for weak bullets');
    assert.ok(result.bulletFixes[0].suggestion.length > result.bulletFixes[0].original.length, 'Suggested bullet should be more descriptive and quantified');
});

console.log('\n======================================================');
console.log(`  TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
    process.exit(1);
}
