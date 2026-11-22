/**
 * Formats a Date object into UTC YYYYMMDDTHHmmssZ for calendar formats
 */
function formatUtcForCalendar(date) {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Builds a direct Google Calendar Web Intent URL
 */
export function generateGoogleCalendarUrl({
    title = 'Job Application Event',
    description = '',
    location = '',
    startDate = new Date(),
    endDate = null
}) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default

    const datesParam = `${formatUtcForCalendar(start)}/${formatUtcForCalendar(end)}`;

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: datesParam,
        details: description,
        location: location || ''
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates and triggers download of a standard RFC 5545 .ics iCalendar file
 */
export function downloadIcsFile({
    title = 'Job Application Event',
    description = '',
    location = '',
    startDate = new Date(),
    endDate = null,
    filename = 'job-tracker-event.ics'
}) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000);
    const now = new Date();

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//AI JobTracker//Career Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${now.getTime()}-${Math.random().toString(36).substring(2, 9)}@aijobtracker.app`,
        `DTSTAMP:${formatUtcForCalendar(now)}`,
        `DTSTART:${formatUtcForCalendar(start)}`,
        `DTEND:${formatUtcForCalendar(end)}`,
        `SUMMARY:${title.replace(/\n/g, ' ')}`,
        `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
        `LOCATION:${(location || '').replace(/\n/g, ' ')}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
}

/**
 * Exports application records into formatted, CSV download
 */
export function exportApplicationsToCsv(applications = []) {
    if (!applications || applications.length === 0) {
        alert('No applications to export.');
        return;
    }

    const headers = [
        'Company',
        'Position',
        'Status',
        'Location',
        'Salary',
        'Source',
        'Job URL',
        'Linked Resume',
        'Interview Date',
        'Deadline Date',
        'Date Applied',
        'Last Updated',
        'Notes'
    ];

    const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    };

    const rows = applications.map(app => [
        escapeCsv(app.company),
        escapeCsv(app.position),
        escapeCsv(app.status),
        escapeCsv(app.location || ''),
        escapeCsv(app.salary || ''),
        escapeCsv(app.source || 'Direct'),
        escapeCsv(app.jobUrl || ''),
        escapeCsv(app.resumeId?.name || ''),
        escapeCsv(app.interviewDate ? new Date(app.interviewDate).toLocaleDateString() : ''),
        escapeCsv(app.deadlineDate ? new Date(app.deadlineDate).toLocaleDateString() : ''),
        escapeCsv(app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ''),
        escapeCsv(app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : ''),
        escapeCsv(app.notes || '')
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `job-applications-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
}
