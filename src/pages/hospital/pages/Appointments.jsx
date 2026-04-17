import React, { useState, useEffect } from 'react';
import {
    UserPlus,
    Search,
    ClipboardList,
    Clock,
    ArrowRight,
    ChevronRight,
    ArrowUpRight,
    CalendarCheck,
    Activity,
    CheckCircle,
    AlertTriangle,
    UserCheck,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    subscribeToAppointments, 
    updateAppointmentStatus 
} from '../../../firebase/services';
import { db } from '../../../firebase/config';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const HistoricalItem = ({ item, idx }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.05 }}
        style={{
            display: 'flex',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glass)',
            marginBottom: '0.75rem'
        }}
    >
        <div style={{ color: 'var(--success)', marginRight: '1rem' }}>
            <CheckCircle size={18} />
        </div>
        <div style={{ flex: 1 }}>
            <h5 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{item.patientName || item.name}</h5>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.doctorName || item.doctor} â€¢ Completed at {new Date(item.updatedAt?.seconds * 1000).toLocaleTimeString()}</p>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            DONE
        </div>
    </motion.div>
);

const QueueItem = ({ item, idx, doctors, onAssign, onReject, isEmergency }) => {
    const [selectedDoc, setSelectedDoc] = useState('');

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={!isEmergency ? { x: 5, background: 'rgba(59, 130, 246, 0.05)' } : {}}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1.25rem 2rem',
                borderRadius: 'var(--radius-lg)',
                border: item.status === 'assigned' ? '1px solid var(--brand-primary)' : '1px solid var(--border-glass)',
                marginBottom: '1rem',
                background: item.status === 'assigned' ? 'rgba(59, 130, 246, 0.02)' : 'var(--bg-surface)',
                transition: 'var(--transition)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {item.status === 'assigned' && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    padding: '4px 12px',
                    background: 'var(--brand-primary)',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: '900',
                    borderBottomLeftRadius: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Assigned
                </div>
            )}
            <div style={{
                minWidth: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, var(--brand-dark), var(--brand-primary))',
                color: 'white',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '1.1rem',
                marginRight: '2rem',
                boxShadow: 'var(--shadow-md)'
            }}>
                {idx + 1}
            </div>
            <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>{item.patientName || item.name}</h4>
                <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} /> {item.time || 'ASAP'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--brand-primary)', fontWeight: '700' }}>
                        {(item.appointmentType || item.type || 'General')} Appointment
                    </span>
                    {item.status === 'assigned' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--brand-teal)', fontWeight: '800' }}>
                            <UserCheck size={14} /> Assigned to {item.doctorName || 'Clinician'}
                        </span>
                    )}
                </div>
            </div>

            <div style={{ marginRight: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <select
                    value={selectedDoc}
                    onChange={(e) => setSelectedDoc(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'var(--bg-main)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-glass)',
                        fontSize: '0.85rem'
                    }}
                >
                    <option value="">Assign Doctor...</option>
                    {doctors.map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialization})</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button
                    title={item.status === 'assigned' ? "Reassign Mission" : "Dispatch Mission to Doctor"}
                    whileHover={!isEmergency ? { scale: 1.05 } : {}}
                    whileTap={!isEmergency ? { scale: 0.95 } : {}}
                    onClick={() => !isEmergency && onAssign(item.id, selectedDoc || item.doctorRefId || item.doctorId)}
                    className="btn-premium"
                    disabled={isEmergency || (!selectedDoc && !item.doctorRefId && !item.doctorId)}
                    style={{
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: (isEmergency || (!selectedDoc && !item.doctorRefId && !item.doctorId)) ? 'not-allowed' : 'pointer',
                        opacity: (isEmergency || (!selectedDoc && !item.doctorRefId && !item.doctorId)) ? 0.5 : 1,
                        background: item.status === 'assigned' ? 'var(--brand-teal)' : 'var(--brand-primary)'
                    }}
                >
                    <Zap size={18} /> {item.status === 'assigned' ? 'Reassign' : 'Dispatch'}
                </motion.button>
                <motion.button
                    title="Reject"
                    whileHover={!isEmergency ? { scale: 1.03 } : {}}
                    whileTap={!isEmergency ? { scale: 0.97 } : {}}
                    onClick={() => !isEmergency && onReject(item.id)}
                    disabled={isEmergency}
                    style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: 'var(--critical)',
                        fontWeight: 800,
                        cursor: isEmergency ? 'not-allowed' : 'pointer',
                        opacity: isEmergency ? 0.5 : 1
                    }}
                >
                    Reject
                </motion.button>
            </div>
        </motion.div>
    );
};

