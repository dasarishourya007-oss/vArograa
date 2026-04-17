import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import DoctorDashboard from '../DoctorDashboard';
import DoctorProfileDashboard from '../DoctorProfileDashboard';
import '../../hospital/styles/global.css';

const Layout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user } = useAuth();
    const { pathname } = useLocation();
    const isApproved = user?.doctorStatus === 'APPROVED';

    // Total Lockdown: If not approved, only show the pending message (but allow profile page)
    if (!isApproved) {
        if (pathname === '/dashboard/doctor/profile') {
            return (
                <div className="hospital-dashboard-root" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
                    <DoctorProfileDashboard />
                </div>
            );
        }
        return (
            <div className="hospital-dashboard-root" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
                <DoctorDashboard />
            </div>
        );
    }

    return (
        <div className="hospital-dashboard-root" style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                paddingLeft: isCollapsed ? 'var(--sidebar-collapsed, 80px)' : 'var(--sidebar-width, 280px)',
                transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                <div style={{
                    padding: '1.5rem 2.5rem',
                    maxWidth: '1600px',
                    width: '100%',
                    margin: '0 auto',
                    position: 'relative'
                }}>
                    <Header />
                    <div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={window.location.pathname}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Ambient Background Glows */}
                <div style={{
                    position: 'fixed',
                    top: '-10%',
                    right: '-5%',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                    zIndex: -1,
                    pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'fixed',
                    bottom: '-10%',
                    left: '10%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(20, 184, 166, 0.1) 0%, transparent 70%)',
                    zIndex: -1,
                    pointerEvents: 'none'
                }} />
            </main>
        </div>
    );
};

export default Layout;
