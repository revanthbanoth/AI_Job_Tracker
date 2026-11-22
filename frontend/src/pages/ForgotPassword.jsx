import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import HeadingUnderline from '../components/HeadingUnderline';
import { triggerOfferConfetti } from '../utils/confetti';
import { ArrowLeft, Lock, Mail, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const [email, setEmail] = useState('');
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
    const isFormValid = email.trim().length > 0 && hasMinLength && passwordsMatch;

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
            const { data } = await api.post('/api/auth/forgot-password', {
                email: email.trim(),
                password
            });

            // Automatically save session credentials so user is authenticated
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
            console.error('Password reset error:', err);
            setError(
                err.response?.data?.message || 
                'Unable to reset password. Please check your registered email address and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-card border border-border rounded-card shadow-warm-lg relative font-sans">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text mb-6 transition-colors group font-medium">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Sign in
            </Link>

            {!success ? (
                <>
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-warm">
                            <Lock size={24} />
                        </div>
                        <div className="inline-block relative">
                            <h2 className="text-2xl font-serif font-bold text-text tracking-tight">
                                Reset Password
                            </h2>
                            <HeadingUnderline />
                        </div>
                        <p className="text-muted text-sm mt-2">
                            Enter your registered email and choose a new password to reset it directly.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium flex items-start gap-2.5">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Registered Email */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                                Registered Email Address
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    disabled={loading}
                                    className="w-full p-3 pr-10 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-sm placeholder:text-muted/60 disabled:opacity-60"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/60 pointer-events-none">
                                    <Mail size={16} />
                                </div>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    disabled={loading}
                                    className="w-full p-3 pr-10 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-sm placeholder:text-muted/60 disabled:opacity-60"
                                    placeholder="At least 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    disabled={loading}
                                    className="w-full p-3 pr-10 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-sm placeholder:text-muted/60 disabled:opacity-60"
                                    placeholder="Re-enter your new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Validation hints */}
                        <div className="py-1 space-y-1 text-xs">
                            <div className={`flex items-center gap-1.5 transition-colors ${hasMinLength ? 'text-sage font-medium' : 'text-muted'}`}>
                                <ShieldCheck size={14} className={hasMinLength ? 'text-sage' : 'text-muted/60'} />
                                <span>At least 6 characters</span>
                            </div>
                            {confirmPassword && (
                                <div className={`flex items-center gap-1.5 transition-colors ${passwordsMatch ? 'text-sage font-medium' : 'text-rose-500'}`}>
                                    <ShieldCheck size={14} className={passwordsMatch ? 'text-sage' : 'text-rose-500'} />
                                    <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !isFormValid}
                            className="w-full py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl font-medium shadow-warm hover:shadow-warm-lg transition-all flex justify-center items-center gap-2 cursor-pointer mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Updating Password...</span>
                                </>
                            ) : (
                                <span>Change Password Directly</span>
                            )}
                        </button>
                    </form>
                </>
            ) : (
                <div className="text-center py-3">
                    <div className="w-16 h-16 bg-sage/15 text-sage rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                        <CheckCircle2 size={36} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-text mb-2">Password Changed!</h2>
                    <p className="text-muted text-sm mb-6 leading-relaxed">
                        Your password for <span className="text-text font-semibold">{email}</span> has been updated successfully. You are now logged in.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium shadow-warm hover:shadow-warm-lg transition-all flex justify-center items-center gap-2 cursor-pointer"
                        >
                            <span>Go to Dashboard</span>
                            <ArrowRight size={16} />
                        </button>
                        <Link
                            to="/login"
                            className="block w-full py-2.5 bg-card-subtle hover:bg-card border border-border rounded-xl text-xs font-medium text-muted hover:text-text transition-colors"
                        >
                            Return to Sign In Page
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ForgotPassword;
