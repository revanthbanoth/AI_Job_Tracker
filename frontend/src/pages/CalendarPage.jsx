import { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    Sparkles,
    ExternalLink,
    Download,
    Check,
    X,
    Building2,
    CalendarCheck,
    AlertCircle
} from 'lucide-react';
import HeadingUnderline from '../components/HeadingUnderline';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarExport';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('All'); // 'All' | 'Interviews' | 'Follow-ups' | 'Deadlines'

    // Schedule Event Modal state
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);
    const [scheduleType, setScheduleType] = useState('interview'); // 'interview' | 'deadline'
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('10:00');
    const [calendarNotes, setCalendarNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchApps = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/api/applications');
                setApplications(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to fetch applications for calendar', err);
            } finally {
                setLoading(false);
            }
        };

        fetchApps();
    }, []);

    // Calendar computation
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Build unified events list
    const events = [];
    applications.forEach(app => {
        // 1. Scheduled Interviews
        if (app.interviewDate) {
            const dateObj = new Date(app.interviewDate);
            events.push({
                id: `interview-${app._id || app.id}`,
                app,
                type: 'interview',
                title: `Interview: ${app.company}`,
                position: app.position,
                date: dateObj,
                dateKey: `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`,
                color: 'bg-amber/15 text-amber-800 dark:text-amber-300 border-amber/30',
                badgeText: 'Interview'
            });
        }

        // 2. Deadlines
        if (app.deadlineDate) {
            const dateObj = new Date(app.deadlineDate);
            events.push({
                id: `deadline-${app._id || app.id}`,
                app,
                type: 'deadline',
                title: `Deadline: ${app.company}`,
                position: app.position,
                date: dateObj,
                dateKey: `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`,
                color: 'bg-terracotta/15 text-terracotta border-terracotta/30',
                badgeText: 'Deadline'
            });
        }

        // 3. 7-Day Follow-up recommendation milestones
        if (app.status === 'Applied' && !app.interviewDate) {
            const created = new Date(app.createdAt || new Date());
            const followUpDate = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
            events.push({
                id: `followup-${app._id || app.id}`,
                app,
                type: 'followup',
                title: `Follow Up: ${app.company}`,
                position: app.position,
                date: followUpDate,
                dateKey: `${followUpDate.getFullYear()}-${followUpDate.getMonth()}-${followUpDate.getDate()}`,
                color: 'bg-sage/15 text-sage border-sage/35',
                badgeText: 'Follow-up'
            });
        }
    });

    const filteredEvents = events.filter(e => {
        if (filterType === 'Interviews') return e.type === 'interview';
        if (filterType === 'Follow-ups') return e.type === 'followup';
        if (filterType === 'Deadlines') return e.type === 'deadline';
        return true;
    });

    // Calendar Cells Generation
    const cells = [];
    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        cells.push({
            day: daysInPrevMonth - i,
            isCurrentMonth: false,
            dateKey: `${month === 0 ? year - 1 : year}-${month === 0 ? 11 : month - 1}-${daysInPrevMonth - i}`
        });
    }
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        cells.push({
            day,
            isCurrentMonth: true,
            dateKey: `${year}-${month}-${day}`
        });
    }
    // Next month padding to fill grid
    const remaining = 42 - cells.length; // 6 rows * 7
    for (let day = 1; day <= remaining; day++) {
        cells.push({
            day,
            isCurrentMonth: false,
            dateKey: `${month === 11 ? year + 1 : year}-${month === 11 ? 0 : month + 1}-${day}`
        });
    }

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    // Handle Saving Event Date
    const handleSaveEvent = async (e) => {
        e.preventDefault();
        if (!selectedApp || !eventDate) return;

        setSaving(true);
        try {
            const fullDateTime = new Date(`${eventDate}T${eventTime || '10:00'}`);
            const updatePayload = {
                calendarNotes
            };

            if (scheduleType === 'interview') {
                updatePayload.interviewDate = fullDateTime;
                if (selectedApp.status === 'Applied' || selectedApp.status === 'Screening') {
                    updatePayload.status = 'Interviewing';
                }
            } else {
                updatePayload.deadlineDate = fullDateTime;
            }

            const { data: updated } = await api.put(`/api/applications/${selectedApp._id || selectedApp.id}`, updatePayload);

            setApplications(prev => prev.map(a => (a._id === updated._id || a.id === updated._id) ? updated : a));
            setIsScheduleModalOpen(false);
            setSelectedApp(null);
            setEventDate('');
        } catch (err) {
            console.error('Failed to schedule event', err);
            alert('Failed to save schedule. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <div className="relative inline-block">
                        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text tracking-tight">Calendar & Milestones</h1>
                        <HeadingUnderline className="text-primary max-w-[200px]" />
                    </div>
                    <p className="text-muted mt-2 text-sm sm:text-base font-sans">
                        Coordinate interviews, 7-day follow-ups, and application deadlines.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Filter buttons */}
                    <div className="bg-card border border-border rounded-xl p-1 flex items-center shadow-warm-sm text-xs font-semibold">
                        {['All', 'Interviews', 'Follow-ups', 'Deadlines'].map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                    filterType === type
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-muted hover:text-text'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* Schedule Event button */}
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedApp(applications[0] || null);
                            setEventDate(new Date().toISOString().slice(0, 10));
                            setIsScheduleModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-warm flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus size={16} />
                        <span>Schedule Event</span>
                    </button>
                </div>
            </div>

            {/* Main Calendar Section & Upcoming Events Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar Grid (3 columns on large screens) */}
                <div className="lg:col-span-3 bg-card border border-border rounded-card p-5 shadow-warm flex flex-col justify-between">
                    {/* Month Navigator */}
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <h2 className="font-serif text-xl sm:text-2xl font-bold text-text">
                                {monthName} {year}
                            </h2>
                            <button
                                type="button"
                                onClick={handleToday}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-card-subtle text-muted hover:text-text border border-border transition-colors cursor-pointer"
                            >
                                Today
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-2 rounded-lg hover:bg-card-subtle text-muted hover:text-text transition-colors cursor-pointer"
                                title="Previous Month"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-2 rounded-lg hover:bg-card-subtle text-muted hover:text-text transition-colors cursor-pointer"
                                title="Next Month"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 text-center font-serif text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                        {DAYS_OF_WEEK.map(d => (
                            <div key={d} className="py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Day Cells */}
                    <div className="grid grid-cols-7 gap-1.5 flex-1">
                        {cells.map((cell, idx) => {
                            const isToday = cell.dateKey === todayKey;
                            const cellEvents = filteredEvents.filter(e => e.dateKey === cell.dateKey);

                            return (
                                <div
                                    key={idx}
                                    className={`min-h-[90px] sm:min-h-[105px] p-1.5 rounded-xl border transition-all flex flex-col justify-between ${
                                        cell.isCurrentMonth
                                            ? 'bg-card-subtle/30 border-border/80'
                                            : 'bg-card-subtle/10 border-border/30 opacity-40'
                                    } ${isToday ? 'ring-2 ring-primary border-primary/50' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`text-xs font-mono font-semibold rounded-md w-6 h-6 flex items-center justify-center ${
                                                isToday
                                                    ? 'bg-primary text-white font-bold'
                                                    : cell.isCurrentMonth ? 'text-text' : 'text-muted'
                                            }`}
                                        >
                                            {cell.day}
                                        </span>
                                        {cellEvents.length > 0 && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        )}
                                    </div>

                                    {/* Events inside this day */}
                                    <div className="space-y-1 mt-1 overflow-hidden flex-1">
                                        {cellEvents.slice(0, 2).map((ev) => (
                                            <div
                                                key={ev.id}
                                                className={`text-[10px] px-1.5 py-0.5 rounded border truncate font-sans font-medium ${ev.color}`}
                                                title={`${ev.title} (${ev.position})`}
                                            >
                                                {ev.title}
                                            </div>
                                        ))}
                                        {cellEvents.length > 2 && (
                                            <span className="text-[9px] text-muted font-medium pl-1">
                                                +{cellEvents.length - 2} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Upcoming Events Agenda Sidebar (1 column) */}
                <div className="bg-card border border-border rounded-card p-5 shadow-warm flex flex-col justify-between space-y-4">
                    <div>
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-primary" />
                                <h3 className="font-serif font-bold text-base text-text">Upcoming Agenda</h3>
                            </div>
                            <span className="text-xs text-muted font-mono">{filteredEvents.length} items</span>
                        </div>

                        {filteredEvents.length === 0 ? (
                            <div className="py-12 text-center text-xs text-muted space-y-2">
                                <CalendarCheck size={28} className="text-muted/50 mx-auto" />
                                <p>No events found for this filter.</p>
                                <p className="text-[11px] text-muted/80">Schedule an interview date or follow-up deadline.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                                {filteredEvents
                                    .sort((a, b) => a.date - b.date)
                                    .map(ev => {
                                        const googleUrl = generateGoogleCalendarUrl({
                                            title: `${ev.badgeText}: ${ev.app.company} (${ev.app.position})`,
                                            description: `Job Application Milestone with ${ev.app.company}.\nRole: ${ev.app.position}\nNotes: ${ev.app.notes || 'Tracked via AI JobTracker'}`,
                                            location: ev.app.location || 'Remote',
                                            startDate: ev.date
                                        });

                                        return (
                                            <div
                                                key={ev.id}
                                                className="p-3 rounded-xl bg-card-subtle border border-border space-y-2 group hover:border-primary/40 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-block mb-1 ${ev.color}`}>
                                                            {ev.badgeText}
                                                        </span>
                                                        <h4 className="font-serif font-bold text-sm text-text leading-tight">
                                                            {ev.app.company}
                                                        </h4>
                                                        <p className="text-xs text-muted font-sans truncate max-w-[170px]">
                                                            {ev.app.position}
                                                        </p>
                                                    </div>
                                                    <span className="text-[11px] font-mono text-muted shrink-0">
                                                        {ev.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>

                                                {/* Calendar Action Buttons */}
                                                <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
                                                    <a
                                                        href={googleUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-2 py-1 bg-card hover:bg-card-subtle text-text border border-border rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                                                        title="Add directly to Google Calendar"
                                                    >
                                                        <ExternalLink size={10} />
                                                        <span>Google Cal</span>
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => downloadIcsFile({
                                                            title: `${ev.badgeText}: ${ev.app.company} (${ev.app.position})`,
                                                            description: `Milestone for ${ev.app.position} at ${ev.app.company}.`,
                                                            location: ev.app.location || 'Remote',
                                                            startDate: ev.date,
                                                            filename: `${ev.app.company.toLowerCase()}-${ev.badgeText.toLowerCase()}.ics`
                                                        })}
                                                        className="px-2 py-1 bg-card hover:bg-card-subtle text-muted hover:text-text border border-border rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                                                        title="Download .ics file for Outlook / Apple Calendar"
                                                    >
                                                        <Download size={10} />
                                                        <span>.ics</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Schedule Event Modal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-modal shadow-warm-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card-subtle/50">
                            <div className="flex items-center gap-2">
                                <CalendarIcon size={18} className="text-primary" />
                                <h3 className="font-serif text-lg font-bold text-text">Schedule Calendar Event</h3>
                            </div>
                            <button
                                onClick={() => setIsScheduleModalOpen(false)}
                                className="p-1 text-muted hover:text-text rounded-lg hover:bg-card transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                                    Target Application
                                </label>
                                <select
                                    value={selectedApp?._id || selectedApp?.id || ''}
                                    onChange={(e) => {
                                        const found = applications.find(a => (a._id || a.id) === e.target.value);
                                        setSelectedApp(found);
                                    }}
                                    required
                                    className="w-full px-3 py-2.5 bg-card-subtle border border-border rounded-xl text-xs text-text focus:outline-none focus:border-primary"
                                >
                                    {applications.map(app => (
                                        <option key={app._id || app.id} value={app._id || app.id}>
                                            {app.company} – {app.position} ({app.status})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                                    Event Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setScheduleType('interview')}
                                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                            scheduleType === 'interview'
                                                ? 'bg-amber/20 text-amber-800 dark:text-amber-300 border-amber/40 font-bold'
                                                : 'bg-card-subtle border-border text-muted hover:text-text'
                                        }`}
                                    >
                                        Interview Stage
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setScheduleType('deadline')}
                                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                            scheduleType === 'deadline'
                                                ? 'bg-terracotta/20 text-terracotta border-terracotta/40 font-bold'
                                                : 'bg-card-subtle border-border text-muted hover:text-text'
                                        }`}
                                    >
                                        Offer / Task Deadline
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-card-subtle border border-border rounded-xl text-xs text-text focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                                        Time
                                    </label>
                                    <input
                                        type="time"
                                        value={eventTime}
                                        onChange={(e) => setEventTime(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-card-subtle border border-border rounded-xl text-xs text-text focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                                    Notes & Meeting Link
                                </label>
                                <textarea
                                    rows="2"
                                    value={calendarNotes}
                                    onChange={(e) => setCalendarNotes(e.target.value)}
                                    placeholder="e.g. Google Meet link, technical panel round, behavioral prep notes..."
                                    className="w-full px-3 py-2.5 bg-card-subtle border border-border rounded-xl text-xs text-text focus:outline-none focus:border-primary resize-none"
                                />
                            </div>

                            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsScheduleModalOpen(false)}
                                    className="px-4 py-2 bg-card hover:bg-card-subtle text-text border border-border rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-warm"
                                >
                                    {saving ? 'Saving...' : 'Add to Calendar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;
