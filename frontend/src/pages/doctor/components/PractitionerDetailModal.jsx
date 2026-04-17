import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Calendar, Clock, Award, Star, TrendingUp, Users } from 'lucide-react';

const PractitionerDetailModal = ({ isOpen, onClose, practitioner }) => {
    if (!practitioner) return null;

    const stats = [
        { label: 'Patient Satisfaction', value: '4.9/5', icon: Star, color: '#F59E0B' },
        { label: 'Cases Resolved', value: '842', icon: Activity, color: '#10B981' },
        { label: 'Experience', value: '12 Years', icon: Award, color: '#3B82F6' },
        { label: 'Active Queue', value: '5 Patients', icon: Users, color: '#8B5CF6' }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="glass"
                        style={{
                            width: '100%',
                            maxWidth: '700px',
                            position: 'relative',
                            padding: '3rem',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '32px',
                            background: 'rgba(15, 23, 42, 0.98)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                    >
                        <button
                            onClick={onClose}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10 }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '24px',
                                background: 'linear-gradient(135deg, var(--primary), var(--teal))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '3rem',
                                color: 'white',
                                fontWeight: '800',
                                boxShadow: '0 10px 30px var(--primary-glow)'
                            }}>
                                {practitioner.name.split(' ').pop()[0]}
                            </div>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{practitioner.name}</h2>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: 'var(--available)',
                                        fontSize: '0.7rem',
                                        fontWeight: '800',
                                        border: '1px solid rgba(16, 185, 129, 0.2)'
                                    }}>VERIFIED ADVISOR</span>
                                </div>
                                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{practitioner.spec} • {practitioner.dept}</p>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <TrendingUp size={16} /> 98% Efficiency
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <Clock size={16} /> Avg 15m Response
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                            {stats.map((stat, i) => (
                                <div key={i} style={{ padding: '1.5rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                                    <stat.icon size={20} color={stat.color} style={{ marginBottom: '10px' }} />
                                    <p style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white' }}>{stat.value}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginBottom: '3rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'white' }}>Service Overview</h4>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                Specialized in advanced high-throughput clinical operations within the {practitioner.dept} division.
                                Currently managing priority protocols with a focuses on patient telemetry and real-time diagnostic efficiency.
                                Recognized for excellence in {practitioner.spec.toLowerCase()} and cross-departmental collaboration.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-premium" style={{ flex: 1, padding: '16px' }}>Schedule Consultation</button>
                            <button style={{
                                flex: 1,
                                padding: '16px',
                                border: '1px solid var(--border-glass)',
                                borderRadius: '14px',
                                background: 'transparent',
                                color: 'white',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}>Access Medical Logs</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PractitionerDetailModal;
