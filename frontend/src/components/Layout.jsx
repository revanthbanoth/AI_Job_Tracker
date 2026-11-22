import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Footer from './Footer';
import { LayoutDashboard, FileText, Briefcase, Settings, LogOut, Bell, Search, X, CheckCircle2, ArrowRight, Sun, Moon, BarChart2, Calendar } from 'lucide-react';
import Modal from './Modal';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [reminders, setReminders] = useState([]);
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return false;
    });
    const notifRef = useRef(null);

    // Sync theme toggle
    useEffect(() => {
        const syncTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        window.addEventListener('themechange', syncTheme);
        return () => window.removeEventListener('themechange', syncTheme);
    }, []);

    const toggleTheme = () => {
        const nextDark = !isDark;
        setIsDark(nextDark);
        if (nextDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        window.dispatchEvent(new Event('themechange'));
    };

    // Fetch real reminders from user's active applications
    useEffect(() => {
        const fetchReminders = async () => {
            try {
                const { data } = await api.get('/api/applications');
                if (Array.isArray(data)) {
                    const now = new Date();
                    const activeReminders = [];

                    data.forEach(app => {
                        const updatedDate = new Date(app.updatedAt || app.createdAt);
                        const daysSinceUpdate = Math.max(0, Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24)));

                        if (app.status === 'Interviewing') {
                            activeReminders.push({
                                id: app._id,
                                title: `Interview Active: ${app.company}`,
                                desc: `Active interview stage for ${app.position}. Review company values and preparation notes.`,
                                time: daysSinceUpdate === 0 ? 'Today' : `${daysSinceUpdate}d ago`,
                                type: 'Interview',
                                unread: true
                            });
                        } else if (app.status === 'Applied' && daysSinceUpdate >= 7) {
                            activeReminders.push({
                                id: app._id,
                                title: `Gentle Check-in: ${app.company}`,
                                desc: `It's been ${daysSinceUpdate} days since you applied for ${app.position}. A short, polite follow-up email can show your enthusiasm.`,
                                time: `${daysSinceUpdate}d ago`,
                                type: 'Follow-up',
                                unread: true
                            });
                        } else if (app.status === 'Offer') {
                            activeReminders.push({
                                id: app._id,
                                title: `Celebration & Offer: ${app.company}`,
                                desc: `Wonderful news! Take your time to review the offer terms for ${app.position}.`,
                                time: daysSinceUpdate === 0 ? 'Today' : `${daysSinceUpdate}d ago`,
                                type: 'Offer',
                                unread: true
                            });
                        }
                    });

                    setReminders(activeReminders);
                }
            } catch (err) {
                console.debug('Reminders query:', err.message);
            }
        };

        fetchReminders();
    }, [location.pathname]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (location.pathname !== '/applications' && value.trim().length > 0) {
            navigate('/applications');
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const handleNotificationClick = (e, notification) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedNotification(notification);
        setShowNotifications(false);
    };

    const handleBackToList = () => {
        setSelectedNotification(null);
        setShowNotifications(true);
    };

    const handleDismissNotification = (id) => {
        setReminders(prev => prev.filter(r => r.id !== id));
        setSelectedNotification(null);
    };

    return (
        <div className="flex h-screen w-full bg-background text-text overflow-hidden transition-colors duration-300">
            {/* Desktop Sidebar (Left, Fixed, Solid Warm Surface - Hidden on mobile) */}
            <aside className="hidden md:flex md:w-64 h-screen flex-shrink-0 bg-card border-r border-border flex-col justify-between transition-colors duration-300 z-20 select-none shadow-warm-sm">
                <div>
                    {/* Brand Header */}
                    <div className="h-16 flex items-center px-6 border-b border-border">
                        <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center font-serif font-bold text-lg text-white shadow-warm">
                            JT
                        </div>
                        <div className="ml-3">
                            <span className="font-serif font-bold text-xl tracking-tight text-text">JobTracker</span>
                            <span className="block text-[10px] text-muted -mt-0.5">Thoughtful Careers</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="py-6 space-y-1.5 px-3">
                        <NavItem to="/" icon={<LayoutDashboard size={19} />} label="Dashboard" active={location.pathname === '/'} />
                        <NavItem to="/applications" icon={<Briefcase size={19} />} label="Applications" active={location.pathname === '/applications'} />
                        <NavItem to="/calendar" icon={<Calendar size={19} />} label="Calendar" active={location.pathname === '/calendar'} />
                        <NavItem to="/analytics" icon={<BarChart2 size={19} />} label="Analytics" active={location.pathname === '/analytics'} />
                        <NavItem to="/resumes" icon={<FileText size={19} />} label="Resumes" active={location.pathname === '/resumes'} />
                        <NavItem to="/settings" icon={<Settings size={19} />} label="Settings" active={location.pathname === '/settings'} />
                    </nav>
                </div>

                {/* User Profile Card */}
                <div className="p-3 border-t border-border">
                    <Link to="/settings" className="flex items-center gap-3 p-2 rounded-xl hover:bg-card-subtle transition-colors cursor-pointer group">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-serif font-bold text-primary">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <div className="font-medium text-sm truncate text-text">{user?.name || 'My Account'}</div>
                            <div className="text-xs text-muted truncate">{user?.email}</div>
                        </div>
                    </Link>
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
                {/* Top Bar (Solid Warm Surface) */}
                <header className="h-16 flex-shrink-0 border-b border-border bg-card/90 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0 transition-colors duration-300">
                    <div className="flex items-center gap-2.5">
                        <div className="md:hidden h-8 w-8 bg-primary rounded-xl flex items-center justify-center font-serif font-bold text-sm text-white shadow-warm shrink-0">
                            JT
                        </div>
                        <h2 className="font-serif text-lg sm:text-xl font-bold text-text capitalize truncate">
                            {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1)}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Search Input */}
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                            <input
                                type="text"
                                placeholder="Search by role or company..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="bg-card-subtle/80 border border-border rounded-xl pl-9 pr-8 py-1.5 text-sm focus:outline-none focus:border-primary text-text w-52 lg:w-64 transition-all placeholder-muted font-sans"
                            />
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                                    title="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Theme Toggle (Sun / Moon) */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl text-muted hover:text-text hover:bg-card-subtle transition-colors flex items-center justify-center focus:outline-none"
                            aria-label={isDark ? "Switch to warm cream light mode" : "Switch to warm charcoal dark mode"}
                            title={isDark ? "Light mode" : "Dark mode"}
                        >
                            {isDark ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} />}
                        </button>

                        {/* Notification Bell with Dynamic Reminder Count */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2 rounded-xl transition-colors relative ${showNotifications ? 'bg-card-subtle text-text' : 'text-muted hover:text-text hover:bg-card-subtle'}`}
                                aria-label="Notifications"
                                title="Notifications"
                            >
                                <Bell size={19} />
                                {/* Show red dot ONLY when real reminders exist */}
                                {reminders.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary ring-2 ring-card"></span>
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Logout with accessible tooltip */}
                        <div className="relative group">
                            <button
                                onClick={logout}
                                className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors flex items-center justify-center focus:outline-none"
                                aria-label="Log Out"
                                title="Log Out"
                            >
                                <LogOut size={19} />
                            </button>
                            <span className="pointer-events-none absolute -bottom-9 right-0 hidden group-hover:flex items-center bg-card text-text text-xs px-2.5 py-1 rounded-md shadow-warm border border-border whitespace-nowrap z-50">
                                Log Out
                            </span>
                        </div>
                    </div>
                </header>

                {/* Main Content: Single Scroll Container with Solid Warm Surface */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 pb-36 md:pb-8 z-0 flex flex-col justify-between custom-scrollbar bg-background transition-colors duration-300">
                    <div className="flex-1 pb-8">
                        <Outlet context={{ searchQuery, setSearchQuery }} />
                    </div>
                    <Footer />
                </main>

                {/* Mobile Bottom Navigation Bar (Screens < md) */}
                <nav
                    style={{
                        paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 18px) + 6px)',
                    }}
                    className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around pt-2 px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] select-none"
                >
                    <MobileNavItem to="/" icon={<LayoutDashboard size={19} />} label="Home" active={location.pathname === '/'} />
                    <MobileNavItem to="/applications" icon={<Briefcase size={19} />} label="Jobs" active={location.pathname === '/applications'} />
                    <MobileNavItem to="/calendar" icon={<Calendar size={19} />} label="Calendar" active={location.pathname === '/calendar'} />
                    <MobileNavItem to="/analytics" icon={<BarChart2 size={19} />} label="Stats" active={location.pathname === '/analytics'} />
                    <MobileNavItem to="/resumes" icon={<FileText size={19} />} label="Resumes" active={location.pathname === '/resumes'} />
                    <MobileNavItem to="/settings" icon={<Settings size={19} />} label="Settings" active={location.pathname === '/settings'} />
                </nav>
            </div>

            {/* Notifications Modal */}
            <Modal
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                title={`Application Reminders (${reminders.length})`}
            >
                {reminders.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 size={24} />
                        </div>
                        <h4 className="font-serif text-lg font-bold text-text mb-1">All Caught Up!</h4>
                        <p className="text-sm text-muted max-w-xs mx-auto">
                            No applications currently need a follow-up or interview preparation. Keep up the great pace!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                        {reminders.map((reminder) => (
                            <NotificationItem
                                key={reminder.id}
                                title={reminder.title}
                                desc={reminder.desc}
                                time={reminder.time}
                                type={reminder.type}
                                unread={reminder.unread}
                                onClick={(e) => handleNotificationClick(e, reminder)}
                            />
                        ))}
                    </div>
                )}
            </Modal>

            {/* Selected Notification Detail Modal */}
            <Modal
                isOpen={!!selectedNotification}
                onClose={() => setSelectedNotification(null)}
                title={selectedNotification?.title || "Notification"}
            >
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
                            {selectedNotification?.type || 'Update'}
                        </span>
                        <span className="text-sm text-muted">{selectedNotification?.time}</span>
                    </div>
                    <p className="text-text leading-relaxed mb-6 font-sans">
                        {selectedNotification?.desc}
                    </p>
                    <div className="flex justify-between items-center gap-3 pt-4 border-t border-border">
                        <Link
                            to="/applications"
                            onClick={() => setSelectedNotification(null)}
                            className="text-sm text-primary hover:text-primary-hover flex items-center gap-1.5 font-medium"
                        >
                            Open in Applications <ArrowRight size={14} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBackToList}
                                className="bg-transparent hover:bg-card-subtle text-text px-4 py-2 rounded-xl transition-colors font-medium border border-border text-sm"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => handleDismissNotification(selectedNotification.id)}
                                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm shadow-warm-sm"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const NavItem = ({ to, icon, label, active }) => (
    <Link
        to={to}
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${
            active
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted hover:text-text hover:bg-card-subtle'
        }`}
    >
        <div className={`${active ? 'text-primary' : 'text-muted group-hover:text-text'} transition-colors`}>
            {icon}
        </div>
        <span className="hidden md:block text-sm">{label}</span>
    </Link>
);

