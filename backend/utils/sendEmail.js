const nodemailer = require('nodemailer');

/**
 * Send an email using configured SMTP service or fallback for development.
 * 
 * Supports:
 * 1. Gmail / Preconfigured service via:
 *    EMAIL_SERVICE (default: 'gmail')
 *    EMAIL_USER
 *    EMAIL_PASS (e.g. Gmail App Password)
 * 2. Custom SMTP via:
 *    SMTP_HOST
 *    SMTP_PORT
 *    SMTP_USER
 *    SMTP_PASS
 *    SMTP_SECURE (true/false)
 * 3. Development / Test fallback:
 *    If no credentials are set, creates an Ethereal test mailbox or logs reset URL.
 */
const sendEmail = async ({ to, subject, html, text, attachments }) => {
    let transporter = null;
    let isTestAccount = false;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    } else {
        // Fallback: try Ethereal test account or local simulation
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            isTestAccount = true;
        } catch (etherealErr) {
            console.warn('[sendEmail] Could not create Ethereal test account. Falling back to console log:', etherealErr.message);
            transporter = null;
        }
    }

    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"AI Job Tracker" <noreply@aijobtracker.com>';

    if (!transporter) {
        console.log(`\n================== [EMAIL SIMULATION] ==================`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content:\n${text || html}`);
        console.log(`========================================================\n`);
        return {
            success: true,
            simulated: true,
            messageId: 'simulated-' + Date.now(),
        };
    }

    const mailOptions = {
        from: fromAddress,
        to,
        subject,
        text,
        html,
    };

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);
    let previewUrl = null;
    if (isTestAccount) {
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[sendEmail] Test Email sent! Preview URL: ${previewUrl}`);
    }

    return {
        success: true,
        messageId: info.messageId,
        previewUrl,
        isTestAccount,
    };
};

module.exports = sendEmail;
