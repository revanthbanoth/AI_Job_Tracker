/**
 * Shared Transactional Email Layout Engine for JobTracker
 * 
 * Design Standards:
 * - Cream background #FAF6F0
 * - White card (max-width 600px, border-radius 12px, border 1px solid #EFEAE4)
 * - Ink text #1F1B16
 * - Terracotta button #D4663A (white text, rounded corners)
 * - Header: "JobTracker" in Georgia serif
 * - Body: Arial / system sans-serif (email-safe, mobile-friendly)
 * - Footer: "JobTracker - Thoughtful Careers", Manage preferences & Unsubscribe (non-security only)
 */

const getFrontendUrl = () => {
    let url = (process.env.FRONTEND_URL || '').trim();
    if (!url || url.includes('your-frontend-app') || url.includes('example.com')) {
        url = 'https://ai-job-tracker-htng.onrender.com';
    }
    return url.split(',')[0].trim().replace(/\/$/, '');
};

const escapeHtml = (unsafe) => {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const getFirstName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'there';
    const trimmed = fullName.trim();
    if (!trimmed) return 'there';
    const first = trimmed.split(/\s+/)[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
};

/**
 * Render shared email layout
 */
const renderEmailLayout = ({
    title,
    firstName,
    bodyHtml,
    bodyText,
    buttonText,
    buttonUrl,
    secondaryButtons = [], // [{ text, url, secondary: true }]
    fallbackText,
    fallbackUrl,
    footerNote,
    isSecurityEmail = false,
    unsubscribeToken = null,
}) => {
    const clientUrl = getFrontendUrl();
    const preferencesUrl = `${clientUrl}/settings?tab=notifications${unsubscribeToken ? `&token=${unsubscribeToken}` : ''}`;
    const unsubscribeUrl = `${clientUrl}/unsubscribe?token=${unsubscribeToken || 'all'}`;

    // Action buttons HTML
    let buttonsHtml = '';
    if (buttonText && buttonUrl) {
        buttonsHtml += `
            <a href="${buttonUrl}" target="_blank" style="display: inline-block; background-color: #D4663A; color: #FFFFFF; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600; line-height: 1; text-decoration: none; padding: 13px 26px; border-radius: 8px; margin: 4px 6px 4px 0; text-align: center; box-shadow: 0 2px 6px rgba(212, 102, 58, 0.2);">
                ${escapeHtml(buttonText)}
            </a>
        `;
    }

    if (secondaryButtons && Array.isArray(secondaryButtons) && secondaryButtons.length > 0) {
        secondaryButtons.forEach(btn => {
            buttonsHtml += `
                <a href="${btn.url}" target="_blank" style="display: inline-block; background-color: #F4EFEA; color: #1F1B16; border: 1px solid #E5DCD3; font-family: Arial, sans-serif; font-size: 13px; font-weight: 600; line-height: 1; text-decoration: none; padding: 12px 20px; border-radius: 8px; margin: 4px 6px 4px 0; text-align: center;">
                    ${escapeHtml(btn.text)}
                </a>
            `;
        });
    }

    // Fallback URL HTML
    let fallbackHtml = '';
    if (fallbackText && fallbackUrl) {
        fallbackHtml = `
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #EFEAE4; font-size: 12px; line-height: 1.5; color: #6E675F;">
                <p style="margin: 0 0 6px 0;">${escapeHtml(fallbackText)}</p>
                <p style="margin: 0; word-break: break-all;">
                    <a href="${fallbackUrl}" style="color: #D4663A; text-decoration: underline;">${escapeHtml(fallbackUrl)}</a>
                </p>
            </div>
        `;
    }

    // Footer note (e.g. Questions? Just reply to this email.)
    let noteHtml = '';
    if (footerNote) {
        noteHtml = `
            <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.5; color: #6E675F;">
                ${escapeHtml(footerNote)}
            </p>
        `;
    }

    // Unsubscribe link (non-security only)
    const unsubscribeLinkHtml = !isSecurityEmail
        ? ` &bull; <a href="${unsubscribeUrl}" style="color: #8C827A; text-decoration: underline;">Unsubscribe</a>`
        : '';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${escapeHtml(title || 'JobTracker')}</title>
    <style>
        body { margin: 0; padding: 0; background-color: #FAF6F0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-spacing: 0; border-collapse: collapse; }
        img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
        @media only screen and (max-width: 600px) {
            .email-card { width: 100% !important; padding: 24px 20px !important; }
            .email-container { padding: 12px 10px !important; }
            .button-stack { display: block !important; width: 100% !important; margin: 6px 0 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF6F0; font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; color: #1F1B16;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF6F0; width: 100%; table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 32px 16px;" class="email-container">
                <!-- Main Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #EFEAE4; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(31, 27, 22, 0.04);" class="email-card">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 32px 32px 12px 32px; text-align: left; border-bottom: 1px solid #FAF6F0;">
                            <span style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #1F1B16; letter-spacing: -0.3px; display: inline-block;">
                                JobTracker
                            </span>
                        </td>
                    </tr>
                    <!-- Email Content Body -->
                    <tr>
                        <td style="padding: 24px 32px 32px 32px; font-size: 15px; line-height: 1.6; color: #1F1B16;">
                            ${bodyHtml}
                            
                            ${buttonsHtml ? `<div style="margin-top: 24px;">${buttonsHtml}</div>` : ''}

                            ${fallbackHtml}

                            ${noteHtml}
                        </td>
                    </tr>
                </table>

                <!-- Email Footer -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 20px;">
                    <tr>
                        <td style="text-align: center; font-size: 12px; line-height: 1.6; color: #8C827A; padding: 0 16px;">
                            <p style="margin: 0 0 6px 0; font-weight: 500;">
                                JobTracker &bull; Thoughtful Careers
                            </p>
                            <p style="margin: 0;">
                                <a href="${preferencesUrl}" style="color: #8C827A; text-decoration: underline;">Manage email preferences</a>${unsubscribeLinkHtml}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();

    // Plain text alternative
    let text = `${bodyText}\n\n`;
    if (buttonText && buttonUrl) {
        text += `${buttonText}: ${buttonUrl}\n\n`;
    }
    if (secondaryButtons && secondaryButtons.length > 0) {
        secondaryButtons.forEach(btn => {
            text += `${btn.text}: ${btn.url}\n`;
        });
        text += '\n';
    }
    if (fallbackText && fallbackUrl) {
        text += `${fallbackText}\n${fallbackUrl}\n\n`;
    }
    if (footerNote) {
        text += `${footerNote}\n\n`;
    }
    text += `---\nJobTracker - Thoughtful Careers\nManage email preferences: ${preferencesUrl}\n`;
    if (!isSecurityEmail) {
        text += `Unsubscribe: ${unsubscribeUrl}\n`;
    }

    return { html, text: text.trim() };
};

module.exports = {
    escapeHtml,
    getFirstName,
    renderEmailLayout,
    getFrontendUrl,
};
