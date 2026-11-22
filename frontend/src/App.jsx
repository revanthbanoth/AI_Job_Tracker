import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Resumes from './pages/Resumes';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import CalendarPage from './pages/CalendarPage';
import ShareProgressPage from './pages/ShareProgressPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';

// Public page wrapper to include consistent footer without breaking viewport
const PublicLayout = ({ children }) => (
  <div className="min-h-screen w-full flex flex-col justify-between bg-background text-text overflow-y-auto">
    <div className="flex-1 flex items-center justify-center">
      {children}
    </div>
    <Footer />
  </div>
);

function App() {
  // Initialize theme: Light theme by default, dark mode if explicitly set
  if (typeof window !== 'undefined') {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return (
    <div className="h-screen w-full bg-background text-text font-sans overflow-hidden">
      <Routes>
        {/* Public Routes with consistent footer */}
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
        <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
        <Route path="/share/:token" element={<PublicLayout><ShareProgressPage /></PublicLayout>} />

        {/* Protected Routes inside Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="resumes" element={<Resumes />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch all - Redirect to Login or Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
