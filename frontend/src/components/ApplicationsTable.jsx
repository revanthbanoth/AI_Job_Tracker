import { Sparkles, Trash2, ExternalLink, FileText, MapPin, DollarSign, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const StatusBadge = ({ status, onStatusChange }) => {
    const styles = {
        'Wishlist': 'bg-stone-500/10 text-text border-stone-300 dark:border-stone-700',
        'Applied': 'bg-primary/10 text-primary border-primary/25',
        'Screening': 'bg-amber/15 text-amber border-amber/30',
        'Interviewing': 'bg-amber-600/15 text-amber-600 dark:text-amber-400 border-amber-600/30',
        'Offer': 'bg-sage/15 text-sage border-sage/35',
        'Rejected': 'bg-card-subtle text-muted border-border',
    };

    const labels = {
        'Wishlist': 'Wishlist',
        'Applied': 'Applied',
        'Screening': 'Screening',
        'Interviewing': 'Interview',
        'Offer': 'Offer Received 🎉',
        'Rejected': 'Closed Chapter',
    };

    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${styles[status] || styles.Applied} inline-flex items-center gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'Offer' ? 'bg-sage animate-pulse' : 'bg-current'}`} />
            <span>{labels[status] || status}</span>
        </span>
    );
};

const ApplicationsTable = ({ applications = [], onSelectApp, onAnalyzeApp, onDeleteApp }) => {
    const now = new Date();

    return (
        <div className="bg-card border border-border rounded-card overflow-hidden shadow-warm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-muted border-b border-border text-xs uppercase tracking-wider bg-card-subtle/40 font-medium">
                            <th className="py-3.5 px-6">Company & Role</th>
                            <th className="py-3.5 px-6">Stage</th>
                            <th className="py-3.5 px-6">Location</th>
                            <th className="py-3.5 px-6">Salary</th>
                            <th className="py-3.5 px-6">Source</th>
                            <th className="py-3.5 px-6">Linked Resume</th>
                            <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {applications.map((app) => {
                            const lastDate = new Date(app.updatedAt || app.createdAt);
                            const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
                            const isStale = daysSince >= 7 && app.status !== 'Offer' && app.status !== 'Rejected';

                            return (
                                <tr
                                    key={app.id || app._id}
                                    onClick={() => onSelectApp(app)}
                                    className="hover:bg-card-subtle/50 transition-colors group cursor-pointer"
                                >
                                    <td className="py-4 px-6 text-text font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-card-subtle border border-border flex items-center justify-center font-serif text-sm font-bold text-text shadow-sm">
                                                {app.company ? app.company.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <div className="font-serif font-bold text-sm text-text group-hover:text-primary transition-colors flex items-center gap-2">
                                                    <span>{app.company}</span>
                                                    {isStale && (
                                                        <span className="text-[10px] text-amber font-sans font-semibold bg-amber/15 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <Clock size={10} /> {daysSince}d
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted font-sans">{app.position}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <StatusBadge status={app.status === 'Interview' ? 'Interviewing' : app.status} />
                                    </td>
                                    <td className="py-4 px-6 text-xs text-muted font-sans">
                                        {app.location || '—'}
                                    </td>
                                    <td className="py-4 px-6 text-xs text-muted font-sans font-mono">
                                        {app.salary || '—'}
                                    </td>
                                    <td className="py-4 px-6 text-xs text-muted font-sans">
                                        {app.source || 'Direct'}
                                    </td>
                                    <td className="py-4 px-6 text-xs text-muted font-sans">
                                        {app.resumeId?.name ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-terracotta/10 text-primary border border-primary/20 text-xs font-medium">
                                                <FileText size={11} />
                                                <span className="truncate max-w-[110px]">{app.resumeId.name}</span>
                                            </span>
                                        ) : (
                                            <span className="text-muted/60 italic">—</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center justify-end gap-2"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => onAnalyzeApp(app)}
                                                className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors cursor-pointer"
                                                title="Analyze ATS Match"
                                            >
                                                <Sparkles size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteApp(app.id || app._id)}
                                                className="p-1.5 hover:bg-red-500/10 text-muted hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                                title="Delete Application"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ApplicationsTable;
