import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Users, Calendar, Clock, ClipboardList, 
    Plus, ChevronRight, History, CheckCircle2, 
    AlertCircle, FileText, Send, Download, 
    Printer, X, Trash2, LayoutDashboard, 
    Activity, ArrowRight, BrainCircuit, Share2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import OfficialPrescriptionReport from '../../components/shared/OfficialPrescriptionReport';
import { 
    subscribeToAppointments, 
    subscribeToPrescriptions,
    startConsultation,
    completeConsultation,
    subscribeToActiveConsultation,
    createSmartPrescription,
    updatePrescriptionStatus
} from '../../firebase/services';

// --- Shared Constants & Mock Data ---
const DEFAULT_TEMPLATES = [
    {
        id: 'cold',
        label: 'Common Cold & Fever',
        diagnosis: 'Viral Upper Respiratory Tract Infection',
        medicines: [
            { name: 'Paracetamol', dose: '500 mg', frequency: 'TID (3x/day)', duration: '5 days', instructions: 'After food' },
            { name: 'Cetirizine', dose: '10 mg', frequency: 'OD (1x/night)', duration: '5 days', instructions: 'At bedtime' },
            { name: 'Ambroxol', dose: '30 mg', frequency: 'BD (2x/day)', duration: '5 days', instructions: 'After food' },
        ],
        advice: 'Rest well. Increase fluid intake. Avoid cold drinks. Follow up if fever persists >3 days.',
    },
    {
        id: 'htn',
        label: 'Hypertension Follow-up',
        diagnosis: 'Essential Hypertension (Controlled)',
        medicines: [
            { name: 'Amlodipine', dose: '5 mg', frequency: 'OD (1x/day)', duration: '30 days', instructions: 'Morning, after food' },
            { name: 'Losartan', dose: '50 mg', frequency: 'OD (1x/day)', duration: '30 days', instructions: 'Morning, after food' },
            { name: 'Aspirin', dose: '75 mg', frequency: 'OD (1x/day)', duration: '30 days', instructions: 'After food' },
        ],
        advice: 'Monitor BP daily. Low-salt diet. Avoid alcohol & smoking. Return if BP >150/90.',
    },
    {
        id: 'diabetes',
        label: 'Diabetes Maintenance',
        diagnosis: 'Type 2 Diabetes Mellitus (Stable)',
        medicines: [
            { name: 'Metformin', dose: '500 mg', frequency: 'BD (2x/day)', duration: '30 days', instructions: 'With meals' },
            { name: 'Glipizide', dose: '5 mg', frequency: 'OD (1x/day)', duration: '30 days', instructions: 'Before breakfast' },
            { name: 'Vitamin B12', dose: '500 mcg', frequency: 'OD (1x/day)', duration: '30 days', instructions: 'After food' },
        ],
        advice: 'Check fasting glucose weekly. Diet: low sugar, high fibre. Exercise 30 min/day. Follow up in 1 month.',
    },
    {
        id: 'postop',
        label: 'Post-Op Recovery',
        diagnosis: 'Post-Surgical Recovery Protocol',
        medicines: [
            { name: 'Amoxicillin-Clavulanate', dose: '625 mg', frequency: 'BD (2x/day)', duration: '7 days', instructions: 'After food' },
            { name: 'Diclofenac', dose: '50 mg', frequency: 'BD (2x/day)', duration: '5 days', instructions: 'After food, avoid if GI issues' },
            { name: 'Pantoprazole', dose: '40 mg', frequency: 'OD (1x/day)', duration: '7 days', instructions: 'Before breakfast' },
            { name: 'Multivitamin', dose: '1 tablet', frequency: 'OD (1x/day)', duration: '15 days', instructions: 'After food' },
        ],
        advice: 'Keep wound clean and dry. Watch for signs of infection (redness, swelling, discharge). Return immediately if fever >38.5°C.',
    },
];

