import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Since we don't have a real email service configured in this dev environment, 
        // we will simulate the success state.
        // In production, this would call an API: await axios.post('/api/auth/forgot-password', { email });
        setSubmitted(true);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
            {/* Background Gradient Blurs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px]" />

            <div className="w-full max-w-md p-8 bg-card/50 rounded-lg shadow-xl border border-white/10 backdrop-blur-md relative z-10">
                <Link to="/login" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Login
                </Link>

                {!submitted ? (
                    <>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <Mail size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
                            <p className="text-gray-400 text-sm">No worries, we'll send you reset instructions.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-300">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full p-3 rounded-lg bg-background/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-white placeholder-gray-500"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-lg font-bold text-white shadow-lg shadow-primary/25 transition-all transform active:scale-[0.98]">
                                Send Reset Link
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                            <Mail size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                        <p className="text-gray-400 mb-6">We sent a password reset link to<br /><span className="text-white font-medium">{email}</span></p>
                        <p className="text-xs text-gray-500 mb-6">
                            Did not receive the email? Check your spam filter,<br />or <button onClick={() => setSubmitted(false)} className="text-primary hover:underline">try another email address</button>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
