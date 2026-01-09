import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // While checking authentication status, show a loader
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-text">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If no user is found after loading, redirect to login
    // We check user existence which confirms token validaton from AuthContext
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If authenticated, render the protected component
    return children;
};

export default ProtectedRoute;
