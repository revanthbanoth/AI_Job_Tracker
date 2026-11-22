import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import HeadingUnderline from '../components/HeadingUnderline';
import { Compass, AlertCircle, ArrowRight } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await register(name, email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration could not be completed. Please check your information.');
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-card border border-border rounded-card shadow-warm-lg relative">
            {/* Artisan Brand Icon */}
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-terracotta/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-warm">
                    <Compass size={26} strokeWidth={2.2} />
                </div>
                <div className="inline-block relative">
                    <h2 className="text-3xl font-serif font-bold text-text tracking-tight">
                        Begin Your Search
                    </h2>
                    <HeadingUnderline />
                </div>
                <p className="text-muted text-sm mt-2 font-sans">
                    Everyone starts at zero. Let's make your hunt organized and mindful.
                </p>
            </div>

            {error && (
                <div className="p-3.5 mb-5 text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl text-sm flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5 font-sans">
                        Full Name
                    </label>
                    <input
                        type="text"
                        required
                        className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-sm placeholder:text-muted/60"
                        placeholder="e.g. Revanth Banoth"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5 font-sans">
                        Email Address
                    </label>
                    <input
                        type="email"
                        required
                        className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-sm placeholder:text-muted/60"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5 font-sans">
                        Create Password
                    </label>
                    <input
                        type="password"
                        required
                        className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-sm placeholder:text-muted/60"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium shadow-warm hover:shadow-warm-lg transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed pt-3 mt-2"
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Setting up your account...</span>
                        </>
                    ) : (
                        <>
                            <span>Create Your Account</span>
                            <ArrowRight size={16} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border text-center text-sm text-muted">
                <span>Already have an account? </span>
                <Link to="/login" className="text-primary hover:underline font-semibold transition-colors">
                    Sign in
                </Link>
            </div>
        </div>
    );
};

export default Register;
