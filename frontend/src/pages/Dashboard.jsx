import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { Briefcase, Calendar, Trophy, HeartHandshake, ArrowRight, Plus, Sparkles, Clock, AlertCircle, CheckCircle2, Flame, ExternalLink } from 'lucide-react';
import HeadingUnderline from '../components/HeadingUnderline';
import DoodleEmptyState from '../components/DoodleEmptyState';
import Counter from '../components/Counter';
import WeeklyGoalRing from '../components/WeeklyGoalRing';
import { DashboardSkeleton } from '../components/SkeletonLoader';

const AI_TIPS = [
    {
        title: "The 7-Day Follow-Up Rule",
        tip: "Recruiters review hundreds of profiles weekly. A brief, polite check-in 5 to 7 days after applying demonstrates proactivity without appearing impatient."
    },
    {
        title: "Quantify Your Impact",
        tip: "ATS engines and hiring managers weight bullets with metrics (e.g. 'Reduced latency by 35%') nearly twice as heavily as generic responsibilities."
    },
    {
        title: "Interview Reverse-Inquiry",
        tip: "Ask interviewers: 'What does success look like in the first 90 days of this role?' It immediately signals strategic readiness and high accountability."
    },
    {
        title: "Keywords in Bullets vs Skills Lists",
        tip: "Embedding technical keywords naturally inside past project bullet points yields higher ATS match ranking than merely listing them in an isolated skills column."
    }
];