const PrescriptionModal = ({ isOpen, onClose, patient, consultation, doctor, onSend }) => {
    const [diagnosis, setDiagnosis] = useState('');
    const [medicines, setMedicines] = useState([{ name: '', dose: '', frequency: '', duration: '', instructions: '' }]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setDiagnosis('');
            setMedicines([{ name: '', dose: '', frequency: '', duration: '', instructions: '' }]);
            setNotes('');
            setShowPreview(false);
        }
    }, [isOpen]);

    const addMed = () => setMedicines([...medicines, { name: '', dose: '', frequency: '', duration: '', instructions: '' }]);
    const removeMed = (i) => setMedicines(medicines.filter((_, idx) => idx !== i));
    const updateMed = (i, field, val) => {
        const newMeds = [...medicines];
        newMeds[i][field] = val;
        setMedicines(newMeds);
    };

    const applyTemplate = (t) => {
        setDiagnosis(t.diagnosis);
        setMedicines(t.medicines.map(m => ({ ...m })));
        setNotes(t.advice);
    };

    const handleSubmit = async () => {
        if (!diagnosis.trim() || medicines.some(m => !m.name.trim())) {
            alert("Please fill diagnosis and at least one medicine name.");
            return;
        }

        setIsSubmitting(true);
        try {
            const rxData = {
                patientId: patient.patientId,
                patientName: patient.name,
                age: patient.age,
                gender: patient.gender,
                doctorId: doctor.uid || doctor.id,
                doctorName: doctor.displayName || doctor.name || 'Doctor',
                hospitalName: doctor.hospitalName || 'JAGNYASENI HOSPITAL',
                consultationId: consultation.id,
                appointmentId: consultation.appointmentId,
                diagnosis,
                medicines,
                notes,
                date: new Date().toLocaleDateString(),
                status: 'sent'
            };

            await createSmartPrescription(rxData);
            await completeConsultation(consultation.id, consultation.appointmentId);
            onSend();
            onClose();
        } catch (error) {
            console.error("Failed to send prescription:", error);
            alert("Error sending prescription. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const mockRxForPreview = {
        patientId: patient.patientId,
        patientName: patient.name,
        age: patient.age,
        gender: patient.gender,
        doctorName: doctor.displayName || doctor.name || 'Doctor',
        hospitalName: doctor.hospitalName || 'JAGNYASENI HOSPITAL',
        diagnosis,
        medicines,
        notes,
        date: new Date().toLocaleDateString(),
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                style={{ background: showPreview ? 'transparent' : 'var(--bg-surface)', width: '100%', maxWidth: showPreview ? '700px' : '850px', maxHeight: '95vh', borderRadius: '32px', border: showPreview ? 'none' : '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 128px rgba(0,0,0,0.5)' }}
            >
                {showPreview ? (
                    <div className="relative">
                        <OfficialPrescriptionReport rx={mockRxForPreview} onClose={() => setShowPreview(false)} />
                        <div className="absolute top-4 right-4 flex gap-3">
                            <button 
                                onClick={() => setShowPreview(false)}
                                className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 font-black text-xs uppercase"
                            >
                                Back to Edit
                            </button>
                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-3 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/30 text-white font-black text-xs uppercase"
                            >
                                {isSubmitting ? 'Sending...' : 'Confirm & Finalize'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                            <div>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)', tracking: '-0.02em' }}>Digital O.P.D. Ticket</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Patient: <span style={{ color: 'var(--brand-primary)' }}>{patient.name}</span> • ID: #{patient.patientId?.slice(-8)}</p>
                            </div>
                            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '16px', width: '44px', height: '44px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                        </div>

                        {/* Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            
                            {/* Template Suggestions */}
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.1em' }}>Quick Smart Templates</p>
                                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                                    {DEFAULT_TEMPLATES.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => applyTemplate(t)}
                                            style={{ padding: '10px 20px', background: 'rgba(58, 131, 246, 0.08)', border: '1px solid rgba(58, 131, 246, 0.2)', borderRadius: '14px', color: 'var(--brand-primary)', fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Diagnosis */}
                            <div className="space-y-3">
                                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block' }}>DIAGNOSIS / CLINICAL NOTES</label>
                                <input 
                                    value={diagnosis} 
                                    onChange={e => setDiagnosis(e.target.value)}
                                    placeholder="e.g. Acute Respiratory Infection..."
                                    style={{ width: '100%', padding: '1.2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '16px', color: 'white', fontSize: '1.1rem', fontWeight: '700', outline: 'none', transition: 'border-color 0.2s' }} 
                                />
                            </div>

                            {/* Medicines */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)' }}>MEDICATIONS (Rx)</label>
                                    <button onClick={addMed} style={{ background: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: '12px', padding: '8px 18px', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 16px rgba(58, 131, 246, 0.2)' }}>
                                        <Plus size={16} /> Add Medicine
                                    </button>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {medicines.map((m, i) => (
                                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '18px', border: '1px solid var(--border-glass)' }}>
                                            <input style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.95rem', fontWeight: '700', outline: 'none' }} value={m.name} onChange={e => updateMed(i, 'name', e.target.value)} placeholder="Name" />
                                            <input style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }} value={m.dose} onChange={e => updateMed(i, 'dose', e.target.value)} placeholder="Dose" />
                                            <input style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }} value={m.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} placeholder="Freq" />
                                            <input style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }} value={m.duration} onChange={e => updateMed(i, 'duration', e.target.value)} placeholder="Dur" />
                                            <button onClick={() => removeMed(i)} style={{ color: 'var(--critical)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}><Trash2 size={18} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Advice */}
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>SPECIAL INSTRUCTIONS</label>
                                <textarea 
                                    rows={3}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Take after food, Avoid cold drinks..."
                                    style={{ width: '100%', padding: '1.2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '18px', color: 'white', fontSize: '1rem', fontWeight: '600', outline: 'none', resize: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '1.5rem 3rem', borderTop: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'flex-end', gap: '1.2rem' }}>
                            <button onClick={onClose} style={{ padding: '14px 28px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
                            <button 
                                onClick={() => setShowPreview(true)} 
                                style={{ padding: '14px 40px', borderRadius: '16px', background: 'var(--brand-primary)', color: 'white', border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', boxShadow: '0 12px 32px rgba(58, 131, 246, 0.4)' }}
                            >
                                Preview Report <ArrowRight size={18} />
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

const SmartPrescriptionSystem = () => {
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeConsultation, setActiveConsultation] = useState(null);
    const [isRxModalOpen, setIsRxModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRxForModal, setSelectedRxForModal] = useState(null);

    // Fetch Patients from appointments
    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToAppointments({ doctorId: user.uid || user.id }, (apptList) => {
            const uniquePatients = [];
            const patientIds = new Set();
            
            apptList.forEach(appt => {
                const pid = appt.patientId || appt.userId;
                if (pid && !patientIds.has(pid)) {
                    patientIds.add(pid);
                    uniquePatients.push({
                        patientId: pid,
                        name: appt.patientName || 'Anonymous',
                        lastVisit: appt.date || 'New Patient',
                        age: appt.age || '--',
                        gender: appt.gender || '--',
                        status: appt.status || 'idle',
                        appointmentId: appt.id
                    });
                }
            });
            setPatients(uniquePatients);
            if (uniquePatients.length > 0 && !selectedPatient) {
                setSelectedPatient(uniquePatients[0]);
            }
            setIsLoading(false);
        });
        return () => unsub();
    }, [user]);

    // Track Active Consultation
    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToActiveConsultation(user.uid || user.id, (consult) => {
            setActiveConsultation(consult);
            // If consultation exists, auto-select that patient
            if (consult) {
                const p = patients.find(p => p.patientId === consult.patientId);
                if (p) setSelectedPatient(p);
            }
        });
        return () => unsub();
    }, [user, patients]);

    // Fetch Prescriptions for Selected Patient
    useEffect(() => {
        if (!selectedPatient) return;
        const unsub = subscribeToPrescriptions(selectedPatient.patientId, (list) => {
            setPrescriptions(list);
        });
        return () => unsub();
    }, [selectedPatient]);

    const handleStartConsultation = async () => {
        if (!selectedPatient) return;
        try {
            await startConsultation(selectedPatient.patientId, user.uid || user.id, selectedPatient.appointmentId);
            // alert(`Consultation started for ${selectedPatient.name}`);
        } catch (error) {
            console.error("Error starting consultation:", error);
        }
    };

    const filteredPatients = patients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.patientId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', height: 'calc(100vh - 160px)', minHeight: '600px' }}>
            
            {/* --- LEFT: Patient List --- */}
            <div className="glass" style={{ border: '1px solid var(--border-glass)', borderRadius: '24px', background: 'var(--bg-surface)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                    <input 
                        placeholder="Search patients..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', color: 'white', fontSize: '0.85rem', outline: 'none' }}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient History ({filteredPatients.length})</h3>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>
                    ) : filteredPatients.map(p => (
                        <motion.div
                            key={p.patientId}
                            whileHover={{ x: 6, scale: 1.01 }}
                            onClick={() => setSelectedPatient(p)}
                            style={{ 
                                padding: '16px', 
                                borderRadius: '20px', 
                                background: selectedPatient?.patientId === p.patientId ? 'rgba(58, 131, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                                border: selectedPatient?.patientId === p.patientId ? '1px solid rgba(58, 131, 246, 0.4)' : '1px solid var(--border-glass)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                boxShadow: selectedPatient?.patientId === p.patientId ? '0 10px 20px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(58, 131, 246, 0.3)' }}>
                                    {p.name[0]}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <p style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{p.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginTop: '2px' }}>Last visit: {p.lastVisit}</p>
                                </div>
                                {activeConsultation?.patientId === p.patientId && (
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--brand-teal)', boxShadow: '0 0 12px var(--brand-teal)', animation: 'pulse 2s infinite' }}></div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {!isLoading && filteredPatients.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No patients found.</div>
                    )}
                </div>
            </div>

            {/* --- CENTER: Prescription Timeline --- */}
            <div className="glass" style={{ border: '1px solid var(--border-glass)', borderRadius: '24px', background: 'var(--bg-surface)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
                {selectedPatient ? (
                    <>
                            {/* New Professional Action Header */}
                            <div style={{ 
                                padding: '24px', 
                                background: 'rgba(255,255,255,0.02)', 
                                border: '1px solid var(--border-glass)', 
                                borderRadius: '24px', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '2rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '1.6rem', boxShadow: '0 8px 24px rgba(58, 131, 246, 0.4)' }}>
                                        {selectedPatient.name[0]}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{selectedPatient.name}</h2>
                                            <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(58, 131, 246, 0.1)', color: 'var(--brand-primary)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>{selectedPatient.gender} · {selectedPatient.age}y</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>Patient ID: <span style={{ color: 'var(--text-primary)' }}>#{selectedPatient.patientId?.slice(-12)}</span></p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {activeConsultation ? (
                                        <button 
                                            onClick={() => setIsRxModalOpen(true)}
                                            style={{ padding: '14px 28px', background: 'var(--brand-primary)', border: 'none', borderRadius: '16px', color: 'white', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 12px 32px rgba(58, 131, 246, 0.4)' }}
                                        >
                                            <Plus size={18} /> Create Prescription
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleStartConsultation}
                                            style={{ padding: '14px 28px', background: 'var(--text-primary)', border: 'none', borderRadius: '16px', color: 'var(--bg-main)', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                                        >
                                            <Activity size={18} /> Start Consultation
                                        </button>
                                    )}
                                    <button style={{ padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '16px', color: 'var(--text-muted)', cursor: 'pointer' }}><Printer size={20} /></button>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px' }}>
                                <History size={18} color="var(--brand-teal)" /> Clinical Timeline
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '19px', top: '24px', bottom: '24px', width: '2px', background: 'rgba(255,255,255,0.05)' }}></div>
                                
                                {prescriptions.length > 0 ? prescriptions.map(rx => (
                                    <div key={rx.id} className="group cursor-pointer">
                                        {/* Simplified Summary Card */}
                                        <div 
                                            onClick={() => setSelectedRxForModal(rx)}
                                            style={{ 
                                                padding: '24px', 
                                                background: 'rgba(255,255,255,0.02)', 
                                                borderRadius: '20px', 
                                                border: '1px solid var(--border-glass)', 
                                                transition: 'all 0.3s',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                marginLeft: '40px'
                                            }}
                                            className="hover:bg-white/[0.04] hover:border-blue-500/30"
                                        >
                                            <div style={{ position: 'absolute', left: '-40px', top: '24px', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--bg-surface)', border: '4px solid var(--brand-primary)', zIndex: 1 }}></div>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div>
                                                    <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{rx.date}</p>
                                                    <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{rx.diagnosis}</h4>
                                                </div>
                                                <div style={{ padding: '6px 14px', borderRadius: '100px', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--brand-teal)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                                    Verified Rx
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {rx.medicines?.slice(0, 3).map((m, idx) => (
                                                    <span key={idx} style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>
                                                        {m.name}
                                                    </span>
                                                ))}
                                                {rx.medicines?.length > 3 && (
                                                    <span style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--brand-primary)', fontSize: '0.75rem', fontWeight: '800' }}>
                                                        +{rx.medicines.length - 3} more
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                                <button style={{ color: 'var(--brand-primary)', fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    View Full Report <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ textAlign: 'center', padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <FileText size={48} style={{ opacity: 0.1 }} />
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No previous prescriptions found for this patient.</p>
                                    </div>
                                )}
                            </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                        <Users size={48} style={{ opacity: 0.1 }} />
                        <p>Select a patient to view clinical history.</p>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}
            <AnimatePresence>
                {isRxModalOpen && selectedPatient && activeConsultation && (
                    <PrescriptionModal 
                        isOpen={isRxModalOpen}
                        onClose={() => setIsRxModalOpen(false)}
                        patient={selectedPatient}
                        consultation={activeConsultation}
                        doctor={user}
                        onSend={() => {
                            // Consultation status is updated automatically in submit
                        }}
                    />
                )}

                {/* Full Report Modal */}
                {selectedRxForModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                            style={{ background: 'transparent', width: '100%', maxWidth: '700px', maxHeight: '95vh', borderRadius: '32px', overflow: 'hidden' }}
                        >
                            <OfficialPrescriptionReport rx={selectedRxForModal} onClose={() => setSelectedRxForModal(null)} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SmartPrescriptionSystem;

const EyeIcon = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
);
