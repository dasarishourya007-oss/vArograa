import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, User, FileText, Mic, CheckCircle2, AlertCircle,
    History, FileBarChart, PlusCircle, BookOpen, Play, Paperclip,
    PhoneOff, ChevronRight, X, Pill, FlaskConical, Stethoscope,
    Clipboard, Calendar, Activity, Save, Trash2, Plus,
} from 'lucide-react';


// ─── Today's booked appointments ────────────────────────────────────────────
const TODAY_APPOINTMENTS = [
    { id: 1, tokenNumber: '01', patientName: 'Jane Smith', type: 'Consultation', time: '10:30 AM', age: '28', gender: 'Female', bloodGroup: 'A+', allergies: ['Penicillin'], status: 'pending', summary: 'Recurring headaches for 2 weeks. No prior medication.' },
    { id: 2, tokenNumber: '02', patientName: 'Robert Brown', type: 'Follow Up', time: '11:45 AM', age: '45', gender: 'Male', bloodGroup: 'B+', allergies: ['Sulfa drugs'], status: 'pending', summary: 'Follow-up for Acute Bronchitis. Wheezing reduced.' },
    { id: 3, tokenNumber: '03', patientName: 'Michael Davis', type: 'Report Review', time: '04:00 PM', age: '52', gender: 'Male', bloodGroup: 'O-', allergies: [], status: 'pending', summary: 'Cardiac screening results to be reviewed today.' },
];

// ─── Mock per-patient data ───────────────────────────────────────────────────
const PATIENT_HISTORY = {
    1: [
        { date: '2026-02-05', type: 'Consultation', doctor: 'Dr. Priya Shah', notes: 'Presented with severe migraine. Prescribed Sumatriptan.' },
        { date: '2026-01-18', type: 'Follow Up', doctor: 'Dr. Sarah Wilson', notes: 'Headache frequency reduced to 2x/week. Continue medication.' },
        { date: '2025-12-10', type: 'Consultation', doctor: 'Dr. Priya Shah', notes: 'Initial visit for recurring headaches. Referred to neurology.' },
    ],
    2: [
        { date: '2026-02-14', type: 'Follow Up', doctor: 'Dr. Wilson', notes: 'Acute bronchitis confirmed. Started Azithromycin 500mg.' },
        { date: '2026-01-30', type: 'Consultation', doctor: 'Dr. Anjali Kumar', notes: 'Persistent cough > 3 weeks. Chest X-ray ordered.' },
    ],
    3: [
        { date: '2026-02-20', type: 'Report Review', doctor: 'Dr. Mehta', notes: 'ECG showed mild ST changes. Echocardiogram scheduled.' },
        { date: '2026-01-15', type: 'Consultation', doctor: 'Dr. Sarah Wilson', notes: 'Routine cardiac check-up. BP elevated at 148/92.' },
        { date: '2025-11-22', type: 'Consultation', doctor: 'Dr. Sarah Wilson', notes: 'Initial hypertension diagnosis. Started Amlodipine 5mg.' },
    ],
};

const LAB_REPORTS = {
    1: [
        { name: 'Complete Blood Count (CBC)', date: '2026-02-20', status: 'Normal', values: [{ label: 'Hemoglobin', val: '12.4 g/dL', ok: true }, { label: 'WBC', val: '6,200 /µL', ok: true }, { label: 'Platelets', val: '210,000 /µL', ok: true }] },
        { name: 'MRI Brain', date: '2026-02-10', status: 'Reviewed', values: [{ label: 'Finding', val: 'No structural abnormality detected', ok: true }] },
    ],
    2: [
        { name: 'Chest X-Ray', date: '2026-02-01', status: 'Abnormal', values: [{ label: 'Finding', val: 'Mild peribronchial thickening', ok: false }, { label: 'Assessment', val: 'Consistent with bronchitis', ok: true }] },
        { name: 'Sputum Culture', date: '2026-02-03', status: 'Positive', values: [{ label: 'Organism', val: 'Streptococcus pneumoniae', ok: false }, { label: 'Sensitivity', val: 'Sensitive to Azithromycin', ok: true }] },
        { name: 'Complete Blood Count (CBC)', date: '2026-02-01', status: 'Normal', values: [{ label: 'WBC', val: '11,200 /µL ↑', ok: false }, { label: 'CRP', val: '32 mg/L ↑', ok: false }] },
    ],
    3: [
        { name: 'ECG (12-lead)', date: '2026-02-20', status: 'Abnormal', values: [{ label: 'Rhythm', val: 'Sinus rhythm', ok: true }, { label: 'Finding', val: 'Mild ST depression leads V4-V6', ok: false }] },
        { name: 'Lipid Profile', date: '2026-02-18', status: 'Abnormal', values: [{ label: 'LDL', val: '142 mg/dL ↑', ok: false }, { label: 'HDL', val: '38 mg/dL ↓', ok: false }, { label: 'Triglycerides', val: '210 mg/dL ↑', ok: false }] },
        { name: 'HbA1c', date: '2026-02-18', status: 'Borderline', values: [{ label: 'Value', val: '6.1% (Borderline)', ok: null }] },
    ],
};

