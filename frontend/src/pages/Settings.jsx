import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Save, UploadCloud, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import HeadingUnderline from '../components/HeadingUnderline';
import api from '../services/api';

const Settings = () => {
    const { user, setUser, loading } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Resume state
    const [uploadingResume, setUploadingResume] = useState(false);
    const resumeInputRef = useRef(null);

    // Initial load effect
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    useEffect(() => {
        const checkDark = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        checkDark();

        window.addEventListener('themechange', checkDark);
        return () => window.removeEventListener('themechange', checkDark);
    }, []);

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);

        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }

        window.dispatchEvent(new Event('themechange'));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const { data } = await api.put(`/api/auth/profile`, {
                name,
                email,
                password: password || undefined
            });

            const existingUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const updatedUser = { ...user, name: data.name, email: data.email };

            if (existingUserInfo.token) {
                updatedUser.token = existingUserInfo.token;
            }

            setUser(updatedUser);
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));

            if (updatedUser.token) {
                localStorage.setItem('token', updatedUser.token);
            }

            setMessage('Profile updated successfully');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || 'Failed to update profile');
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingResume(true);
        setMessage('');
        setError('');

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('name', file.name);

        try {
            await api.post(`/api/resumes`, formData);
            setMessage(`Resume "${file.name}" uploaded successfully!`);
        } catch (err) {
            setError('Failed to upload resume to your profile');
        } finally {
            setUploadingResume(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl space-y-4">
                <div className="h-10 w-48 bg-card-subtle animate-pulse rounded-lg" />
                <div className="h-32 bg-card border border-border rounded-card animate-pulse" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h2 className="text-3xl font-serif font-bold text-text tracking-tight relative inline-block">
                    Account Settings
                    <HeadingUnderline />
                </h2>
                <p className="text-muted mt-2 text-sm sm:text-base font-sans">
                    Personalize your profile, security credentials, and workspace preferences.
                </p>
            </div>

            {message && (
                <div className="p-4 rounded-xl bg-sage/10 text-sage text-sm border border-sage/20 flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{message}</span>
                </div>
            )}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-sm border border-red-500/20 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleUpdateProfile} className="bg-card border border-border rounded-card p-6 shadow-warm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
                    <div>
                        <h3 className="text-lg font-serif font-semibold text-text">Profile & Credentials</h3>
                        <p className="text-xs text-muted">Your name is used for warm greetings across the dashboard.</p>
                    </div>
                    <button
                        type="submit"
                        className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium shadow-warm transition-all cursor-pointer"
                    >
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-text">Display Name</label>
                        <input
                            type="text"
                            className="w-full p-3 rounded-xl bg-background border border-border text-text focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors text-sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-text">Email Address</label>
                        <input
                            type="email"
                            className="w-full p-3 rounded-xl bg-card-subtle border border-border text-muted cursor-not-allowed text-sm"
                            value={email}
                            disabled
                        />
                        <p className="text-xs text-muted mt-1.5">Registered email address is locked to preserve your application history.</p>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield size={16} className="text-primary" />
                            <h4 className="text-sm font-medium text-text">Change Password</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted">New Password</label>
                                <input
                                    type="password"
                                    className="w-full p-3 rounded-xl bg-background border border-border text-text focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors text-sm"
                                    placeholder="Leave blank to keep current"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="w-full p-3 rounded-xl bg-background border border-border text-text focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors text-sm"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* Resume Upload Box */}
            <div className="bg-card border border-border rounded-card p-6 shadow-warm">
                <h3 className="text-lg font-serif font-semibold text-text mb-1">Quick Resume Upload</h3>
                <p className="text-xs text-muted mb-4">Add a new resume version directly to your profile repository.</p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card-subtle border border-border">
                    <div>
                        <p className="text-sm text-text font-medium">Add New PDF Document</p>
                        <p className="text-xs text-muted">Automatically scanned and prepared for ATS scoring.</p>
                    </div>
                    <div>
                        <input
                            type="file"
                            ref={resumeInputRef}
                            onChange={handleResumeUpload}
                            className="hidden"
                            accept=".pdf"
                        />
                        <button
                            onClick={() => resumeInputRef.current?.click()}
                            disabled={uploadingResume}
                            className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-card-subtle border border-border text-text rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
                        >
                            <UploadCloud size={16} />
                            {uploadingResume ? 'Uploading...' : 'Select PDF'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Appearance Section */}
            <div className="bg-card border border-border rounded-card p-6 shadow-warm">
                <h3 className="text-lg font-serif font-semibold text-text mb-1">Appearance & Palette</h3>
                <p className="text-xs text-muted mb-4">Select your preferred viewing comfort. Hand-crafted palette for clarity and ease of focus.</p>

                <div className="flex items-center justify-between p-4 rounded-xl bg-card-subtle border border-border">
                    <span className="text-text font-medium text-sm flex items-center gap-2">
                        {isDarkMode ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-amber" />}
                        {isDarkMode ? 'Warm Charcoal Dark Mode' : 'Natural Light Cream Mode'}
                    </span>
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle dark mode"
                        className={`w-14 h-8 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${
                            isDarkMode ? 'bg-primary' : 'bg-stone-300 dark:bg-stone-700'
                        }`}
                    >
                        <div
                            className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-warm flex items-center justify-center text-xs text-stone-700 ${
                                isDarkMode ? 'left-[calc(100%-28px)]' : 'left-1'
                            }`}
                        >
                            {isDarkMode ? '🌙' : '☀️'}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
