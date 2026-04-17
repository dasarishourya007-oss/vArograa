import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CalendarClock,
    MonitorPlay,
    Droplets,
    FileBarChart,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Search,
    LayoutGrid,
    Bed
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/config';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const { logout, role, user } = useAuth();

    const [pendingCount, setPendingCount] = useState(0);

    React.useEffect(() => {
        if (!role || role !== 'hospital') return;
        const hospitalId = localStorage.getItem('varogra_hospital_id') || 'jPz6UEHW2NVRtMo49belygDhbRo1';

        const q = query(collection(db, "hospitals", hospitalId, "doctors"), where("status", "==", "PENDING_APPROVAL"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPendingCount(snapshot.size);
        });
        return unsubscribe;
    }, [role]);

    const navItems = [
        { title: 'Dashboard', icon: <LayoutDashboard size={22} />, path: '/hospital' },
        { title: 'Availability', icon: <Users size={22} />, path: '/hospital/availability' },
        { title: 'Appointments', icon: <CalendarClock size={22} />, path: '/hospital/appointments' },
        {
            title: 'Doctors',
            icon: <Users size={22} />,
            path: '/hospital/doctors',
            badge: pendingCount > 0 ? pendingCount : null
        },
        { title: 'Pharmacy', icon: <Search size={22} />, path: '/hospital/pharmacy' },
        { title: 'Consultations', icon: <MonitorPlay size={22} />, path: '/hospital/live' },
        { title: 'Blood Bank', icon: <Droplets size={22} />, path: '/hospital/blood-bank' },
        { title: 'Analytics', icon: <FileBarChart size={22} />, path: '/hospital/reports' },
        { title: 'Patient Records', icon: <FileText size={22} />, path: '/hospital/records' },
        { title: 'Bed Management', icon: <Bed size={22} />, path: '/hospital/beds' },
    ];

    return (
        <motion.aside
            animate={{ width: isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass"
            style={{
                height: '100vh',
                position: 'fixed',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem 1.25rem',
                zIndex: 1000,
                background: 'var(--bg-sidebar)',
                borderRight: '1px solid var(--border-glass)',
                boxShadow: 'var(--shadow-lg)'
            }}
        >
            {/* Logo Section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0.5rem',
                marginBottom: '2.5rem',
                overflow: 'hidden'
            }}>
                <img
                    src="/pwa-192x192.png"
                    alt="vArogra"
                    style={{
                        minWidth: '40px',
                        height: '40px',
                        objectFit: 'contain',
                        borderRadius: 'var(--radius-lg)',
                    }}
                />
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}
                    >
                        vArogra
                    </motion.span>
                )}
            </div>

            {/* Navigation Section */}
            <nav style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '12px 16px',
                                    borderRadius: 'var(--radius-lg)',
                                    color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                    background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                                    border: isActive ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                                    textDecoration: 'none',
                                    transition: 'var(--transition)',
                                    position: 'relative'
                                })}
                            >
                                {({ isActive }) => (
                                    <>
                                        <div style={{ color: isActive ? 'var(--brand-primary)' : 'inherit' }}>
                                            {item.icon}
                                        </div>
                                        {!isCollapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                style={{ fontWeight: isActive ? '600' : '400', fontSize: '0.95rem' }}
                                            >
                                                {item.title}
                                            </motion.span>
                                        )}
                                        {item.badge && !isCollapsed && (
                                            <div style={{
                                                marginLeft: 'auto',
                                                background: 'var(--critical)',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)'
                                            }}>
                                                {item.badge}
                                            </div>
                                        )}
                                        {isActive && !isCollapsed && !item.badge && (
                                            <motion.div
                                                layoutId="activeGlow"
                                                style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    width: '6px',
                                                    height: '6px',
                                                    background: 'var(--brand-primary)',
                                                    borderRadius: '50%',
                                                    boxShadow: '0 0 10px var(--brand-primary)'
                                                }}
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer Section */}
            <div style={{
                paddingTop: 'auto',
                paddingBottom: '0.5rem',
                borderTop: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginTop: '1rem'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px',
                    background: 'var(--bg-main)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        minWidth: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: 'white'
                    }}>
                        {(user?.adminName || 'A')[0]}
                    </div>
                    {!isCollapsed && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, overflow: 'hidden' }}>
                            <p style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.adminName || 'Administrator'}</p>
                            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.hospitalName || 'Health Center'}</p>
                        </motion.div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{
                            padding: '10px',
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '10px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%'
                        }}
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-2"><ChevronLeft size={18} /><span className="text-xs font-bold">Collapse</span></div>}
                    </button>

                    <button
                        onClick={logout}
                        className="group"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.1)',
                            borderRadius: '12px',
                            color: 'var(--critical)',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            fontWeight: '700',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--critical)';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                            e.currentTarget.style.color = 'var(--critical)';
                        }}
                    >
                        <LogOut size={20} />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
