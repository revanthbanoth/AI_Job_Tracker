import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Briefcase, Trophy, Flame, CheckCircle2, AlertCircle, ArrowRight, HeartHandshake, Sparkles, Building2 } from 'lucide-react';
import HeadingUnderline from '../components/HeadingUnderline';

const ShareProgressPage = () => {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProgress = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await api.get(`/api/share/view/${token}`);
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'This progress link is invalid or has expired.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchProgress();
        }
    }, [token]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
                <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="font-serif text-lg text-text">Loading candidate progress...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
                <div className="w-16 h-16 bg-amber/15 text-amber rounded-2xl flex items-center justify-center mx-auto">
                    <AlertCircle size={32} />
                </div>
                <h2 className="font-serif text-2xl font-bold text-text">Link Unavailable</h2>
                <p className="text-sm text-muted leading-relaxed">
                    {error || 'This link has either been revoked by the candidate or has expired.'}
                </p>
                <div className="pt-4">
                    <Link
                        to="/login"
                        className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                        <span>Go to JobTracker</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        );
    }

    const { candidateFirstName, stats, pipeline } = data;

    const statusBadges = {
        'Wishlist': 'bg-stone-500/10 text-text border-stone-300 dark:border-stone-700',
        'Applied': 'bg-primary/10 text-primary border-primary/25',
        'Screening': 'bg-amber/15 text-amber border-amber/30',
        'Interviewing': 'bg-amber-600/15 text-amber-600 dark:text-amber-400 border-amber-600/30',
        'Interview': 'bg-amber-600/15 text-amber-600 dark:text-amber-400 border-amber-600/30',
        'Offer': 'bg-sage/15 text-sage border-sage/35',
        'Rejected': 'bg-card-subtle text-muted border-border',
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 w-full">
            {/* Header */}
            <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sage/15 text-sage border border-sage/25">
                    <Sparkles size={12} />
                    <span>Mentor & Coach View</span>
                </span>
                <div className="relative inline-block mt-2">
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text tracking-tight">
                        {candidateFirstName}&rsquo;s Job Search Journey
                    </h1>
                    <HeadingUnderline className="text-primary max-w-[220px] mx-auto mt-1" />
                </div>
                <p className="text-muted text-sm font-sans max-w-lg mx-auto">
                    A read-only snapshot of current job application milestones, active interviews, and momentum.
                </p>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-card p-4 shadow-warm text-center">
                    <span className="text-xs text-muted font-sans uppercase tracking-wider block mb-1">Total Applied</span>
                    <span className="font-serif text-3xl font-extrabold text-text">{stats.total}</span>
                    <span className="block text-[11px] text-sage font-medium mt-1">+{stats.thisWeek} this week</span>
                </div>

                <div className="bg-card border border-border rounded-card p-4 shadow-warm text-center">
                    <span className="text-xs text-muted font-sans uppercase tracking-wider block mb-1">Interviews</span>
                    <span className="font-serif text-3xl font-extrabold text-amber">{stats.interviews}</span>
                    <span className="block text-[11px] text-muted mt-1">{stats.interviewRate}% conversion</span>
                </div>

                <div className="bg-card border border-border rounded-card p-4 shadow-warm text-center">
                    <span className="text-xs text-muted font-sans uppercase tracking-wider block mb-1">Offers</span>
                    <span className="font-serif text-3xl font-extrabold text-sage">{stats.offers}</span>
                    <span className="block text-[11px] text-sage font-medium mt-1">
                        {stats.offers > 0 ? 'Offer Secured! 🎉' : 'In Progress'}
                    </span>
                </div>

                <div className="bg-card border border-border rounded-card p-4 shadow-warm text-center">
                    <span className="text-xs text-muted font-sans uppercase tracking-wider block mb-1">Response Rate</span>
                    <span className="font-serif text-3xl font-extrabold text-primary">{stats.responseRate}%</span>
                    <span className="block text-[11px] text-muted mt-1">Interviews & Offers</span>
                </div>
            </div>

            {/* Active Pipeline Table */}
            <div className="bg-card border border-border rounded-card overflow-hidden shadow-warm">
                <div className="p-4 border-b border-border flex items-center justify-between bg-card-subtle/30">
                    <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-primary" />
                        <h3 className="font-serif font-bold text-base text-text">Opportunity Pipeline</h3>
                    </div>
                    <span className="text-xs text-muted font-mono">{pipeline.length} entries</span>
                </div>

                {pipeline.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted">
                        No applications logged yet.
                    </div>
                ) : (
                    <div className="divide-y divide-border overflow-x-auto">
                        {pipeline.map(app => (
                            <div key={app.id} className="p-4 flex items-center justify-between gap-4 hover:bg-card-subtle/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-card-subtle border border-border flex items-center justify-center font-serif text-sm font-bold text-text shrink-0">
                                        {app.company.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-serif font-bold text-sm text-text">{app.company}</div>
                                        <div className="text-xs text-muted font-sans">{app.position} • {app.location}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusBadges[app.status] || statusBadges.Applied}`}>
                                        {app.status === 'Offer' ? 'Offer 🎉' : app.status === 'Rejected' ? 'Closed' : app.status}
                                    </span>
                                    <span className="text-[11px] text-muted font-mono hidden sm:inline">
                                        {new Date(app.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Encouraging Mentor Note */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 text-center text-xs text-muted">
                Shared securely via <strong className="text-text">AI JobTracker</strong>. Want to build your own thoughtful career tracker?{' '}
                <Link to="/register" className="text-primary font-semibold hover:underline">
                    Create an account
                </Link>
            </div>
        </div>
    );
};

export default ShareProgressPage;
