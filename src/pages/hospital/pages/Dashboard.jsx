import React from 'react';
import { useAuth } from '../context/AuthContext';
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
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../../firebase/config';


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

const workloadData = [
    { name: '08 AM', count: 12 },
    { name: '10 AM', count: 25 },
    { name: '12 PM', count: 42 },
    { name: '02 PM', count: 38 },
    { name: '04 PM', count: 28 },
    { name: '08 PM', count: 15 },
];

const analyticData = [
    { day: 'Mon', patients: 120 },
    { day: 'Tue', patients: 150 },
    { day: 'Wed', patients: 130 },
    { day: 'Thu', patients: 180 },
    { day: 'Fri', patients: 210 },
    { day: 'Sat', patients: 95 },
    { day: 'Sun', patients: 60 },
];

const multiPeriodData = {
    day: [
        { label: '08:00', patients: 45 },
        { label: '10:00', patients: 82 },
        { label: '12:00', patients: 115 },
        { label: '14:00', patients: 98 },
        { label: '16:00', patients: 84 },
        { label: '18:00', patients: 62 },
        { label: '20:00', patients: 45 },
    ],
    week: [
        { label: 'Mon', patients: 120 },
        { label: 'Tue', patients: 150 },
        { label: 'Wed', patients: 130 },
        { label: 'Thu', patients: 180 },
        { label: 'Fri', patients: 210 },
        { label: 'Sat', patients: 95 },
        { label: 'Sun', patients: 60 },
    ],
    month: [
        { label: 'Week 1', patients: 850 },
        { label: 'Week 2', patients: 920 },
        { label: 'Week 3', patients: 1100 },
        { label: 'Week 4', patients: 980 },
    ],
    year: [
        { label: '2022', patients: 42000 },
        { label: '2023', patients: 51200 },
        { label: '2024', patients: 48500 },
        { label: '2025', patients: 62300 },
    ]
};


