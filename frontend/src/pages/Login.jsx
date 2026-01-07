import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
            {/* Background Gradient Blurs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px]" />

            <div className="w-full max-w-md p-8 bg-card/50 rounded-lg shadow-xl border border-white/10 backdrop-blur-md relative z-10">
                <h2 className="text-3xl font-bold text-center text-primary mb-2">Welcome Back</h2>
                <p className="text-center text-gray-400 mb-6">Login to continue tracking your applications</p>

                {error && <div className="p-3 mb-4 text-red-400 bg-red-500/10 border border-red-500/20 rounded text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-300">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full p-3 rounded-lg bg-background/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-white placeholder-gray-500"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-medium text-gray-300">Password</label>
                            <Link to="/forgot-password" className="text-xs text-primary hover:text-white transition-colors">Forgot Password?</Link>
                        </div>
                        <input
                            type="password"
                            required
                            className="w-full p-3 rounded-lg bg-background/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-white placeholder-gray-500"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-lg font-bold text-white shadow-lg shadow-primary/25 transition-all transform active:scale-[0.98]">
                        Login
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-400">
                    Don't have an account? <Link to="/register" className="text-primary hover:text-white transition-colors font-semibold">Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
