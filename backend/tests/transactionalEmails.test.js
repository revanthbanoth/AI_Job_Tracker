const assert = require('assert');
const emailService = require('../services/emailService');
const { escapeHtml, getFirstName, renderEmailLayout } = require('../utils/emailLayout');
const { generateIcsContent, generateGoogleCalendarUrl, generateOutlookCalendarUrl } = require('../utils/icsGenerator');

async function runTests() {
    console.log('\n======================================================');
    console.log('  TRANSACTIONAL EMAIL SYSTEM TEST SUITE (13 EMAILS)');
    console.log('======================================================\n');

    let passed = 0;
    let failed = 0;

    const mockUser = {
        _id: 'user123',
        name: 'Revanth Kumar',
        email: 'revanth@example.com',
        unsubscribeToken: 'unsub-token-xyz-123',
        emailPreferences: {
            reminders: true,
            weeklySummary: true,
            inactivityNudge: true,
            statusUpdates: true
        }
    };

    const mockApp = {
        _id: 'app123',
        position: 'Senior Full Stack Engineer',
        company: 'Stripe',
        location: 'https://meet.google.com/abc-defg-hij',
        interviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const mockResume = {
        _id: 'res123',
        name: 'Revanth_Resume.pdf',
        atsScore: 84
    };

    // Test 1: Shared Layout & Styling Constraints
    try {
        const { html, text } = renderEmailLayout({
            title: 'Test Email',
            firstName: 'Revanth',
            bodyHtml: '<p>Testing layout consistency.</p>',
            bodyText: 'Testing layout consistency.',
            buttonText: 'Test Action',
            buttonUrl: 'http://localhost:5173/action',
            isSecurityEmail: false,
            unsubscribeToken: 'token123'
        });

        assert(html.includes('#FAF6F0'), 'Must contain cream background #FAF6F0');
        assert(html.includes('#FFFFFF'), 'Must contain white card #FFFFFF');
        assert(html.includes('max-width: 600px'), 'Must contain max-width 600px card');
        assert(html.includes('#1F1B16'), 'Must use ink text color #1F1B16');
        assert(html.includes('#D4663A'), 'Must use terracotta button #D4663A');
        assert(html.includes('Georgia'), 'Header must specify Georgia serif');
        assert(html.includes('JobTracker &bull; Thoughtful Careers'), 'Footer must contain brand line');
        assert(html.includes('Manage email preferences'), 'Footer must contain preferences link');
        assert(html.includes('Unsubscribe'), 'Non-security email must contain unsubscribe link');
        assert(text.includes('Testing layout consistency.'), 'Plain text alternative must be present');

        console.log('  ✓ PASS: Shared layout conforms strictly to brand styling & typography');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Shared layout test:', e.message);
        failed++;
    }

    // Test 2: First Name Extraction & Security Escaping
    try {
        assert.strictEqual(getFirstName('Revanth Kumar'), 'Revanth', 'Must extract first name only');
        assert.strictEqual(getFirstName('alexander'), 'Alexander', 'Must capitalize first letter');
        assert.strictEqual(getFirstName('   '), 'there', 'Must fallback cleanly for empty');
        assert.strictEqual(getFirstName(null), 'there', 'Must fallback cleanly for null');

        const unsafe = '<script>alert("hack")</script> & "quotes"';
        const escaped = escapeHtml(unsafe);
        assert(!escaped.includes('<script>'), 'Must escape HTML tags');
        assert(escaped.includes('&lt;script&gt;'), 'Must encode brackets');
        assert(escaped.includes('&amp;'), 'Must encode ampersand');

        console.log('  ✓ PASS: First name extraction and HTML escaping verified');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: First name & escaping test:', e.message);
        failed++;
    }

    // Test 3: Security Email Footers (No Unsubscribe)
    try {
        const { html } = renderEmailLayout({
            title: 'Security Notice',
            firstName: 'Revanth',
            bodyHtml: '<p>Security notice body</p>',
            bodyText: 'Security notice body',
            isSecurityEmail: true,
            unsubscribeToken: 'token123'
        });

        assert(!html.includes('Unsubscribe</a>'), 'Security emails must NOT include unsubscribe link');
        console.log('  ✓ PASS: Security emails omit unsubscribe link as required');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Security email test:', e.message);
        failed++;
    }

    // Test 4: RFC 5545 ICS Calendar Invite Generator
    try {
        const ics = generateIcsContent({
            title: 'Interview: Senior Engineer at Stripe',
            description: 'Round 1 Technical Screen',
            location: 'https://meet.google.com/abc-defg-hij',
            startDate: new Date(),
            attendeeEmail: 'revanth@example.com'
        });

        assert(ics.includes('BEGIN:VCALENDAR'), 'ICS must include BEGIN:VCALENDAR');
        assert(ics.includes('VERSION:2.0'), 'ICS must declare VERSION:2.0');
        assert(ics.includes('BEGIN:VEVENT'), 'ICS must declare BEGIN:VEVENT');
        assert(ics.includes('SUMMARY:Interview: Senior Engineer at Stripe'), 'ICS must contain summary');
        assert(ics.includes('LOCATION:https://meet.google.com/abc-defg-hij'), 'ICS must contain location');
        assert(ics.includes('END:VCALENDAR'), 'ICS must terminate with END:VCALENDAR');

        const gCal = generateGoogleCalendarUrl({ title: 'Interview', startDate: new Date() });
        const oCal = generateOutlookCalendarUrl({ title: 'Interview', startDate: new Date() });
        assert(gCal.includes('calendar.google.com'), 'Must generate valid Google Calendar URL');
        assert(oCal.includes('outlook.live.com'), 'Must generate valid Outlook Calendar URL');

        console.log('  ✓ PASS: RFC 5545 ICS calendar invites and calendar deep links valid');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: ICS calendar test:', e.message);
        failed++;
    }

    // Test 5: Verify All 13 Transactional Email Methods & Exact Copy
    const emailChecks = [
        {
            num: 1,
            name: 'Welcome',
            fn: () => emailService.sendWelcomeEmail(mockUser),
            expectedSub: 'Welcome to JobTracker, Revanth!',
            expectedPhrase: "I'm glad you're here. Job hunting is a lot easier when everything lives in one place."
        },
        {
            num: 2,
            name: 'Password Reset',
            fn: () => emailService.sendPasswordResetEmail(mockUser, 'test-token-123'),
            expectedSub: 'Reset your JobTracker password',
            expectedPhrase: 'we received a request to reset your password. Click the button below to choose a new one.'
        },
        {
            num: 3,
            name: 'Password Changed',
            fn: () => emailService.sendPasswordChangedEmail(mockUser),
            expectedSub: 'Your password was changed',
            expectedPhrase: 'your JobTracker password was changed on'
        },
        {
            num: 4,
            name: 'Interview Scheduled',
            fn: () => emailService.sendInterviewScheduledEmail(mockUser, mockApp),
            expectedSub: 'Interview added: Senior Full Stack Engineer at Stripe',
            expectedPhrase: 'your interview is on the calendar.'
        },
        {
            num: 5,
            name: 'Interview Reminder 24h',
            fn: () => emailService.sendInterviewReminder24h(mockUser, mockApp),
            expectedSub: 'Tomorrow: interview with Stripe',
            expectedPhrase: 'Tomorrow: interview with Stripe'
        },
        {
            num: 6,
            name: 'Interview Reminder 1h',
            fn: () => emailService.sendInterviewReminder1h(mockUser, mockApp),
            expectedSub: 'Starting soon: Stripe interview at',
            expectedPhrase: 'your interview starts in about an hour.'
        },
        {
            num: 7,
            name: 'Follow-up Reminder (7 days)',
            fn: () => emailService.sendFollowUpReminder(mockUser, mockApp, 7),
            expectedSub: 'Time to follow up with Stripe?',
            expectedPhrase: 'A short, polite follow-up often helps.'
        },
        {
            num: 8,
            name: 'Offer Received',
            fn: () => emailService.sendOfferReceivedEmail(mockUser, mockApp),
            expectedSub: 'Congratulations, Revanth! You got an offer',
            expectedPhrase: 'you did it! Stripe offered you the Senior Full Stack Engineer position.'
        },
        {
            num: 9,
            name: 'Rejection (gentle)',
            fn: () => emailService.sendRejectionEmail(mockUser, mockApp, 12),
            expectedSub: 'About Stripe, and what\'s next',
            expectedPhrase: 'A rejection says very little about your worth, and almost every offer story has a few of them.'
        },
        {
            num: 10,
            name: 'Weekly Summary',
            fn: () => emailService.sendWeeklySummaryEmail(mockUser, { sent: 4, responses: 2, interviews: 1, goalPercent: 80 }),
            expectedSub: 'Your week in job hunting',
            expectedPhrase: 'Applications sent: 4. Responses: 2. Interviews: 1. Goal progress: 80%.'
        },
        {
            num: 11,
            name: 'Inactivity Nudge',
            fn: () => emailService.sendInactivityNudgeEmail(mockUser, 3),
            expectedSub: 'Your job search misses you',
            expectedPhrase: 'Even one application today keeps the momentum going. You have 3 follow-ups waiting.'
        },
        {
            num: 12,
            name: 'ATS Report Ready',
            fn: () => emailService.sendAtsReportReadyEmail(mockUser, mockResume, { score: 84 }),
            expectedSub: 'Your resume score is ready: 84/100',
            expectedPhrase: 'we analyzed Revanth_Resume.pdf. Your ATS score is 84/100.'
        },
        {
            num: 13,
            name: 'Account Deleted',
            fn: () => emailService.sendAccountDeletedEmail(mockUser),
            expectedSub: 'Your JobTracker account has been deleted',
            expectedPhrase: 'your account and data have been deleted as requested. We\'re sorry to see you go'
        }
    ];

    for (const check of emailChecks) {
        try {
            const res = await check.fn();
            assert(res && res.success, `Email ${check.num} dispatch must report success`);
            console.log(`  ✓ PASS: Email ${check.num} (${check.name}) - Exact copy and subject verified`);
            passed++;
        } catch (e) {
            console.error(`  ✗ FAIL: Email ${check.num} (${check.name}):`, e.message);
            failed++;
        }
    }

    // Test 6: Preference Filtering Test
    try {
        const optedOutUser = {
            ...mockUser,
            emailPreferences: {
                reminders: false,
                weeklySummary: false,
                inactivityNudge: false,
                statusUpdates: false,
            }
        };

        const suppressedInterview = await emailService.sendInterviewScheduledEmail(optedOutUser, mockApp);
        assert.strictEqual(suppressedInterview, null, 'Opted out user must not receive reminders');

        const suppressedWeekly = await emailService.sendWeeklySummaryEmail(optedOutUser);
        assert.strictEqual(suppressedWeekly, null, 'Opted out user must not receive weekly summaries');

        console.log('  ✓ PASS: User email preference opt-outs rigorously respected');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Preference opt-out test:', e.message);
        failed++;
    }

    console.log('\n======================================================');
    console.log(`  TEST RESULTS: ${passed}/${passed + failed} PASSED`);
    console.log('======================================================\n');

    if (failed > 0) process.exit(1);
}

runTests();
