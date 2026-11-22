/**
 * RFC 5545 ICS Calendar Invite & Web Links Generator
 */

const formatIcsDate = (date) => {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Generate standard .ics calendar invite string
 */
const generateIcsContent = ({
    title,
    description,
    location,
    startDate,
    endDate,
    organizerEmail = 'noreply@jobtracker.com',
    attendeeEmail
}) => {
    const start = formatIcsDate(startDate);
    const end = formatIcsDate(endDate || new Date(new Date(startDate).getTime() + 45 * 60 * 1000));
    const now = formatIcsDate(new Date());
    const uid = `interview-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@jobtracker.com`;

    const cleanTitle = (title || 'Interview').replace(/\n/g, ' ');
    const cleanLocation = (location || 'Virtual / Details to follow').replace(/\n/g, ' ');
    const cleanDesc = (description || '').replace(/\n/g, '\\n');

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//JobTracker//JobTracker Interview Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${cleanTitle}`,
        `DESCRIPTION:${cleanDesc}`,
        `LOCATION:${cleanLocation}`,
        'STATUS:CONFIRMED',
        `ORGANIZER;CN=JobTracker:mailto:${organizerEmail}`,
        attendeeEmail ? `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${attendeeEmail}:mailto:${attendeeEmail}` : '',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Interview Reminder',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
};

/**
 * Generate Google Calendar Web URL
 */
const generateGoogleCalendarUrl = ({ title, description, location, startDate, endDate }) => {
    const start = formatIcsDate(startDate);
    const end = formatIcsDate(endDate || new Date(new Date(startDate).getTime() + 45 * 60 * 1000));
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title || 'Interview',
        dates: `${start}/${end}`,
        details: description || '',
        location: location || '',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook Web Calendar URL
 */
const generateOutlookCalendarUrl = ({ title, description, location, startDate, endDate }) => {
    const start = new Date(startDate).toISOString();
    const end = new Date(endDate || new Date(startDate).getTime() + 45 * 60 * 1000).toISOString();
    const params = new URLSearchParams({
        subject: title || 'Interview',
        startdt: start,
        enddt: end,
        body: description || '',
        location: location || '',
        path: '/calendar/action/compose',
        rru: 'addevent',
    });
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

module.exports = {
    generateIcsContent,
    generateGoogleCalendarUrl,
    generateOutlookCalendarUrl,
};
