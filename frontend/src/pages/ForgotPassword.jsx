import { useState } from 'react';
import { Link } from 'react-router-dom';
import HeadingUnderline from '../components/HeadingUnderline';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="w-full max-w-md p-8 bg-card border border-border rounded-card shadow-warm-lg relative">
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
                        <p className="text-muted text-sm mt-2 font-sans">
                            No worries, we'll send you simple recovery instructions.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5 font-sans">
                                Registered Email Address
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-text text-sm placeholder:text-muted/60"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium shadow-warm hover:shadow-warm-lg transition-all flex justify-center items-center gap-2 cursor-pointer pt-3 mt-2"
                        >
                            Send Reset Link
                        </button>
                    </form>
                </>
            ) : (
                <div className="text-center py-4">
                    <div className="w-14 h-14 bg-sage/15 text-sage rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={30} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-text mb-2">Check your email</h2>
                    <p className="text-muted text-sm mb-4">
                        If an account exists for <span className="text-text font-semibold">{email}</span>, we've sent password reset instructions.
                    </p>
                    <p className="text-xs text-muted mb-6">
                        Didn't see it? Check your spam folder, or{' '}
                        <button onClick={() => setSubmitted(false)} className="text-primary hover:underline font-medium">
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
