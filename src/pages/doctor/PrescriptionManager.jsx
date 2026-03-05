import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Plus,
    Download,
    Printer,
    Trash2,
    Search,
    User,
    Clipboard,
    X,
    CheckCircle,
    Eye,
    Package
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createPrescription, updateAppointmentStatus, subscribeToPrescriptions } from '../../firebase/services';

// ─── View Prescription Modal ────────────────────────────────────────────────
const ViewPrescriptionModal = ({ prescription, onClose, onPrint, onDownload }) => {
    const p = prescription;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 1100,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '700px',
                    maxHeight: '88vh',
                    overflowY: 'auto',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.75rem',
                }}
            >
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }}>{p.patient}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                            ID: {p.id} &nbsp;•&nbsp; Issued: {p.date} &nbsp;•&nbsp;
                            <span style={{ color: p.status === 'Active' ? 'var(--brand-teal)' : 'var(--text-muted)', fontWeight: '700' }}>{p.status}</span>
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button onClick={() => onPrint(p)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Print"><Printer size={18} /></button>
                        <button onClick={() => onDownload(p)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Download"><Download size={18} /></button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
                    </div>
                </div>

                {/* Patient + Doctor strip */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {[
                        { label: 'Patient', value: `${p.patient}${p.age ? ', ' + p.age + 'y' : ''}${p.gender ? ' • ' + p.gender : ''}` },
                        { label: 'Prescribing Doctor', value: p.doctorName || 'Dr. Sarah Wilson' },
                    ].map(({ label, value }) => (
                        <div key={label} style={{ padding: '0.9rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</p>
                            <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Diagnosis */}
                <div style={{ padding: '0.9rem 1rem', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Diagnosis</p>
                    <p style={{ fontWeight: '700' }}>{p.diagnosis || p.templateLabel || '–'}</p>
                </div>

                {/* Medicines table */}
                {p.medicines && p.medicines.length > 0 && (
                    <div>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--brand-teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Medicines</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                        {['Medicine', 'Dose', 'Frequency', 'Duration', 'Instructions'].map(h => (
                                            <th key={h} style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'left', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {p.medicines.map((m, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '10px', fontWeight: '700' }}>{m.name}</td>
                                            <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{m.dose}</td>
                                            <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{m.frequency}</td>
                                            <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{m.duration}</td>
                                            <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{m.instructions}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Advice */}
                {p.advice && (
                    <div style={{ padding: '1rem', background: 'rgba(20,184,166,0.05)', borderRadius: '10px', border: '1px solid rgba(20,184,166,0.15)' }}>
                        <p style={{ fontSize: '0.68rem', color: 'var(--brand-teal)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '8px' }}>Advice & Instructions</p>
                        <p style={{ fontSize: '0.88rem', lineHeight: '1.65', color: 'var(--text-primary)' }}>{p.advice}</p>
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="glass"
                    style={{ padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-muted)' }}
                >
                    Close
                </button>
            </motion.div>
        </motion.div>
    );
};

// ─── Default Template Data ──────────────────────────────────────────────────
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

// ─── Create Template Modal ───────────────────────────────────────────────────
const CreateTemplateModal = ({ onClose, onSave }) => {
    const [form, setForm] = useState({
        label: '',
        diagnosis: '',
        advice: '',
        medicines: [{ name: '', dose: '', frequency: '', duration: '', instructions: '' }],
    });

    const updateField = (field, value) => setForm(f => ({ ...f, [field]: value }));
    const updateMed = (idx, field, value) =>
        setForm(f => ({ ...f, medicines: f.medicines.map((m, i) => i === idx ? { ...m, [field]: value } : m) }));
    const addMed = () =>
        setForm(f => ({ ...f, medicines: [...f.medicines, { name: '', dose: '', frequency: '', duration: '', instructions: '' }] }));
    const removeMed = (idx) =>
        setForm(f => ({ ...f, medicines: f.medicines.filter((_, i) => i !== idx) }));

    const handleSave = () => {
        if (!form.label.trim()) return;
        onSave({ ...form, id: 'custom_' + Date.now() });
        onClose();
    };

    const inputStyle = {
        width: '100%', background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border-glass)', borderRadius: '8px',
        padding: '8px 12px', color: 'white', outline: 'none',
        fontSize: '0.88rem', boxSizing: 'border-box',
    };
    const labelStyle = {
        fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block',
        marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em',
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 1200,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border-glass)',
                    borderRadius: '20px', width: '100%', maxWidth: '740px',
                    maxHeight: '90vh', overflowY: 'auto',
                    padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Create New Template</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Define a reusable prescription template for future use.</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={22} /></button>
                </div>

                {/* Template Name */}
                <div>
                    <label style={labelStyle}>Template Name *</label>
                    <input style={inputStyle} placeholder="e.g. Migraine Relief" value={form.label} onChange={e => updateField('label', e.target.value)} />
                </div>

                {/* Diagnosis */}
                <div>
                    <label style={labelStyle}>Diagnosis</label>
                    <input style={inputStyle} placeholder="e.g. Chronic Migraine" value={form.diagnosis} onChange={e => updateField('diagnosis', e.target.value)} />
                </div>

                {/* Medicines */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--brand-teal)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Medicines</h4>
                        <button onClick={addMed} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid var(--brand-primary)', color: 'var(--brand-primary)', borderRadius: '8px', padding: '5px 12px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Plus size={13} /> Add
                        </button>
                    </div>
                    {/* Column headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.9fr 1.2fr 0.9fr 1.5fr 36px', gap: '8px', padding: '0 4px', marginBottom: '6px' }}>
                        {['Medicine', 'Dose', 'Frequency', 'Duration', 'Instructions', ''].map(h => (
                            <span key={h} style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {form.medicines.map((med, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.9fr 1.2fr 0.9fr 1.5fr 36px', gap: '8px', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                                <input style={inputStyle} value={med.name} onChange={e => updateMed(idx, 'name', e.target.value)} placeholder="Medicine" />
                                <input style={inputStyle} value={med.dose} onChange={e => updateMed(idx, 'dose', e.target.value)} placeholder="Dose" />
                                <input style={inputStyle} value={med.frequency} onChange={e => updateMed(idx, 'frequency', e.target.value)} placeholder="Frequency" />
                                <input style={inputStyle} value={med.duration} onChange={e => updateMed(idx, 'duration', e.target.value)} placeholder="Duration" />
                                <input style={inputStyle} value={med.instructions} onChange={e => updateMed(idx, 'instructions', e.target.value)} placeholder="Instructions" />
                                <button onClick={() => removeMed(idx)} style={{ background: 'none', border: 'none', color: 'var(--critical)', cursor: 'pointer', padding: '4px' }}><Trash2 size={15} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Advice */}
                <div>
                    <label style={labelStyle}>Advice & Instructions</label>
                    <textarea rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} placeholder="General advice for this template..." value={form.advice} onChange={e => updateField('advice', e.target.value)} />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-glass)' }}>
                    <button className="glass" onClick={onClose} style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={15} /> Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!form.label.trim()}
                        style={{
                            flex: 2, padding: '12px', border: 'none', borderRadius: '10px', cursor: form.label.trim() ? 'pointer' : 'not-allowed',
                            background: form.label.trim() ? 'var(--brand-primary)' : 'rgba(99,102,241,0.3)',
                            color: 'white', fontWeight: '700', fontSize: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        }}
                    >
                        <CheckCircle size={18} /> Save Template
                    </button>
                </div>
                {!form.label.trim() && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '-1rem' }}>Template name is required.</p>
                )}
            </motion.div>
        </motion.div>
    );
};

// ─── Editable Prescription Modal ───────────────────────────────────────────
const PrescriptionModal = ({ template, appointment, onClose, onSave }) => {
    const { user } = useAuth();
    const [form, setForm] = useState({
        patientName: appointment?.patientName || '',
        patientAge: appointment?.patientAge || '',
        patientGender: appointment?.patientGender || 'Male',
        patientId: appointment?.patientId || '',
        appointmentId: appointment?.id || '',
        diagnosis: template.diagnosis,
        medicines: template.medicines.map(m => ({ ...m })),
        advice: template.advice,
        doctorName: user?.displayName || user?.name || 'Dr. Specialist',
        doctorId: user?.uid || user?.id || '',
        date: new Date().toLocaleDateString('en-GB'),
    });

    const updateField = (field, value) =>
        setForm(f => ({ ...f, [field]: value }));

    const updateMed = (idx, field, value) =>
        setForm(f => ({
            ...f,
            medicines: f.medicines.map((m, i) => i === idx ? { ...m, [field]: value } : m),
        }));

    const removeMed = (idx) =>
        setForm(f => ({ ...f, medicines: f.medicines.filter((_, i) => i !== idx) }));

    const addMed = () =>
        setForm(f => ({
            ...f,
            medicines: [...f.medicines, { name: '', dose: '', frequency: '', duration: '', instructions: '' }],
        }));

    const handleSave = () => {
        if (!form.patientName.trim() || !form.patientAge) return;
        onSave({ ...form, templateLabel: template.label });
        onClose();
    };

    const inputStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border-glass)',
        borderRadius: '8px',
        padding: '8px 12px',
        color: 'white',
        outline: 'none',
        fontSize: '0.88rem',
        boxSizing: 'border-box',
    };

    const labelStyle = {
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        display: 'block',
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '760px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.75rem',
                }}
            >
                {/* Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }}>{template.label}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Fill in patient details — all fields are editable.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* ── Patient Info ── */}
                <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--brand-teal)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Patient Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Patient Name *</label>
                            <input
                                style={inputStyle}
                                placeholder="e.g. John Doe"
                                value={form.patientName}
                                onChange={e => updateField('patientName', e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Age *</label>
                            <input
                                style={inputStyle}
                                type="number"
                                placeholder="e.g. 34"
                                value={form.patientAge}
                                onChange={e => updateField('patientAge', e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Gender</label>
                            <select
                                style={{ ...inputStyle, cursor: 'pointer' }}
                                value={form.patientGender}
                                onChange={e => updateField('patientGender', e.target.value)}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Diagnosis ── */}
                <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--brand-teal)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Diagnosis
                    </h4>
                    <input
                        style={inputStyle}
                        value={form.diagnosis}
                        onChange={e => updateField('diagnosis', e.target.value)}
                    />
                </div>

                {/* ── Medicines ── */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--brand-teal)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Medicines
                        </h4>
                        <button
                            onClick={addMed}
                            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid var(--brand-primary)', color: 'var(--brand-primary)', borderRadius: '8px', padding: '5px 12px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <Plus size={14} /> Add Medicine
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Column headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.9fr 1.2fr 0.9fr 1.5fr 36px', gap: '8px', padding: '0 4px' }}>
                            {['Medicine', 'Dose', 'Frequency', 'Duration', 'Instructions', ''].map(h => (
                                <span key={h} style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                            ))}
                        </div>

                        {form.medicines.map((med, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.9fr 1.2fr 0.9fr 1.5fr 36px', gap: '8px', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                                <input style={inputStyle} value={med.name} onChange={e => updateMed(idx, 'name', e.target.value)} placeholder="Medicine name" />
                                <input style={inputStyle} value={med.dose} onChange={e => updateMed(idx, 'dose', e.target.value)} placeholder="Dose" />
                                <input style={inputStyle} value={med.frequency} onChange={e => updateMed(idx, 'frequency', e.target.value)} placeholder="Frequency" />
                                <input style={inputStyle} value={med.duration} onChange={e => updateMed(idx, 'duration', e.target.value)} placeholder="Duration" />
                                <input style={inputStyle} value={med.instructions} onChange={e => updateMed(idx, 'instructions', e.target.value)} placeholder="Instructions" />
                                <button
                                    onClick={() => removeMed(idx)}
                                    style={{ background: 'none', border: 'none', color: 'var(--critical)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Advice / Notes ── */}
                <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--brand-teal)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Advice & Instructions
                    </h4>
                    <textarea
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
                        value={form.advice}
                        onChange={e => updateField('advice', e.target.value)}
                    />
                </div>

                {/* ── Doctor & Date ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Prescribing Doctor</label>
                        <input style={inputStyle} value={form.doctorName} onChange={e => updateField('doctorName', e.target.value)} />
                    </div>
                    <div>
                        <label style={labelStyle}>Date</label>
                        <input style={inputStyle} value={form.date} onChange={e => updateField('date', e.target.value)} />
                    </div>
                </div>

                {/* ── Action Buttons ── */}
                <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-glass)' }}>
                    <button
                        className="glass"
                        onClick={onClose}
                        style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                        <X size={16} /> Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!form.patientName.trim() || !form.patientAge}
                        style={{
                            flex: 2, padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                            background: (!form.patientName.trim() || !form.patientAge) ? 'rgba(99,102,241,0.3)' : 'var(--brand-primary)',
                            color: 'white', fontWeight: '700', fontSize: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'background 0.2s',
                        }}
                    >
                        <CheckCircle size={18} /> Save Prescription
                    </button>
                </div>

                {(!form.patientName.trim() || !form.patientAge) && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '-1rem' }}>
                        Patient name and age are required to save.
                    </p>
                )}
            </motion.div>
        </motion.div>
    );
};

// ─── Main Page ──────────────────────────────────────────────────────────────
const PrescriptionManager = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
    const [prescriptions, setPrescriptions] = useState([]);
    const [activeAppointment, setActiveAppointment] = useState(location.state?.appointment || null);

    useEffect(() => {
        if (!user) return;
        // Listen to all prescriptions issued by this doctor or for this doctor?
        // Actually, typically a doctor wants to see prescriptions they've issued.
        // But our subscribeToPrescriptions takes patientId.
        // Let's assume for now we just want to see the list.
        // If we want to see ALL prescriptions in the system (for this doctor), we'd need a different filter.
        // For now, let's just use the ones we fetch for the active patient if applicable, 
        // or a global list if we had one.
    }, [user]);

    // Open modal immediately if appointment passed
    useEffect(() => {
        if (activeAppointment) {
            setActiveTemplate(DEFAULT_TEMPLATES[0]); // Default to first template
        }
    }, [activeAppointment]);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [viewPrescription, setViewPrescription] = useState(null);
    const [showCreateTemplate, setShowCreateTemplate] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handleCreateTemplate = (newTemplate) => {
        setTemplates(prev => [...prev, newTemplate]);
        setSuccessMsg(`Template "${newTemplate.label}" created!`);
        setTimeout(() => setSuccessMsg(''), 3500);
    };

    // ── Print ──────────────────────────────────────────────────────────────
    const printPrescription = (p) => {
        const medRows = (p.medicines || []).map(m =>
            `<tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">${m.name}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee">${m.dose}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee">${m.frequency}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee">${m.duration}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee">${m.instructions}</td>
            </tr>`
        ).join('');

        const html = `
            <html><head><title>Rx – ${p.patient}</title>
            <style>
                body{font-family:Arial,sans-serif;padding:40px;color:#111;max-width:800px;margin:auto}
                h1{font-size:22px;margin-bottom:4px}h2{font-size:16px;font-weight:normal;color:#555}
                .header{border-bottom:2px solid #2563eb;padding-bottom:16px;margin-bottom:24px}
                .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
                .box{border:1px solid #e5e7eb;border-radius:8px;padding:12px}
                .label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
                .value{font-weight:700;font-size:15px}
                table{width:100%;border-collapse:collapse;margin-top:8px}
                thead tr{background:#f3f4f6}
                th{padding:8px 12px;text-align:left;font-size:12px;color:#555;text-transform:uppercase}
                .diagnosis{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin-bottom:20px}
                .advice{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-top:20px;font-size:14px;line-height:1.6}
                .footer{margin-top:40px;border-top:1px solid #e5e7eb;padding-top:12px;font-size:12px;color:#888;display:flex;justify-content:space-between}
            </style></head><body>
            <div class="header">
                <h1>vArogra Hospital &nbsp;|&nbsp; Digital Prescription</h1>
                <h2>Date Issued: ${p.date} &nbsp;&bull;&nbsp; Status: ${p.status}</h2>
            </div>
            <div class="grid">
                <div class="box"><div class="label">Patient</div><div class="value">${p.patient}${p.age ? ', ' + p.age + 'y' : ''}${p.gender ? ' • ' + p.gender : ''}</div></div>
                <div class="box"><div class="label">Prescribing Doctor</div><div class="value">${p.doctorName || 'Dr. Sarah Wilson'}</div></div>
            </div>
            <div class="diagnosis"><div class="label">Diagnosis</div><div class="value">${p.diagnosis || p.templateLabel || '–'}</div></div>
            <table><thead><tr><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
            <tbody>${medRows}</tbody></table>
            ${p.advice ? `<div class="advice"><strong>Advice & Instructions</strong><br/><br/>${p.advice}</div>` : ''}
            <div class="footer"><span>vArogra Hospital Portal</span><span>Rx #${p.id}</span></div>
            </body></html>`;

        const win = window.open('', '_blank', 'width=900,height=650');
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 400);
    };

    // ── Download ────────────────────────────────────────────────────────────
    const downloadPrescription = (p) => {
        const medLines = (p.medicines || []).map((m, i) =>
            `  ${i + 1}. ${m.name} | ${m.dose} | ${m.frequency} | ${m.duration} | ${m.instructions}`
        ).join('\n');

        const content = [
            '============================================',
            '   vAROGRA HOSPITAL — DIGITAL PRESCRIPTION ',
            '============================================',
            `Rx #${p.id}                    Date: ${p.date}`,
            '',
            `Patient  : ${p.patient}${p.age ? ', ' + p.age + 'y' : ''}${p.gender ? ' (' + p.gender + ')' : ''}`,
            `Doctor   : ${p.doctorName || 'Dr. Sarah Wilson'}`,
            `Status   : ${p.status}`,
            '',
            '--- DIAGNOSIS ---',
            `  ${p.diagnosis || p.templateLabel || '–'}`,
            '',
            '--- MEDICINES ---',
            medLines,
            '',
            '--- ADVICE & INSTRUCTIONS ---',
            `  ${p.advice || 'N/A'}`,
            '',
            '============================================',
            'This prescription was generated by vArogra.',
            '============================================',
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Prescription_${p.patient.replace(/\s+/g, '_')}_${p.date}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSave = async (formData) => {
        try {
            const newRx = {
                patientName: formData.patientName,
                patientId: formData.patientId,
                appointmentId: formData.appointmentId,
                age: formData.patientAge,
                gender: formData.patientGender,
                status: 'Active',
                templateLabel: formData.templateLabel,
                diagnosis: formData.diagnosis,
                medicines: formData.medicines.map(m => m.name).join(', '), // Simplified for discovery
                medicinesDetail: formData.medicines,
                advice: formData.advice,
                doctorName: formData.doctorName,
                doctorId: formData.doctorId,
                cost: Math.floor(Math.random() * 500) + 200 // Mock cost for medical store integration
            };

            const prescriptionId = await createPrescription(newRx);

            // If linked to appointment, update status
            if (formData.appointmentId) {
                await updateAppointmentStatus(formData.appointmentId, 'completed');
            }

            setSuccessMsg(`Prescription for ${formData.patientName} saved and transmitted!`);
            setTimeout(() => {
                setSuccessMsg('');
                if (activeAppointment) navigate('/doctor/dashboard');
            }, 3000);
        } catch (error) {
            console.error("Prescription save failed:", error);
            alert("Error saving prescription to vArogra network.");
        }
    };

    const deletePrescription = (id) =>
        setPrescriptions(prev => prev.filter(p => p.id !== id));

    const filtered = prescriptions.filter(p =>
        p.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.templateLabel?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Prescriptions</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage and create digital prescriptions for your patients.</p>
                </div>
            </div>

            {/* Success toast */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            padding: '12px 20px', background: 'rgba(20,184,166,0.12)',
                            border: '1px solid var(--brand-teal)', borderRadius: '12px',
                            color: 'var(--brand-teal)', fontWeight: '600', fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', gap: '10px',
                        }}
                    >
                        <CheckCircle size={18} /> {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>

                {/* ── Prescription List ── */}
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '10px 16px', marginBottom: '1.5rem', border: '1px solid var(--border-glass)', gap: '10px', alignItems: 'center' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search by patient name or prescription type..."
                            style={{ background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <FileText size={40} style={{ opacity: 0.15, margin: '0 auto 1rem' }} />
                            <p>No prescriptions found.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                                    {['Patient', 'Type', 'Date Issued', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '14px 12px' }}>
                                            <div
                                                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                                onClick={() => setViewPrescription(p)}
                                                title="View prescription"
                                            >
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={15} color="var(--brand-primary)" />
                                                </div>
                                                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--brand-primary)', textDecoration: 'underline', textDecorationColor: 'rgba(99,102,241,0.4)', textUnderlineOffset: '3px' }}>
                                                    {p.patient}
                                                </span>
                                                <Eye size={13} color="var(--brand-primary)" style={{ opacity: 0.6 }} />
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 12px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.templateLabel || '–'}</td>
                                        <td style={{ padding: '14px 12px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.date}</td>
                                        <td style={{ padding: '14px 12px' }}>
                                            <span style={{
                                                padding: '3px 12px', borderRadius: '20px', fontSize: '0.73rem', fontWeight: '700',
                                                background: p.status === 'Active' ? 'rgba(20,184,166,0.1)' : 'rgba(255,255,255,0.05)',
                                                color: p.status === 'Active' ? 'var(--brand-teal)' : 'var(--text-muted)',
                                                border: p.status === 'Active' ? '1px solid rgba(20,184,166,0.25)' : '1px solid transparent',
                                            }}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                                <button onClick={() => printPrescription(p)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Print"><Printer size={17} /></button>
                                                <button onClick={() => downloadPrescription(p)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Download"><Download size={17} /></button>
                                                <button onClick={() => { if (window.confirm(`Delete prescription for ${p.patient}?`)) deletePrescription(p.id); }} style={{ background: 'none', border: 'none', color: 'var(--critical)', cursor: 'pointer' }} title="Delete"><Trash2 size={17} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── Sidebar ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Smart Templates */}
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clipboard size={18} color="var(--brand-primary)" /> Smart Templates
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {templates.map(t => (
                                <motion.div
                                    key={t.id}
                                    whileHover={{ x: 4, background: 'rgba(99,102,241,0.08)' }}
                                    onClick={() => setActiveTemplate(t)}
                                    style={{
                                        padding: '12px 14px',
                                        borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--border-glass)',
                                        cursor: 'pointer',
                                        fontSize: '0.88rem',
                                        fontWeight: '500',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    {t.label}
                                    <Plus size={14} color="var(--brand-primary)" />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Create Template Card */}
                    <motion.div
                        className="glass"
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setShowCreateTemplate(true)}
                        style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', textAlign: 'center', cursor: 'pointer' }}
                    >
                        <div style={{ padding: '1.5rem', background: 'rgba(99,102,241,0.07)', borderRadius: '16px', border: '1px dashed rgba(99,102,241,0.35)', marginBottom: '1rem' }}>
                            <Plus size={38} color="var(--brand-primary)" style={{ margin: '0 auto 0.5rem' }} />
                            <h4 style={{ fontSize: '0.88rem', fontWeight: '700' }}>Create New Template</h4>
                            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '4px' }}>Add your own reusable prescription template.</p>
                        </div>
                        <span style={{ color: 'var(--brand-primary)', fontWeight: '600', fontSize: '0.85rem' }}>+ New Template</span>
                    </motion.div>
                </div>
            </div>

            {/* Create Prescription Modal */}
            <AnimatePresence>
                {activeTemplate && (
                    <PrescriptionModal
                        template={activeTemplate}
                        appointment={activeAppointment}
                        onClose={() => setActiveTemplate(null)}
                        onSave={handleSave}
                    />
                )}
            </AnimatePresence>

            {/* Create Template Modal */}
            <AnimatePresence>
                {showCreateTemplate && (
                    <CreateTemplateModal
                        onClose={() => setShowCreateTemplate(false)}
                        onSave={handleCreateTemplate}
                    />
                )}
            </AnimatePresence>

            {/* View Prescription Modal */}
            <AnimatePresence>
                {viewPrescription && (
                    <ViewPrescriptionModal
                        prescription={viewPrescription}
                        onClose={() => setViewPrescription(null)}
                        onPrint={printPrescription}
                        onDownload={downloadPrescription}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default PrescriptionManager;
