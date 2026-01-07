import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, Trophy, XCircle, ArrowRight, ExternalLink } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total: 0,
        interviews: 0,
        offers: 0,
        rejections: 0,
        thisWeek: 0
    });
    const [recentApps, setRecentApps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/applications');

                // Calculate stats
                const total = data.length;
                const interviews = data.filter(app => app.status === 'Interviewing').length;
                const offers = data.filter(app => app.status === 'Offer').length;
                const rejections = data.filter(app => app.status === 'Rejected').length;

                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const thisWeek = data.filter(app => new Date(app.createdAt) > oneWeekAgo).length;

                setStats({ total, interviews, offers, rejections, thisWeek });
                setRecentApps(data.slice(0, 5)); // Get first 5
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
            {/* Header Section */}
            <motion.div variants={item} className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-text to-muted bg-clip-text text-transparent">Dashboard Overview</h2>
                    <p className="text-muted mt-1">Track your progress and stay on top of your applications.</p>
                </div>
                <Link to="/applications" className="hidden sm:flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                    View All Applications <ArrowRight size={16} />
                </Link>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    variants={item}
                    title="Total Applications"
                    value={stats.total}
                    change={`+${stats.thisWeek}`}
                    color="from-blue-500 to-indigo-500"
                    icon={<Briefcase size={20} />}
                    onClickPath="/applications"
                />
                <StatCard
                    variants={item}
                    title="Interviews"
                    value={stats.interviews}
                    change="Active"
                    color="from-purple-500 to-pink-500"
                    icon={<Calendar size={20} />}
                    onClickPath="/applications"
                />
                <StatCard
                    variants={item}
                    title="Offers"
                    value={stats.offers}
                    change="Received"
                    color="from-emerald-500 to-teal-500"
                    icon={<Trophy size={20} />}
                    onClickPath="/applications"
                />
                <StatCard
                    variants={item}
                    title="Rejections"
                    value={stats.rejections}
                    change="Archived"
                    color="from-orange-500 to-red-500"
                    icon={<XCircle size={20} />}
                    onClickPath="/applications"
                />
            </div>

            {/* Recent Applications List */}
            <motion.div variants={item} className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-semibold text-text flex items-center gap-2">
                        <Briefcase size={18} className="text-primary" />
                        Recent Applications
                    </h3>
                </div>

                {recentApps.length === 0 ? (
                    <div className="text-center text-muted py-24 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Briefcase size={24} className="opacity-50" />
                        </div>
                        <p className="text-lg font-medium">No applications yet</p>
                        <p className="text-sm mb-6">Start tracking your job search journey today.</p>
                        <Link to="/applications" className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
                            Add First Application
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-muted/70 border-b border-white/5 text-xs uppercase tracking-wider">
                                    <th className="py-4 px-6 font-medium">Company</th>
                                    <th className="py-4 px-6 font-medium">Position</th>
                                    <th className="py-4 px-6 font-medium">Status</th>
                                    <th className="py-4 px-6 font-medium text-right">Date Applied</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentApps.map((app) => (
                                    <tr
                                        key={app._id}
                                        onClick={() => app.jobUrl ? window.open(app.jobUrl, '_blank') : window.location.href = '/applications'}
                                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                                    >
                                        <td className="py-4 px-6 text-text font-medium">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-inner flex items-center justify-center text-sm font-bold border border-white/10 text-white">
                                                    {app.logo || app.company.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold">{app.company}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-muted-foreground group-hover:text-text transition-colors">
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

const StatCard = ({ title, value, change, color, icon, variants, onClickPath }) => (
    <motion.div variants={variants}>
        <Link to={onClickPath} className="block h-full">
            <div className="h-full bg-card/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 hover:border-primary/20 hover:bg-card/60 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 relative overflow-hidden group cursor-pointer flex flex-col justify-between">
                {/* Background Glow */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-all duration-500`}></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} shadow-lg shadow-black/10`}>
                        <div className="text-white transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
                    </div>
                    {/* Badge */}
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-muted px-2 py-1 rounded-lg border border-white/5">
                        {title === 'Total Applications' ? 'Total' : 'Active'}
                    </span>
                </div>

                <div className="relative z-10">
                    <h4 className="text-muted text-sm font-medium mb-1">{title}</h4>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-text tracking-tight">{value}</span>
                        {change && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${title === 'Rejections' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'} border border-white/5`}>
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
    const styles = {
        'Applied': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'Interviewing': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'Offer': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    // Default fallback
    const style = styles[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';

    return (
        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${style} inline-flex items-center gap-1.5 shadow-sm`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'Offer' ? 'bg-emerald-400 animate-pulse' : 'bg-current'}`}></span>
            {status}
        </span>
    );
}

export default Dashboard;
