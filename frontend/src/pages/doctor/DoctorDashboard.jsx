import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Play,
    User,
    ShieldCheck,
    Stethoscope,
    Settings,
    ChevronRight,
    X,
    Calendar,
    FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToAppointments, subscribeToNotifications, updateAppointmentStatus } from '../../firebase/services';
import { SOSAlertPanel, PatientTriageInsight } from '../../components/doctor/vArograDoctorFeatures';
import { serverTimestamp } from 'firebase/firestore';

const SummaryCard = ({ title, value, icon, color, trend, onClick }) => {
    const Icon = icon;
    return (
    <motion.div
        whileHover={{ y: -5 }}
        whileTap={onClick ? { scale: 0.98 } : {}}
        onClick={onClick}
        className="glass"
        style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glass)',
            flex: 1,
            minWidth: '240px',
            cursor: onClick ? 'pointer' : 'default'
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
};

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [isAcceptingId, setIsAcceptingId] = useState(null);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [sessionStartedAtMs, setSessionStartedAtMs] = useState(null);
    const [sessionElapsedSec, setSessionElapsedSec] = useState(0);
    const [isFinalizingId, setIsFinalizingId] = useState(null);
    const [portalNotice, setPortalNotice] = useState('');
    const [showCompletedModal, setShowCompletedModal] = useState(false);
    const seenNotificationIdsRef = useRef(new Set());

    useEffect(() => {
        if (!user) return;

        const doctorId = user.uid || user.id;
        const unsubPrimary = subscribeToAppointments({ doctorId }, (data) => {
            setAppointments(data || []);
        });

        const refId = user?.doctorId || user?.id;
        let unsubRef = () => { };
        if (refId && refId !== doctorId) {
            unsubRef = subscribeToAppointments({ doctorRefId: refId }, (data) => {
                setAppointments((prev) => {
                    const merged = [...(prev || []), ...(data || [])];
                    const seen = new Set();
                    return merged.filter((item) => {
                        if (!item?.id || seen.has(item.id)) return false;
                        seen.add(item.id);
                        return true;
                    });
                });
            });
        }

        return () => {
            unsubPrimary();
            unsubRef();
        };
    }, [user]);


    useEffect(() => {
        const doctorId = user?.uid || user?.id;
        if (!doctorId) return undefined;

        const unsub = subscribeToNotifications(doctorId, (items) => {
            if (!Array.isArray(items) || items.length === 0) return;

            const fresh = items.find((n) => {
                if (!n?.id) return false;
                if (seenNotificationIdsRef.current.has(n.id)) return false;
                return n.type === 'doctor_appointment_assigned' || n.type === 'appointment' || String(n.title || '').toLowerCase().includes('appointment');
            });

            items.forEach((n) => {
                if (n?.id) seenNotificationIdsRef.current.add(n.id);
            });

            if (fresh?.message) {
                setPortalNotice(fresh.message);
                setTimeout(() => setPortalNotice(''), 7000);
            }
        });

        return () => unsub();
    }, [user?.uid, user?.id]);
    const pendingRequests = appointments.filter((a) => {
        const status = String(a.status || '').toLowerCase();
        return status === 'pending';
    });
    const activeConsultations = appointments.filter((a) => {
        const status = String(a.status || '').toLowerCase();
        return status === 'accepted';
    });
    const todayKey = new Date().toISOString().split('T')[0];
    const completedConsultations = appointments.filter((a) => {
        const status = String(a.status || '').toLowerCase();
        if (status !== 'completed') return false;
        const dateKey = a?.appointmentDateKey || a?.date || '';
        return !dateKey || dateKey === todayKey;
    });
    const pendingPatients = pendingRequests.length > 0 ? pendingRequests : activeConsultations;

    const handleAcceptAppointment = async (appointment) => {
        if (!appointment?.id || isAcceptingId) return;
        try {
            setIsAcceptingId(appointment.id);
            await updateAppointmentStatus(appointment.id, 'accepted', {
                doctorId: user?.uid || user?.id || appointment.doctorId || null,
                doctorName: user?.displayName || appointment.doctorName || 'Doctor'
            });
        } catch (error) {
            console.error('Failed to accept appointment:', error);
        } finally {
            setIsAcceptingId(null);
        }
    };

    const formatSessionTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const handleStartSession = (appointment) => {
        if (!appointment?.id) return;
        if (activeSessionId && activeSessionId !== appointment.id) return;
        setActiveSessionId(appointment.id);
        setSessionStartedAtMs(Date.now());
        setSessionElapsedSec(0);
    };

    const handleFinalizeSession = async (appointment) => {
        if (!appointment?.id || isFinalizingId) return;
        try {
            setIsFinalizingId(appointment.id);
            await updateAppointmentStatus(appointment.id, 'completed', {
                completedAt: serverTimestamp(),
                sessionDurationSec: sessionElapsedSec,
                finalizedByDoctorAt: serverTimestamp()
            });
            setPortalNotice(`Session finalized for ${appointment.patientName || 'patient'}.`);
            setTimeout(() => setPortalNotice(''), 5000);
            setActiveSessionId(null);
            setSessionStartedAtMs(null);
            setSessionElapsedSec(0);
        } catch (error) {
            console.error('Failed to finalize session:', error);
        } finally {
            setIsFinalizingId(null);
        }
    };

    useEffect(() => {
        if (!activeSessionId || !sessionStartedAtMs) return undefined;
        const timer = setInterval(() => {
            const elapsed = Math.max(0, Math.floor((Date.now() - sessionStartedAtMs) / 1000));
            setSessionElapsedSec(elapsed);
        }, 1000);
        return () => clearInterval(timer);
    }, [activeSessionId, sessionStartedAtMs]);
    const isApproved = String(user?.doctorStatus || '').toUpperCase() === 'APPROVED' || String(user?.doctorStatus || '').toUpperCase() === 'ACTIVE';
    if (!isApproved) {
        return (
            <div style={{
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass"
                    style={{
                        maxWidth: '600px',
                        width: '100%',
                        padding: '3rem',
                        borderRadius: '40px',
                        background: 'linear-gradient(160deg, #2563eb 0%, #4f46e5 100%)',
                        color: 'white',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(79, 70, 229, 0.4)'
                    }}
                >
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'white',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 2rem',
                            color: '#4f46e5',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                        }}>
                            <Stethoscope size={40} />
                        </div>

                        <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '-0.5px' }}>
                            Verification In Progress
                        </h2>

                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255,255,255,0.1)',
                            padding: '6px 16px',
                            borderRadius: '100px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            marginBottom: '2rem'
                        }}>
                            <div style={{ width: '8px', height: '8px', background: '#fbbf24', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', tracking: '1px' }}>
                                Awaiting Hospital Approval
                            </span>
                        </div>

                        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', opacity: 0.9, marginBottom: '2.5rem', fontWeight: '500' }}>
                            Welcome, Dr. {user?.displayName?.split(' ')[0] || 'Partner'}. Your professional profile for <strong>{user?.hospitalName || 'the hospital'}</strong> is currently being reviewed by their administration team.
                        </p>

                        <div style={{
                            background: 'rgba(0,0,0,0.1)',
                            borderRadius: '24px',
                            padding: '1.5rem',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <p style={{ fontSize: '13px', fontWeight: '700', opacity: 0.8 }}>
                                While you wait for clinical access:
                            </p>
                            <button
                                onClick={() => navigate('/dashboard/patient')}
                                className="btn-premium"
                                style={{
                                    background: 'white',
                                    color: '#4f46e5',
                                    border: 'none',
                                    padding: '14px',
                                    borderRadius: '16px',
                                    fontWeight: '800',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                Use Patient Portal
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Background Elements */}
                    <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', color: 'rgba(255,255,255,0.05)', zIndex: 1 }}>
                        <ShieldCheck size={280} />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header Section */}
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Welcome back, Dr. {user?.displayName?.split(' ')[0] || 'Alpha'}</h1>
                <p style={{ color: 'var(--text-muted)' }}>Here's your schedule and patient overview for today.</p>
            </div>

            <SOSAlertPanel />

            {portalNotice && (
                <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#1e3a8a', fontWeight: 700, fontSize: '0.9rem' }}>
                    {portalNotice}
                </div>
            )}

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
                    onClick={() => setShowCompletedModal(true)}
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
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Status: {pendingPatients[0].status} â€¢ Type: {pendingPatients[0].appointmentType || pendingPatients[0].visitType || 'hospital'}</p>

                                <PatientTriageInsight
                                    patientId={pendingPatients[0].patientId}
                                    triageData={pendingPatients[0].triageData}
                                />
                            </div>
                            {String(pendingPatients[0].status || '').toLowerCase() === 'pending' ? (
                                <button
                                    onClick={() => handleAcceptAppointment(pendingPatients[0])}
                                    className="btn-premium"
                                    disabled={isAcceptingId === pendingPatients[0].id}
                                    style={{ padding: '12px 24px', opacity: isAcceptingId === pendingPatients[0].id ? 0.7 : 1 }}
                                >
                                    {isAcceptingId === pendingPatients[0].id ? 'Accepting...' : 'Accept Appointment'}
                                </button>
                            ) : activeSessionId === pendingPatients[0].id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                                        Live Timer: {formatSessionTime(sessionElapsedSec)}
                                    </div>
                                    <button
                                        onClick={() => handleFinalizeSession(pendingPatients[0])}
                                        className="btn-premium"
                                        disabled={isFinalizingId === pendingPatients[0].id}
                                        style={{ padding: '12px 24px', opacity: isFinalizingId === pendingPatients[0].id ? 0.7 : 1 }}
                                    >
                                        {isFinalizingId === pendingPatients[0].id ? 'Finalizing...' : 'Finalize'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleStartSession(pendingPatients[0])}
                                    className="btn-premium" style={{ padding: '12px 24px' }}>Start Session</button>
                            )}
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

            {/* Completed Consultations Modal */}
            {showCompletedModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(8px)'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="glass"
                        style={{
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '85vh',
                            background: 'white',
                            borderRadius: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            borderBottom: '1px solid var(--border-glass)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Completed Consultations</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Found {completedConsultations.length} appointments for today</p>
                            </div>
                            <button
                                onClick={() => setShowCompletedModal(false)}
                                style={{
                                    padding: '10px',
                                    borderRadius: '14px',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-muted)',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            {completedConsultations.length > 0 ? (
                                completedConsultations.map((appt, idx) => (
                                    <div
                                        key={appt.id || idx}
                                        style={{
                                            padding: '1.25rem',
                                            borderRadius: '20px',
                                            border: '1px solid var(--border-glass)',
                                            background: 'rgba(59, 130, 246, 0.02)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem'
                                        }}
                                    >
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '16px',
                                            background: 'var(--brand-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white'
                                        }}>
                                            <User size={24} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>{appt.patientName}</h4>
                                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} /> {appt.time || 'N/A'}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={12} /> {appt.date || 'Today'}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <FileText size={12} /> {appt.appointmentType || 'Consultation'}
                                                </span>
                                            </div>
                                        </div>
                                        {appt.sessionDurationSec > 0 && (
                                            <div style={{
                                                padding: '6px 12px',
                                                borderRadius: '10px',
                                                background: 'var(--bg-main)',
                                                fontSize: '0.75rem',
                                                fontWeight: '700',
                                                color: 'var(--brand-teal)'
                                            }}>
                                                {Math.floor(appt.sessionDurationSec / 60)}m {appt.sessionDurationSec % 60}s
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '3rem 1rem',
                                    color: 'var(--text-muted)'
                                }}>
                                    <CheckCircle2 size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                    <p>No completed consultations for today yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            borderTop: '1px solid var(--border-glass)',
                            display: 'flex',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setShowCompletedModal(false)}
                                className="btn-premium"
                                style={{ padding: '10px 24px' }}
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;