const MobileNavItem = ({ to, icon, label, active }) => (
    <Link
        to={to}
        className={`flex flex-col items-center justify-center py-1.5 px-1 sm:px-2 rounded-xl transition-all duration-150 min-w-[50px] ${
            active ? 'text-primary' : 'text-text/80 hover:text-text'
        }`}
    >
        <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-primary/15 text-primary' : 'text-text/80'}`}>
            {icon}
        </div>
        <span className={`text-[11px] leading-none mt-1 tracking-tight whitespace-nowrap ${
            active ? 'font-bold text-primary' : 'font-semibold text-text/85'
        }`}>
            {label}
        </span>
    </Link>
);

const NotificationItem = ({ title, desc, time, type, unread, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-full text-left p-3.5 rounded-xl border border-border hover:bg-card-subtle transition-colors ${
            unread ? 'bg-card-subtle/50' : 'bg-card'
        }`}
    >
        <div className="flex justify-between items-start mb-1">
            <h5 className={`text-sm ${unread ? 'font-semibold text-text' : 'font-medium text-text/80'}`}>{title}</h5>
            <span className="text-xs text-muted whitespace-nowrap ml-2">{time}</span>
        </div>
        <p className="text-xs text-muted line-clamp-2 leading-relaxed">{desc}</p>
    </button>
);

export default Layout;
