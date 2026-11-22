import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, Clock, MapPin, DollarSign, ArrowRight, ArrowLeft, ExternalLink, Sparkles, FileText, CheckCircle2, LayoutGrid, Columns3 } from 'lucide-react';
import { triggerOfferConfetti } from '../utils/confetti';

const COLUMNS = [
    { id: 'Wishlist', label: 'Wishlist', tone: 'border-stone-300 dark:border-stone-700 bg-stone-500/10 text-text' },
    { id: 'Applied', label: 'Applied', tone: 'border-primary/30 bg-primary/10 text-primary' },
    { id: 'Screening', label: 'Screening', tone: 'border-amber/30 bg-amber/10 text-amber' },
    { id: 'Interviewing', label: 'Interview', tone: 'border-amber-600/30 bg-amber-600/10 text-amber-600 dark:text-amber-400' },
    { id: 'Offer', label: 'Offer 🎉', tone: 'border-sage/40 bg-sage/15 text-sage' },
    { id: 'Rejected', label: 'Closed Chapter', tone: 'border-border bg-card-subtle text-muted' },
];

const STAGE_ORDER = ['Wishlist', 'Applied', 'Screening', 'Interviewing', 'Offer', 'Rejected'];

const KanbanBoard = ({
    applications = [],
    onSelectApp,
    onStatusChange,
    onQuickAdd,
    onAnalyzeApp,
    onOpenCopilot
}) => {
    const shouldReduceMotion = useReducedMotion();
    const now = new Date();

    const [boardLayout, setBoardLayout] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('kanban_board_layout') || 'wrap';
        }
        return 'wrap';
    });

    const handleLayoutToggle = (mode) => {
        setBoardLayout(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('kanban_board_layout', mode);
        }
    };

    const handleMove = (app, direction) => {
        const currentIndex = STAGE_ORDER.indexOf(app.status === 'Interview' ? 'Interviewing' : app.status);
        const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= 0 && nextIndex < STAGE_ORDER.length) {
            const nextStatus = STAGE_ORDER[nextIndex];
            onStatusChange(app.id || app._id, nextStatus);
            if (nextStatus === 'Offer') {
                triggerOfferConfetti();
            }
        }
    };

    return (
        <div className="space-y-3">
            {/* Board Layout Sub-bar */}
            <div className="flex items-center justify-between px-1">
                <div className="text-xs text-muted font-medium flex items-center gap-2">
                    <span className="font-semibold text-text">6 Pipeline Stages</span>
                    <span className="text-[10px] text-muted">•</span>
                    <span className="text-[11px] text-muted hidden sm:inline">
                        {boardLayout === 'wrap' ? '2-row grid (scrolls down naturally)' : 'Horizontal scrolling lane'}
                    </span>
                </div>
                <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-warm-sm">
                    <button
                        type="button"
                        onClick={() => handleLayoutToggle('wrap')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            boardLayout === 'wrap'
                                ? 'bg-primary text-white font-semibold shadow-xs'
                                : 'text-muted hover:text-text hover:bg-card-subtle'
                        }`}
                        title="Stack stages into 2 rows without horizontal scrolling"
                    >
                        <LayoutGrid size={13} />
                        <span>Wrap Down</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleLayoutToggle('lane')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            boardLayout === 'lane'
                                ? 'bg-primary text-white font-semibold shadow-xs'
                                : 'text-muted hover:text-text hover:bg-card-subtle'
                        }`}
                        title="Single lane horizontal scroll"
                    >
                        <Columns3 size={13} />
                        <span>Scroll Lane</span>
                    </button>
                </div>
            </div>

            {/* Stages Columns Container */}
            <div
                className={
                    boardLayout === 'wrap'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 select-none pb-2'
                        : 'flex gap-4 overflow-x-auto pb-4 pt-1 -mx-2 px-2 custom-scrollbar items-start select-none'
                }
            >
                {COLUMNS.map((col) => {
                    const colApps = applications.filter(a => {
                        if (col.id === 'Interviewing') {
                            return a.status === 'Interviewing' || a.status === 'Interview';
                        }
                        return a.status === col.id;
                    });

                    return (
                        <div
                            key={col.id}
                            className={
                                boardLayout === 'wrap'
                                    ? 'w-full bg-card/60 backdrop-blur-xs border border-border rounded-card p-3.5 shadow-warm-sm flex flex-col min-h-[170px]'
                                    : 'w-72 shrink-0 bg-card/60 backdrop-blur-xs border border-border rounded-card p-3 shadow-warm-sm flex flex-col max-h-[82vh]'
                            }
                        >
                        {/* Column Header */}
                        <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-md text-xs font-serif font-bold border ${col.tone}`}>
                                    {col.label}
                                </span>
                                <span className="text-xs font-mono font-semibold text-muted">
                                    {colApps.length}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onQuickAdd(col.id)}
                                title={`Add new in ${col.label}`}
                                className="p-1 hover:bg-card-subtle text-muted hover:text-text rounded-md transition-colors cursor-pointer"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {/* Cards List */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 custom-scrollbar min-h-[140px]">
                            {colApps.length === 0 ? (
                                <div className="h-28 border border-dashed border-border rounded-xl flex items-center justify-center text-xs text-muted/60 italic text-center p-3">
                                    Drop or add applications here
                                </div>
                            ) : (
                                colApps.map((app) => {
                                    const lastDate = new Date(app.updatedAt || app.createdAt);
                                    const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
                                    const isStale = daysSince >= 7 && app.status !== 'Offer' && app.status !== 'Rejected';

                                    return (
                                        <motion.div
                                            key={app.id || app._id}
                                            layout
                                            whileHover={{ y: -2 }}
                                            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                            onClick={() => onSelectApp(app)}
                                            className="bg-card border border-border rounded-xl p-3.5 shadow-warm hover:shadow-warm-lg hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-8 h-8 rounded-lg bg-card-subtle border border-border flex items-center justify-center font-serif text-xs font-bold text-text shrink-0">
                                                            {app.company ? app.company.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-serif font-bold text-sm text-text truncate group-hover:text-primary transition-colors">
                                                                {app.company}
                                                            </h4>
                                                            <p className="text-xs text-muted truncate">{app.position}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Metadata pills */}
                                                <div className="flex flex-wrap gap-1.5 mt-2.5 text-[11px] text-muted font-sans">
                                                    {app.location && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-card-subtle border border-border">
                                                            <MapPin size={10} className="shrink-0" />
                                                            <span className="truncate max-w-[100px]">{app.location}</span>
                                                        </span>
                                                    )}
                                                    {app.salary && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-card-subtle border border-border">
                                                            <DollarSign size={10} className="shrink-0" />
                                                            <span className="truncate max-w-[90px]">{app.salary}</span>
                                                        </span>
                                                    )}
                                                    {app.resumeId?.name && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-terracotta/10 text-primary border border-primary/20 text-[10px] font-medium">
                                                            <FileText size={10} />
                                                            <span className="truncate max-w-[80px]">{app.resumeId.name}</span>
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Stale 7-day alert */}
                                                {isStale && (
                                                    <div className="mt-2.5 px-2 py-1 bg-amber/15 border border-amber/25 rounded-md text-[11px] text-amber flex items-center gap-1.5 font-medium">
                                                        <Clock size={11} className="shrink-0" />
                                                        <span>No update for {daysSince}d</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer Actions: Move forward / backward */}
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs text-muted"
                                            >
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMove(app, 'back')}
                                                        disabled={STAGE_ORDER.indexOf(app.status) <= 0}
                                                        className="p-1 hover:bg-card-subtle disabled:opacity-30 rounded cursor-pointer"
                                                        title="Move to previous stage"
                                                    >
                                                        <ArrowLeft size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMove(app, 'forward')}
                                                        disabled={STAGE_ORDER.indexOf(app.status) >= STAGE_ORDER.length - 1}
                                                        className="p-1 hover:bg-card-subtle disabled:opacity-30 rounded cursor-pointer"
                                                        title="Advance to next stage"
                                                    >
                                                        <ArrowRight size={13} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    {onOpenCopilot && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onOpenCopilot(app, 'cover_letter')}
                                                            className="px-2 py-0.5 hover:bg-amber/15 text-amber-700 dark:text-amber-400 text-[11px] rounded font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                                            title="Open AI Copilot for this application"
                                                        >
                                                            <Sparkles size={11} />
                                                            <span>AI</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => onAnalyzeApp(app)}
                                                        className="px-2 py-0.5 hover:bg-primary/10 text-primary text-[11px] rounded font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                                    >
                                                        <span>Match</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);
};

export default KanbanBoard;
