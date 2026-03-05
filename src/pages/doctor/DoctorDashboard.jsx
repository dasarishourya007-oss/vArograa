import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Play,
    User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToAppointments, updateAppointmentStatus } from '../../firebase/services';
import { SOSAlertPanel, PatientTriageInsight } from '../../components/doctor/vArograDoctorFeatures';

const SummaryCard = ({ title, value, icon: Icon, color, trend }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="glass"
        style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glass)',
            flex: 1,
            minWidth: '240px'
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div style={{
                padding: '12px',
                borderRadius: '12px',
                background: `rgba(${color}, 0.1)`,
                color: `rgb(${color})`
            }}>
                <Icon size={24} />
            </div>
            {trend && (
                <div style={{ fontSize: '0.8rem', color: 'var(--brand-teal)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} /> {trend}
                </div>
            )}
        </div>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{value}</p>
    </motion.div>
);

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [liveQueue, setLiveQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const doctorId = user.uid || user.id;
        // Listen to all appointments assigned to this doctor
        const unsub = subscribeToAppointments({ doctorId }, (data) => {
            setAppointments(data);
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    const activeConsultations = appointments.filter(a => a.status === 'approved');
    const completedConsultations = appointments.filter(a => a.status === 'completed');
    const pendingPatients = activeConsultations; // For now mapping approved to pending queue

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header Section */}
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Welcome back, Dr. {user?.displayName?.split(' ')[0] || 'Alpha'}</h1>
                <p style={{ color: 'var(--text-muted)' }}>Here's your schedule and patient overview for today.</p>
            </div>

            <SOSAlertPanel />

            {/* Summary Grid */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <SummaryCard
                    title="Total Appointments"
                    value={appointments.length}
                    icon={Users}
                    color="59, 130, 246"
                    trend="+12%"
                />
                <SummaryCard
                    title="Approved Patients"
                    value={activeConsultations.length}
                    icon={Play}
                    color="16, 185, 129"
                />
                <SummaryCard
                    title="Completed Today"
                    value={completedConsultations.length}
                    icon={CheckCircle2}
                    color="245, 158, 11"
                />
                <SummaryCard
                    title="Avg. Time"
                    value="18m"
                    icon={TrendingUp}
                    color="139, 92, 246"
                />
            </div>

            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Live Session Control */}
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Live Consultation Center</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-teal)' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-teal)', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Live System Active</span>
                        </div>
                    </div>

                    {pendingPatients.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User color="white" size={32} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>{pendingPatients[0].patientName}</h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Status: {pendingPatients[0].status} • Type: {pendingPatients[0].visitType}</p>

                                <PatientTriageInsight
                                    patientId={pendingPatients[0].patientId}
                                    triageData={pendingPatients[0].triageData}
                                />
                            </div>
                            <button
                                onClick={() => navigate('/doctor/prescription', { state: { appointment: pendingPatients[0] } })}
                                className="btn-premium" style={{ padding: '12px 24px' }}>Start Session</button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--border-glass)', borderRadius: '16px' }}>
                            <AlertCircle size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <h3 style={{ marginBottom: '0.5rem' }}>No pending patients</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Queue is currently clear.</p>
                            <button
                                className="btn-premium"
                                disabled
                                style={{ opacity: 0.5 }}
                            >
                                Start Next Consultation
                            </button>
                        </div>
                    )}
                </div>

                {/* Performance Mini Chart Placeholder */}
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Weekly Efficiency</h2>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '0 10px' }}>
                        {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                style={{
                                    flex: 1,
                                    background: i === 3 ? 'var(--brand-primary)' : 'var(--bg-main)',
                                    borderRadius: '4px 4px 0 0'
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <span>Mon</span>
                        <span>Sun</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
