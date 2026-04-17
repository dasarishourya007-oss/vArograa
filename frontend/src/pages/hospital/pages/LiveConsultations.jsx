import React, { useState, useEffect } from 'react';
import {
    MonitorPlay,
    Clock,
    CheckCircle2,
    AlertCircle,
    Stethoscope,
    Timer,
    Activity,
    User,
    Users,
    AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppointments } from '../context/AppointmentContext';

const doctorAverages = {
    "Dr. Sarah Mitchell": 900, // 15 mins
    "Dr. Michael Chen": 720,   // 12 mins
    "Dr. James Wilson": 1080   // 18 mins
};

const ConsultationCard = ({ docName, patient, token, startTime, duration, progress, onFinalize }) => {
    const [time, setTime] = useState(duration);
    const averageTime = doctorAverages[docName] || 600;

    useEffect(() => {
        const interval = setInterval(() => setTime(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const remainingTime = averageTime - time;
    const isOverdue = time > averageTime;
    const isExtended = time > averageTime + 300; // 5 mins over

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getPredictionText = () => {
        if (isOverdue) return "Over expected duration";
        const minsRemaining = Math.ceil(remainingTime / 60);
        return `Estimated completion in ${minsRemaining} mins`;
    };

    const calculatedProgress = Math.min(Math.round((time / averageTime) * 100), 100);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
                opacity: 1,
                scale: 1,
                borderColor: isExtended ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-glass)',
                boxShadow: isExtended ? '0 0 25px rgba(239, 68, 68, 0.15)' : 'none'
            }}
            whileHover={{ y: -5 }}
            className="card"
            style={{
                padding: '2rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-lg)',
                position: 'relative',
                transition: 'border-color 0.5s ease, box-shadow 0.5s ease'
            }}
        >
            <AnimatePresence mode="wait">
                {isExtended && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        style={{
                            position: 'absolute',
                            top: '-12px',
                            right: '24px',
                            background: 'var(--critical)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.7rem',
                            fontWeight: '900',
                            letterSpacing: '0.5px',
                            boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)',
                            zIndex: 10
                        }}
                    >
                        EXTENDED SESSION
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '14px',
                        background: 'rgba(20, 184, 166, 0.05)',
                        color: 'var(--brand-teal)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Stethoscope size={24} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{docName}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Room 402 • Wing C</p>
                    </div>
                </div>
                <div style={{
                    background: isExtended ? 'var(--critical)' : 'var(--primary)',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    boxShadow: isExtended ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 12px var(--primary-glow)',
                    transition: 'background 0.5s ease'
                }}>
                    TOKEN {token}
                </div>
            </div>

            <div style={{
                background: 'var(--bg-main)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-glass)',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={18} color="rgba(255,255,255,0.5)" />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently Seeing</p>
                        <p style={{ fontWeight: '700', color: 'white' }}>{patient}</p>
                    </div>
                </div>

                {/* Progress Bar Container */}
                <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Session Progress</span>
                        <span style={{ color: isOverdue ? 'var(--busy)' : 'var(--brand-teal)', fontWeight: '700' }}>{calculatedProgress}%</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${calculatedProgress}%` }}
                            style={{
                                height: '100%',
                                background: isOverdue ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, var(--brand-teal), #2DD4BF)',
                                boxShadow: isOverdue ? '0 0 10px rgba(245, 158, 11, 0.3)' : '0 0 10px var(--teal-glow)'
                            }}
                        />
                    </div>

                    {/* Smart Prediction Line */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.75rem',
                            color: isOverdue ? '#F59E0B' : 'var(--text-muted)',
                            fontWeight: isOverdue ? '600' : '400'
                        }}
                    >
                        {isOverdue ? <AlertTriangle size={12} /> : <Timer size={12} />}
                        <span>{getPredictionText()}</span>
                    </motion.div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        padding: '8px',
                        background: 'var(--bg-main)',
                        borderRadius: '8px'
                    }}>
                        <Timer size={18} color={isOverdue ? 'var(--warning)' : 'var(--brand-teal)'} />
                    </div>
                    <span style={{
                        fontSize: '1.4rem',
                        fontWeight: '800',
                        fontFamily: 'monospace',
                        color: isOverdue ? '#F59E0B' : 'var(--brand-teal)'
                    }}>{formatTime(time)}</span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onFinalize(time)}
                    className="btn-premium"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-glass)', boxShadow: 'none' }}
                >
                    Finalize
                </motion.button>
            </div>
        </motion.div>
    );
};

const LiveConsultations = () => {
    const { activeConsultations: sessions, finalizeConsultation } = useAppointments();

    const handleFinalize = (id, finalDuration) => {
        finalizeConsultation(id, finalDuration);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '0.5rem' }}>Active Sessions</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Monitoring all protocolized medical consultations in real-time.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(20, 184, 166, 0.05)', padding: '10px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                    <Activity size={18} color="var(--brand-teal)" className="pulse-icon" />
                    <span style={{ fontWeight: '800', color: 'var(--brand-teal)', fontSize: '0.85rem', letterSpacing: '1px' }}>LIVE ANALYTICS ON</span>
                </div>
            </div>

            <style>{`
                .pulse-icon {
                    animation: pulse-kf 2s infinite ease-in-out;
                }
                @keyframes pulse-kf {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.6; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                <AnimatePresence mode="popLayout">
                    {sessions.map(session => (
                        <ConsultationCard
                            key={`${session.id}-${session.patient}`} // Key change triggers component reset
                            {...session}
                            onFinalize={(finalTime) => handleFinalize(session.id, finalTime)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            <motion.div
                whileHover={{ scale: 1.01 }}
                style={{
                    marginTop: '4rem',
                    padding: '3rem',
                    textAlign: 'center',
                    background: 'rgba(59, 130, 246, 0.05)',
                    borderRadius: '24px',
                    border: '1px dashed var(--border-active)'
                }}
            >
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'var(--primary)',
                    borderRadius: '20px',
                    margin: '0 auto 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px var(--primary-glow)'
                }}>
                    <Users size={32} color="white" />
                </div>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '0.75rem', fontWeight: '800' }}>Candidate Preparation Zone</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                    Next protocol cluster contains 12 candidates. Pre-screening metrics indicate 100% readiness for consultation.
                </p>
                <button className="btn-premium">Review Preparation Queue</button>
            </motion.div>
        </div>
    );
};

export default LiveConsultations;
