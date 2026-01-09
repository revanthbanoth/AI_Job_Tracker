import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);





    useEffect(() => {
        const verifyToken = async () => {
            // Cleanup legacy localStorage tokens to ensure strict session security
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');

            setLoading(true);
            const token = sessionStorage.getItem('token');

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Token exists, verify with backend
                // api interceptor will attach the token
                const { data } = await api.get('/api/auth/verify');

                // If effective, keep user logged in
                const validUser = { ...data, token };
                setUser(validUser);
                sessionStorage.setItem('userInfo', JSON.stringify(validUser));
            } catch (error) {
                console.error("Token verification failed:", error);
                // Token invalid/expired -> Clear everything
                setUser(null);
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('userInfo');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, []);



    const login = async (email, password) => {
        try {
            const { data } = await api.post(`/api/auth/login`, { email, password });
            sessionStorage.setItem('userInfo', JSON.stringify(data));
            sessionStorage.setItem('token', data.token);
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
            sessionStorage.setItem('userInfo', JSON.stringify(data));
            sessionStorage.setItem('token', data.token);
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
            sessionStorage.removeItem('userInfo');
            sessionStorage.removeItem('token');
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
