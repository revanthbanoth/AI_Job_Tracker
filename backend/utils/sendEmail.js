const nodemailer = require('nodemailer');
const axios = require('axios');

/**
 * Send an email using:
 * 1. Resend HTTP REST API (HTTPS Port 443 - Bypasses Render free-tier SMTP blocks)
 * 2. Brevo HTTP REST API (HTTPS Port 443 - Bypasses Render free-tier SMTP blocks)
 * 3. Traditional SMTP (Gmail / Custom SMTP) - for localhost or paid cloud plans
 * 4. Development test fallback (Ethereal / simulation)
 */
const sendEmail = async ({ to, subject, html, text, attachments }) => {
    // -------------------------------------------------------------------------
    // OPTION 1: Resend HTTP REST API (HTTPS Port 443 - Works 100% on Render Free)
    // -------------------------------------------------------------------------
    if (process.env.RESEND_API_KEY) {
        try {
            const cleanKey = process.env.RESEND_API_KEY.trim();
            // Default sandbox sender or verified custom domain
            const from = process.env.EMAIL_FROM 
                ? process.env.EMAIL_FROM.replace(/^["']|["']$/g, '').trim()
                : 'JobTracker <onboarding@resend.dev>';

            const payload = {
                from,
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
                text,
            };

            if (attachments && Array.isArray(attachments) && attachments.length > 0) {
                payload.attachments = attachments.map(att => ({
                    filename: att.filename,
                    content: Buffer.isBuffer(att.content) 
                        ? att.content.toString('base64') 
                        : Buffer.from(att.content).toString('base64'),
                }));
            }

            const response = await axios.post('https://api.resend.com/emails', payload, {
                headers: {
                    'Authorization': `Bearer ${cleanKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });

            return {
                success: true,
                messageId: response.data?.id,
                provider: 'resend',
            };
        } catch (resendErr) {
            const errDetail = resendErr.response?.data?.message || resendErr.message;
            console.error('[sendEmail Resend Error]:', errDetail);
            throw new Error(`Resend API Error: ${errDetail}`);
        }
    }

    // -------------------------------------------------------------------------
    // OPTION 2: Brevo HTTP REST API (HTTPS Port 443 - Works on Render Free)
    // -------------------------------------------------------------------------
    if (process.env.BREVO_API_KEY) {
        try {
            const cleanKey = process.env.BREVO_API_KEY.trim();
            const senderEmail = (process.env.EMAIL_USER || 'jobtrackerai.in@gmail.com').trim();
            const senderName = 'JobTracker';

            const payload = {
                sender: { name: senderName, email: senderEmail },
                to: [{ email: to }],
                subject,
                htmlContent: html,
                textContent: text,
            };

            if (attachments && Array.isArray(attachments) && attachments.length > 0) {
                payload.attachment = attachments.map(att => ({
                    name: att.filename,
                    content: Buffer.isBuffer(att.content) 
                        ? att.content.toString('base64') 
                        : Buffer.from(att.content).toString('base64'),
                }));
            }

            const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
                headers: {
                    'api-key': cleanKey,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });

            return {
                success: true,
                messageId: response.data?.messageId,
                provider: 'brevo',
            };
        } catch (brevoErr) {
            const errDetail = brevoErr.response?.data?.message || brevoErr.message;
            console.error('[sendEmail Brevo Error]:', errDetail);
            throw new Error(`Brevo API Error: ${errDetail}`);
        }
    }

    // -------------------------------------------------------------------------
    // OPTION 3: Traditional SMTP (Works locally or on non-blocked cloud hosts)
    // -------------------------------------------------------------------------
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
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });
    } else if (cleanUser && cleanPass) {
        if (cleanService === 'gmail') {
            transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: cleanUser,
                    pass: cleanPass,
                },
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
            });
        } else {
            transporter = nodemailer.createTransport({
                service: cleanService,
                auth: {
                    user: cleanUser,
                    pass: cleanPass,
                },
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
            });
        }
    } else {
        if (process.env.NODE_ENV === 'production') {
            console.warn('[sendEmail WARNING] Live email credentials (EMAIL_USER / EMAIL_PASS or RESEND_API_KEY) are missing in Render environment variables. Falling back to test mode.');
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
        provider: 'smtp',
    };
};

module.exports = sendEmail;
