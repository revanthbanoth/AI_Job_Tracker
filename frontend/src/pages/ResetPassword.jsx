import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import HeadingUnderline from '../components/HeadingUnderline';
import { triggerOfferConfetti } from '../utils/confetti';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Live validation
    const hasMinLength = password.length >= 6;
    const passwordsMatch = password.length > 0 && password === confirmPassword;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!hasMinLength) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match. Please verify both fields.');
            return;
        }

        setLoading(true);

        try {
            const { data } = await api.post(`/api/auth/reset-password/${token}`, { password });

            // Save session credentials
            if (data.token) {
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('userInfo', JSON.stringify(data));
                if (setUser) {
                    setUser(data);
                }
            }

            setSuccess(true);
            triggerOfferConfetti();
        } catch (err) {
            console.error('Reset password error:', err);
            setError(
                err.response?.data?.message || 
                'Unable to reset password. The link may have expired or is invalid.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[420px] px-6 py-5 bg-card border border-border rounded-2xl shadow-warm-lg relative font-sans my-auto">
            {!success ? (
                <>
                    <div className="text-center mb-4">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-2 shadow-warm">
                            <Lock size={18} />
                        </div>
                        <div className="inline-block relative">
                            <h2 className="text-xl font-serif font-bold text-text tracking-tight">
                                Create New Password
                            </h2>
                            <HeadingUnderline />
                        </div>
                        <p className="text-muted text-xs mt-1">
                            Choose a strong, secure password for your account.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium flex items-start gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p>{error}</p>
                                {error.toLowerCase().includes('expired') && (
                                    <Link
                                        to="/forgot-password"
                                        className="inline-block mt-1 text-primary hover:underline font-semibold"
                                    >
                                        Request a fresh reset link →
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* New Password */}
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    disabled={loading}
                                    className="w-full py-2 px-3 pr-8 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-xs placeholder:text-muted/60 disabled:opacity-60"
                                    placeholder="Enter at least 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors p-0.5"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    disabled={loading}
                                    className="w-full py-2 px-3 pr-8 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-xs placeholder:text-muted/60 disabled:opacity-60"
                                    placeholder="Re-enter your new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors p-0.5"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Validation hints */}
                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                            <div className={`flex items-center gap-1 transition-colors ${hasMinLength ? 'text-sage font-medium' : 'text-muted'}`}>
                                <ShieldCheck size={12} className={hasMinLength ? 'text-sage' : 'text-muted/60'} />
                                <span>6+ chars</span>
                            </div>
                            <div className={`flex items-center gap-1 transition-colors ${confirmPassword ? (passwordsMatch ? 'text-sage font-medium' : 'text-rose-500 font-medium') : 'text-muted'}`}>
                                <ShieldCheck size={12} className={confirmPassword && passwordsMatch ? 'text-sage' : 'text-muted/60'} />
                                <span>{confirmPassword ? (passwordsMatch ? 'Passwords match' : 'Do not match') : 'Match confirmation'}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !hasMinLength || !passwordsMatch}
                            className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg font-medium text-xs shadow-warm hover:shadow-warm-lg transition-all flex justify-center items-center gap-1.5 cursor-pointer mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Updating Password...</span>
                                </>
                            ) : (
                                <span>Save New Password</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <Link to="/login" className="text-xs text-muted hover:text-text transition-colors">
                            Remember your password? <span className="text-primary font-medium">Sign in</span>
                        </Link>
                    </div>
                </>
            ) : (
                <div className="text-center py-2">
                    <div className="w-12 h-12 bg-sage/15 text-sage rounded-full flex items-center justify-center mx-auto mb-3 animate-scale-in">
                        <CheckCircle2 size={28} />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-text mb-1.5">Password Updated!</h2>
                    <p className="text-muted text-xs mb-4 leading-relaxed">
                        Your password has been changed successfully. You are now securely logged in.
                    </p>
                    <div className="space-y-2">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-xs shadow-warm hover:shadow-warm-lg transition-all flex justify-center items-center gap-2 cursor-pointer"
                        >
                            <span>Go to Dashboard</span>
                            <ArrowRight size={14} />
                        </button>
                        <Link
                            to="/login"
                            className="block w-full py-2 bg-card-subtle hover:bg-card border border-border rounded-lg text-xs font-medium text-muted hover:text-text transition-colors"
                        >
                            Return to Sign In Page
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResetPassword;
