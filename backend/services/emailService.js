const sendEmail = require('../utils/sendEmail');
const { escapeHtml, getFirstName, renderEmailLayout, getFrontendUrl } = require('../utils/emailLayout');
const { generateIcsContent, generateGoogleCalendarUrl, generateOutlookCalendarUrl } = require('../utils/icsGenerator');

/**
 * Complete Transactional Email Service for JobTracker
 * 
 * Implements all 13 canonical transactional emails using the shared
 * layout, email-safe Arial body typography, Georgia header,
 * cream #FAF6F0 background, and terracotta #D4663A buttons.
 */
class EmailService {
    constructor() {
        this.clientUrl = getFrontendUrl();
        this.supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'jobtrackerai.in@gmail.com';
    }

    /**
     * Check if a specific email preference is enabled for a user
     */
    shouldSend(user, preferenceKey) {
        if (!user) return true;
        if (!preferenceKey) return true; // Security or transactional notice
        if (user.emailPreferences && user.emailPreferences[preferenceKey] === false) {
            return false;
        }
        return true;
    }

    // =========================================================================
    // 1. WELCOME (on signup)
    // =========================================================================
    async sendWelcomeEmail(user) {
        const firstName = getFirstName(user.name);
        const subject = `Welcome to JobTracker, ${firstName}!`;

        const bodyHtml = `
            <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(firstName)}, I'm glad you're here. Job hunting is a lot easier when everything lives in one place. Here's how to get started: 1) Add your first application, 2) Upload your resume to get your ATS score, 3) Set a weekly goal. Everyone starts at zero, and one application today is a great start.</p>
        `;

        const bodyText = `Hi ${firstName}, I'm glad you're here. Job hunting is a lot easier when everything lives in one place. Here's how to get started: 1) Add your first application, 2) Upload your resume to get your ATS score, 3) Set a weekly goal. Everyone starts at zero, and one application today is a great start.`;

        const { html, text } = renderEmailLayout({
            title: subject,
            firstName,
            bodyHtml,
            bodyText,
            buttonText: 'Add my first application',
            buttonUrl: `${this.clientUrl}/applications?action=new`,
            footerNote: 'Questions? Just reply to this email.',
            isSecurityEmail: false,
            unsubscribeToken: user.unsubscribeToken,
        });

        return await sendEmail({ to: user.email, subject, html, text });
    }

    // =========================================================================
    // 2. PASSWORD RESET
    // =========================================================================
    async sendPasswordResetEmail(user, resetToken) {
        const firstName = getFirstName(user.name);
        const subject = 'Reset your JobTracker password';
        const resetLink = `${this.clientUrl}/reset-password/${resetToken}`;

        const bodyHtml = `
            <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(firstName)}, we received a request to reset your password. Click the button below to choose a new one. This link expires in 30 minutes and can be used only once.</p>
        `;

        const bodyText = `Hi ${firstName}, we received a request to reset your password. Click the button below to choose a new one. This link expires in 30 minutes and can be used only once.`;

        const { html, text } = renderEmailLayout({
            title: subject,
            firstName,
            bodyHtml,
            bodyText,
            buttonText: 'Reset password',
            buttonUrl: resetLink,
            fallbackText: "If the button doesn't work, copy and paste this link into your browser:",
            fallbackUrl: resetLink,
            footerNote: "If you didn't request this, you can ignore this email. Your password won't change.",
            isSecurityEmail: true,
            unsubscribeToken: user.unsubscribeToken,
        });

        return await sendEmail({ to: user.email, subject, html, text });
    }

