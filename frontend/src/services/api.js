import axios from 'axios';

// Create a centralized axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://ai-job-tracker-backend.onrender.com',
    withCredentials: true,
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        // 1. Try to get token from standalone key
        let token = localStorage.getItem('token');

        // 2. Fallback to userInfo object if not found
        if (!token) {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                try {
                    const parsed = JSON.parse(userInfo);
                    if (parsed && parsed.token) {
                        token = parsed.token;
                        // Auto-fix: Store it separately for future
                        localStorage.setItem('token', token);
                    }
                } catch (error) {
                    console.error("Error parsing userInfo from localStorage", error);
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
