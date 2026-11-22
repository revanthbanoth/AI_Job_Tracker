import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import HeadingUnderline from '../components/HeadingUnderline';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2, ExternalLink, ArrowRight } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [devResetUrl, setDevResetUrl] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/api/auth/forgot-password', { email });
            if (res.data.devResetUrl) {
                setDevResetUrl(res.data.devResetUrl);
            }
            if (res.data.previewUrl) {
                setPreviewUrl(res.data.previewUrl);
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
        <div className="w-full max-w-md p-8 bg-card border border-border rounded-card shadow-warm-lg relative font-sans">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text mb-6 transition-colors group font-medium">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Sign in
            </Link>

            {!submitted ? (
                <>
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-amber/10 text-amber rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-warm">
                            <Mail size={24} />
                        </div>
                        <div className="inline-block relative">
                            <h2 className="text-2xl font-serif font-bold text-text tracking-tight">
                                Reset Password
                            </h2>
                            <HeadingUnderline />
                        </div>
                        <p className="text-muted text-sm mt-2">
                            Enter your email and we'll send you simple recovery instructions.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium flex items-start gap-2.5">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                                Registered Email Address
                            </label>
                            <input
                                type="email"
                                required
                                disabled={loading}
                                className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-sm placeholder:text-muted/60 disabled:opacity-60"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl font-medium shadow-warm hover:shadow-warm-lg transition-all flex justify-center items-center gap-2 cursor-pointer mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Sending Link...</span>
                                </>
                            ) : (
                                <span>Send Reset Link</span>
                            )}
                        </button>
                    </form>
                </>
            ) : (
                <div className="text-center py-2">
                    <div className="w-14 h-14 bg-sage/15 text-sage rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={30} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-text mb-2">Check your email</h2>
                    <p className="text-muted text-sm mb-4">
                        We've dispatched password reset instructions to <span className="text-text font-semibold">{email}</span>.
                    </p>

                    {/* Development & preview helpers if running locally or using Ethereal */}
                    {(devResetUrl || previewUrl) && (
                        <div className="mb-6 p-4 rounded-xl bg-amber/10 border border-amber/20 text-left space-y-2.5">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber">
                                <span>Quick Access (Test Mode)</span>
                            </div>
                            <p className="text-xs text-text/80">
                                You can proceed immediately using this direct reset link:
                            </p>
                            {devResetUrl && (
                                <Link
                                    to={devResetUrl.replace(/^https?:\/\/[^/]+/, '')}
                                    className="inline-flex items-center justify-between w-full p-2.5 bg-card hover:bg-card-subtle border border-border rounded-lg text-xs font-medium text-primary hover:text-primary-hover transition-colors group"
                                >
                                    <span>Open Password Reset Form</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            )}
                            {previewUrl && (
                                <a
                                    href={previewUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors pt-1"
                                >
                                    <ExternalLink size={12} />
                                    <span>Inspect Outgoing Email (Ethereal Mailbox)</span>
                                </a>
                            )}
                        </div>
                    )}

                    <p className="text-xs text-muted mb-6">
                        Didn't see it? Check your spam folder, or{' '}
                        <button
                            onClick={() => {
                                setSubmitted(false);
                                setDevResetUrl('');
                                setPreviewUrl('');
                            }}
                            className="text-primary hover:underline font-medium"
                        >
                            try another email
                        </button>.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block px-5 py-2.5 bg-card-subtle hover:bg-card border border-border rounded-xl text-sm font-medium text-text transition-colors"
                    >
                        Return to Sign In
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ForgotPassword;
