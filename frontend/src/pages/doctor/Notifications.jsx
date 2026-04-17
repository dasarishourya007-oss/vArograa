import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, AlertTriangle, Clock, FlaskConical, CalendarClock,
    CheckCircle2, X, ChevronRight, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_NOTIFICATIONS = [
    {
        id: 1,
        type: 'critical',
        title: 'Critical Lab Result',
        message: 'Elevated Troponin levels for Michael Davis. Review immediately.',
        time: '2 mins ago',
        icon: AlertTriangle,
        color: 'var(--critical)',
        actionLabel: 'Review Lab',
        actionPath: '/live',
        read: false
    },
    {
        id: 2,
        type: 'queue',
        title: 'Patient Waiting',
        message: 'Jane Smith has been in the waiting room for 15+ minutes.',
        time: '12 mins ago',
        icon: Clock,
        color: '#f59e0b',
        actionLabel: 'Start Session',
        actionPath: '/live',
        read: false
    },
    {
        id: 3,
        type: 'system',
        title: 'New Appointment Booked',
        message: 'New consultation booked by Robert Brown for 11:45 AM.',
        time: '1 hour ago',
        icon: CalendarClock,
        color: 'var(--brand-primary)',
        actionLabel: 'View Schedule',
        actionPath: '/schedule',
        read: true
    },
    {
        id: 4,
        type: 'lab',
        title: 'Reports Ready',
        message: 'Complete Blood Count (CBC) reports for Sarah Jenkins are now available.',
        time: '2 hours ago',
        icon: FlaskConical,
        color: 'var(--brand-teal)',
        actionLabel: 'Open Report',
        actionPath: '/records',
        read: true
    }
];

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));

    const markRead = (id) => setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));

    const dismiss = (id) => setNotifications(n => n.filter(x => x.id !== id));

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '1rem', borderBottom: '1px solid var(--border-glass)' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <div style={{ position: 'relative' }}>
                            <Bell size={28} color="var(--brand-primary)" />
                            {unreadCount > 0 && (
                                <span style={{ position: 'absolute', top: -2, right: -2, width: '10px', height: '10px', background: 'var(--critical)', borderRadius: '50%', border: '2px solid var(--bg-main)' }} />
                            )}
                        </div>
                        Command Center Alerts
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''} requiring attention.`
                            : 'All caught up! No new notifications.'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        style={{ background: 'none', border: 'none', color: 'var(--brand-teal)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <CheckCircle2 size={16} /> Mark all read
                    </button>
                )}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <AnimatePresence>
                    {notifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}
                        >
                            <Bell size={48} style={{ opacity: 0.1, margin: '0 auto 1rem' }} />
                            <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>Inbox Empty</p>
                            <p style={{ fontSize: '0.9rem' }}>No pending alerts or notifications.</p>
                        </motion.div>
                    ) : (
                        notifications.map((n) => (
                            <motion.div
                                key={n.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass"
                                style={{
                                    padding: '1.25rem',
                                    borderRadius: 'var(--radius-lg)',
                                    background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${n.read ? 'var(--border-glass)' : `color-mix(in srgb, ${n.color} 30%, transparent)`}`,
                                    borderLeft: `4px solid ${n.color}`,
                                    display: 'flex',
                                    gap: '1rem',
                                    position: 'relative'
                                }}
                            >
                                <div style={{
                                    width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                                    background: `color-mix(in srgb, ${n.color} 15%, transparent)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <n.icon size={20} color={n.color} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: n.read ? '600' : '800', color: n.read ? 'var(--text-primary)' : 'white' }}>
                                            {n.title}
                                        </h3>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.time}</span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: n.read ? 'var(--text-muted)' : 'rgba(255,255,255,0.85)', marginBottom: '12px', lineHeight: '1.5' }}>
                                        {n.message}
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={() => { markRead(n.id); navigate(n.actionPath); }}
                                            style={{
                                                padding: '6px 14px', background: 'var(--brand-primary)', border: 'none',
                                                borderRadius: '6px', color: 'white', fontSize: '0.8rem', fontWeight: '600',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                            }}
                                        >
                                            {n.actionLabel} <ChevronRight size={14} />
                                        </button>
                                        {!n.read && (
                                            <button
                                                onClick={() => markRead(n.id)}
                                                style={{ background: 'none', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '6px 14px', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => dismiss(n.id)}
                                    style={{
                                        position: 'absolute', top: '12px', right: '12px',
                                        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px'
                                    }}
                                    title="Dismiss"
                                >
                                    <X size={16} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Notifications;
