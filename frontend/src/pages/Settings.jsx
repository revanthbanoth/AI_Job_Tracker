import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Save, UploadCloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../axiosConfig';

const Settings = () => {
    const { user, setUser } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Resume state
    const [resumeFile, setResumeFile] = useState(null);
    const [uploadingResume, setUploadingResume] = useState(false);
    const resumeInputRef = useRef(null);

    useEffect(() => {
        // Initialize state based on current class
        if (document.documentElement.classList.contains('dark')) {
            setIsDarkMode(true);
        } else {
            setIsDarkMode(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

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
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            // Config handled by interceptor for Authorization
            // const config = { ... };

            const { data } = await api.put(`/api/auth/profile`, {
                name,
                email,
                password: password || undefined
            });

            // Update context
            const updatedUser = { ...user, name: data.name, email: data.email };
            setUser(updatedUser);
            localStorage.setItem('userInfo', JSON.stringify(updatedUser)); // Sync with local storage

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

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('name', file.name);

        try {
            // Header for multipart/form-data is set automatically by axios/browser when using FormData
            // Authorization token is handled by global interceptor
            await api.post(`/api/resumes`, formData);

            setMessage(`Resume "${file.name}" uploaded successfully!`);
            setResumeFile(null);
        } catch (err) {
            setError('Failed to upload resume to your profile');
        } finally {
            setUploadingResume(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <h3 className="text-2xl font-bold text-text mb-6">Settings</h3>

            {message && <div className="p-3 mb-4 rounded-lg bg-green-500/10 text-green-500 text-sm border border-green-500/20">{message}</div>}
            {error && <div className="p-3 mb-4 rounded-lg bg-red-500/10 text-red-500 text-sm border border-red-500/20">{error}</div>}

            <form onSubmit={handleUpdateProfile} className="bg-card/30 border border-border rounded-2xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-text">Profile Settings</h4>
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors">
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-muted">Display Name</label>
                        <input
                            type="text"
                            className="w-full p-3 rounded-lg bg-background/50 border border-border text-text focus:border-primary focus:outline-none transition-colors"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-muted">Email</label>
                        <input
                            type="email"
                            className="w-full p-3 rounded-lg bg-background/50 border border-border text-muted"
                            value={email}
                            disabled
                        />
                        <p className="text-xs text-muted mt-1">Email cannot be changed.</p>
                    </div>
                    <div className="pt-2 border-t border-border mt-4">
                        <h5 className="text-sm font-medium text-text mb-3 mt-2">Change Password</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-muted">New Password</label>
                                <input
                                    type="password"
                                    className="w-full p-3 rounded-lg bg-background/50 border border-border text-text focus:border-primary focus:outline-none transition-colors"
                                    placeholder="Leave blank to keep current"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-muted">Confirm Password</label>
                                <input
                                    type="password"
                                    className="w-full p-3 rounded-lg bg-background/50 border border-border text-text focus:border-primary focus:outline-none transition-colors"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <div className="bg-card/30 border border-border rounded-2xl p-6 mb-6">
                <h4 className="text-lg font-semibold text-text mb-4">Resume Settings</h4>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-text font-medium mb-1">Add or Update Resume</p>
                        <p className="text-xs text-muted">Upload a new resume to add it to your profile collection.</p>
                    </div>
                    <div>
                        <input
                            type="file"
                            ref={resumeInputRef}
                            onChange={handleResumeUpload}
                            className="hidden"
                            accept=".pdf,.docx,.doc"
                        />
                        <button
                            onClick={() => resumeInputRef.current.click()}
                            disabled={uploadingResume}
                            className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text rounded-lg text-sm font-medium transition-colors"
                        >
                            <UploadCloud size={16} />
                            {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-card/30 border border-border rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-text mb-4">Appearance</h4>
                <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-2">
                        {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                        {isDarkMode ? 'Dark Mode Active' : 'Light Mode Active'}
                    </span>
                    <button
                        onClick={toggleTheme}
                        className={`w-14 h-7 rounded-full relative transition-colors duration-300 focus:outline-none ${isDarkMode ? 'bg-primary' : 'bg-gray-600'}`}
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${isDarkMode ? 'left-[calc(100%-24px)]' : 'left-1'}`}></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
