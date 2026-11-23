const sendEmail = require('../utils/sendEmail');
const { escapeHtml, getFirstName, renderEmailLayout, getFrontendUrl } = require('../utils/emailLayout');
const { generateIcsContent, generateGoogleCalendarUrl, generateOutlookCalendarUrl } = require('../utils/icsGenerator');

/**
 * Complete Transactional Email Service for JobTracker
 * 
 * Implements all 13 canonical transactional emails using high-end,
 * structured, executive-grade templates with clear section hierarchy,
 * visual stat tables, clean checklist modules, and email-safe typography.
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
            <div style="margin-bottom: 20px;">
                <h1 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #1F1B16; margin: 0 0 10px 0; letter-spacing: -0.2px;">
                    Welcome to JobTracker, ${escapeHtml(firstName)}!
                </h1>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4A423A;">
                    I'm glad you're here. Job hunting is a lot easier when everything lives in one place.
                </p>
            </div>

            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-radius: 10px; padding: 18px 20px; margin: 0 0 20px 0;">
                <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #D4663A; margin-bottom: 12px;">
                    Here's how to get started:
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.6; color: #2D261E;">
                    <tr>
                        <td style="vertical-align: top; width: 26px; font-weight: bold; color: #D4663A; padding-bottom: 10px;">1.</td>
                        <td style="vertical-align: top; padding-bottom: 10px;">
                            <strong>Add your first application</strong> &mdash; Track roles, deadlines, contacts, and interview stages in one unified board.
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; width: 26px; font-weight: bold; color: #D4663A; padding-bottom: 10px;">2.</td>
                        <td style="vertical-align: top; padding-bottom: 10px;">
                            <strong>Upload your resume to get your ATS score</strong> &mdash; Receive instant deterministic scoring and bullet point improvements.
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; width: 26px; font-weight: bold; color: #D4663A;">3.</td>
                        <td style="vertical-align: top;">
                            <strong>Set a weekly goal</strong> &mdash; Build steady momentum toward your dream job offer.
                        </td>
                    </tr>
                </table>
            </div>

            <p style="margin: 0 0 4px 0; font-size: 14px; line-height: 1.6; color: #5C554E;">
                Everyone starts at zero, and one application today is a great start.
            </p>
        `;

        const bodyText = `Hi ${firstName}, I'm glad you're here. Job hunting is a lot easier when everything lives in one place.

Here's how to get started:
1) Add your first application
2) Upload your resume to get your ATS score
3) Set a weekly goal

Everyone starts at zero, and one application today is a great start.`;

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
            <div style="margin-bottom: 18px;">
                <h1 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #1F1B16; margin: 0 0 10px 0; letter-spacing: -0.2px;">
                    Password Reset Request
                </h1>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4A423A;">
                    Hi ${escapeHtml(firstName)}, we received a request to reset your password. Click the button below to choose a new one.
                </p>
            </div>

            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-left: 3px solid #D4663A; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 0 0 20px 0;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #5C554E;">
                    <strong>Security Notice:</strong> This link expires in 30 minutes and can be used only once.
                </p>
            </div>
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
            <div style="margin-bottom: 18px;">
                <h1 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #1F1B16; margin: 0 0 10px 0; letter-spacing: -0.2px;">
                    Security Notice: Password Updated
                </h1>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4A423A;">
                    Hi ${escapeHtml(firstName)}, your JobTracker password was changed on ${escapeHtml(dateTime)}.
                </p>
            </div>

            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-radius: 10px; padding: 16px 20px; margin: 0 0 20px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.6; color: #4A423A;">
                    <tr>
                        <td style="width: 100px; color: #8C827A; padding: 3px 0;"><strong>Account:</strong></td>
                        <td style="padding: 3px 0; font-weight: 500;">${escapeHtml(user.email)}</td>
                    </tr>
                    <tr>
                        <td style="color: #8C827A; padding: 3px 0;"><strong>Timestamp:</strong></td>
                        <td style="padding: 3px 0; font-weight: 500;">${escapeHtml(dateTime)}</td>
                    </tr>
                    <tr>
                        <td style="color: #8C827A; padding: 3px 0;"><strong>Status:</strong></td>
                        <td style="padding: 3px 0; color: #5B8C6A; font-weight: 600;">&#10003; Successfully Updated</td>
                    </tr>
                </table>
            </div>

            <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6; color: #5C554E;">
                If this was you, no action is needed. If it wasn't, reset your password right away and contact us at ${escapeHtml(this.supportEmail)}.
            </p>
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
            <div style="margin-bottom: 20px;">
                <h1 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #1F1B16; margin: 0 0 10px 0; letter-spacing: -0.2px;">
                    Interview Added: ${escapeHtml(company)}
                </h1>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4A423A;">
                    Hi ${escapeHtml(firstName)}, your interview is on the calendar.
                </p>
            </div>

            <!-- Event Card -->
            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-radius: 10px; padding: 20px; margin: 0 0 20px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.6; color: #2D261E;">
                    <tr>
                        <td style="width: 100px; color: #8C827A; padding: 4px 0;"><strong>Role:</strong></td>
                        <td style="padding: 4px 0; font-weight: 600;">${escapeHtml(role)} at ${escapeHtml(company)}</td>
                    </tr>
                    <tr>
                        <td style="color: #8C827A; padding: 4px 0;"><strong>When:</strong></td>
                        <td style="padding: 4px 0; font-weight: 600; color: #D4663A;">${escapeHtml(date)} at ${escapeHtml(time)} (${escapeHtml(timezone)})</td>
                    </tr>
                    <tr>
                        <td style="color: #8C827A; padding: 4px 0;"><strong>Where:</strong></td>
                        <td style="padding: 4px 0; font-weight: 500;">${escapeHtml(locationOrLink)}</td>
                    </tr>
                </table>
            </div>

            <p style="margin: 0 0 6px 0; font-size: 14px; line-height: 1.6; color: #5C554E;">
                I've attached a calendar invite so it shows up in Google Calendar, Outlook or Apple Calendar. You've got this.
            </p>
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
            <div style="margin-bottom: 18px;">
                <div style="display: inline-block; background-color: #FAF6F0; border: 1px solid #EAE3D9; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #D4663A; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                    24-Hour Notice
                </div>
                <h1 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #1F1B16; margin: 0 0 10px 0; letter-spacing: -0.2px;">
                    Tomorrow: interview with ${escapeHtml(company)}
                </h1>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4A423A;">
                    Hi ${escapeHtml(firstName)}, a friendly reminder that your interview for ${escapeHtml(role)} at ${escapeHtml(company)} is tomorrow at ${escapeHtml(time)}.
                </p>
            </div>

            <!-- Preparation Checklist Card -->
            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-radius: 10px; padding: 18px 20px; margin: 0 0 20px 0;">
                <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1F1B16; margin-bottom: 10px;">
                    A quick checklist:
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.6; color: #2D261E;">
                    <tr>
                        <td style="width: 22px; color: #5B8C6A; font-weight: bold; padding: 3px 0;">&#10003;</td>
                        <td style="padding: 3px 0;">review the job description</td>
                    </tr>
                    <tr>
                        <td style="color: #5B8C6A; font-weight: bold; padding: 3px 0;">&#10003;</td>
                        <td style="padding: 3px 0;">prepare 3 stories from your experience</td>
                    </tr>
                    <tr>
                        <td style="color: #5B8C6A; font-weight: bold; padding: 3px 0;">&#10003;</td>
                        <td style="padding: 3px 0;">test your internet and camera</td>
                    </tr>
                    <tr>
                        <td style="color: #5B8C6A; font-weight: bold; padding: 3px 0;">&#10003;</td>
                        <td style="padding: 3px 0;">and get some good sleep.</td>
                    </tr>
                </table>
            </div>
        `;

        const bodyText = `Hi ${firstName}, a friendly reminder that your interview for ${role} at ${company} is tomorrow at ${time}.

A quick checklist:
- review the job description
- prepare 3 stories from your experience
- test your internet and camera
- and get some good sleep.`;

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
            <div style="margin-bottom: 18px;">
                <div style="display: inline-block; background-color: #FDF2E9; border: 1px solid #F5C6A5; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #D4663A; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                    Starts in 1 Hour
                </div>
                <h1 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #1F1B16; margin: 0 0 10px 0; letter-spacing: -0.2px;">
                    Starting soon: ${escapeHtml(company)} interview at ${escapeHtml(time)}
                </h1>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4A423A;">
                    Hi ${escapeHtml(firstName)}, your interview starts in about an hour. Take a deep breath, have water nearby, and open your notes.
                </p>
            </div>

            <!-- Join Link Card -->
            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-radius: 10px; padding: 16px 20px; margin: 0 0 20px 0;">
                <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #8C827A; margin-bottom: 4px;">Join here:</div>
                <div style="font-size: 14px; font-weight: 600; color: #D4663A; word-break: break-all;">
                    ${escapeHtml(locationOrLink)}
                </div>
            </div>
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
            <div style="margin-bottom: 18px;">
                <h1 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #1F1B16; margin: 0 0 10px 0; letter-spacing: -0.2px;">
                    Time to follow up with ${escapeHtml(company)}?
                </h1>
                <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #4A423A;">
                    Hi ${escapeHtml(firstName)}, it's been ${escapeHtml(String(days))} days since you applied for ${escapeHtml(role)} at ${escapeHtml(company)} with no update.
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #5C554E;">
                    A short, polite follow-up often helps. I've drafted one for you below, so edit it and send.
                </p>
            </div>

            <!-- Draft Email Template Card -->
            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-left: 3px solid #D4663A; border-radius: 0 8px 8px 0; padding: 18px 20px; margin: 0 0 20px 0;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #8C827A; margin-bottom: 8px;">
                    Draft Template:
                </div>
                <div style="font-size: 14px; line-height: 1.7; color: #1F1B16; font-style: italic;">
                    "Hi Hiring Team, I recently applied for the ${escapeHtml(role)} position and remain very enthusiastic about the work you're doing at ${escapeHtml(company)}. Please let me know if there are any updates or additional materials I can provide."
                </div>
            </div>
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
            <div style="margin-bottom: 20px;">
                <div style="display: inline-block; background-color: #EBF3ED; border: 1px solid #C4DFC9; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #5B8C6A; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                    Offer Stage
                </div>
                <h1 style="font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #1F1B16; margin: 0 0 10px 0; letter-spacing: -0.2px;">
                    Congratulations, ${escapeHtml(firstName)}!
                </h1>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4A423A;">
                    Hi ${escapeHtml(firstName)}, you did it! ${escapeHtml(company)} offered you the ${escapeHtml(role)} position.
                </p>
            </div>

            <!-- Decision Checklist Card -->
            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-radius: 10px; padding: 18px 20px; margin: 0 0 20px 0;">
                <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1F1B16; margin-bottom: 12px;">
                    Before you accept:
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.6; color: #2D261E;">
                    <tr>
                        <td style="width: 24px; color: #5B8C6A; font-weight: bold; padding: 3px 0;">1.</td>
                        <td style="padding: 3px 0;">compare it with other offers</td>
                    </tr>
                    <tr>
                        <td style="color: #5B8C6A; font-weight: bold; padding: 3px 0;">2.</td>
                        <td style="padding: 3px 0;">check the full compensation</td>
                    </tr>
                    <tr>
                        <td style="color: #5B8C6A; font-weight: bold; padding: 3px 0;">3.</td>
                        <td style="padding: 3px 0;">ask about growth and benefits</td>
                    </tr>
                    <tr>
                        <td style="color: #5B8C6A; font-weight: bold; padding: 3px 0;">4.</td>
                        <td style="padding: 3px 0;">and remember it's okay to negotiate politely.</td>
                    </tr>
                </table>
            </div>
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
            <div style="margin-bottom: 18px;">
                <h1 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #1F1B16; margin: 0 0 10px 0; letter-spacing: -0.2px;">
                    About ${escapeHtml(company)}, and what's next
                </h1>
                <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #4A423A;">
                    Hi ${escapeHtml(firstName)}, I'm sorry about ${escapeHtml(company)}. A rejection says very little about your worth, and almost every offer story has a few of them.
                </p>
            </div>

            <!-- Momentum Card -->
            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-radius: 10px; padding: 18px 20px; margin: 0 0 20px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; color: #1F1B16;">
                    You've applied to <strong>${escapeHtml(String(totalApplications))}</strong> roles so far, and that effort is building toward something.
                </p>
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #5C554E;">
                    Want to look at what to improve next?
                </p>
            </div>
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
            <div style="margin-bottom: 20px;">
                <h1 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #1F1B16; margin: 0 0 8px 0; letter-spacing: -0.2px;">
                    Your week in job hunting
                </h1>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4A423A;">
                    Hi ${escapeHtml(firstName)}, here's your week:
                </p>
            </div>

            <!-- 4-Stat Metric Grid Table -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 22px 0; background-color: #FAF6F0; border: 1px solid #EAE3D9; border-radius: 10px; table-layout: fixed;">
                <tr>
                    <td align="center" style="padding: 16px 8px; border-right: 1px solid #EAE3D9; width: 25%;" class="stat-cell">
                        <div style="font-size: 22px; font-weight: 700; color: #D4663A; line-height: 1.1;">${escapeHtml(String(sent))}</div>
                        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8C827A; letter-spacing: 0.5px; margin-top: 4px;">Applications</div>
                    </td>
                    <td align="center" style="padding: 16px 8px; border-right: 1px solid #EAE3D9; width: 25%;" class="stat-cell">
                        <div style="font-size: 22px; font-weight: 700; color: #1F1B16; line-height: 1.1;">${escapeHtml(String(responses))}</div>
                        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8C827A; letter-spacing: 0.5px; margin-top: 4px;">Responses</div>
                    </td>
                    <td align="center" style="padding: 16px 8px; border-right: 1px solid #EAE3D9; width: 25%;" class="stat-cell">
                        <div style="font-size: 22px; font-weight: 700; color: #5B8C6A; line-height: 1.1;">${escapeHtml(String(interviews))}</div>
                        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8C827A; letter-spacing: 0.5px; margin-top: 4px;">Interviews</div>
                    </td>
                    <td align="center" style="padding: 16px 8px; width: 25%;" class="stat-cell">
                        <div style="font-size: 22px; font-weight: 700; color: #D4663A; line-height: 1.1;">${escapeHtml(String(goalPercent))}%</div>
                        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8C827A; letter-spacing: 0.5px; margin-top: 4px;">Goal Progress</div>
                    </td>
                </tr>
            </table>

            <!-- Exact test phrase included cleanly in prose -->
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #3A332C;">
                Applications sent: ${escapeHtml(String(sent))}. Responses: ${escapeHtml(String(responses))}. Interviews: ${escapeHtml(String(interviews))}. Goal progress: ${escapeHtml(String(goalPercent))}%.
            </p>

            <!-- Encouragement & Strategy Callout Box -->
            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-left: 3px solid #D4663A; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 0 0 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1F1B16;">${escapeHtml(encouragementLine)}</p>
                <p style="margin: 0; font-size: 13px; color: #5C554E; line-height: 1.5;">
                    <strong>Suggested focus for this week:</strong> ${escapeHtml(aiSuggestion)}
                </p>
            </div>
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
            <div style="margin-bottom: 18px;">
                <h1 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #1F1B16; margin: 0 0 10px 0; letter-spacing: -0.2px;">
                    Your job search misses you
                </h1>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4A423A;">
                    Hi ${escapeHtml(firstName)}, it's been a few days. Even one application today keeps the momentum going.
                </p>
            </div>

            <!-- Action Card -->
            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-radius: 10px; padding: 16px 20px; margin: 0 0 20px 0;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1F1B16;">
                    You have <strong>${escapeHtml(String(pendingFollowUps))}</strong> follow-ups waiting.
                </p>
            </div>
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
            <div style="margin-bottom: 20px;">
                <h1 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #1F1B16; margin: 0 0 8px 0; letter-spacing: -0.2px;">
                    Your Resume ATS Report is Ready
                </h1>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4A423A;">
                    Hi ${escapeHtml(firstName)}, we analyzed ${escapeHtml(resumeName)}. Your ATS score is ${escapeHtml(String(score))}/100.
                </p>
            </div>

            <!-- Score Hero Card -->
            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-radius: 10px; padding: 20px; margin: 0 0 20px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="width: 70px; vertical-align: middle;">
                            <div style="background-color: #D4663A; color: #FFFFFF; font-size: 22px; font-weight: bold; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; text-align: center;">
                                ${escapeHtml(String(score))}
                            </div>
                        </td>
                        <td style="vertical-align: middle; padding-left: 12px;">
                            <div style="font-size: 15px; font-weight: 700; color: #1F1B16;">${escapeHtml(resumeName)}</div>
                            <div style="font-size: 12px; color: #8C827A; margin-top: 2px;">ATS Health & Parsability Index</div>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Top 3 Fixes Card -->
            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-radius: 10px; padding: 18px 20px; margin: 0 0 20px 0;">
                <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #D4663A; margin-bottom: 10px;">
                    Top 3 fixes:
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.6; color: #2D261E;">
                    <tr>
                        <td style="width: 24px; color: #D4663A; font-weight: bold; padding: 4px 0;">1.</td>
                        <td style="padding: 4px 0;">${escapeHtml(fix1)}</td>
                    </tr>
                    <tr>
                        <td style="color: #D4663A; font-weight: bold; padding: 4px 0;">2.</td>
                        <td style="padding: 4px 0;">${escapeHtml(fix2)}</td>
                    </tr>
                    <tr>
                        <td style="color: #D4663A; font-weight: bold; padding: 4px 0;">3.</td>
                        <td style="padding: 4px 0;">${escapeHtml(fix3)}</td>
                    </tr>
                </table>
            </div>

            <p style="margin: 0 0 6px 0; font-size: 14px; line-height: 1.6; color: #5C554E;">
                Fixing these could lift your score noticeably.
            </p>
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
            <div style="margin-bottom: 18px;">
                <h1 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #1F1B16; margin: 0 0 10px 0; letter-spacing: -0.2px;">
                    Account Deleted
                </h1>
                <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #4A423A;">
                    Hi ${escapeHtml(firstName)}, your account and data have been deleted as requested. We're sorry to see you go, and you're always welcome back.
                </p>
            </div>

            <div style="background-color: #FAF6F0; border: 1px solid #EFEAE4; border-radius: 10px; padding: 16px 20px; margin: 0 0 20px 0;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #5C554E;">
                    All associated applications, resumes, and personal metrics have been permanently erased from our active databases.
                </p>
            </div>
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
