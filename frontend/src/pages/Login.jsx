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
        <div className="w-full max-w-[400px] px-6 py-5 bg-card border border-border rounded-2xl shadow-warm-lg relative my-auto font-sans">
            {/* Brand Icon */}
            <div className="text-center mb-4">
                <div className="w-9 h-9 bg-terracotta/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-2 shadow-warm">
                    <Compass size={20} strokeWidth={2.2} />
                </div>
                <div className="inline-block relative">
                    <h2 className="text-2xl font-serif font-bold text-text tracking-tight">
                        Welcome Back
                    </h2>
                    <HeadingUnderline />
                </div>
                <p className="text-muted text-xs mt-1">
                    Let's continue tracking your journey to the right role.
                </p>
            </div>

            {error && (
                <div className="p-2.5 mb-3 text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg text-xs flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        required
                        className="w-full py-2 px-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-xs placeholder:text-muted/60"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
                            Password
                        </label>
                        <Link to="/forgot-password" tabIndex={-1} className="text-[11px] text-primary hover:underline transition-colors font-medium">
                            Forgot password?
                        </Link>
                    </div>
                    <input
                        type="password"
                        required
                        className="w-full py-2 px-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-xs placeholder:text-muted/60"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-xs shadow-warm hover:shadow-warm-lg transition-all flex justify-center items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                    {loading ? (
                        <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Signing in...</span>
                        </>
                    ) : (
                        <>
                            <span>Continue to Dashboard</span>
                            <ArrowRight size={14} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-4 pt-3 border-t border-border text-center text-xs text-muted">
                <span>New here? </span>
                <Link to="/register" className="text-primary hover:underline font-semibold transition-colors">
                    Create an account
                </Link>
            </div>
        </div>
    );
};

export default Login;