    // =========================================================================
    // 3. PASSWORD CHANGED
    // =========================================================================
    async sendPasswordChangedEmail(user) {
        const firstName = getFirstName(user.name);
        const subject = 'Your password was changed';
        const dateTime = new Date().toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });

        const bodyHtml = `
            <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(firstName)}, your JobTracker password was changed on ${escapeHtml(dateTime)}. If this was you, no action is needed. If it wasn't, reset your password right away and contact us at ${escapeHtml(this.supportEmail)}.</p>
        `;

        const bodyText = `Hi ${firstName}, your JobTracker password was changed on ${dateTime}. If this was you, no action is needed. If it wasn't, reset your password right away and contact us at ${this.supportEmail}.`;

        const { html, text } = renderEmailLayout({
            title: subject,
            firstName,
            bodyHtml,
            bodyText,
            buttonText: 'Secure my account',
            buttonUrl: `${this.clientUrl}/forgot-password`,
            isSecurityEmail: true,
            unsubscribeToken: user.unsubscribeToken,
        });

        return await sendEmail({ to: user.email, subject, html, text });
    }

    // =========================================================================
    // 4. INTERVIEW SCHEDULED (with .ics attachment)
    // =========================================================================
    async sendInterviewScheduledEmail(user, application) {
        if (!this.shouldSend(user, 'reminders')) return null;

        const firstName = getFirstName(user.name);
        const role = application.position || 'Upcoming Role';
        const company = application.company || 'Company';
        const interviewDateObj = new Date(application.interviewDate || Date.now());

        const date = interviewDateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const time = interviewDateObj.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';
        const locationOrLink = application.location || application.jobUrl || 'Video call link to follow';

        const subject = `Interview added: ${role} at ${company}`;

        const bodyHtml = `
            <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(firstName)}, your interview is on the calendar. Role: ${escapeHtml(role)} at ${escapeHtml(company)}. When: ${escapeHtml(date)} at ${escapeHtml(time)} (${escapeHtml(timezone)}). Where: ${escapeHtml(locationOrLink)}. I've attached a calendar invite so it shows up in Google Calendar, Outlook or Apple Calendar. You've got this.</p>
        `;

        const bodyText = `Hi ${firstName}, your interview is on the calendar. Role: ${role} at ${company}. When: ${date} at ${time} (${timezone}). Where: ${locationOrLink}. I've attached a calendar invite so it shows up in Google Calendar, Outlook or Apple Calendar. You've got this.`;

        const calDetails = {
            title: `Interview: ${role} at ${company}`,
            description: `JobTracker Interview with ${company} for ${role}.\nLocation/Link: ${locationOrLink}`,
            location: locationOrLink,
            startDate: interviewDateObj,
            attendeeEmail: user.email
        };

        const googleCalUrl = generateGoogleCalendarUrl(calDetails);
        const outlookCalUrl = generateOutlookCalendarUrl(calDetails);
        const icsContent = generateIcsContent(calDetails);

        const { html, text } = renderEmailLayout({
            title: subject,
            firstName,
            bodyHtml,
            bodyText,
            buttonText: 'Open application',
            buttonUrl: `${this.clientUrl}/applications`,
            secondaryButtons: [
                { text: 'Add to Google Calendar', url: googleCalUrl },
                { text: 'Add to Outlook', url: outlookCalUrl },
            ],
            isSecurityEmail: false,
            unsubscribeToken: user.unsubscribeToken,
        });

        const attachments = [
            {
                filename: 'interview.ics',
                content: icsContent,
                contentType: 'text/calendar; charset=utf-8; method=REQUEST',
            }
        ];

        return await sendEmail({ to: user.email, subject, html, text, attachments });
    }

    // =========================================================================
    // 5. INTERVIEW REMINDER, 24 HOURS BEFORE
    // =========================================================================
    async sendInterviewReminder24h(user, application) {
        if (!this.shouldSend(user, 'reminders')) return null;

        const firstName = getFirstName(user.name);
        const role = application.position || 'Upcoming Role';
        const company = application.company || 'Company';
        const time = new Date(application.interviewDate).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const subject = `Tomorrow: interview with ${company}`;

        const bodyHtml = `
            <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(firstName)}, a friendly reminder that your interview for ${escapeHtml(role)} at ${escapeHtml(company)} is tomorrow at ${escapeHtml(time)}. A quick checklist: review the job description, prepare 3 stories from your experience, test your internet and camera, and get some good sleep.</p>
        `;

        const bodyText = `Hi ${firstName}, a friendly reminder that your interview for ${role} at ${company} is tomorrow at ${time}. A quick checklist: review the job description, prepare 3 stories from your experience, test your internet and camera, and get some good sleep.`;

        const { html, text } = renderEmailLayout({
            title: subject,
            firstName,
            bodyHtml,
            bodyText,
            buttonText: 'Open interview prep',
            buttonUrl: `${this.clientUrl}/applications`,
            isSecurityEmail: false,
            unsubscribeToken: user.unsubscribeToken,
        });

        return await sendEmail({ to: user.email, subject, html, text });
    }

    // =========================================================================
    // 6. INTERVIEW REMINDER, 1 HOUR BEFORE
    // =========================================================================
    async sendInterviewReminder1h(user, application) {
        if (!this.shouldSend(user, 'reminders')) return null;

        const firstName = getFirstName(user.name);
        const company = application.company || 'Company';
        const time = new Date(application.interviewDate).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        const locationOrLink = application.location || application.jobUrl || 'your calendar event';

        const subject = `Starting soon: ${company} interview at ${time}`;

        const bodyHtml = `
            <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(firstName)}, your interview starts in about an hour. Take a deep breath, have water nearby, and open your notes. Join here: ${escapeHtml(locationOrLink)}</p>
        `;

        const bodyText = `Hi ${firstName}, your interview starts in about an hour. Take a deep breath, have water nearby, and open your notes. Join here: ${locationOrLink}`;

        const { html, text } = renderEmailLayout({
            title: subject,
            firstName,
            bodyHtml,
            bodyText,
            buttonText: 'Open my notes',
            buttonUrl: `${this.clientUrl}/applications`,
            isSecurityEmail: false,
            unsubscribeToken: user.unsubscribeToken,
        });

        return await sendEmail({ to: user.email, subject, html, text });
    }

    // =========================================================================
    // 7. FOLLOW-UP REMINDER (no update for 7 days)
    // =========================================================================
    async sendFollowUpReminder(user, application, days = 7) {
        if (!this.shouldSend(user, 'statusUpdates')) return null;

        const firstName = getFirstName(user.name);
        const role = application.position || 'Role';
        const company = application.company || 'Company';

        const aiDraftedFollowUp = `\n\n"Hi Hiring Team, I recently applied for the ${role} position and remain very enthusiastic about the work you're doing at ${company}. Please let me know if there are any updates or additional materials I can provide."`;

        const subject = `Time to follow up with ${company}?`;

        const bodyHtml = `
            <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(firstName)}, it's been ${escapeHtml(String(days))} days since you applied for ${escapeHtml(role)} at ${escapeHtml(company)} with no update. A short, polite follow-up often helps. I've drafted one for you below, so edit it and send. ${escapeHtml(aiDraftedFollowUp)}</p>
        `;

        const bodyText = `Hi ${firstName}, it's been ${days} days since you applied for ${role} at ${company} with no update. A short, polite follow-up often helps. I've drafted one for you below, so edit it and send. ${aiDraftedFollowUp}`;

        const { html, text } = renderEmailLayout({
            title: subject,
            firstName,
            bodyHtml,
            bodyText,
            buttonText: 'Open application',
            buttonUrl: `${this.clientUrl}/applications`,
            isSecurityEmail: false,
            unsubscribeToken: user.unsubscribeToken,
        });

        return await sendEmail({ to: user.email, subject, html, text });
    }

    // =========================================================================
    // 8. OFFER RECEIVED
    // =========================================================================
    async sendOfferReceivedEmail(user, application) {
        if (!this.shouldSend(user, 'statusUpdates')) return null;

        const firstName = getFirstName(user.name);
        const role = application.position || 'position';
        const company = application.company || 'Company';

        const subject = `Congratulations, ${firstName}! You got an offer`;

        const bodyHtml = `
            <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(firstName)}, you did it! ${escapeHtml(company)} offered you the ${escapeHtml(role)} position. Before you accept: compare it with other offers, check the full compensation, ask about growth and benefits, and remember it's okay to negotiate politely.</p>
        `;

        const bodyText = `Hi ${firstName}, you did it! ${company} offered you the ${role} position. Before you accept: compare it with other offers, check the full compensation, ask about growth and benefits, and remember it's okay to negotiate politely.`;

        const { html, text } = renderEmailLayout({
            title: subject,
            firstName,
            bodyHtml,
            bodyText,
            buttonText: 'Open my offer checklist',
            buttonUrl: `${this.clientUrl}/applications`,
            isSecurityEmail: false,
            unsubscribeToken: user.unsubscribeToken,
        });

        return await sendEmail({ to: user.email, subject, html, text });
    }

    // =========================================================================
    // 9. REJECTION (gentle)
    // =========================================================================
    async sendRejectionEmail(user, application, totalApplications = 1) {
        if (!this.shouldSend(user, 'statusUpdates')) return null;

        const firstName = getFirstName(user.name);
        const company = application.company || 'Company';

        const subject = `About ${company}, and what's next`;

        const bodyHtml = `
            <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(firstName)}, I'm sorry about ${escapeHtml(company)}. A rejection says very little about your worth, and almost every offer story has a few of them. You've applied to ${escapeHtml(String(totalApplications))} roles so far, and that effort is building toward something. Want to look at what to improve next?</p>
        `;

        const bodyText = `Hi ${firstName}, I'm sorry about ${company}. A rejection says very little about your worth, and almost every offer story has a few of them. You've applied to ${totalApplications} roles so far, and that effort is building toward something. Want to look at what to improve next?`;

        const { html, text } = renderEmailLayout({
            title: subject,
            firstName,
            bodyHtml,
            bodyText,
            buttonText: 'See my insights',
            buttonUrl: `${this.clientUrl}/analytics`,
            isSecurityEmail: false,
            unsubscribeToken: user.unsubscribeToken,
        });

        return await sendEmail({ to: user.email, subject, html, text });
    }

    // =========================================================================
    // 10. WEEKLY SUMMARY (Mondays)
    // =========================================================================
    async sendWeeklySummaryEmail(user, stats = {}) {
        if (!this.shouldSend(user, 'weeklySummary')) return null;

        const firstName = getFirstName(user.name);
        const sent = stats.sent ?? 0;
        const responses = stats.responses ?? 0;
        const interviews = stats.interviews ?? 0;
        const goalPercent = stats.goalPercent ?? 100;
        const encouragementLine = stats.encouragementLine || 'Keep going, consistent action creates opportunities.';
        const aiSuggestion = stats.aiSuggestion || 'Tailor 2 more resumes for roles with matching skills and reach out to 1 alumni connection.';

        const subject = 'Your week in job hunting';

        const bodyHtml = `
            <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(firstName)}, here's your week: Applications sent: ${escapeHtml(String(sent))}. Responses: ${escapeHtml(String(responses))}. Interviews: ${escapeHtml(String(interviews))}. Goal progress: ${escapeHtml(String(goalPercent))}%. ${escapeHtml(encouragementLine)} Suggested focus for this week: ${escapeHtml(aiSuggestion)}</p>
        `;

        const bodyText = `Hi ${firstName}, here's your week: Applications sent: ${sent}. Responses: ${responses}. Interviews: ${interviews}. Goal progress: ${goalPercent}%. ${encouragementLine} Suggested focus for this week: ${aiSuggestion}`;

        const { html, text } = renderEmailLayout({
            title: subject,
            firstName,
            bodyHtml,
            bodyText,
            buttonText: 'Plan my week',
            buttonUrl: `${this.clientUrl}/calendar`,
            isSecurityEmail: false,
            unsubscribeToken: user.unsubscribeToken,
        });

        return await sendEmail({ to: user.email, subject, html, text });
    }

    // =========================================================================
    // 11. INACTIVITY NUDGE (after 5 days without activity)
    // =========================================================================
    async sendInactivityNudgeEmail(user, pendingFollowUps = 0) {
        if (!this.shouldSend(user, 'inactivityNudge')) return null;

        const firstName = getFirstName(user.name);
        const subject = 'Your job search misses you';

        const bodyHtml = `
            <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(firstName)}, it's been a few days. Even one application today keeps the momentum going. You have ${escapeHtml(String(pendingFollowUps))} follow-ups waiting.</p>
        `;

        const bodyText = `Hi ${firstName}, it's been a few days. Even one application today keeps the momentum going. You have ${pendingFollowUps} follow-ups waiting.`;

        const { html, text } = renderEmailLayout({
            title: subject,
            firstName,
            bodyHtml,
            bodyText,
            buttonText: 'Continue where I left off',
            buttonUrl: `${this.clientUrl}/applications`,
            isSecurityEmail: false,
            unsubscribeToken: user.unsubscribeToken,
        });

        return await sendEmail({ to: user.email, subject, html, text });
    }

    // =========================================================================
    // 12. ATS REPORT READY
    // =========================================================================
    async sendAtsReportReadyEmail(user, resume, atsData = {}) {
        if (!this.shouldSend(user, 'statusUpdates')) return null;

        const firstName = getFirstName(user.name);
        const score = atsData.score ?? resume.atsScore ?? 75;
        const resumeName = resume.name || resume.fileName || 'your resume';

        const deductions = atsData.deductions || [];
        const fix1 = deductions[0]?.fix || 'Quantify accomplishments with numerical metrics';
        const fix2 = deductions[1]?.fix || 'Incorporate targeted industry skills keywords';
        const fix3 = deductions[2]?.fix || 'Replace weak introductory verbs with impactful action verbs';

        const subject = `Your resume score is ready: ${score}/100`;

        const bodyHtml = `
            <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(firstName)}, we analyzed ${escapeHtml(resumeName)}. Your ATS score is ${escapeHtml(String(score))}/100. Top 3 fixes: ${escapeHtml(fix1)}, ${escapeHtml(fix2)}, ${escapeHtml(fix3)}. Fixing these could lift your score noticeably.</p>
        `;

        const bodyText = `Hi ${firstName}, we analyzed ${resumeName}. Your ATS score is ${score}/100. Top 3 fixes: ${fix1}, ${fix2}, ${fix3}. Fixing these could lift your score noticeably.`;

        const { html, text } = renderEmailLayout({
            title: subject,
            firstName,
            bodyHtml,
            bodyText,
            buttonText: 'View full report',
            buttonUrl: `${this.clientUrl}/resumes`,
            isSecurityEmail: false,
            unsubscribeToken: user.unsubscribeToken,
        });

        return await sendEmail({ to: user.email, subject, html, text });
    }

    // =========================================================================
    // 13. ACCOUNT DELETED
    // =========================================================================
    async sendAccountDeletedEmail(user) {
        const firstName = getFirstName(user.name);
        const subject = 'Your JobTracker account has been deleted';

        const bodyHtml = `
            <p style="margin: 0 0 16px 0;">Hi ${escapeHtml(firstName)}, your account and data have been deleted as requested. We're sorry to see you go, and you're always welcome back.</p>
        `;

        const bodyText = `Hi ${firstName}, your account and data have been deleted as requested. We're sorry to see you go, and you're always welcome back.`;

        const { html, text } = renderEmailLayout({
            title: subject,
            firstName,
            bodyHtml,
            bodyText,
            isSecurityEmail: true,
            unsubscribeToken: null,
        });

        return await sendEmail({ to: user.email, subject, html, text });
    }
}

module.exports = new EmailService();
