import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CalendarClock,
    MonitorPlay,
    Bell,
    FileText,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Stethoscope,
    ClipboardList,
    MessageSquare,
    BrainCircuit
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const { logout, user } = useAuth();

    const navItems = [
        { title: 'Dashboard', icon: <LayoutDashboard size={22} />, path: '/dashboard/doctor' },
        { title: 'My Schedule', icon: <CalendarClock size={22} />, path: '/dashboard/doctor/schedule' },
        { title: 'Live Consultation', icon: <MonitorPlay size={22} />, path: '/dashboard/doctor/live' },
        { title: 'Patient History', icon: <Users size={22} />, path: '/dashboard/doctor/history' },
        { title: 'Prescriptions', icon: <ClipboardList size={22} />, path: '/dashboard/doctor/prescriptions' },
        { title: 'SmartScript™', icon: <BrainCircuit size={22} />, path: '/dashboard/doctor/smart-script' },
        { title: 'Shared Notepad', icon: <FileText size={22} />, path: '/dashboard/doctor/notepad' },
        { title: 'Alerts', icon: <Bell size={22} />, path: '/dashboard/doctor/notifications' },
    ];

    return (
        <motion.aside
            animate={{ width: isCollapsed ? 'var(--sidebar-collapsed, 80px)' : 'var(--sidebar-width, 280px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass"
            style={{
                height: '100vh',
                position: 'fixed',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem 1.25rem',
                zIndex: 1000,
                background: 'var(--bg-sidebar, #1E293B)',
                borderRight: '1px solid var(--border-glass, rgba(255, 255, 255, 0.08))',
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
                    src="/logo.png"
                    alt="vArogra"
                    style={{
                        minWidth: '40px',
                        height: '40px',
                        objectFit: 'contain',
                        borderRadius: 'var(--radius-lg, 12px)',
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
                                end
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '12px 16px',
                                    borderRadius: 'var(--radius-lg, 12px)',
                                    color: isActive ? 'var(--brand-primary, #3B82F6)' : 'var(--text-secondary, #475569)',
                                    background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                                    border: isActive ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                                    textDecoration: 'none',
                                    transition: 'var(--transition, all 0.3s ease)',
                                    position: 'relative'
                                })}
                            >
                                {({ isActive }) => (
                                    <>
                                        <div style={{ color: isActive ? 'var(--brand-primary, #3B82F6)' : 'inherit' }}>
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
                                        {isActive && !isCollapsed && (
                                            <motion.div
                                                layoutId="activeGlow"
                                                style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    width: '6px',
                                                    height: '6px',
                                                    background: 'var(--brand-primary, #3B82F6)',
                                                    borderRadius: '50%',
                                                    boxShadow: '0 0 10px var(--brand-primary, #3B82F6)'
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
                borderTop: '1px solid var(--border-glass, rgba(0, 0, 0, 0.08))',
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
                    background: 'var(--bg-main, #F1F5F9)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        minWidth: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-lg, 12px)',
                        background: 'linear-gradient(135deg, var(--brand-primary, #3B82F6), var(--brand-dark, #1E3A8A))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                    }}>
                        {user?.displayName?.[0] || user?.name?.[0] || 'D'}
                    </div>
                    {!isCollapsed && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Dr. {user?.displayName || user?.name || 'Doctor'}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94A3B8)' }}>Surgeon · Oncology</p>
                        </motion.div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{
                            padding: '10px',
                            background: 'var(--bg-main, #F1F5F9)',
                            border: '1px solid var(--border-glass, rgba(0, 0, 0, 0.08))',
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
                            color: 'var(--critical, #EF4444)',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            fontWeight: '700',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--critical, #EF4444)';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                            e.currentTarget.style.color = 'var(--critical, #EF4444)';
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