const Dashboard = () => {
    const { user } = useAuth();
    const shouldReduceMotion = useReducedMotion();
    const [stats, setStats] = useState({
        total: 0,
        interviews: 0,
        offers: 0,
        rejections: 0,
        thisWeek: 0,
        interviewRate: 0,
        offerRate: 0,
        rejectionRate: 0
    });
    const [recentApps, setRecentApps] = useState([]);
    const [staleApps, setStaleApps] = useState([]);
    const [upcomingInterviews, setUpcomingInterviews] = useState([]);
    const [tipIndex, setTipIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data } = await api.get(`/api/applications`);
                const apps = Array.isArray(data) ? data : [];

                const total = apps.length;
                const interviews = apps.filter(app => app.status === 'Interviewing' || app.status === 'Interview').length;
                const offers = apps.filter(app => app.status === 'Offer').length;
                const rejections = apps.filter(app => app.status === 'Rejected').length;

                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const thisWeek = apps.filter(app => new Date(app.createdAt) > oneWeekAgo).length;

                // Stale applications (no update for 7+ days, still active)
                const now = new Date();
                const stale = apps.filter(app => {
                    if (app.status === 'Rejected' || app.status === 'Offer') return false;
                    const lastUpdated = new Date(app.updatedAt || app.createdAt);
                    const diffDays = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
                    return diffDays >= 7;
                });

                const activeInterviews = apps.filter(app => app.status === 'Interviewing' || app.status === 'Interview');

                const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;
                const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;
                const rejectionRate = total > 0 ? Math.round((rejections / total) * 100) : 0;

                setStats({ total, interviews, offers, rejections, thisWeek, interviewRate, offerRate, rejectionRate });
                setRecentApps(apps.slice(0, 5));
                setStaleApps(stale);
                setUpcomingInterviews(activeInterviews);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const firstName = user?.name ? user.name.split(' ')[0] : 'friend';

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: shouldReduceMotion ? 0 : 0.08,
                delayChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 260,
                damping: 24
            }
        }
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-8"
        >
            {/* Header Section */}
            <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="relative inline-block">
                        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text tracking-tight">
                            {getGreeting()}, {firstName}.
                        </h1>
                        <HeadingUnderline className="text-primary max-w-[220px]" />
                    </div>
                    <p className="text-muted mt-2 text-base font-sans">
                        Let&rsquo;s move one application forward today.
                    </p>
                </div>
                <Link
                    to="/applications"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors group self-start sm:self-auto cursor-pointer"
                >
                    <span>View All Applications</span>
                    <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                </Link>
            </motion.div>

            {/* Solid Warm Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    variants={item}
                    title="Total Applications"
                    value={stats.total}
                    topBadge="Pipeline"
                    change={stats.thisWeek > 0 ? `+${stats.thisWeek} this week` : "0 this week"}
                    changeType={stats.thisWeek > 0 ? "positive" : "neutral"}
                    iconBg="bg-primary/10 text-primary"
                    icon={<Briefcase size={20} />}
                    onClickPath="/applications"
                />
                <StatCard
                    variants={item}
                    title="Active Interviews"
                    value={stats.interviews}
                    topBadge="In Progress"
                    change={stats.total > 0 ? `${stats.interviewRate}% interview rate` : "Ready to prepare"}
                    changeType={stats.interviews > 0 ? "positive" : "neutral"}
                    iconBg="bg-amber/15 text-amber"
                    icon={<Calendar size={20} />}
                    onClickPath="/applications"
                />
                <StatCard
                    variants={item}
                    title="Job Offers"
                    value={stats.offers}
                    topBadge="Outcome"
                    change={stats.total > 0 ? `${stats.offerRate}% conversion` : "In reach"}
                    changeType={stats.offers > 0 ? "positive" : "neutral"}
                    iconBg="bg-sage/15 text-sage"
                    icon={<Trophy size={20} />}
                    onClickPath="/applications"
                />
                <StatCard
                    variants={item}
                    title="Archived & Lessons"
                    value={stats.rejections}
                    topBadge="Growth Step"
                    change={stats.rejections === 0 ? "Zero so far" : `${stats.rejections} closed • Step forward`}
                    changeType="neutral"
                    iconBg="bg-card-subtle text-muted"
                    icon={<HeartHandshake size={20} />}
                    onClickPath="/applications"
                />
            </div>

            {/* Phase 3 Row: Today's Focus Card & AI Strategic Tip */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Focus Card (2 columns) */}
                <motion.div variants={item} className="lg:col-span-2 bg-card border border-border rounded-card p-6 shadow-warm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Flame size={18} />
                                </div>
                                <h3 className="font-serif text-lg font-bold text-text">Today&rsquo;s Focus</h3>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-card-subtle text-muted border border-border">
                                {staleApps.length + upcomingInterviews.length} actionable items
                            </span>
                        </div>

                        {staleApps.length === 0 && upcomingInterviews.length === 0 ? (
                            <div className="py-6 text-center">
                                <CheckCircle2 size={32} className="text-sage mx-auto mb-2" />
                                <p className="text-text font-serif font-semibold text-base">You are completely up to date!</p>
                                <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                                    No stale applications (over 7 days) or urgent interviews pending action. Consider submitting your next tailored application.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingInterviews.slice(0, 2).map(app => (
                                    <div key={app._id} className="p-3.5 rounded-xl bg-amber/10 border border-amber/25 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber/20 text-amber font-serif font-bold text-sm flex items-center justify-center">
                                                {app.company.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-text flex items-center gap-2">
                                                    <span>Interview Stage: {app.company}</span>
                                                    <span className="text-[10px] bg-amber/20 text-amber px-2 py-0.5 rounded-full font-bold">Priority</span>
                                                </div>
                                                <p className="text-xs text-muted font-sans">Role: {app.position} • Review team background and technical stories.</p>
                                            </div>
                                        </div>
                                        <Link to="/applications" className="px-3 py-1.5 bg-card hover:bg-card-subtle text-text border border-border rounded-lg text-xs font-medium shrink-0">
                                            Prep Now
                                        </Link>
                                    </div>
                                ))}

                                {staleApps.slice(0, 3).map(app => (
                                    <div key={app._id} className="p-3.5 rounded-xl bg-card-subtle border border-border flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-serif font-bold text-sm flex items-center justify-center">
                                                {app.company.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-text">
                                                    Follow up with {app.company}
                                                </div>
                                                <p className="text-xs text-muted flex items-center gap-1.5 font-sans">
                                                    <Clock size={12} className="text-primary" />
                                                    <span>No update for 7+ days on &ldquo;{app.position}&rdquo;. A polite check-in is recommended.</span>
                                                </p>
                                            </div>
                                        </div>
                                        <Link to="/applications" className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-medium transition-colors shrink-0">
                                            Follow Up
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted font-sans">
                        <span>Applications older than 7 days are automatically highlighted.</span>
                        <Link to="/applications" className="text-primary hover:underline font-semibold flex items-center gap-1">
                            Go to board <ArrowRight size={12} />
                        </Link>
                    </div>
                </motion.div>

                {/* AI Career Tip Card (1 column) */}
                <motion.div variants={item} className="bg-card border border-border rounded-card p-6 shadow-warm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Sparkles size={18} />
                                </div>
                                <h3 className="font-serif text-lg font-bold text-text">AI Daily Wisdom</h3>
                            </div>
                            <button
                                onClick={() => setTipIndex((tipIndex + 1) % AI_TIPS.length)}
                                className="text-xs text-primary hover:underline font-medium cursor-pointer"
                                title="Next tip"
                            >
                                Next Tip
                            </button>
                        </div>

                        <div className="bg-card-subtle p-4 rounded-xl border border-border">
                            <h4 className="font-serif font-semibold text-sm text-text mb-1.5">
                                {AI_TIPS[tipIndex].title}
                            </h4>
                            <p className="text-xs text-muted leading-relaxed font-sans">
                                {AI_TIPS[tipIndex].tip}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted">
                        <span>Tip {tipIndex + 1} of {AI_TIPS.length}</span>
                        <span className="text-primary font-medium">Curated for Search Intent</span>
                    </div>
                </motion.div>
            </div>

            {/* Weekly Goal Ring Widget */}
            <motion.div variants={item}>
                <WeeklyGoalRing current={stats.thisWeek} target={5} />
            </motion.div>

            {/* Recent Applications List */}
            <motion.div variants={item} className="bg-card border border-border rounded-card overflow-hidden shadow-warm transition-colors duration-300">
                <div className="p-6 border-b border-border flex justify-between items-center bg-card-subtle/50">
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                        <h2 className="font-serif text-lg font-bold text-text">Recent Applications</h2>
                    </div>
                    {recentApps.length > 0 && (
                        <Link to="/applications" className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer">
                            See all ({stats.total}) <ArrowRight size={13} />
                        </Link>
                    )}
                </div>

                {recentApps.length === 0 ? (
                    <DoodleEmptyState
                        type="application"
                        title="Nothing here yet"
                        description="Add your first application, everyone starts at zero."
                        actionLabel="Add First Application"
                        actionIcon={<Plus size={16} />}
                        onAction={() => window.location.href = '/applications'}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-muted border-b border-border text-xs uppercase tracking-wider bg-card-subtle/20 font-medium">
                                    <th className="py-3.5 px-6">Company</th>
                                    <th className="py-3.5 px-6">Position</th>
                                    <th className="py-3.5 px-6">Status</th>
                                    <th className="py-3.5 px-6 text-right">Date Applied</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {recentApps.map((app) => (
                                    <tr
                                        key={app._id}
                                        onClick={() => app.jobUrl ? window.open(app.jobUrl, '_blank') : window.location.href = '/applications'}
                                        className="hover:bg-card-subtle/60 transition-colors group cursor-pointer"
                                    >
                                        <td className="py-4 px-6 text-text font-medium">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-9 h-9 rounded-xl bg-card-subtle border border-border flex items-center justify-center font-serif text-sm font-bold text-text shadow-sm">
                                                    {app.logo || app.company?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <span className="font-semibold text-text group-hover:text-primary transition-colors">{app.company}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-muted group-hover:text-text transition-colors text-sm">
                                            {app.position}
                                        </td>
                                        <td className="py-4 px-6">
                                            <StatusBadge status={app.status} />
                                        </td>
                                        <td className="py-4 px-6 text-right text-muted text-sm font-mono">
                                            {new Date(app.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

const StatCard = ({ title, value, change, changeType = 'positive', topBadge, iconBg, icon, variants, onClickPath }) => (
    <motion.div
        variants={variants}
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
        <Link to={onClickPath} className="block h-full group">
            <div className="h-full bg-card border border-border rounded-card p-5 hover:border-primary/40 transition-all duration-200 shadow-warm hover:shadow-warm-lg flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl ${iconBg} shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                        {icon}
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider bg-card-subtle text-muted px-2.5 py-1 rounded-lg border border-border">
                        {topBadge || 'Stage'}
                    </span>
                </div>

                <div>
                    <h3 className="text-muted text-xs font-medium uppercase tracking-wider mb-1 font-sans">{title}</h3>
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="font-serif text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
                            <Counter to={value} />
                        </span>
                        {change && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                                changeType === 'positive'
                                    ? 'bg-sage/15 text-sage border border-sage/25'
                                    : 'bg-card-subtle text-muted border border-border'
                            }`}>
                                {change}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    </motion.div>
);

const StatusBadge = ({ status }) => {
    // Human-made status badges with encouraging rejection language
    const styles = {
        'Applied': 'bg-primary/10 text-primary border-primary/20',
        'Interviewing': 'bg-warning/10 text-warning border-warning/20',
        'Offer': 'bg-secondary/15 text-secondary border-secondary/30',
        'Rejected': 'bg-card-subtle text-muted border-border', // Soft and gentle, never harsh red!
    };

    const labels = {
        'Applied': 'Applied',
        'Interviewing': 'Interviewing',
        'Offer': 'Offer Received',
        'Rejected': 'Closed Chapter', // Encouraging, supportive microcopy
    };

    const style = styles[status] || 'bg-card-subtle text-muted border-border';
    const label = labels[status] || status;

    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${style} inline-flex items-center gap-1.5 shadow-sm`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'Offer' ? 'bg-secondary animate-pulse' : 'bg-current'}`}></span>
            {label}
        </span>
    );
};

export default Dashboard;
