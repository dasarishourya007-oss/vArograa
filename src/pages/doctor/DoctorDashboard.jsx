import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    FileText,
    Droplets,
    Megaphone,
    Search,
    MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToAppointments, subscribeToNotifications, updateAppointmentStatus, updateDoctorOnlineStatus, fetchDoctorPatients } from '../../firebase/services';
import { SOSAlertPanel, PatientTriageInsight } from '../../components/doctor/vArograDoctorFeatures';
import { serverTimestamp } from 'firebase/firestore';
import AddressSetupModal from '../../components/patient/AddressSetupModal';

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
    const { user, profileLoaded } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [isAcceptingId, setIsAcceptingId] = useState(null);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [sessionStartedAtMs, setSessionStartedAtMs] = useState(null);
    const [sessionElapsedSec, setSessionElapsedSec] = useState(0);
    const [isFinalizingId, setIsFinalizingId] = useState(null);
    const [portalNotice, setPortalNotice] = useState('');
    const [showCompletedModal, setShowCompletedModal] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [optimisticOnline, setOptimisticOnline] = useState(null);
    const [showAddressSetup, setShowAddressSetup] = useState(false);
    
    // New States for "My Patients"
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'patients'
    const [myPatients, setMyPatients] = useState([]);
    const [patientSearch, setPatientSearch] = useState('');
    const [isLoadingPatients, setIsLoadingPatients] = useState(false);
    
    // Clear optimistic status once sync is confirmed
    useEffect(() => {
        setOptimisticOnline(null);
    }, [user?.isOnline]);

    useEffect(() => {
        if (profileLoaded && user) {
            const needsLocation = !user.district || !user.state || !user.latitude;
            if (needsLocation) {
                setShowAddressSetup(true);
            }
        }
    }, [user, profileLoaded]);



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
                return n.type === 'doctor_appointment_assigned' || n.type === 'appointment';
            });

            if (fresh?.message) {
                setPortalNotice(fresh.message);
                setTimeout(() => setPortalNotice(''), 7000);
            }
        });

        return () => unsub();
    }, [user?.uid, user?.id]);

    // Fetch Unique Patients Effect
    useEffect(() => {
        const loadPatients = async () => {
            const doctorId = user?.uid || user?.id;
            if (!doctorId) return;
            setIsLoadingPatients(true);
            try {
                const data = await fetchDoctorPatients(doctorId);
                setMyPatients(data || []);
            } catch (err) {
                console.error("Failed to load clinical patients:", err);
            } finally {
                setIsLoadingPatients(false);
            }
        };
        loadPatients();
    }, [user, activeTab]);

    const filteredPatients = myPatients.filter(p => 
        (p.patientName || '').toLowerCase().includes(patientSearch.toLowerCase())
    );

    const pendingRequests = appointments.filter((a) => {
        const status = String(a.status || '').toLowerCase();
        return status === 'pending' || status === 'assigned';
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
            const isMission = String(appointment.status || '').toLowerCase() === 'assigned';
            await updateAppointmentStatus(appointment.id, isMission ? 'confirmed' : 'accepted', {
                doctorId: user?.uid || user?.id || appointment.doctorId || null,
                doctorName: user?.displayName || appointment.doctorName || 'Doctor'
            });
            setPortalNotice(`${isMission ? 'Mission confirmed' : 'Appointment accepted'} for ${appointment.patientName}.`);
            setTimeout(() => setPortalNotice(''), 5000);
        } catch (error) {
            console.error('Failed to accept appointment:', error);
        } finally {
            setIsAcceptingId(null);
        }
    };

    const handleRejectAppointment = async (appointment) => {
        if (!appointment?.id) return;
        
        try {
            const isMission = String(appointment.status || '').toLowerCase() === 'assigned';
            const nextStatus = isMission ? 'declined' : 'rejected';

            await updateAppointmentStatus(appointment.id, nextStatus, {
                doctorId: user?.uid || user?.id || appointment.doctorId || null,
                doctorName: user?.displayName || appointment.doctorName || 'Doctor',
                reason: isMission ? "Clinician declined mission due to workload/conflict." : "Doctor is currently unavailable."
            });
            setPortalNotice(isMission ? `Mission declined. System will attempt auto-reassignment.` : `Appointment for ${appointment.patientName} rejected.`);
            setTimeout(() => setPortalNotice(''), 5000);
        } catch (error) {
            console.error('Failed to reject appointment:', error);
        }
    };

    const isOnline = user?.isOnline === true;
    const currentDisplayOnline = optimisticOnline !== null ? optimisticOnline : isOnline;

    const handleToggleOnline = async () => {
        if (isUpdatingStatus || !user) return;
        
        const newStatus = !isOnline;
        setOptimisticOnline(newStatus); // Optimistic UI
        setIsUpdatingStatus(true);
        
        try {
            await updateDoctorOnlineStatus(user?.uid || user?.id, newStatus);
            // Real-time sync via AuthContext will update isOnline state
        } catch (error) {
            console.error("Failed to update status:", error);
            setOptimisticOnline(null); // Rollback on failure
        } finally {
            setIsUpdatingStatus(false);
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
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 2.5rem'
                        }}>
                            <img src="/logo_varogra.png" alt="vArogra Logo" style={{ height: '90px', width: 'auto', objectFit: 'contain' }} />
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
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Welcome back, Dr. {user?.displayName?.split(' ')[0] || 'Partner'}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Here's your clinical schedule and patient management hub.</p>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'var(--bg-surface)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-glass)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: currentDisplayOnline ? 'var(--brand-teal)' : 'var(--text-muted)' }}>
                            {currentDisplayOnline ? 'Online' : 'Offline'}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                            {currentDisplayOnline ? 'Receiving Appointments' : 'Status: Paused'}
                        </span>
                    </div>
                    {!profileLoaded ? (
                        <div style={{ width: '44px', height: '24px', borderRadius: '100px', background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
                    ) : (
                        <button
                            onClick={handleToggleOnline}
                            disabled={isUpdatingStatus}
                            style={{
                                width: '44px',
                                height: '24px',
                                borderRadius: '100px',
                                background: currentDisplayOnline ? 'var(--brand-teal)' : '#e2e8f0',
                                position: 'relative',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: isUpdatingStatus ? 0.6 : 1
                            }}
                        >
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: 'white',
                                position: 'absolute',
                                left: currentDisplayOnline ? '22px' : '2px',
                                top: '2px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} />
                        </button>
                    )}

                </div>
            </div>

            <SOSAlertPanel user={user} />

            {portalNotice && (
                <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#1e3a8a', fontWeight: 700, fontSize: '0.9rem' }}>
                    {portalNotice}
                </div>
            )}

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '4px' }}>
                <button 
                    onClick={() => setActiveTab('overview')}
                    style={{
                        padding: '12px 24px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'overview' ? '3px solid var(--brand-primary)' : '3px solid transparent',
                        color: activeTab === 'overview' ? 'var(--brand-primary)' : 'var(--text-muted)',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Clinical Overview
                </button>
                <button 
                    onClick={() => setActiveTab('patients')}
                    style={{
                        padding: '12px 24px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'patients' ? '3px solid var(--brand-primary)' : '3px solid transparent',
                        color: activeTab === 'patients' ? 'var(--brand-primary)' : 'var(--text-muted)',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    My Patients History
                </button>
            </div>

            {activeTab === 'overview' ? (
                <>
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
                            <div style={{ 
                                padding: '1.5rem', 
                                background: 'rgba(59, 130, 246, 0.03)', 
                                borderRadius: '24px', 
                                border: '1px solid var(--border-glass)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ 
                                        width: '72px', 
                                        height: '72px', 
                                        borderRadius: '20px', 
                                        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)'
                                    }}>
                                        <User color="white" size={36} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                            <h4 style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.5px' }}>{pendingPatients[0].patientName}</h4>
                                            {String(pendingPatients[0].status || '').toLowerCase() === 'assigned' && (
                                                <span className="pill" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', fontSize: '0.65rem', padding: '2px 8px' }}>
                                                    HOSPITAL ASSIGNED
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <span style={{ textTransform: 'uppercase', fontWeight: '700', fontSize: '0.7rem' }}>
                                                {pendingPatients[0].appointmentType || pendingPatients[0].visitType || 'hospital'} 
                                            </span>
                                            <span style={{ opacity: 0.3 }}>•</span>
                                            <span>Priority: {pendingPatients[0].priority || 'Normal'}</span>
                                        </div>
                                    </div>
                                </div>

                                <PatientTriageInsight
                                    patientId={pendingPatients[0].patientId}
                                    triageData={pendingPatients[0].triageData}
                                />

                                <div style={{ 
                                    display: 'flex', 
                                    gap: '12px', 
                                    paddingTop: '0.5rem', 
                                    borderTop: '1px solid var(--border-glass)' 
                                }}>
                                    {(String(pendingPatients[0].status || '').toLowerCase() === 'pending' || String(pendingPatients[0].status || '').toLowerCase() === 'assigned') ? (
                                        <>
                                            <motion.button
                                                whileHover={{ scale: 1.02, y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleAcceptAppointment(pendingPatients[0])}
                                                className="btn-premium"
                                                disabled={isAcceptingId === pendingPatients[0].id}
                                                style={{ 
                                                    flex: 2,
                                                    padding: '14px', 
                                                    fontSize: '1rem',
                                                    opacity: isAcceptingId === pendingPatients[0].id ? 0.7 : 1,
                                                    background: String(pendingPatients[0].status || '').toLowerCase() === 'assigned' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'var(--brand-primary)',
                                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                                                }}
                                            >
                                                {isAcceptingId === pendingPatients[0].id ? 'Processing...' : (String(pendingPatients[0].status || '').toLowerCase() === 'assigned' ? 'Accept Mission' : 'Accept')}
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ background: 'rgba(239, 68, 68, 0.1)' }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleRejectAppointment(pendingPatients[0])}
                                                style={{
                                                    flex: 1,
                                                    padding: '14px',
                                                    borderRadius: '16px',
                                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                                    background: 'transparent',
                                                    color: '#ef4444',
                                                    fontWeight: '800',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Decline
                                            </motion.button>
                                        </>
                                    ) : (String(pendingPatients[0].status || '').toLowerCase() === 'accepted' || String(pendingPatients[0].status || '').toLowerCase() === 'confirmed') ? (
                                        <div style={{ display: 'flex', width: '100%', gap: '12px', alignItems: 'center' }}>
                                            {activeSessionId === pendingPatients[0].id ? (
                                                <>
                                                    <div style={{ flex: 1, padding: '12px', borderRadius: '14px', background: 'var(--bg-main)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Clock size={16} className="animate-pulse" color="var(--brand-primary)" />
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                                                            {formatSessionTime(sessionElapsedSec)}
                                                        </span>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        onClick={() => handleFinalizeSession(pendingPatients[0])}
                                                        className="btn-premium"
                                                        disabled={isFinalizingId === pendingPatients[0].id}
                                                        style={{ flex: 2, padding: '14px', opacity: isFinalizingId === pendingPatients[0].id ? 0.7 : 1 }}
                                                    >
                                                        {isFinalizingId === pendingPatients[0].id ? 'Finalizing...' : 'Finalize Mission'}
                                                    </motion.button>
                                                </>
                                            ) : (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => handleStartSession(pendingPatients[0])}
                                                    className="btn-premium" 
                                                    style={{ flex: 1, padding: '14px' }}
                                                >
                                                    Start Clinical Session
                                                </motion.button>
                                            )}
                                            {String(pendingPatients[0].appointmentType || pendingPatients[0].visitType || '').toLowerCase() === 'online' && (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => navigate(`/call/${pendingPatients[0].id}`)}
                                                    className="btn-premium"
                                                    style={{ flex: 1, padding: '14px', background: '#0ea5e9', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)' }}
                                                >
                                                    Join Call
                                                </motion.button>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
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
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Patient Records ({filteredPatients.length})</h2>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text"
                                placeholder="Search patients by name..."
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px 10px 40px',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>
                    </div>

                    {isLoadingPatients ? (
                        <div style={{ textAlign: 'center', padding: '5rem' }}>
                            <div className="spin" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', margin: '0 auto' }} />
                            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading clinical archives...</p>
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--bg-card)', borderRadius: '24px', border: '1px dashed var(--border-glass)' }}>
                            <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <h3>No patients found</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Your historical patient matches will appear here.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            {filteredPatients.map(patient => (
                                <motion.div 
                                    key={patient.patientId}
                                    whileHover={{ y: -5 }}
                                    className="glass"
                                    style={{ padding: '1.5rem', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}
                                >
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'var(--brand-primary)', overflow: 'hidden' }}>
                                            {patient.photoURL ? (
                                                <img src={patient.photoURL} alt={patient.patientName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>
                                                    {(patient.patientName || 'P')[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{patient.patientName}</h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>UID: {patient.patientId.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Last Clinical Visit</p>
                                            <p style={{ fontWeight: 800, color: 'var(--brand-teal)' }}>{patient.lastVisitDate}</p>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/dashboard/doctor/smart-script?appointmentId=${patient.lastAppointmentId}`)}
                                            className="btn-premium"
                                            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                                        >
                                            Write Script
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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
            {/* Location Setup Prompt */}
            <AddressSetupModal 
                isOpen={showAddressSetup} 
                onClose={() => setShowAddressSetup(false)} 
                onSave={() => {
                    setShowAddressSetup(false);
                }}
            />
        </div>
    </>
    );
};

export default DoctorDashboard;
