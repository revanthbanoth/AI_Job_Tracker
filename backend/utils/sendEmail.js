const nodemailer = require('nodemailer');

/**
 * Send an email using configured SMTP service or fallback for development/testing.
 * 
 * Supports:
 * 1. Gmail with Port 465 Direct SSL (optimal for cloud containers like Render)
 *    EMAIL_USER
 *    EMAIL_PASS (e.g. 16-character Gmail App Password)
 *    EMAIL_SERVICE (optional, defaults to gmail)
 * 2. Custom SMTP via:
 *    SMTP_HOST
 *    SMTP_PORT
 *    SMTP_USER
 *    SMTP_PASS
 *    SMTP_SECURE (true/false)
 * 3. Development / Test fallback:
 *    If no credentials are set, uses Ethereal test account or logs to console.
 */
const sendEmail = async ({ to, subject, html, text, attachments }) => {
    let transporter = null;
    let isTestAccount = false;

    // Sanitize credentials: strip whitespace, newlines, and accidental quotes
    const cleanUser = (process.env.EMAIL_USER || '').trim().replace(/^["']|["']$/g, '');
    const cleanPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').replace(/^["']|["']$/g, '');
    const cleanService = (process.env.EMAIL_SERVICE || 'gmail').trim().toLowerCase();

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST.trim(),
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER.trim(),
                pass: process.env.SMTP_PASS.trim(),
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 20000,
        });
    } else if (cleanUser && cleanPass) {
        if (cleanService === 'gmail') {
            // Port 465 with SSL direct is the most reliable, firewall-resistant
            // transport on Render, AWS, and Linux cloud containers
            transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: cleanUser,
                    pass: cleanPass,
                },
                connectionTimeout: 15000,
                greetingTimeout: 15000,
                socketTimeout: 20000,
            });
        } else {
            transporter = nodemailer.createTransport({
                service: cleanService,
                auth: {
                    user: cleanUser,
                    pass: cleanPass,
                },
                connectionTimeout: 15000,
                greetingTimeout: 15000,
                socketTimeout: 20000,
            });
        }
    } else {
        if (process.env.NODE_ENV === 'production') {
            console.warn('[sendEmail WARNING] Live email credentials (EMAIL_USER / EMAIL_PASS) are missing in Render environment variables. Falling back to test mode.');
        }

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

    const fromAddress = process.env.EMAIL_FROM 
        ? process.env.EMAIL_FROM.replace(/^["']|["']$/g, '').trim()
        : (cleanUser ? `"JobTracker" <${cleanUser}>` : '"JobTracker" <noreply@aijobtracker.com>');

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
