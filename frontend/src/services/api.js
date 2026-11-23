import axios from 'axios';

// Create a centralized axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://ai-job-tracker-backend.onrender.com',
    timeout: 90000, // 90s timeout for mobile uploads
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        // 1. Try to get token from standalone key (sessionStorage or localStorage)
        let token = sessionStorage.getItem('token') || localStorage.getItem('token');

        // 2. Fallback to userInfo object if not found
        if (!token) {
            const rawUser = sessionStorage.getItem('userInfo') || localStorage.getItem('userInfo');
            if (rawUser) {
                try {
                    const parsed = JSON.parse(rawUser);
                    if (parsed && parsed.token) {
                        token = parsed.token;
                        // Auto-fix: Store it for future requests
                        sessionStorage.setItem('token', token);
                        localStorage.setItem('token', token);
                    }
                } catch (error) {
                    console.error("Error parsing userInfo from storage", error);
                }
            }
        }

        // 3. Attach token to headers if available
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
