const fs = require('fs');
const content = import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_PATHS = {
    patient: '/dashboard/patient',
    hospital: '/dashboard/hospital',
    doctor: '/dashboard/doctor'
};

export const DashboardGate = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className= flex h-screen items-center justify-center>
                <Loader2 className=animate-spin text-p-600 size={32} />
            </div>
        );
    }
    if (!user) {
        return <Navigate to=/login/patient replace />;
    }
    return children ? children : <Outlet />;
};

export const RoleRedirect = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading || !user) return;
        if (!location.pathname.startsWith('/dashboard')) return;
        const target = ROLE_PATHS[user.role];
        if (!target) {
            navigate('/', { replace: true });
            return;
        }
        if (location.pathname.startsWith(target)) return;
        if (location.pathname !== '/dashboard' && location.pathname !== '/dashboard/') {
            navigate(target, { replace: true });
            return;
        }
        navigate(target, { replace: true });
    }, [loading, location.pathname, navigate, user]);

    return null;
};

export const RoleGuard = ({ allowedRole, children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to=/ replace />;
    const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!roles.includes(user.role)) {
        return <Navigate to=/ replace />;
    }
    return children;
};
;
fs.writeFileSync('src/components/RoleRouter.jsx', content, 'utf8');
