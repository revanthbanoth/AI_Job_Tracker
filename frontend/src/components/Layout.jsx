import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Briefcase, Settings, LogOut, Bell, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Modal from './Modal';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const notifRef = useRef(null);



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

    return (
        <div className="flex h-screen bg-background text-text overflow-hidden transition-colors duration-300">
            {/* Sidebar (Left) */}
            <aside className="w-20 md:w-64 bg-card/50 backdrop-blur-xl border-r border-border flex flex-col transition-all duration-300 z-20">
                <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-border">
                    <div className="h-8 w-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center font-bold text-white">AI</div>
                    <span className="ml-3 font-bold text-xl hidden md:block tracking-tight text-text">JobTracker</span>
                </div>

                <nav className="flex-1 py-6 space-y-2 px-3">
                    <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={location.pathname === '/'} />
                    <NavItem to="/applications" icon={<Briefcase size={20} />} label="Applications" active={location.pathname === '/applications'} />
                    <NavItem to="/resumes" icon={<FileText size={20} />} label="Resumes" active={location.pathname === '/resumes'} />
                    <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" active={location.pathname === '/settings'} />
                </nav>

                <div className="p-4 border-t border-border">
                    <Link to="/settings" className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold ring-2 ring-border group-hover:ring-primary/50 transition-all text-white">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="hidden md:block overflow-hidden">
                            <div className="font-medium text-sm truncate text-text">{user?.name}</div>
                            <div className="text-xs text-muted truncate">{user?.email}</div>
                        </div>
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-background relative transition-colors duration-300">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-[128px]" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-[128px]" />
                </div>

                {/* Top Bar */}
                <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-6 z-50 sticky top-0 transition-colors duration-300">
                    <div className="flex items-center gap-4 text-muted">
                        <h2 className="text-lg font-semibold text-text capitalize">{location.pathname === '/' ? 'Overview' : location.pathname.substring(1)}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-card/50 border border-border rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary/50 text-text w-64 transition-all placeholder-muted"
                            />
                        </div>

                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-black/10 dark:bg-white/10 text-text' : 'text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background"></span>
                            </button>

                            {/* Notifications Dropdown */}

                        </div>

                        <button onClick={logout} className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors" title="Logout">
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 z-10 custom-scrollbar">
                    <Outlet />
                </div>
            </main>


            {/* All Notifications Modal */}
            <Modal
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                title="Notifications"
            >
                <div className="space-y-2">
                    <NotificationItem
                        title="Interview Reminder"
                        desc="Google interview in 1 hour"
                        time="1h ago"
                        unread
                        onClick={(e) => handleNotificationClick(e, {
                            title: "Interview Reminder",
                            desc: "You have an upcoming interview with Google for the Frontend Engineer role in 1 hour. Make sure your camera and microphone are working.",
                            time: "1h ago",
                            type: "Interview"
                        })}
                    />
                    <NotificationItem
                        title="Application Viewed"
                        desc="Netflix viewed your application"
                        time="4h ago"
                        onClick={(e) => handleNotificationClick(e, {
                            title: "Application Viewed",
                            desc: "Netflix has viewed your application for the Senior React Developer position. Keep an eye on your email for potential next steps!",
                            time: "4h ago",
                            type: "status"
                        })}
                    />
                    <NotificationItem
                        title="New Feature"
                        desc="Check out the new Resume AI Analyzer!"
                        time="1d ago"
                        onClick={(e) => handleNotificationClick(e, {
                            title: "New Feature Available",
                            desc: "We've just launched our AI Resume Analyzer! Upload your resume now to get detailed feedback and match scores against your target job descriptions.",
                            time: "1d ago",
                            type: "system"
                        })}
                    />
                </div>
            </Modal>

            {/* Notification Modal */}
            <Modal
                isOpen={!!selectedNotification}
                onClose={() => setSelectedNotification(null)}
                title={selectedNotification?.title || "Notification"}
            >
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-1 rounded-md uppercase tracking-wider">
                            {selectedNotification?.type || 'Update'}
                        </span>
                        <span className="text-sm text-muted">{selectedNotification?.time}</span>
                    </div>
                    <p className="text-text leading-relaxed mb-6">
                        {selectedNotification?.desc}
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleBackToList}
                            className="bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-text px-4 py-2 rounded-lg transition-colors font-medium border border-border"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setSelectedNotification(null)}
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                        >
                            Mark as Read
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
};

const NavItem = ({ to, icon, label, active }) => (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group ${active ? 'bg-primary/10 text-primary font-medium' : 'text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5'}`}>
        <div className={`${active ? 'text-primary' : 'text-muted group-hover:text-text'}`}>
            {icon}
        </div>
        <span className="hidden md:block">{label}</span>
    </Link>
);

const NotificationItem = ({ title, desc, time, unread, onClick }) => (
    <button type="button" onClick={onClick} className={`w-full text-left p-3 border-b border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${unread ? 'bg-primary/5' : ''}`}>
        <div className="flex justify-between items-start mb-1">
            <h5 className={`text-sm ${unread ? 'font-bold text-text' : 'font-medium text-text/80'}`}>{title}</h5>
            <span className="text-xs text-muted">{time}</span>
        </div>
        <p className="text-xs text-muted line-clamp-2">{desc}</p>
    </button>
)

export default Layout;
