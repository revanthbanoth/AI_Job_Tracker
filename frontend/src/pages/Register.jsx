import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
            {/* Background Gradient Blurs */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px]" />

            <div className="w-full max-w-md p-8 bg-card/50 rounded-lg shadow-xl border border-white/10 backdrop-blur-md relative z-10">
                <h2 className="text-3xl font-bold text-center text-primary mb-2">Create Account</h2>
                <p className="text-center text-gray-400 mb-6">Start your journey to your dream job</p>

                {error && <div className="p-3 mb-4 text-red-400 bg-red-500/10 border border-red-500/20 rounded text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-300">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full p-3 rounded-lg bg-background/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-white placeholder-gray-500"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
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
                        <label className="block text-sm font-medium mb-1.5 text-gray-300">Password</label>
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
                        Sign Up
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-400">
                    Already have an account? <Link to="/login" className="text-primary hover:text-white transition-colors font-semibold">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
