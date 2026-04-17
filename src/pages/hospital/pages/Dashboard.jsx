import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    Users,
    MonitorPlay,
    UserPlus,
    CalendarCheck,
    Droplets,
    TrendingUp,
    ArrowUpRight,
    Clock,
    Activity,
    ShieldCheck,
    Zap,
    ChevronRight,
    ArrowRight,
    Bell,
    CheckCircle,
    AlertCircle,
    MapPin,
    Megaphone,
    Hand,
    WifiOff,
    AlertOctagon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../../../firebase/config';
import { 
    subscribeToAppointments, 
    subscribeToHospitalAnalytics,
    subscribeToHospitalDoc,
    updateHospitalStatus
} from '../../../firebase/services';
import Toast from '../../../components/Toast';
import AddressSetupModal from '../../../components/patient/AddressSetupModal';


const StatCard = ({ title, value, icon, trend, color, bgGradient }) => (
    <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        className="card"
        style={{
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid var(--border-glass)',
            background: 'var(--bg-surface)'
        }}
    >
        {/* Abstract Background Curve */}
        <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            background: bgGradient,
            filter: 'blur(40px)',
            opacity: 0.2
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'relative' }}>
            <div style={{
                padding: '12px',
                borderRadius: '14px',
                background: bgGradient,
                color: 'white',
                boxShadow: `0 8px 20px ${color}30`
            }}>
                {icon}
            </div>
            {trend && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8rem',
                    color: 'var(--success)',
                    fontWeight: '700',
                    background: 'rgba(34, 197, 94, 0.1)',
                    padding: '4px 10px',
                    borderRadius: '20px'
                }}>
                    <ArrowUpRight size={14} strokeWidth={3} />
                    {trend}%
                </div>
            )}
        </div>
        <div style={{ position: 'relative' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>{title}</p>
            <h3 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-1px' }}>{value}</h3>
        </div>
    </motion.div>
);

// Static Command Center and charts removed to enforce real-time data integrity.

const Dashboard = () => {
    const { user, profileLoaded, allHospitals = [], notifications = [] } = useAuth();

    
    if (!user) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-p-600"></div>
            </div>
        );
    }

    const [stats, setStats] = React.useState({
        totalAppointments: 0,
        pending: 0,
        accepted: 0,
        rejected: 0
    });

    React.useEffect(() => {
        if (!user) return;
        const hospitalId = user.uid || user.id;
        const unsub = subscribeToHospitalAnalytics(hospitalId, (data) => {
            setStats(data);
        });
        return () => unsub();
    }, [user]);

    const navigate = useNavigate();
    const [hospitalStaff, setHospitalStaff] = React.useState([]);
    const [pendingAppointments, setPendingAppointments] = React.useState([]);
    const [allAppointments, setAllAppointments] = React.useState([]);
    const [emergencyStatus, setEmergencyStatus] = React.useState('stable');
    const [timeRange, setTimeRange] = React.useState('week');
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [showToast, setShowToast] = React.useState(false);
    const [globalEmergency, setGlobalEmergency] = React.useState(null);
    const [showBloodRequestModal, setShowBloodRequestModal] = React.useState(false);
    const [selectedBloodType, setSelectedBloodType] = React.useState('O+');
    const [broadcastStatus, setBroadcastStatus] = React.useState('idle');
    const [isUpdatingMode, setIsUpdatingMode] = React.useState(false);
    const [optimisticMode, setOptimisticMode] = React.useState(null);
    const [showAddressSetup, setShowAddressSetup] = React.useState(false);

    const hospitalMode = user?.hospitalMode || 'Available';
    const currentDisplayMode = optimisticMode !== null ? optimisticMode : hospitalMode;

    // Clear optimistic state once sync is confirmed
    React.useEffect(() => {
        setOptimisticMode(null);
    }, [user?.hospitalMode]);

    React.useEffect(() => {
        if (profileLoaded && user) {
            const needsLocation = !user.district || !user.state || !user.latitude;
            if (needsLocation) {
                setShowAddressSetup(true);
            }
        }
    }, [user, profileLoaded]);


    // Global Emergency Listener
    React.useEffect(() => {
        const handleEmergency = (e) => {
            const data = e.detail;
            setGlobalEmergency(data);
            setTimeout(() => setGlobalEmergency(null), 15000);
        };
        window.addEventListener('varogra_emergency_broadcast', handleEmergency);
        return () => window.removeEventListener('varogra_emergency_broadcast', handleEmergency);
    }, []);

    const handleBloodBroadcast = () => {
        setBroadcastStatus('broadcasting');
        const emergencyData = {
            id: Date.now(),
            type: selectedBloodType,
            location: `${user?.hospitalName || 'Hospital Center'}`,
            requester: `Regional Admin`,
            timestamp: new Date().toISOString()
        };

        setTimeout(() => {
            setBroadcastStatus('success');
            window.dispatchEvent(new CustomEvent('varogra_emergency_broadcast', { 
                detail: emergencyData 
            }));
            setTimeout(() => {
                setBroadcastStatus('idle');
                setShowBloodRequestModal(false);
            }, 2000);
        }, 3000);
    };

    const hospitalId = user?.hospitalId || user?.uid || 'jPz6UEHW2NVRtMo49belygDhbRo1';
    const hospitalRefId = localStorage.getItem('varogra_hospital_id') || user?.uid || null;
    const hospitalIdCandidates = Array.from(new Set([hospitalId, hospitalRefId].filter(Boolean)));
    const hospitalPrimaryId = hospitalId; // Alias for consistency with mode logic

    // Real-time mode sync is now handled by AuthContext profile snapshot


    const handleModeChange = async (mode) => {
        if (isUpdatingMode || !hospitalPrimaryId || mode === hospitalMode) return;
        
        setOptimisticMode(mode); // Optimistic UI
        setIsUpdatingMode(true);
        
        try {
            await updateHospitalStatus(hospitalPrimaryId, mode);
            // Real-time sync via subscribeToHospitalDoc will update hospitalMode state
        } catch (e) {
            console.error('Failed to update mode:', e);
            setOptimisticMode(null); // Rollback on failure
        } finally {
            setIsUpdatingMode(false);
        }
    };

    React.useEffect(() => {
        if (hospitalIdCandidates.length === 0) return;
        const sourceRows = new Map();
        const recompute = () => {
            const merged = Array.from(sourceRows.values()).flat();
            setAllAppointments(merged); // Capture all appointments for dynamic charts
            const pending = merged.filter((a) => String(a?.status || '').toLowerCase() === 'pending');
            const seen = new Set();
            const uniquePending = pending.filter((item) => {
                if (!item?.id || seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
            });
            setPendingAppointments((prev) => {
                if (uniquePending.length > (prev?.length || 0)) setShowToast(true);
                return uniquePending;
            });
        };

        const unsubscribers = hospitalIdCandidates.map((id) =>
            subscribeToAppointments({ hospitalId: id }, (data) => {
                sourceRows.set(id, data || []);
                recompute();
            })
        );

        return () => unsubscribers.forEach((u) => u && u());
    }, [hospitalId, hospitalRefId]);


    React.useEffect(() => {
        if (!hospitalId) return;
        let isCancelled = false;
        let unsubFunc = null;

        const setupListener = async () => {
            try {
                const { collection, query, onSnapshot } = await import('firebase/firestore');
                const { db } = await import('../../../firebase/config');
                if (!db) return;

                const q = query(collection(db, "hospitals", hospitalId, "doctors"));
                unsubFunc = onSnapshot(q, (snapshot) => {
                    if (isCancelled) return;
                    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                    setHospitalStaff(docs);
                });
            } catch (error) {
                console.error("Dashboard staff listener failed", error);
            }
        };

        setupListener();
        return () => {
            isCancelled = true;
            if (unsubFunc) unsubFunc();
        };
    }, [hospitalId]);

    const approvedStaff = hospitalStaff.filter(d => d.status === 'APPROVED');
    const pendingStaff = hospitalStaff.filter(d => d.status === 'PENDING_APPROVAL');

    const handleEmergency = () => {
        setEmergencyStatus('resolving');
        setTimeout(() => {
            setEmergencyStatus('stable');
        }, 3000);
    };

    // --- Dynamic Analytics Computation ---
    const dynamicWorkloadData = React.useMemo(() => {
        const counts = { '08 AM': 0, '10 AM': 0, '12 PM': 0, '02 PM': 0, '04 PM': 0, '08 PM': 0 };
        allAppointments.forEach(app => {
            const timeStr = app.time || '12:00';
            const [hours] = timeStr.split(':').map(Number);
            const hour = isNaN(hours) ? 12 : hours;
            
            if (hour >= 8 && hour < 10) counts['08 AM']++;
            else if (hour >= 10 && hour < 12) counts['10 AM']++;
            else if (hour >= 12 && hour < 14) counts['12 PM']++;
            else if (hour >= 14 && hour < 16) counts['02 PM']++;
            else if (hour >= 16 && hour < 20) counts['04 PM']++;
            else counts['08 PM']++;
        });
        return Object.keys(counts).map(k => ({ name: k, count: counts[k] }));
    }, [allAppointments]);

    const dynamicMultiPeriodData = React.useMemo(() => {
        const total = allAppointments.length;
        // Mocking historical distribution for visual continuity, but driven by actual totals
        return {
            day: [ 
                { label: '08:00', patients: Math.floor(total * 0.1) },
                { label: '12:00', patients: Math.floor(total * 0.3) },
                { label: '16:00', patients: Math.floor(total * 0.4) },
                { label: '20:00', patients: Math.floor(total * 0.2) }
            ],
            week: [ 
                { label: 'Mon', patients: Math.floor(total * 0.15) },
                { label: 'Wed', patients: Math.floor(total * 0.4) },
                { label: 'Fri', patients: Math.floor(total * 0.3) },
                { label: 'Sun', patients: Math.floor(total * 0.15) }
            ],
            month: [ 
                { label: 'Week 1', patients: Math.floor(total * 0.2) },
                { label: 'Week 2', patients: Math.floor(total * 0.3) },
                { label: 'Week 3', patients: Math.floor(total * 0.4) },
                { label: 'Week 4', patients: Math.floor(total * 0.1) }
            ],
            year: [ 
                { label: 'Q1', patients: Math.floor(total * 0.2) },
                { label: 'Q2', patients: Math.floor(total * 0.3) },
                { label: 'Q3', patients: Math.floor(total * 0.3) },
                { label: 'Q4', patients: Math.floor(total * 0.2) }
            ]
        };
    }, [allAppointments]);


    return (
        <div style={{ paddingBottom: '3rem' }}>
            {/* ===== Hospital Status Mode Panel ===== */}
            <div style={{
                marginBottom: '2.5rem',
                padding: '1.5rem 2rem',
                borderRadius: '24px',
                background: currentDisplayMode === 'full' 
                    ? 'linear-gradient(135deg, #450a0a, #7f1d1d)' 
                    : currentDisplayMode === 'busy' 
                        ? 'linear-gradient(135deg, #451a03, #78350f)'
                        : currentDisplayMode === 'auto' 
                            ? 'linear-gradient(135deg, #052e16, #14532d)'
                            : 'linear-gradient(135deg, #0c1a2e, #1e3a5f)',
                border: `1px solid ${
                    currentDisplayMode === 'full' ? 'rgba(239,68,68,0.4)'
                    : currentDisplayMode === 'busy' ? 'rgba(245,158,11,0.4)'
                    : currentDisplayMode === 'auto' ? 'rgba(34,197,94,0.4)'
                    : 'rgba(59,130,246,0.4)'
                }`,
                boxShadow: currentDisplayMode === 'full' ? '0 0 40px rgba(239,68,68,0.25)' : 'none',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative Pattern */}
                <div style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                    opacity: 0.1, pointerEvents: 'none',
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Center Operational Mode</p>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>
                            {currentDisplayMode === 'auto' && '⚡ Auto-Dispatch Protocol Active'}
                            {currentDisplayMode === 'manual' && '👋 Manual Oversight Active'}
                            {currentDisplayMode === 'busy' && '⛔ System Status: Offline'}
                            {currentDisplayMode === 'full' && '🚨 PROTOCOL RED: Full Capacity'}
                        </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {!profileLoaded ? (
                            <div style={{ height: '44px', width: '200px', background: '#f1f5f9', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
                        ) : [
                            { mode: 'auto', label: 'Auto', icon: '⚡', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.5)' },

                            { mode: 'manual', label: 'Manual', icon: '👋', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.5)' },
                            { mode: 'busy', label: 'Busy', icon: '⛔', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.5)' },
                            { mode: 'full', label: 'Full', icon: '🚨', color: '#f87171', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.5)' }
                        ].map(({ mode, label, icon, color, bg, border }) => (
                            <motion.button
                                key={mode}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleModeChange(mode)}
                                disabled={isUpdatingMode}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '16px',
                                    border: `1px solid ${border}`,
                                    background: currentDisplayMode === mode ? color : bg,
                                    color: currentDisplayMode === mode ? 'white' : color,
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    cursor: isUpdatingMode ? 'not-allowed' : 'pointer',
                                    opacity: isUpdatingMode ? 0.6 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s',
                                    boxShadow: currentDisplayMode === mode ? `0 0 20px ${color}40` : 'none'
                                }}
                            >
                                <span style={{ fontSize: '1rem' }}>{icon}</span> {label}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <StatCard
                    title="Total Patients"
                    value={stats.totalAppointments}
                    icon={<Users size={24} />}
                    trend="12.5"
                    color="#3b82f6"
                    bgGradient="linear-gradient(135deg, #3b82f6, #2563eb)"
                />
                <StatCard
                    title="Pending Approvals"
                    value={stats.pending}
                    icon={<UserPlus size={24} />}
                    trend="8"
                    color="#10b981"
                    bgGradient="linear-gradient(135deg, #10b981, #059669)"
                />
                <StatCard
                    title="Expected Today"
                    value={stats.accepted}
                    icon={<CalendarCheck size={24} />}
                    trend="5.2"
                    color="#f59e0b"
                    bgGradient="linear-gradient(135deg, #f59e0b, #d97706)"
                />
            </div>
            {/* Pending Actions Alert */}
            <AnimatePresence>
                {pendingAppointments.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: '2rem' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div
                            className="card"
                            style={{
                                background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                                border: '2px solid #818cf8',
                                padding: '1.5rem 2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.15)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ background: '#6366f1', padding: '12px', borderRadius: '15px', color: 'white' }}>
                                    <CalendarCheck size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 style={{ color: '#3730a3', fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                                        {pendingAppointments.length} New Appointment Request{pendingAppointments.length > 1 ? 's' : ''}
                                    </h4>
                                    <p style={{ color: '#4338ca', fontWeight: '600', fontSize: '0.95rem' }}>
                                        Patients are waiting for your command approval.
                                    </p>
                                </div>
                            </div>
                            <Link to="/hospital/appointments" style={{ textDecoration: 'none' }}>
                                <button style={{ background: '#6366f1', color: 'white', padding: '12px 24px', borderRadius: '14px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    VIEW QUEUE <ArrowRight size={18} strokeWidth={3} />
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Toast 
                show={showToast} 
                message="New Appointment Request" 
                 onClose={() => setShowToast(false)} 
            />

            {/* Hero Section */}
            <div style={{
                marginBottom: '3rem',
                padding: '3rem',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(20, 184, 166, 0.05))',
                border: '1px solid var(--border-glass)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '2rem'
            }}>
                {/* Global Emergency Banner */}
                <AnimatePresence>
                    {globalEmergency && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                zIndex: 10000,
                                background: '#e11d48',
                                color: 'white',
                                overflow: 'hidden',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div style={{ padding: '1.2rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ 
                                        width: '44px', 
                                        height: '44px', 
                                        borderRadius: '14px', 
                                        background: 'rgba(255,255,255,0.2)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center' 
                                    }}>
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Regional Emergency: {globalEmergency.type} Required</h4>
                                        <p style={{ fontSize: '11px', fontWeight: '700', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MapPin size={12} /> {globalEmergency.location} • Protocol: Global Hub Alert
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button 
                                        onClick={() => setGlobalEmergency(null)}
                                        style={{ padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                                    >
                                        Ignore
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setGlobalEmergency(null);
                                            // Regional action
                                        }}
                                        style={{ padding: '10px 20px', borderRadius: '12px', background: 'white', border: 'none', color: '#e11d48', fontSize: '11px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                                    >
                                        Initiate Transfer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                        <ShieldCheck size={20} color="var(--brand-primary)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                            SECURE ACCESS • vArogra Pro
                        </span>
                    </div>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-1.5px' }}>
                                Welcome back, <span style={{ color: 'var(--brand-primary)' }}>{user?.adminName || 'Partner'}</span>
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', marginBottom: '1.5rem' }}>
                                Your hospital network is performing at <span style={{ color: 'var(--brand-primary)', fontWeight: '600' }}>98% efficiency</span> today.
                            </p>
                        </div>

                        {/* Notification Bell */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{
                                    background: 'white',
                                    border: '1px solid var(--border-glass)',
                                    padding: '12px',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <Bell size={24} />
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        width: '10px',
                                        height: '10px',
                                        background: 'var(--critical)',
                                        borderRadius: '50%',
                                        border: '2px solid white'
                                    }} />
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="glass"
                                        style={{
                                            position: 'absolute',
                                            right: 0,
                                            marginTop: '12px',
                                            width: '320px',
                                            background: 'var(--bg-surface)',
                                            borderRadius: 'var(--radius-xl)',
                                            boxShadow: 'var(--shadow-xl)',
                                            border: '1px solid var(--border-glass)',
                                            zIndex: 100,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Notifications</h3>
                                            <span style={{ fontSize: '0.7rem', fontWeight: '800', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand-primary)', padding: '2px 8px', borderRadius: '10px' }}>
                                                {notifications.filter(n => !n.read).length} New
                                            </span>
                                        </div>
                                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {notifications.length > 0 ? (
                                                notifications.map(n => (
                                                    <div key={n.id} style={{
                                                        padding: '16px',
                                                        borderBottom: '1px solid var(--border-glass)',
                                                        background: !n.read ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
                                                        transition: 'background 0.2s'
                                                    }}>
                                                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '4px' }}>{n.title}</h4>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{n.message}</p>
                                                        <div style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                                                            {new Date(n.createdAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                    No recent notifications
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Hospital Invite Code Card (Replaces old Base ID) */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 20px',
                            borderRadius: '16px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-glass)'
                        }}
                    >
                        <div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Hospital Invite Code</p>
                            <code style={{ fontSize: '1.2rem', color: 'var(--brand-primary)', fontWeight: '900', letterSpacing: '2px' }}>
                                {user?.hospitalCode || allHospitals?.find(h => h.id === hospitalId)?.hospitalCode || 'HSP-XXXXXX'}
                            </code>
                        </div>
                        <button
                            onClick={() => {
                                const codeToCopy = user?.hospitalCode || allHospitals?.find(h => h.id === hospitalId)?.hospitalCode || 'HSP-XXXXXX';
                                navigator.clipboard.writeText(codeToCopy);
                                alert(`Invite Code ${codeToCopy} copied to clipboard! Share this with doctors.`);
                            }}
                            title="Copy Code"
                            style={{
                                background: 'var(--brand-primary)',
                                border: 'none',
                                color: 'white',
                                padding: '8px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <UserPlus size={16} />
                        </button>
                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <div style={{
                    position: 'absolute',
                    right: '-50px',
                    top: '-50px',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
                    opacity: 0.3
                }} />
            </div>

            {/* Stat Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <StatCard title="Total Staff" value={approvedStaff.length.toString()} icon={<Users size={24} />} trend="12" color="var(--brand-primary)" bgGradient="linear-gradient(135deg, var(--brand-dark), var(--brand-primary))" />
                <StatCard title="Live Sessions" value="18" icon={<MonitorPlay size={24} />} trend="8" color="var(--brand-teal)" bgGradient="linear-gradient(135deg, var(--brand-teal), #0D9488)" />
                <StatCard title="Queue Load" value="42" icon={<Activity size={24} />} trend="15" color="var(--warning)" bgGradient="linear-gradient(135deg, var(--warning), #D97706)" />
                <StatCard title="Efficiency" value="96%" icon={<Zap size={24} />} trend="4" color="var(--info)" bgGradient="linear-gradient(135deg, var(--info), #0891B2)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '2.5rem' }}>
                {/* Advanced Charts */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card"
                    style={{ padding: '2rem' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>Network Traffic</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hourly patient intake analysis</p>
                        </div>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.05)' }}>
                            <Clock size={20} color="var(--brand-primary)" />
                        </div>
                    </div>
                    <div style={{ height: '320px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dynamicWorkloadData}>
                                <defs>
                                    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ background: 'white', border: '1px solid var(--border-glass)', borderRadius: '12px', boxShadow: 'var(--card-shadow)' }}
                                    itemStyle={{ color: 'var(--brand-primary)', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="var(--brand-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorPrimary)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card"
                    style={{ padding: '2rem' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>Growth Analytics</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Multi-period footfall analysis</p>
                        </div>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                            {['day', 'week', 'month', 'year'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        fontSize: '0.7rem',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        background: timeRange === range ? 'var(--brand-primary)' : 'transparent',
                                        color: timeRange === range ? 'white' : 'var(--text-muted)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: '320px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, fontSize: '0.7rem', color: 'var(--brand-teal)', fontWeight: '800', opacity: 0.5, letterSpacing: '2px' }}>DATA SCOPE: {timeRange.toUpperCase()}</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dynamicMultiPeriodData[timeRange]}>
                                <defs>
                                    <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--brand-teal)" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="var(--brand-teal)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 'bold' }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ stroke: 'var(--brand-teal)', strokeWidth: 2, strokeDasharray: '5 5' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length && payload[0].payload) {
                                            return (
                                                <motion.div
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="glass"
                                                    style={{
                                                        padding: '16px',
                                                        border: '1px solid var(--brand-teal)',
                                                        background: 'var(--bg-surface)',
                                                        borderRadius: 'var(--radius-lg)',
                                                        boxShadow: 'var(--shadow-lg)',
                                                        zIndex: 1000
                                                    }}
                                                >
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '800' }}>{payload[0].payload.label} Intake</p>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                                        <span style={{ color: 'var(--text-primary)', fontSize: '2rem', fontWeight: '900', letterSpacing: '-1px' }}>{payload[0].value ? payload[0].value.toLocaleString() : '0'}</span>
                                                        <span style={{ color: 'var(--brand-teal)', fontSize: '0.9rem', fontWeight: 'bold' }}>Patients</span>
                                                    </div>
                                                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '0.8rem', fontWeight: '700' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
                                                        Trends: {timeRange === 'year' ? '+22.4% Annual' : '+14.2% Periodic'}
                                                    </div>
                                                </motion.div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="patients"
                                    stroke="var(--brand-teal)"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorTeal)"
                                    activeDot={{ r: 8, fill: 'var(--brand-teal)', stroke: 'white', strokeWidth: 3 }}
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Critical Notification */}
            <AnimatePresence>
                {emergencyStatus !== 'stable' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ scale: 1.01 }}
                        style={{
                            background: emergencyStatus === 'resolving' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                            border: `1px solid ${emergencyStatus === 'resolving' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            padding: '1.5rem 2rem',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{
                                background: emergencyStatus === 'resolving' ? 'var(--brand-primary)' : 'var(--critical)',
                                padding: '10px',
                                borderRadius: '12px',
                                boxShadow: `0 0 20px ${emergencyStatus === 'resolving' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                            }}>
                                {emergencyStatus === 'resolving' ? <Activity size={20} color="white" /> : <Droplets size={20} color="white" />}
                            </div>
                            <div>
                                <h4 style={{ color: emergencyStatus === 'resolving' ? 'var(--brand-primary)' : 'var(--critical)', fontWeight: '700', marginBottom: '2px' }}>
                                    {emergencyStatus === 'resolving' ? 'vArogra UNIFIED PROTOCOL: RELOAD' : 'Global Asset Imbalance Detected'}
                                </h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {emergencyStatus === 'resolving'
                                        ? 'Regional Handshake Locked • Hub Vicinity Broadcast Active (42 donors notified)...'
                                        : 'O- Negative blood stock is at 2 units. Initializing parallel regional & Hub Vicinity acquisition.'}
                                </p>
                            </div>
                        </div>
                        {emergencyStatus === 'critical' && (
                            <button
                                onClick={handleEmergency}
                                className="btn-premium"
                                style={{ background: 'var(--critical)' }}
                            >
                                Handle Emergency
                            </button>
                        )}
                        {emergencyStatus === 'resolving' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-primary)' }} />
                                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-primary)' }} />
                                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-primary)' }} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {emergencyStatus === 'stable' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        background: 'rgba(34, 197, 94, 0.05)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        padding: '1.5rem 2rem',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        color: 'var(--success)',
                        fontWeight: '700'
                    }}
                >
                    <ShieldCheck size={20} />
                    Inventory Stabilized: 50 Units O- Negative Received.
                </motion.div>
            )}

            {/* Blood Request Modal */}
            <AnimatePresence>
                {showBloodRequestModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 11000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(12px)'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            style={{
                                maxWidth: '440px',
                                width: '100%',
                                background: 'white',
                                borderRadius: '40px',
                                padding: '40px',
                                textAlign: 'center',
                                boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '200px', height: '200px', background: 'rgba(225, 29, 72, 0.03)', borderRadius: '50%' }} />
                            
                            <div style={{ 
                                width: '80px', 
                                height: '80px', 
                                borderRadius: '24px', 
                                background: 'linear-gradient(135deg, #ffeef2 0%, #fff1f2 100%)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                margin: '0 auto 24px',
                                color: '#e11d48',
                                position: 'relative'
                            }}>
                                <Droplets size={40} />
                                {broadcastStatus === 'broadcasting' && (
                                    <motion.div 
                                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        style={{ position: 'absolute', inset: 0, borderRadius: '24px', border: '4px solid #e11d48' }}
                                    />
                                )}
                            </div>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>Emergency Blood Request</h2>
                            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '32px', lineHeight: '1.5' }}>
                                This will broadcast a high-priority alert to all connected hospitals, pharmacies, and verified donors.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '32px' }}>
                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => (
                                    <button 
                                        key={type}
                                        onClick={() => setSelectedBloodType(type)}
                                        style={{
                                            padding: '10px 0',
                                            borderRadius: '12px',
                                            border: selectedBloodType === type ? '2px solid #e11d48' : '2px solid #f1f5f9',
                                            background: selectedBloodType === type ? '#fff1f2' : 'white',
                                            color: selectedBloodType === type ? '#e11d48' : '#64748b',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleBloodBroadcast}
                                disabled={broadcastStatus !== 'idle'}
                                style={{
                                    width: '100%',
                                    padding: '18px',
                                    borderRadius: '20px',
                                    background: broadcastStatus === 'success' ? '#10b981' : '#e11d48',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 30px rgba(225, 29, 72, 0.3)',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {broadcastStatus === 'idle' && 'Send Global Alert'}
                                {broadcastStatus === 'broadcasting' && 'Broadcasting...'}
                                {broadcastStatus === 'success' && 'Broadcast Sent!'}
                            </button>

                            {broadcastStatus === 'idle' && (
                                <button 
                                    onClick={() => setShowBloodRequestModal(false)}
                                    style={{ marginTop: '16px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}
                                >
                                    Cancel Request
                                </button>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AddressSetupModal 
                isOpen={showAddressSetup} 
                onClose={() => setShowAddressSetup(false)} 
                onSave={() => {
                    setShowAddressSetup(false);
                }}
            />
        </div>
    );
};

export default Dashboard;
