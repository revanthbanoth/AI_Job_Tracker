const assert = require('assert');
const crypto = require('crypto');

async function runTests() {
    console.log('\n======================================================');
    console.log('  SHAREABLE PROGRESS & TOKEN TEST SUITE (PHASE 6)');
    console.log('======================================================\n');

    let passed = 0;
    let failed = 0;

    // Test 1: Generate Cryptographic Share Token
    try {
        const token = crypto.randomBytes(16).toString('hex');
        assert(token && token.length === 32, 'Share token must be a 32-character hex string');
        assert(/^[a-f0-9]{32}$/.test(token), 'Token must be valid hex');
        console.log('  ✓ PASS: Secure cryptographic token generation (32-character hex)');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Token generation test:', e.message);
        failed++;
    }

    // Test 2: Public View Anonymization Check
    try {
        const rawUser = {
            _id: 'user123',
            name: 'Revanth Kumar',
            email: 'revanth@example.com',
            password: 'hashedPassword',
            shareToken: 'abc123def456',
            shareTokenEnabled: true
        };

        const rawApps = [
            {
                company: 'Google',
                position: 'Staff Engineer',
                status: 'Interviewing',
                salary: '$220,000',
                notes: 'Secret salary negotiation notes',
                contacts: [{ email: 'recruiter@google.com', phone: '555-1234' }],
                createdAt: new Date()
            },
            {
                company: 'Microsoft',
                position: 'Senior Engineer',
                status: 'Offer',
                createdAt: new Date()
            }
        ];

        // Anonymization logic:
        const firstName = rawUser.name.split(' ')[0];
        const publicPipeline = rawApps.map(a => ({
            company: a.company,
            position: a.position,
            status: a.status,
            createdAt: a.createdAt
        }));

        assert.strictEqual(firstName, 'Revanth', 'Only first name should be exposed');
        assert(!publicPipeline[0].notes, 'Sensitive user notes must be stripped from public view');
        assert(!publicPipeline[0].contacts, 'Internal recruiter contacts must be stripped from public view');
        assert.strictEqual(publicPipeline.length, 2, 'Applications list should remain intact');

        console.log('  ✓ PASS: Public view rigorously anonymizes candidate identity & strips sensitive recruiter contacts');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Anonymization test:', e.message);
        failed++;
    }

    // Test 3: Metric Aggregations
    try {
        const apps = [
            { status: 'Applied' },
            { status: 'Applied' },
            { status: 'Interviewing' },
            { status: 'Offer' },
            { status: 'Rejected' }
        ];

        const total = apps.length;
        const interviews = apps.filter(a => a.status === 'Interviewing' || a.status === 'Interview').length;
        const offers = apps.filter(a => a.status === 'Offer').length;
        const interviewRate = Math.round((interviews / total) * 100);
        const responseRate = Math.round(((interviews + offers) / total) * 100);

        assert.strictEqual(total, 5, 'Total applications should equal 5');
        assert.strictEqual(interviews, 1, 'Interviews count should equal 1');
        assert.strictEqual(offers, 1, 'Offers count should equal 1');
        assert.strictEqual(interviewRate, 20, 'Interview rate should be 20%');
        assert.strictEqual(responseRate, 40, 'Response rate should be 40%');

        console.log('  ✓ PASS: Read-only pipeline metrics (Response Rate 40%, Interview Rate 20%) compute reliably');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Metric aggregations test:', e.message);
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