// ─── Drawer panels ───────────────────────────────────────────────────────────

const PatientHistoryPanel = ({ session }) => {
    const history = PATIENT_HISTORY[session?.id] || [];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                <User size={18} color="var(--brand-primary)" />
                <div>
                    <p style={{ fontWeight: '700' }}>{session?.patientName || 'No patient selected'}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{session?.age}y · {session?.gender} · {session?.bloodGroup}</p>
                </div>
            </div>
            {history.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No history available. Start a session first.</p>}
            {history.map((h, i) => (
                <div key={i} style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-glass)', borderLeft: '3px solid var(--brand-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--brand-primary)', textTransform: 'uppercase' }}>{h.type}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{h.date}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{h.doctor}</p>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>{h.notes}</p>
                </div>
            ))}
        </div>
    );
};

const LabReportsPanel = ({ session }) => {
    const [open, setOpen] = useState(null);
    const reports = LAB_REPORTS[session?.id] || [];
    const statusColor = { Normal: 'var(--brand-teal)', Abnormal: 'var(--critical)', Positive: 'var(--critical)', Reviewed: 'var(--text-muted)', Borderline: '#f59e0b' };
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!session && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No patient in session. Start a consultation first.</p>}
            {reports.length === 0 && session && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No lab reports on file.</p>}
            {reports.map((r, i) => (
                <div key={i} style={{ borderRadius: '12px', border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
                    <button
                        onClick={() => setOpen(open === i ? null : i)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: 'none', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: 'white' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FlaskConical size={15} color={statusColor[r.status] || 'var(--text-muted)'} />
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{r.name}</p>
                                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{r.date}</p>
                            </div>
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '3px 10px', borderRadius: '10px', background: `${statusColor[r.status] || 'gray'}18`, color: statusColor[r.status] || 'var(--text-muted)' }}>{r.status}</span>
                    </button>
                    <AnimatePresence>
                        {open === i && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                                <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {r.values.map((v, j) => (
                                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{v.label}</span>
                                            <span style={{ fontWeight: '600', color: v.ok === false ? 'var(--critical)' : v.ok === true ? 'var(--brand-teal)' : '#f59e0b' }}>{v.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
};

// ── Shared key for cross-page prescription storage ────────────────────
const RX_STORAGE_KEY = 'varogra_sent_prescriptions';

const SEND_STAGES = [
    { label: 'Saving prescription…', icon: '💾', color: 'var(--brand-primary)' },
    { label: 'Encrypting & packaging…', icon: '🔐', color: '#a78bfa' },
    { label: 'Sending to patient portal…', icon: '📤', color: '#f59e0b' },
    { label: 'Delivered to patient! ✓', icon: '✅', color: 'var(--brand-teal)' },
];

const PrescriptionPanel = ({ session, onClose }) => {
    const [meds, setMeds] = useState([{ name: '', dose: '', frequency: '', duration: '', instructions: '' }]);
    const [advice, setAdvice] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [stage, setStage] = useState(-1); // -1 = idle, 0-3 = sending stages
    const addMed = () => setMeds(m => [...m, { name: '', dose: '', frequency: '', duration: '', instructions: '' }]);
    const removeMed = i => setMeds(m => m.filter((_, idx) => idx !== i));
    const updateMed = (i, field, val) => setMeds(m => m.map((med, idx) => idx === i ? { ...med, [field]: val } : med));

    const inp = {
        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)',
        borderRadius: '7px', padding: '7px 10px', color: 'white', outline: 'none',
        fontSize: '0.82rem', width: '100%', boxSizing: 'border-box',
    };

    const sendPrescription = () => {
        if (!session) return;
        // Build the record
        const rx = {
            id: Date.now(),
            patient: session.patientName,
            age: session.age,
            gender: session.gender,
            date: new Date().toLocaleDateString('en-CA'),
            status: 'Active',
            templateLabel: diagnosis || 'Custom Prescription',
            diagnosis,
            medicines: meds,
            advice,
            doctorName: 'Dr. Sarah Wilson',
        };

        // Save to localStorage
        const existing = JSON.parse(localStorage.getItem(RX_STORAGE_KEY) || '[]');
        localStorage.setItem(RX_STORAGE_KEY, JSON.stringify([rx, ...existing]));

        // Run staged animation
        let s = 0;
        setStage(s);
        const tick = setInterval(() => {
            s += 1;
            if (s < SEND_STAGES.length) {
                setStage(s);
            } else {
                clearInterval(tick);
                setTimeout(() => { setStage(-1); onClose(); }, 900);
            }
        }, 700);
    };

    const isSending = stage >= 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!session && (
                <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.06)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.83rem', color: 'var(--critical)' }}>
                    ⚠ No active session. Start a consultation first to prescribe.
                </div>
            )}

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Quick prescription for <strong style={{ color: 'white' }}>{session?.patientName || '—'}</strong>
            </p>

            <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnosis</label>
                <input style={inp} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g. Viral URTI" disabled={isSending} />
            </div>

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.68rem', color: 'var(--brand-teal)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Medicines</label>
                    <button onClick={addMed} disabled={isSending} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid var(--brand-primary)', color: 'var(--brand-primary)', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Plus size={11} /> Add
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {meds.map((m, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-glass)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                                <input style={inp} value={m.name} onChange={e => updateMed(i, 'name', e.target.value)} placeholder="Medicine name" disabled={isSending} />
                                <button onClick={() => removeMed(i)} disabled={isSending} style={{ background: 'none', border: 'none', color: 'var(--critical)', cursor: 'pointer', padding: '2px' }}><Trash2 size={13} /></button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                                <input style={inp} value={m.dose} onChange={e => updateMed(i, 'dose', e.target.value)} placeholder="Dose" disabled={isSending} />
                                <input style={inp} value={m.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} placeholder="Freq." disabled={isSending} />
                                <input style={inp} value={m.duration} onChange={e => updateMed(i, 'duration', e.target.value)} placeholder="Days" disabled={isSending} />
                            </div>
                            <input style={inp} value={m.instructions} onChange={e => updateMed(i, 'instructions', e.target.value)} placeholder="Instructions (e.g. After food)" disabled={isSending} />
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Advice & Instructions</label>
                <textarea rows={3} style={{ ...inp, resize: 'vertical', lineHeight: '1.5' }} value={advice} onChange={e => setAdvice(e.target.value)} placeholder="General instructions for patient…" disabled={isSending} />
            </div>

            {/* Send progress */}
            <AnimatePresence>
                {isSending && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ padding: '14px 16px', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)' }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {SEND_STAGES.map((s, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0.2 }}
                                    animate={{ opacity: idx <= stage ? 1 : 0.2 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}
                                >
                                    <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                                    <span style={{ color: idx <= stage ? s.color : 'var(--text-muted)', fontWeight: idx === stage ? '700' : '400', transition: 'color 0.3s' }}>
                                        {s.label}
                                    </span>
                                    {idx < stage && <CheckCircle2 size={13} color="var(--brand-teal)" style={{ marginLeft: 'auto' }} />}
                                    {idx === stage && (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} style={{ marginLeft: 'auto' }}>
                                            <Activity size={13} color={s.color} />
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                        {stage === SEND_STAGES.length - 1 && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--brand-teal)', fontWeight: '600', textAlign: 'center' }}>
                                Prescription visible in Patient Portal & Prescriptions page ✓
                            </motion.p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={sendPrescription}
                disabled={!session || isSending}
                style={{
                    padding: '12px', border: 'none', borderRadius: '10px', cursor: (!session || isSending) ? 'not-allowed' : 'pointer',
                    background: isSending ? 'rgba(99,102,241,0.3)' : 'var(--brand-primary)',
                    color: 'white', fontWeight: '700', fontSize: '0.95rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'background 0.3s', opacity: (!session || isSending) ? 0.7 : 1,
                }}
            >
                <Save size={16} /> Send Prescription to Patient
            </button>
        </div>
    );
};

const NotepadPanel = () => {
    const [text, setText] = useState(() => localStorage.getItem('doctor_notepad') || '');
    const [saved, setSaved] = useState(false);
    const save = () => { localStorage.setItem('doctor_notepad', text); setSaved(true); setTimeout(() => setSaved(false), 1500); };
    const clear = () => { setText(''); localStorage.removeItem('doctor_notepad'); };
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Scratchpad — notes saved locally in your browser.</p>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Write anything here — drug interactions, reminders, ICD codes..."
                style={{ flex: 1, minHeight: '280px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '1rem', color: 'white', fontSize: '0.92rem', resize: 'none', outline: 'none', lineHeight: '1.65' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={clear} className="glass" style={{ flex: 1, padding: '10px', cursor: 'pointer', color: 'var(--critical)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}><Trash2 size={14} /> Clear</button>
                <button onClick={save} style={{ flex: 2, padding: '10px', background: saved ? 'var(--brand-teal)' : 'var(--brand-primary)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', transition: 'background 0.3s' }}>
                    <Save size={14} /> {saved ? 'Saved!' : 'Save Notes'}
                </button>
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const LiveConsultation = () => {
    const [queue, setQueue] = useState(TODAY_APPOINTMENTS);
    const [activeSession, setActiveSession] = useState(null);
    const [timer, setTimer] = useState(0);
    const [notes, setNotes] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [completed, setCompleted] = useState([]);
    const [drawer, setDrawer] = useState(null); // 'history' | 'labs' | 'prescription' | 'notepad'
    const intervalRef = useRef(null);

    useEffect(() => {
        if (activeSession) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => setTimer(t => t + 1), 1000);
        } else {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setTimer(0);
        }
        return () => clearInterval(intervalRef.current);
    }, [activeSession]);

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const startSession = (appt) => {
        setQueue(q => q.map(a => a.id === appt.id ? { ...a, status: 'active' } : a));
        setActiveSession(appt);
        setNotes('');
        setDiagnosis('');
    };

    const handleComplete = () => {
        if (!activeSession) return;
        setCompleted(c => [...c, { ...activeSession, notes, diagnosis, duration: formatTime(timer) }]);
        setQueue(q => q.filter(a => a.id !== activeSession.id));
        setActiveSession(null);
        setDrawer(null);
    };

    const handleEscalate = () => {
        if (!activeSession) return;
        setQueue(q => q.map(a => a.id === activeSession.id ? { ...a, status: 'escalated' } : a));
        setActiveSession(null);
        setDrawer(null);
    };

    const pending = queue.filter(a => a.status === 'pending');

    const QUICK_ACTIONS = [
        { key: 'history', icon: History, label: 'Patient History', color: 'var(--brand-primary)' },
        { key: 'labs', icon: FlaskConical, label: 'Lab Reports', color: 'var(--brand-teal)' },
        { key: 'prescription', icon: PlusCircle, label: 'Add Prescription', color: 'var(--brand-primary)' },
        { key: 'notepad', icon: BookOpen, label: 'Open Notepad', color: 'var(--brand-teal)' },
    ];

    const DRAWER_TITLES = {
        history: 'Patient History',
        labs: 'Lab Reports',
        prescription: 'Quick Prescription',
        notepad: 'Doctor Notepad',
    };

    return (
        <div style={{ position: 'relative' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '280px 1fr 280px',
                gap: '1.5rem',
                height: 'calc(100vh - 160px)',
                overflow: 'hidden',
            }}>

                {/* ── LEFT: Patient Snapshot ── */}
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'white' }}>
                            <User size={34} />
                        </div>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: '800' }}>
                            {activeSession ? activeSession.patientName : 'No Active Session'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                            {activeSession ? `${activeSession.age}y · ${activeSession.gender}` : 'Select an appointment to begin'}
                        </p>
                        {activeSession && (
                            <span style={{ marginTop: '8px', display: 'inline-block', padding: '3px 10px', background: 'rgba(99,102,241,0.1)', color: 'var(--brand-primary)', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase' }}>
                                {activeSession.type}
                            </span>
                        )}
                    </div>

                    {activeSession ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {[
                                    { label: 'Blood Group', value: activeSession.bloodGroup },
                                    { label: 'Token', value: `#${activeSession.tokenNumber}` },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                                        <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.82rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertCircle size={12} color="var(--critical)" /> Allergies
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {activeSession.allergies.length > 0
                                        ? activeSession.allergies.map(a => (
                                            <span key={a} style={{ padding: '3px 8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', fontSize: '0.71rem', color: 'var(--critical)' }}>{a}</span>
                                        ))
                                        : <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>None reported</span>
                                    }
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '0.82rem', fontWeight: '700', marginBottom: '8px' }}>Visit Summary</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>{activeSession.summary}</p>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Stethoscope size={42} style={{ opacity: 0.08, margin: '0 auto 1rem' }} />
                                <p style={{ fontSize: '0.8rem' }}>Start a session from the queue →</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── CENTER: Consultation ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>

                    {/* Timer bar */}
                    <div className="glass" style={{ padding: '1.1rem 1.5rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', background: 'rgba(99,102,241,0.1)', borderRadius: '10px', color: 'var(--brand-primary)' }}>
                                <Clock size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', lineHeight: 1 }}>{activeSession ? formatTime(timer) : '--:--'}</h3>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Session Timer</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.82rem', fontWeight: '700', color: activeSession ? 'var(--brand-teal)' : 'var(--text-muted)' }}>
                                {activeSession ? '● Live Session' : '○ No Active Session'}
                            </p>
                            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {activeSession ? `${activeSession.patientName} · Token #${activeSession.tokenNumber}` : 'Pick an appointment to begin'}
                            </p>
                        </div>
                    </div>

                    {/* Notes / Idle */}
                    <AnimatePresence mode="wait">
                        {activeSession ? (
                            <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="glass" style={{ flex: 1, padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileText size={17} color="var(--brand-primary)" /> Clinical Observations
                                    </h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="glass" style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><Mic size={12} /> Voice</button>
                                        <button className="glass" style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><Paperclip size={12} /> Attach</button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.67rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnosis</label>
                                    <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Preliminary diagnosis..."
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '9px', padding: '9px 13px', color: 'white', outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box' }} />
                                </div>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Write detailed clinical notes here..."
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '1rem', color: 'white', fontSize: '0.95rem', resize: 'none', outline: 'none', lineHeight: '1.65' }} />
                            </motion.div>
                        ) : (
                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="glass" style={{ flex: 1, padding: '2rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-glass)' }}>
                                    <AlertCircle size={26} color="var(--text-muted)" />
                                </div>
                                <h3 style={{ fontWeight: '700', fontSize: '1.05rem' }}>No Active Session</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                                    {pending.length > 0 ? `${pending.length} patient${pending.length > 1 ? 's' : ''} waiting — click ▶ to begin` : 'All consultations complete for today.'}
                                </p>
                                {pending.length > 0 && (
                                    <button onClick={() => startSession(pending[0])} style={{ padding: '10px 26px', background: 'var(--brand-primary)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '0.92rem' }}>
                                        Start Next Consultation
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={handleEscalate} disabled={!activeSession} className="glass"
                            style={{ flex: 1, padding: '1rem', color: 'var(--critical)', fontWeight: '700', borderRadius: 'var(--radius-lg)', cursor: activeSession ? 'pointer' : 'not-allowed', opacity: activeSession ? 1 : 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                            <PhoneOff size={16} /> Escalate
                        </button>
                        <button onClick={handleComplete} disabled={!activeSession} className="btn-premium"
                            style={{ flex: 2, padding: '1rem', fontSize: '0.95rem', opacity: activeSession ? 1 : 0.5, cursor: activeSession ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                            <CheckCircle2 size={16} /> Mark Complete
                        </button>
                    </div>
                </div>

                {/* ── RIGHT: Quick Actions + Queue ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>

                    {/* Quick Actions */}
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)' }}>
                        <h3 style={{ fontSize: '0.92rem', fontWeight: '700', marginBottom: '1rem' }}>Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            {QUICK_ACTIONS.map((a) => (
                                <motion.button
                                    key={a.key}
                                    whileHover={{ x: 3 }}
                                    onClick={() => setDrawer(d => d === a.key ? null : a.key)}
                                    style={{
                                        width: '100%', padding: '10px 14px',
                                        background: drawer === a.key ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                                        border: drawer === a.key ? '1px solid var(--brand-primary)' : '1px solid var(--border-glass)',
                                        borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px',
                                        cursor: 'pointer', color: 'white', transition: 'background 0.2s, border 0.2s',
                                    }}
                                >
                                    <a.icon size={15} color={a.color} />
                                    <span style={{ fontSize: '0.83rem', fontWeight: '600', flex: 1, textAlign: 'left' }}>{a.label}</span>
                                    <ChevronRight size={13} color="var(--text-muted)" style={{ transform: drawer === a.key ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Appointment Queue */}
                    <div className="glass" style={{ flex: 1, padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '0.92rem', fontWeight: '700' }}>
                            Today's Queue
                            <span style={{ fontSize: '0.72rem', fontWeight: '400', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                {pending.length} pending · {completed.length} done
                            </span>
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            {activeSession && (
                                <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                    style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', border: '1px solid var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '9px' }}>
                                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: '800', color: 'white', flexShrink: 0 }}>#{activeSession.tokenNumber}</div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeSession.patientName}</p>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--brand-primary)' }}>● In session · {activeSession.time}</p>
                                    </div>
                                </motion.div>
                            )}
                            {pending.map(appt => (
                                <div key={appt.id} style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '9px' }}>
                                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: '800', flexShrink: 0 }}>#{appt.tokenNumber}</div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appt.patientName}</p>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{appt.type} · {appt.time}</p>
                                    </div>
                                    <button onClick={() => { if (!activeSession) startSession(appt); }}
                                        style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--brand-primary)', borderRadius: '6px', padding: '5px 7px', cursor: activeSession ? 'not-allowed' : 'pointer', opacity: activeSession ? 0.3 : 1, flexShrink: 0 }}>
                                        <Play size={12} />
                                    </button>
                                </div>
                            ))}
                            {completed.map(appt => (
                                <div key={appt.id} style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(20,184,166,0.04)', border: '1px solid rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', gap: '9px', opacity: 0.7 }}>
                                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <CheckCircle2 size={13} color="var(--brand-teal)" />
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appt.patientName}</p>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--brand-teal)' }}>✓ Done · {appt.duration}</p>
                                    </div>
                                </div>
                            ))}
                            {pending.length === 0 && completed.length === 0 && !activeSession && (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>No appointments today.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SLIDE-IN DRAWER ── */}
            <AnimatePresence>
                {drawer && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDrawer(null)}
                            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
                        />
                        {/* Drawer */}
                        <motion.div
                            key="drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            style={{
                                position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
                                width: '420px', maxWidth: '90vw',
                                background: 'var(--bg-surface)',
                                borderLeft: '1px solid var(--border-glass)',
                                boxShadow: '-16px 0 48px rgba(0,0,0,0.4)',
                                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                            }}
                        >
                            {/* Drawer header */}
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <h3 style={{ fontWeight: '800', fontSize: '1.1rem' }}>{DRAWER_TITLES[drawer]}</h3>
                                <button onClick={() => setDrawer(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            {/* Drawer body */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                                {drawer === 'history' && <PatientHistoryPanel session={activeSession} />}
                                {drawer === 'labs' && <LabReportsPanel session={activeSession} />}
                                {drawer === 'prescription' && <PrescriptionPanel session={activeSession} onClose={() => setDrawer(null)} />}
                                {drawer === 'notepad' && <NotepadPanel />}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LiveConsultation;
