import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import HeadingUnderline from '../components/HeadingUnderline';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resetLink, setResetLink] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await api.post('/api/auth/forgot-password', { email: email.trim() });
            if (data?.resetLink) {
                setResetLink(data.resetLink);
            }
            setSubmitted(true);
        } catch (err) {
            console.error('Forgot password error:', err);
            setError(
                err.response?.data?.message || 
                'Unable to send reset instructions. Please check the email address and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[420px] px-6 py-5 bg-card border border-border rounded-2xl shadow-warm-lg relative font-sans my-auto">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text mb-3 transition-colors group font-medium">
                <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
                Back to Sign in
            </Link>

            {!submitted ? (
                <>
                    <div className="text-center mb-4">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-2 shadow-warm">
                            <Mail size={18} />
                        </div>
                        <div className="inline-block relative">
                            <h2 className="text-xl font-serif font-bold text-text tracking-tight">
                                Reset Password
                            </h2>
                            <HeadingUnderline />
                        </div>
                        <p className="text-muted text-xs mt-1">
                            Enter your registered email and we'll send you recovery instructions.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium flex items-start gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
                                Registered Email Address
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    disabled={loading}
                                    className="w-full py-2.5 px-3 pr-8 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-xs placeholder:text-muted/60 disabled:opacity-60"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted/60 pointer-events-none">
                                    <Mail size={14} />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email.trim()}
                            className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg font-medium text-xs shadow-warm hover:shadow-warm-lg transition-all flex justify-center items-center gap-1.5 cursor-pointer mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Sending Reset Email...</span>
                                </>
                            ) : (
                                <span>Send Reset Link</span>
                            )}
                        </button>
                    </form>
                </>
            ) : (
                <div className="text-center py-2">
                    <div className="w-12 h-12 bg-sage/15 text-sage rounded-full flex items-center justify-center mx-auto mb-3 animate-scale-in">
                        <CheckCircle2 size={28} />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-text mb-1.5">Check Your Email</h2>
                    <p className="text-muted text-xs mb-3 leading-relaxed">
                        We've sent password reset instructions to <span className="text-text font-semibold">{email}</span>.
                    </p>
                    <p className="text-[11px] text-muted mb-4">
                        Please check your inbox (and spam folder) and click the link to reset your password. The link is valid for 30 minutes.
                    </p>
                    {resetLink && (
                        <div className="mb-4 p-3 bg-primary/10 border border-primary/25 rounded-xl text-left animate-fade-in">
                            <p className="text-[11px] font-semibold text-primary mb-1.5">
                                Direct Recovery Link:
                            </p>
                            <a
                                href={resetLink}
                                className="block text-center py-2 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-warm transition-all"
                            >
                                Reset My Password Now
                            </a>
                        </div>
                    )}
                    <div className="space-y-2">
                        <button
                            onClick={() => setSubmitted(false)}
                            className="text-xs text-primary hover:underline font-medium block mx-auto"
                        >
                            Didn't receive it? Try again
                        </button>
                        <Link
                            to="/login"
                            className="block w-full py-2 bg-card-subtle hover:bg-card border border-border rounded-lg text-xs font-medium text-muted hover:text-text transition-colors mt-2"
                        >
                            Return to Sign In
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ForgotPassword;
