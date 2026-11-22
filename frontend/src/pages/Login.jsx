import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import HeadingUnderline from '../components/HeadingUnderline';
import { Compass, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email.trim(), password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'We could not sign you in. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[420px] p-6 sm:p-7 bg-card border border-border rounded-2xl shadow-warm-lg relative my-auto">
            {/* Artisan Brand Icon */}
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-terracotta/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-warm">
                    <Compass size={26} strokeWidth={2.2} />
                </div>
                <div className="inline-block relative">
                    <h2 className="text-3xl font-serif font-bold text-text tracking-tight">
                        Welcome Back
                    </h2>
                    <HeadingUnderline />
                </div>
                <p className="text-muted text-sm mt-2 font-sans">
                    Let's continue tracking your journey to the right role.
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
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted font-sans">
                            Password
                        </label>
                        <Link to="/forgot-password" className="text-xs text-primary hover:underline transition-colors font-medium">
                            Forgot password?
                        </Link>
                    </div>
                    <input
                        type="password"
                        required
                        className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-sm placeholder:text-muted/60"
                        placeholder="••••••••"
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
                            <span>Signing in...</span>
                        </>
                    ) : (
                        <>
                            <span>Continue to Dashboard</span>
                            <ArrowRight size={16} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border text-center text-sm text-muted">
                <span>New here? </span>
                <Link to="/register" className="text-primary hover:underline font-semibold transition-colors">
                    Create an account
                </Link>
            </div>
        </div>
    );
};

export default Login;
