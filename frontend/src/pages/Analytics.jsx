import { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, BarChart2, PieChart, Award, Users, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import HeadingUnderline from '../components/HeadingUnderline';
import Counter from '../components/Counter';
import DoodleEmptyState from '../components/DoodleEmptyState';

const Analytics = () => {
    const shouldReduceMotion = useReducedMotion();
    const [applications, setApplications] = useState([]);
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [appsRes, resumesRes] = await Promise.all([
                    api.get('/api/applications').catch(() => ({ data: [] })),
                    api.get('/api/resumes').catch(() => ({ data: [] }))
                ]);
                setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
                setResumes(Array.isArray(resumesRes.data) ? resumesRes.data : []);
            } catch (err) {
                console.error('Failed to load analytics', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Metric Calculations
    const total = applications.length;
    const pastApplied = applications.filter(a => a.status !== 'Applied' && a.status !== 'Wishlist').length;
    const responseRate = total > 0 ? Math.round((pastApplied / total) * 100) : 0;
    const interviews = applications.filter(a => a.status === 'Interviewing' || a.status === 'Interview').length;
    const offers = applications.filter(a => a.status === 'Offer').length;
    const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;
    const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;

    // Funnel Stages
    const funnelStages = [
        { name: 'Applied', count: applications.filter(a => a.status === 'Applied').length + pastApplied, color: 'bg-primary' },
        { name: 'Screening', count: applications.filter(a => a.status === 'Screening' || a.status === 'Interviewing' || a.status === 'Offer').length, color: 'bg-amber' },
        { name: 'Interview', count: interviews + offers, color: 'bg-amber-600' },
        { name: 'Offer', count: offers, color: 'bg-sage' },
    ];

    // Source Breakdown
    const sourcesCount = {};
    applications.forEach(a => {
        const src = a.source || 'Direct';
        sourcesCount[src] = (sourcesCount[src] || 0) + 1;
    });
    const sortedSources = Object.entries(sourcesCount).sort((a, b) => b[1] - a[1]);

    // Resume Version Performance
    const resumeStats = resumes.map(r => {
        const linkedApps = applications.filter(a => a.resumeId === r._id || a.resumeId?._id === r._id);
        const linkedInterviews = linkedApps.filter(a => a.status === 'Interviewing' || a.status === 'Offer').length;
        const rate = linkedApps.length > 0 ? Math.round((linkedInterviews / linkedApps.length) * 100) : 0;
        return {
            id: r._id,
            name: r.name,
            atsScore: r.healthScore ?? r.atsScore,
            totalLinked: linkedApps.length,
            interviews: linkedInterviews,
            rate
        };
    });

    // Weekly Pacing (last 4 weeks)
    const weeksData = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - (i + 1) * 7);
        const end = new Date(now);
        end.setDate(now.getDate() - i * 7);

        const count = applications.filter(a => {
            const d = new Date(a.createdAt);
            return d >= start && d < end;
        }).length;

        weeksData.push({
            label: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i} wks ago`,
            count
        });
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: shouldReduceMotion ? 0 : 0.08 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 14 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="h-10 w-64 bg-card-subtle animate-pulse rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-28 bg-card border border-border rounded-card animate-pulse shadow-warm" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-8"
        >
            {/* Header */}
            <motion.div variants={item}>
                <div className="relative inline-block">
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text tracking-tight">
                        Pipeline Analytics
                    </h1>
                    <HeadingUnderline className="text-primary max-w-[220px]" />
                </div>
                <p className="text-muted mt-2 text-base font-sans">
                    Actionable conversion rates, sourcing breakdowns, and resume version effectiveness.
                </p>
            </motion.div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricCard
                    variants={item}
                    title="Response Rate"
                    value={`${responseRate}%`}
                    subtitle="Progression beyond applied"
                    badge="First Screen"
                    color="text-primary"
                />
                <MetricCard
                    variants={item}
                    title="Interview Rate"
                    value={`${interviewRate}%`}
                    subtitle="Applications reaching interview"
                    badge="Active Dialogue"
                    color="text-amber"
                />
                <MetricCard
                    variants={item}
                    title="Offer Conversion"
                    value={`${offerRate}%`}
                    subtitle="Final offers secured"
                    badge="Outcomes"
                    color="text-sage"
                />
                <MetricCard
                    variants={item}
                    title="Total Applications"
                    value={<Counter to={total} />}
                    subtitle={`${applications.filter(a => a.status === 'Applied').length} currently awaiting review`}
                    badge="Tracked"
                    color="text-text"
                />
            </div>

            {total === 0 ? (
                <div className="bg-card border border-border rounded-card p-8 shadow-warm">
                    <DoodleEmptyState
                        type="application"
                        title="No application data yet"
                        description="Start tracking your applications to view progression funnels, weekly pacing, and resume performance."
                        actionLabel="Add Application"
                        onAction={() => window.location.href = '/applications'}
                    />
                </div>
            ) : (
                <>
                    {/* Funnel & Weekly Pacing Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Conversion Funnel */}
                        <motion.div variants={item} className="bg-card border border-border rounded-card p-6 shadow-warm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp size={18} className="text-primary" />
                                    <h3 className="font-serif text-lg font-bold text-text">Conversion Funnel</h3>
                                </div>
                                <p className="text-xs text-muted mb-6">How applications transition across key interview milestones.</p>

                                <div className="space-y-4">
                                    {funnelStages.map((stage, i) => {
                                        const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                                        return (
                                            <div key={stage.name} className="space-y-1.5">
                                                <div className="flex justify-between items-center text-xs font-medium">
                                                    <span className="text-text">{stage.name}</span>
                                                    <span className="text-muted font-mono">{stage.count} ({pct}%)</span>
                                                </div>
                                                <div className="w-full h-3 bg-card-subtle rounded-full overflow-hidden border border-border">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.max(4, pct)}%` }}
                                                        transition={{ duration: 0.8, delay: i * 0.1 }}
                                                        className={`h-full ${stage.color} rounded-full`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted">
                                <span>Benchmarked against industry standards</span>
                                <span className="text-sage font-medium inline-flex items-center gap-1">
                                    <CheckCircle2 size={13} /> Healthy flow
                                </span>
                            </div>
                        </motion.div>

                        {/* Weekly Pacing Bar Chart */}
                        <motion.div variants={item} className="bg-card border border-border rounded-card p-6 shadow-warm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <BarChart2 size={18} className="text-primary" />
                                    <h3 className="font-serif text-lg font-bold text-text">Weekly Application Volume</h3>
                                </div>
                                <p className="text-xs text-muted mb-6">Pacing over the past 4 weeks. Consistency builds interview momentum.</p>

                                <div className="grid grid-cols-4 gap-3 items-end h-44 pt-4 pb-2 border-b border-border">
                                    {weeksData.map((week, idx) => {
                                        const maxCount = Math.max(...weeksData.map(w => w.count), 5);
                                        const barHeightPct = Math.min(100, Math.round((week.count / maxCount) * 100));

                                        return (
                                            <div key={week.label} className="flex flex-col items-center h-full justify-end group">
                                                <span className="text-xs font-mono font-bold text-text mb-1 group-hover:text-primary transition-colors">
                                                    {week.count}
                                                </span>
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(8, barHeightPct)}%` }}
                                                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                                                    className="w-full max-w-[42px] bg-terracotta/20 hover:bg-primary group-hover:bg-primary border border-primary/40 rounded-t-lg transition-colors cursor-pointer"
                                                />
                                                <span className="text-[11px] text-muted text-center mt-2 leading-tight">
                                                    {week.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-4 pt-2 flex items-center gap-2 text-xs text-muted">
                                <Clock size={13} className="text-primary shrink-0" />
                                <span>Suggested cadence: 3–5 tailored applications per week.</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Performance by Source & Resume Version */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sources */}
                        <motion.div variants={item} className="bg-card border border-border rounded-card p-6 shadow-warm">
                            <div className="flex items-center gap-2 mb-1">
                                <Users size={18} className="text-primary" />
                                <h3 className="font-serif text-lg font-bold text-text">Applications by Source</h3>
                            </div>
                            <p className="text-xs text-muted mb-5">Where your applications originate.</p>

                            <div className="space-y-3">
                                {sortedSources.map(([source, count]) => {
                                    const pct = Math.round((count / total) * 100);
                                    return (
                                        <div key={source} className="flex items-center justify-between p-3 rounded-xl bg-card-subtle border border-border">
                                            <div>
                                                <span className="text-sm font-medium text-text">{source}</span>
                                                <div className="text-xs text-muted font-mono">{count} applications</div>
                                            </div>
                                            <div className="text-sm font-serif font-bold text-primary">
                                                {pct}%
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Resume Version Performance */}
                        <motion.div variants={item} className="bg-card border border-border rounded-card p-6 shadow-warm">
                            <div className="flex items-center gap-2 mb-1">
                                <Award size={18} className="text-primary" />
                                <h3 className="font-serif text-lg font-bold text-text">Performance by Resume Version</h3>
                            </div>
                            <p className="text-xs text-muted mb-5">Identify which resume version generates the highest interview rate.</p>

                            {resumeStats.length === 0 ? (
                                <p className="text-xs text-muted italic">No resume documents uploaded yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {resumeStats.map(r => (
                                        <div key={r.id} className="p-3.5 rounded-xl bg-card-subtle border border-border flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm font-serif font-semibold text-text truncate">{r.name}</h4>
                                                <div className="text-xs text-muted flex items-center gap-2 mt-0.5">
                                                    <span>ATS: {r.atsScore}/100</span>
                                                    <span>•</span>
                                                    <span>{r.totalLinked} linked apps</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-base font-serif font-bold text-sage">{r.rate}%</div>
                                                <div className="text-[10px] text-muted uppercase font-semibold">Interview rate</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </motion.div>
    );
};

const MetricCard = ({ title, value, subtitle, badge, color, variants }) => (
    <motion.div
        variants={variants}
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="bg-card border border-border rounded-card p-5 shadow-warm flex flex-col justify-between"
    >
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider font-sans">{title}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-card-subtle text-muted px-2 py-0.5 rounded-md border border-border">
                {badge}
            </span>
        </div>
        <div>
            <div className={`font-serif text-3xl font-extrabold tracking-tight ${color}`}>{value}</div>
            <p className="text-xs text-muted mt-1 leading-snug">{subtitle}</p>
        </div>
    </motion.div>
);

export default Analytics;
