import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);





    useEffect(() => {
        const verifyToken = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userInfo = localStorage.getItem('userInfo');

            if (token || userInfo) {
                try {
                    // Call backend to verify token validity
                    // API interceptor will attach the token automatically
                    const { data } = await api.get('/api/auth/verify');

                    // If successful, data contains user info (without token usually)
                    // We preserve the local token
                    const validUser = { ...data, token: token || JSON.parse(userInfo).token };

                    setUser(validUser);
                    // Update localStorage to keep it fresh
                    localStorage.setItem('userInfo', JSON.stringify(validUser));
                } catch (error) {
                    console.error("Token verification failed:", error);
                    // If verification fails (401), clear everything
                    localStorage.removeItem('userInfo');
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        verifyToken();
    }, []);



    const login = async (email, password) => {
        try {
            const { data } = await api.post(`/api/auth/login`, { email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            setUser(data);
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const register = async (name, email, password) => {
        try {
            const { data } = await api.post(`/api/auth/register`, { name, email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            setUser(data);
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    const logout = async () => {
        try {
            await api.post(`/api/auth/logout`);
            localStorage.removeItem('userInfo');
            localStorage.removeItem('token');
            setUser(null);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