const CommandCenterWidget = ({ emergencyStatus }) => {
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [isPaused, setIsPaused] = React.useState(false);

    const items = [
        {
            id: 'emergency',
            title: 'Universal Protocol Alpha',
            subtitle: emergencyStatus === 'critical' ? 'Network + Hub Vicinity Broadcast' : 'Universal Match Active',
            level: 'Alpha-1',
            icon: <Droplets size={28} />,
            color: 'var(--critical)',
            path: '/hospital/blood-bank',
            active: emergencyStatus !== 'stable'
        },
        {
            id: 'reminder',
            title: 'Shift Handover',
            subtitle: '14:45 AM Group Sync',
            level: 'Priority',
            icon: <CalendarCheck size={28} />,
            color: 'var(--warning)',
            path: '/hospital/appointments',
            active: true
        },
        {
            id: 'alert',
            title: 'Network Lag',
            subtitle: 'St. Jude Node 4X',
            level: 'Advisory',
            icon: <Zap size={28} />,
            color: 'var(--brand-primary)',
            path: '/hospital/settings',
            active: true
        }
    ];

    const next = () => setActiveIndex((prev) => (prev + 1) % items.length);
    const prev = () => setActiveIndex((prev) => (prev - 1 + items.length) % items.length);

    React.useEffect(() => {
        if (!isPaused) {
            const timer = setInterval(() => {
                next();
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [isPaused]);

    return (
        <div style={{ width: '500px', height: '220px', position: 'relative' }}>
            <div
                style={{ position: 'relative', height: '100%', overflow: 'hidden', borderRadius: '28px' }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        style={{
                            height: '100%',
                            padding: '2rem 3rem',
                            background: 'var(--bg-surface)',
                            backdropFilter: 'blur(15px)',
                            border: `1px solid var(--border-glass)`,
                            borderRadius: 'var(--radius-xl)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: `0 10px 40px ${items[activeIndex].color}15`
                        }}
                    >
                        {/* Status Pulse */}
                        {items[activeIndex].active && (
                            <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <motion.div
                                    animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    style={{ width: '10px', height: '10px', borderRadius: '50%', background: items[activeIndex].color, boxShadow: `0 0 10px ${items[activeIndex].color}` }}
                                />
                                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: items[activeIndex].color, letterSpacing: '2px' }}>ACTIVE</span>
                            </div>
                        )}

                        <div>
                            <div style={{ color: items[activeIndex].color, marginBottom: '16px' }}>
                                {items[activeIndex].icon}
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>{items[activeIndex].title}</h3>
                            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{items[activeIndex].subtitle}</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>LEVEL:</span>
                                <span style={{ fontSize: '0.8rem', color: items[activeIndex].color, fontWeight: '800' }}>{items[activeIndex].level.toUpperCase()}</span>
                            </div>
                            <Link
                                to={items[activeIndex].path}
                                style={{
                                    textDecoration: 'none',
                                    display: 'block',
                                    zIndex: 1000,
                                    position: 'relative',
                                    pointerEvents: 'auto'
                                }}
                            >
                                <motion.div
                                    whileHover={{
                                        scale: 1.05,
                                        boxShadow: `0 10px 25px ${items[activeIndex].color}60`,
                                        filter: 'brightness(1.1)'
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        fontSize: '0.85rem',
                                        color: 'white',
                                        fontWeight: '900',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: items[activeIndex].color,
                                        padding: '12px 24px',
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        boxShadow: `0 5px 15px ${items[activeIndex].color}40`,
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    ENGAGE <ArrowUpRight size={18} strokeWidth={3} />
                                </motion.div>
                            </Link>
                        </div>

                        {/* Background Decoration */}
                        <div style={{
                            position: 'absolute',
                            bottom: '-40px',
                            right: '-40px',
                            width: '180px',
                            height: '180px',
                            background: items[activeIndex].color,
                            filter: 'blur(60px)',
                            opacity: 0.2,
                            pointerEvents: 'none',
                            zIndex: 1
                        }} />

                        {/* Slide Indicator */}
                        <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none', zIndex: 1 }}>
                            <motion.div
                                key={`progress-${activeIndex}-${isPaused}`}
                                initial={{ width: '0%' }}
                                animate={{ width: isPaused ? '0%' : '100%' }}
                                transition={{ duration: isPaused ? 0 : 5, ease: 'linear' }}
                                style={{ height: '100%', background: items[activeIndex].color, opacity: 0.6 }}
                            />
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Left Arrow (Inside, Frameless) */}
                <button
                    onClick={prev}
                    style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '10px',
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        opacity: 0.4,
                        cursor: 'pointer',
                        zIndex: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
                >
                    <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
                </button>

                {/* Right Arrow (Inside, Frameless) */}
                <button
                    onClick={next}
                    style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '10px',
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        opacity: 0.4,
                        cursor: 'pointer',
                        zIndex: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user, allHospitals } = useAuth();
    const [timeRange, setTimeRange] = React.useState('week');
    const [emergencyStatus, setEmergencyStatus] = React.useState('critical'); // 'critical', 'resolving', 'stable'

    const hospitalId = user?.uid || user?.id || 'jPz6UEHW2NVRtMo49belygDhbRo1';

    // Calculate live stats
    const [hospitalStaff, setHospitalStaff] = React.useState([]);

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

    return (
        <div style={{ paddingBottom: '3rem' }}>
            {/* Pending Actions Alert */}
            <AnimatePresence>
                {pendingStaff.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: '2rem' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div
                            className="card"
                            style={{
                                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                border: '2px solid #fcd34d',
                                padding: '1.5rem 2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                boxShadow: '0 10px 30px rgba(245, 158, 11, 0.15)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ background: '#f59e0b', padding: '12px', borderRadius: '15px', color: 'white' }}>
                                    <UserPlus size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 style={{ color: '#92400e', fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                                        {pendingStaff.length} New Doctor Application{pendingStaff.length > 1 ? 's' : ''}
                                    </h4>
                                    <p style={{ color: '#b45309', fontWeight: '600', fontSize: '0.95rem' }}>
                                        Specialists are waiting for your approval to join the hospital directory.
                                    </p>
                                </div>
                            </div>
                            <Link to="/hospital/doctors" style={{ textDecoration: 'none' }}>
                                <button style={{ background: '#f59e0b', color: 'white', padding: '12px 24px', borderRadius: '14px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    REVIEW NOW <ArrowRight size={18} strokeWidth={3} />
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                        <ShieldCheck size={20} color="var(--brand-primary)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                            SECURE ACCESS • vArogra Pro
                        </span>
                    </div>
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-1.5px' }}>
                        Welcome back, <span style={{ color: 'var(--brand-primary)' }}>Admin</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', marginBottom: '1.5rem' }}>
                        Your hospital network is performing at <span style={{ color: 'var(--brand-primary)', fontWeight: '600' }}>98% efficiency</span> today.
                    </p>

                    {/* Hospital ID Card */}
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
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Hospital Base ID</p>
                            <code style={{ fontSize: '0.9rem', color: 'var(--brand-primary)', fontWeight: '700' }}>
                                {user?.uid || user?.id || 'jPz6UEHW2NVRtMo49belygDhbRo1'}
                            </code>
                        </div>
                        <button
                            onClick={() => {
                                const idToCopy = user?.uid || user?.id || 'jPz6UEHW2NVRtMo49belygDhbRo1';
                                navigator.clipboard.writeText(idToCopy);
                                alert('Hospital ID copied to clipboard!');
                            }}
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

                <CommandCenterWidget emergencyStatus={emergencyStatus} />

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
                            <AreaChart data={workloadData}>
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
                            <AreaChart data={multiPeriodData[timeRange]}>
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
        </div>
    );
};

export default Dashboard;
