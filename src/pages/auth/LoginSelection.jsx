import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, ShieldCheck, Star, ArrowRight } from 'lucide-react';

/* ─── Portal Data ─── */
const portals = [
    {
        id: 'patient',
        title: 'Patient',
        description: 'Personal health records',
        route: '/login/patient',
        recommended: true,
        color: '#16a34a',          // green
        bgColor: '#dcfce7',
        svg: (
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
                <path d="M20 6C14.477 6 10 10.477 10 16c0 3.993 2.195 7.472 5.441 9.328L20 34l4.559-8.672C27.805 23.472 30 19.993 30 16c0-5.523-4.477-10-10-10z" stroke="#16a34a" strokeWidth="2" strokeLinejoin="round" />
                <path d="M16 16h8M20 12v8" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        id: 'doctor',
        title: 'Doctor',
        description: 'Clinical tools',
        route: '/login/doctor',
        color: '#2563eb',          // blue
        bgColor: '#dbeafe',
        accentLine: '#2563eb',
        svg: (
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                <circle cx="20" cy="14" r="5" stroke="#2563eb" strokeWidth="2" />
                <path d="M20 19c-5 0-9 2.5-9 6v1h18v-1c0-3.5-4-6-9-6z" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
                <circle cx="30" cy="30" r="5" stroke="#2563eb" strokeWidth="2" />
                <path d="M28 30h4M30 28v4" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        id: 'hospital',
        title: 'Hospital',
        description: 'Administration',
        route: '/login/hospital',
        color: '#16a34a',          // green
        bgColor: '#dcfce7',
        accentLine: '#16a34a',
        svg: (
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                <rect x="8" y="14" width="24" height="20" rx="2" stroke="#16a34a" strokeWidth="2" />
                <path d="M15 34V26h10v8" stroke="#16a34a" strokeWidth="2" strokeLinejoin="round" />
                <path d="M18 20h4M20 18v4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 14V10a8 8 0 0116 0v4" stroke="#16a34a" strokeWidth="2" />
            </svg>
        ),
    },
    {
        id: 'pharmacy',
        title: 'Pharmacy',
        description: 'Inventory & Sales',
        route: '/login/medical-store',
        color: '#ea580c',          // orange
        bgColor: '#ffedd5',
        accentLine: '#ea580c',
        svg: (
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                <rect x="8" y="18" width="24" height="16" rx="2" stroke="#ea580c" strokeWidth="2" />
                <path d="M14 18v-4a6 6 0 1112 0v4" stroke="#ea580c" strokeWidth="2" />
                <path d="M16 26h8M20 23v6" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
    },
];

/* ─── Main Component ─── */
const LoginSelection = () => {
    const navigate = useNavigate();
    const patient = portals[0];
    const others = portals.slice(1);

    return (
        <div
            style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 40%, #eff6ff 100%)' }}
            className="min-h-screen w-full flex flex-col overflow-hidden relative"
        >
            {/* Decorative blobs */}
            <div style={{ position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, #bbf7d0 0%, transparent 70%)', opacity: 0.6, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 80, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, #bfdbfe 0%, transparent 70%)', opacity: 0.5, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, left: '30%', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, #fed7aa 0%, transparent 70%)', opacity: 0.55, pointerEvents: 'none' }} />

            {/* Top Nav */}
            <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px #16a34a44' }}>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>v</span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', letterSpacing: '-0.5px' }}>vArogra</span>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 6, borderRadius: 8, display: 'flex' }}>
                    <Settings size={22} />
                </button>
            </nav>

            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                style={{ textAlign: 'center', padding: '28px 24px 20px' }}
            >
                <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.8px' }}>
                    Choose Your <span style={{ color: '#16a34a' }}>Portal</span>
                </h1>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0, fontWeight: 500 }}>
                    Select the interface that best describes your role
                </p>
                <div style={{ width: 40, height: 3, background: '#e2e8f0', borderRadius: 99, margin: '14px auto 0' }} />
            </motion.div>

            {/* Cards */}
            <div style={{ flex: 1, padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480, width: '100%', margin: '0 auto' }}>

                {/* Patient – Large Featured Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(patient.route)}
                    style={{
                        background: '#fff',
                        borderRadius: 22,
                        border: '2px solid #bbf7d0',
                        boxShadow: '0 4px 24px #16a34a18',
                        padding: '22px 22px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 18,
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Recommended badge */}
                    <div style={{
                        position: 'absolute', top: 14, right: 14,
                        background: '#16a34a', color: '#fff',
                        borderRadius: 99, padding: '4px 10px',
                        fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <Star size={10} fill="#fff" /> Recommended
                    </div>

                    {/* Icon circle */}
                    <div style={{
                        width: 70, height: 70, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 12px #16a34a22',
                    }}>
                        {patient.svg}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 22, color: '#0f172a', marginBottom: 2 }}>Patient</div>
                        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Personal health records</div>
                    </div>

                    {/* Arrow */}
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px #16a34a33', flexShrink: 0,
                    }}>
                        <ArrowRight size={18} color="#fff" />
                    </div>

                    {/* Background shimmer */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #f0fdf4 0%, transparent 60%)', borderRadius: 22, pointerEvents: 'none', opacity: 0.5 }} />
                </motion.div>

                {/* Grid: Doctor | Hospital | Pharmacy */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {others.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.08, duration: 0.45 }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate(p.route)}
                            style={{
                                background: '#fff',
                                borderRadius: 18,
                                border: '1.5px solid #f1f5f9',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                                padding: '18px 10px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Icon */}
                            <div style={{
                                width: 54, height: 54, borderRadius: '50%',
                                background: p.bgColor,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 10,
                            }}>
                                {p.svg}
                            </div>

                            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>{p.title}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 10 }}>{p.description}</div>

                            {/* Small arrow */}
                            <ArrowRight size={16} color={p.color} />

                            {/* Bottom accent line */}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: p.accentLine, borderRadius: '0 0 18px 18px' }} />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Footer – Secure & HIPAA Compliant */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px 24px 28px',
                    color: '#475569', fontSize: 13, fontWeight: 600,
                }}
            >
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <ShieldCheck size={16} color="#16a34a" />
                <span>Secure &amp; HIPAA Compliant</span>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </motion.div>
        </div>
    );
};

export default LoginSelection;
