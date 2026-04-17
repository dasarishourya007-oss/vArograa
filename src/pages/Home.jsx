import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginSelection from './auth/LoginSelection';

const Home = () => {
    const { user, loading } = useAuth();

    if (loading && !user) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
            <div className="animate-pulse" style={{ color: '#10b981', fontWeight: 'bold' }}>Loading Varogra Secure...</div>
        </div>;
    }

    // Not logged in -> Show Login Selection directly
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Doctor Logged In -> Keep them where they are if possible, or redirect to official home
    if (user.role === 'doctor') {
        const path = window.location.pathname;
        if (path === '/') return <Navigate to="/dashboard/doctor" replace />;
        return null; // Let the router handle it
    }

    // Medical Store Logged In
    if (user.role === 'medical_store') {
        return <Navigate to="/dashboard/pharmacy" replace />;
    }

    // Hospital Role Check
    const storedRole = localStorage.getItem('userRole');
    if (storedRole === 'hospital') {
        return <Navigate to="/hospital" replace />;
    }

    // Patient Logged In -> NEW DASHBOARD
    return <Navigate to="/dashboard/patient" replace />;
};

export default Home;