const Appointments = () => {
    const { user } = useAuth();
    const [pendingQueue, setPendingQueue] = useState([]);
    const [history, setHistory] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [isEmergency, setIsEmergency] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

    const hospitalPrimaryId = user?.hospitalId || user?.uid || localStorage.getItem('varogra_hospital_id') || 'demo-hospital-id';
    const hospitalRefId = localStorage.getItem('varogra_hospital_id') || user?.uid || null;
    const hospitalIdCandidates = Array.from(new Set([hospitalPrimaryId, hospitalRefId].filter(Boolean)));


    useEffect(() => {
        const fetchDoctors = async () => {
            if (!db || hospitalIdCandidates.length === 0) return;
            const primary = query(collection(db, "hospitals", hospitalPrimaryId, "doctors"), where("status", "==", "APPROVED"));
            const primarySnap = await getDocs(primary);
            let docs = primarySnap.docs.map(d => ({ id: d.id, ...d.data() }));

            if (docs.length === 0 && hospitalRefId && hospitalRefId !== hospitalPrimaryId) {
                const fallback = query(collection(db, "hospitals", hospitalRefId, "doctors"), where("status", "==", "APPROVED"));
                const fallbackSnap = await getDocs(fallback);
                docs = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            }

            setDoctors(docs);
        };

        fetchDoctors();

        const sourceRows = new Map();
        const recompute = () => {
            const merged = Array.from(sourceRows.values()).flat();
            const seen = new Set();
            const unique = merged.filter((item) => {
                if (!item?.id || seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
            });
            setPendingQueue(unique.filter((a) => {
                const s = String(a.status || '').toLowerCase();
                return s === 'pending' || s === 'assigned';
            }));
            setHistory(unique.filter((a) => String(a.status || '').toLowerCase() === 'completed').slice(0, 10));
        };

        // BUG FIX: Subscribe to BOTH hospitalId AND hospitalRefId keys so all patient bookings appear
        const allKeys = [
            ...hospitalIdCandidates.map(id => ({ hospitalId: id })),
            ...hospitalIdCandidates.map(id => ({ hospitalRefId: id }))
        ];
        // Deduplicate so we don't double-subscribe identical queries
        const seenKeys = new Set();
        const uniqueKeys = allKeys.filter(f => {
            const k = JSON.stringify(f);
            if (seenKeys.has(k)) return false;
            seenKeys.add(k);
            return true;
        });

        const unsubscribers = uniqueKeys.map((f) =>
            subscribeToAppointments(f, (data) => {
                const key = JSON.stringify(f);
                sourceRows.set(key, data || []);
                recompute();
            })
        );

        return () => {
            unsubscribers.forEach((u) => u && u());
        };
    }, [hospitalPrimaryId, hospitalRefId]);

    const handleAssign = async (appointmentId, doctorId) => {
        const appointment = pendingQueue.find((a) => a.id === appointmentId);
        if (!appointment) return;

        const selectedDoctor = doctors.find(d => d.id === doctorId);
        const resolvedDoctorId =
            selectedDoctor?.uid ||
            selectedDoctor?.userId ||
            selectedDoctor?.doctorId ||
            appointment?.doctorId ||
            doctorId;
        const resolvedDoctorRefId = selectedDoctor?.id || appointment?.doctorRefId || doctorId || '';
        const resolvedDoctorName = selectedDoctor?.name || appointment?.doctorName || 'Assigned Doctor';

        const isReassignment = !!(appointment.doctorId || appointment.doctorRefId);

        if (!resolvedDoctorId) {
            alert('No doctor found for this request. Please select a doctor and try again.');
            return;
        }

        try {
            if (appointment?.date && appointment?.time) {
                const conflictQuery = query(
                    collection(db, "appointments"),
                    where("doctorId", "==", resolvedDoctorId),
                    where("date", "==", appointment.date),
                    where("time", "==", appointment.time),
                    where("status", "==", "accepted")
                );
                const conflictSnap = await getDocs(conflictQuery);
                if (!conflictSnap.empty) {
                    alert(`Doctor ${resolvedDoctorName} is not available at ${appointment.time}. Please choose another doctor or reject this request.`);
                    return;
                }
            }

            // Always move to 'assigned' to trigger the Doctor Validation Layer
            const newStatus = 'assigned';

            await updateAppointmentStatus(appointmentId, newStatus, {
                doctorId: resolvedDoctorId,
                doctorRefId: resolvedDoctorRefId,
                doctorName: resolvedDoctorName,
                originalDoctorId: isReassignment ? appointment.doctorId : (appointment.originalDoctorId || null),
                originalDoctorName: isReassignment ? appointment.doctorName : (appointment.originalDoctorName || null),
                reviewedByHospitalAt: serverTimestamp(),
                assignmentType: isReassignment ? 'OVERRIDE' : 'INITIAL'
            });
            alert(`MISSION DISPATCHED: Dr. ${resolvedDoctorName} has been assigned. Waiting for clinician validation.`);
        } catch (error) {
            console.error("Error assigning doctor:", error);
        }
    };

    const handleReject = async (appointmentId) => {
        try {
            await updateAppointmentStatus(appointmentId, 'rejected', {
                reviewedByHospitalAt: serverTimestamp()
            });
            alert('Appointment rejected due to doctor availability.');
        } catch (error) {
            console.error('Error rejecting appointment:', error);
        }
    };

    const handleAssignToken = async () => {
        if (isEmergency) {
            alert("COMMAND DENIED: Orchestration is currently under PROTOCOL ALPHA lockdown.");
            return;
        }
        try {
            const appointmentData = {
                hospitalId: hospitalPrimaryId,
                hospitalRefId,
                patientName: 'Generic Walk-in',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'pending',
                type: 'Walk-in'
            };
            const id = await addDoc(collection(db, "appointments"), {
                ...appointmentData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            alert(`vArogra PROTOCOL: New manual entry ${id} dispatched for processing.`);
        } catch (error) {
            console.error("Error creating manual appointment:", error);
        }
    };

    const triggerEmergency = () => {
        if (isEmergency) {
            handleDeactivation();
            return;
        }
        setIsEmergency(true);
        alert("PROTOCOL ALPHA ACTIVATED: All regular queues suspended. Trauma team notified.");
    };

    const handleDeactivation = () => {
        setIsEmergency(false);
        alert("PROTOCOL ALPHA TERMINATED: Normal orchestration protocols resumed.");
    };

    return (
        <div style={{ paddingBottom: '3rem' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '0.5rem' }}>Appointment Orchestration</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Managing patient flow and specialist assignment under hospital protocol.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={triggerEmergency}
                        style={{
                            background: isEmergency ? 'var(--critical)' : 'rgba(239, 68, 68, 0.05)',
                            color: isEmergency ? 'white' : 'var(--critical)',
                            padding: '12px 24px',
                            fontWeight: '800',
                            border: '1px solid var(--critical)',
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            boxShadow: isEmergency ? 'var(--shadow-lg)' : 'none'
                        }}
                    >
                        {isEmergency ? 'PROTOCOL ALPHA ACTIVE' : 'Emergency Override'}
                    </motion.button>
                    <motion.button
                        whileHover={!isEmergency ? { scale: 1.05 } : {}}
                        whileTap={!isEmergency ? { scale: 0.95 } : {}}
                        onClick={handleAssignToken}
                        className="btn-premium"
                        style={{
                            opacity: isEmergency ? 0.5 : 1,
                            cursor: isEmergency ? 'not-allowed' : 'pointer',
                            filter: isEmergency ? 'grayscale(1)' : 'none'
                        }}
                    >
                        New Manual Token
                    </motion.button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3.5rem' }}>
                {[
                    { label: 'Active Specialists', val: doctors.length, icon: <UserCheck />, color: 'var(--brand-teal)' },
                    { label: 'Pending Approvals', val: pendingQueue.length, icon: <ClipboardList />, color: 'var(--brand-primary)' },
                    { label: 'Network status', val: 'ENCRYPTED', icon: <Activity />, color: 'var(--success)' }
                ].map((s, idx) => (
                    <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--bg-surface)' }}>
                        <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', background: 'rgba(59, 130, 246, 0.05)', color: s.color }}>
                            {s.icon}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
                            <h4 style={{ fontSize: String(s.val).length > 8 ? '1.1rem' : '1.8rem', fontWeight: '900' }}>{s.val}</h4>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '3rem' }}>
                {/* Main Table */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Approval Pipeline</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span className="pill" style={{ background: isEmergency ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: isEmergency ? 'var(--critical)' : 'var(--success)' }}>
                                {isEmergency ? 'PROTOCOL ALPHA' : 'SYSTEM SYNCED'}
                            </span>
                        </div>
                    </div>
                    <div>
                        <AnimatePresence>
                            {pendingQueue.length > 0 ? (
                                pendingQueue.map((item, i) => (
                                    <QueueItem
                                        key={item.id}
                                        item={item}
                                        idx={i}
                                        doctors={doctors}
                                        onAssign={handleAssign}
                                        onReject={handleReject}
                                        isEmergency={isEmergency}
                                    />
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        padding: '5rem 2rem',
                                        borderRadius: 'var(--radius-xl)',
                                        background: 'var(--bg-surface)',
                                        border: isEmergency ? '2px dashed var(--critical)' : '1px dashed var(--border-glass)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                        gap: '2rem'
                                    }}
                                >
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: isEmergency ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                                        color: isEmergency ? 'var(--critical)' : 'var(--brand-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: isEmergency ? 'var(--shadow-lg)' : 'none'
                                    }}>
                                        {isEmergency ? <AlertTriangle size={40} /> : <ClipboardList size={40} />}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: isEmergency ? 'var(--critical)' : 'var(--text-primary)', marginBottom: '0.75rem' }}>
                                            {isEmergency ? 'ORCHESTRATION SUSPENDED' : 'Pipeline Clear'}
                                        </h3>
                                        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: isEmergency ? '2rem' : '0' }}>
                                            {isEmergency ? 'Critical trauma protocol is active. All non-emergency consultations are deferred until deactivation.' : 'The appointment queue is currently empty. Incoming tokens will appear here for command approval.'}
                                        </p>
                                        {isEmergency && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleDeactivation}
                                                className="btn-danger"
                                                style={{ padding: '12px 32px' }}
                                            >
                                                Resume Normal Protocol
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!isEmergency && (
                            <div style={{ marginTop: '2.5rem' }}>
                                <motion.button
                                    whileHover={{ background: 'rgba(59, 130, 246, 0.05)' }}
                                    onClick={() => setShowLogs(!showLogs)}
                                    style={{
                                        width: '100%',
                                        padding: '1.5rem',
                                        border: '1px dashed var(--border-glass)',
                                        borderRadius: 'var(--radius-lg)',
                                        background: showLogs ? 'var(--bg-main)' : 'transparent',
                                        color: showLogs ? 'var(--text-primary)' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <ChevronRight size={18} style={{ transform: showLogs ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                                    {showLogs ? 'Dismiss Historical Logs' : 'View Audit Logs â€¢ Completed'}
                                </motion.button>

                                <AnimatePresence>
                                    {showLogs && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            style={{ overflow: 'hidden', marginTop: '1.5rem' }}
                                        >
                                            <div style={{ padding: '0 0.5rem' }}>
                                                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    Session Audit â€¢ {new Date().toLocaleDateString()}
                                                </h4>
                                                {history.map((p, i) => (
                                                    <HistoricalItem key={p.id} item={p} idx={i} />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.05)', color: 'var(--brand-primary)' }}>
                                <Activity size={20} />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Operational Load</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {[
                                { name: 'Assigned Missions', val: 'ACTIVE', color: 'var(--brand-primary)' },
                                { name: 'Emergency Nodes', val: 'STABLE', color: 'var(--success)' },
                                { name: 'Clinic Density', val: 'MODERATE', color: 'var(--warning)' }
                            ].map((load, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '10px' }}>
                                        <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>{load.name}</span>
                                        <span style={{ color: load.color, fontWeight: '900' }}>{load.val}</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `100%` }}
                                            transition={{ duration: 1, delay: i * 0.1 }}
                                            style={{ height: '100%', background: load.color, borderRadius: '4px' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '2.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), transparent)', border: '1px solid var(--border-glass)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '900', marginBottom: '1rem', color: 'var(--text-primary)' }}>System Note</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            Operational protocols are strictly enforced. All token dispatch and approval events are logged to the central clinical ledger.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Appointments;











