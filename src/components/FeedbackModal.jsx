import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, Stethoscope, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { submitFeedback } from '../firebase/services';

// ─── Interactive Star Row ──────────────────────────────────────────────────────
const StarSelector = ({ rating, onChange, label, icon: Icon, color }) => {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}18` }}
                >
                    <Icon size={16} style={{ color }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{label}</span>
            </div>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= (hovered || rating);
                    return (
                        <motion.button
                            key={star}
                            whileTap={{ scale: 0.85 }}
                            onMouseEnter={() => setHovered(star)}
                            onMouseLeave={() => setHovered(0)}
                            onClick={() => onChange(star)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                lineHeight: 0,
                            }}
                        >
                            <Star
                                size={32}
                                fill={filled ? '#f59e0b' : 'transparent'}
                                strokeWidth={filled ? 0 : 1.5}
                                style={{
                                    color: filled ? '#f59e0b' : '#cbd5e1',
                                    transition: 'all 0.15s ease',
                                    filter: filled ? 'drop-shadow(0 2px 6px rgba(245,158,11,0.4))' : 'none',
                                }}
                            />
                        </motion.button>
                    );
                })}
                <span style={{
                    fontSize: '12px', fontWeight: '700',
                    color: rating ? '#f59e0b' : '#94a3b8',
                    alignSelf: 'center', marginLeft: '4px'
                }}>
                    {rating ? ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating] : 'Tap to rate'}
                </span>
            </div>
        </div>
    );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const FeedbackModal = ({ appointment, onClose }) => {
    const [doctorRating, setDoctorRating] = useState(0);
    const [hospitalRating, setHospitalRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const canSubmit = doctorRating > 0 && hospitalRating > 0;

    const handleSubmit = async () => {
        if (!canSubmit || loading) return;
        setLoading(true);
        try {
            await submitFeedback({
                appointmentId: appointment.id,
                patientId: appointment.patientId,
                doctorId: appointment.doctorId || appointment.doctorRefId,
                hospitalId: appointment.hospitalId || appointment.hospitalRefId,
                doctorName: appointment.doctorName,
                hospitalName: appointment.hospitalName,
                doctorRating,
                hospitalRating,
                comment: comment.trim(),
            });
            setDone(true);
            setTimeout(onClose, 2000);
        } catch (err) {
            console.error('Feedback submit error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(15,23,42,0.6)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9000,
                }}
            />

            {/* Sheet */}
            <motion.div
                key="sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                style={{
                    position: 'fixed',
                    bottom: 0, left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    maxWidth: '450px',
                    zIndex: 9001,
                    background: 'white',
                    borderRadius: '32px 32px 0 0',
                    boxShadow: '0 -20px 60px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Gold accent bar */}
                <div style={{
                    height: '4px',
                    background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)',
                }} />

                <div style={{ padding: '24px 24px 40px' }}>
                    {done ? (
                        /* ── Success State ── */
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center gap-4 py-8"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    width: '72px', height: '72px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
                                }}
                            >
                                <CheckCircle2 size={36} color="white" />
                            </motion.div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>
                                Thank you for your feedback!
                            </h3>
                            <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', fontWeight: '500' }}>
                                Your ratings help improve care for everyone.
                            </p>
                        </motion.div>
                    ) : (
                        <>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <p style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        Appointment Complete
                                    </p>
                                    <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                                        How was your visit?
                                    </h2>
                                    <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>
                                        {appointment.doctorName} · {appointment.hospitalName}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    <X size={18} color="#64748b" />
                                </button>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: '#f1f5f9', marginBottom: '20px' }} />

                            {/* Star Ratings */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
                                <StarSelector
                                    rating={doctorRating}
                                    onChange={setDoctorRating}
                                    label={`Dr. ${appointment.doctorName || 'Doctor'}`}
                                    icon={Stethoscope}
                                    color="#2563eb"
                                />
                                <StarSelector
                                    rating={hospitalRating}
                                    onChange={setHospitalRating}
                                    label={appointment.hospitalName || 'Hospital'}
                                    icon={Building2}
                                    color="#8b5cf6"
                                />
                            </div>

                            {/* Comment Box */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <MessageSquare size={14} color="#94a3b8" />
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
                                        Add a comment <span style={{ fontWeight: '500', color: '#94a3b8' }}>(optional)</span>
                                    </span>
                                </div>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value.slice(0, 200))}
                                    placeholder="Share your experience to help other patients…"
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '16px',
                                        border: '1.5px solid #e2e8f0',
                                        fontSize: '14px',
                                        fontFamily: 'Outfit, sans-serif',
                                        color: '#0f172a',
                                        resize: 'none',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        lineHeight: '1.5',
                                        transition: 'border 0.2s',
                                    }}
                                    onFocus={(e) => e.target.style.border = '1.5px solid #f59e0b'}
                                    onBlur={(e) => e.target.style.border = '1.5px solid #e2e8f0'}
                                />
                                <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right', marginTop: '4px' }}>
                                    {comment.length}/200
                                </p>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={onClose}
                                    style={{
                                        flex: '0 0 auto',
                                        padding: '0 20px',
                                        height: '52px',
                                        borderRadius: '18px',
                                        border: '1.5px solid #e2e8f0',
                                        background: 'white',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        color: '#64748b',
                                        cursor: 'pointer',
                                        fontFamily: 'Outfit, sans-serif',
                                    }}
                                >
                                    Skip
                                </button>
                                <motion.button
                                    whileTap={canSubmit ? { scale: 0.97 } : {}}
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || loading}
                                    style={{
                                        flex: 1,
                                        height: '52px',
                                        borderRadius: '18px',
                                        border: 'none',
                                        background: canSubmit
                                            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                            : '#f1f5f9',
                                        color: canSubmit ? 'white' : '#94a3b8',
                                        fontSize: '14px',
                                        fontWeight: '800',
                                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: canSubmit ? '0 8px 20px rgba(245,158,11,0.35)' : 'none',
                                        transition: 'all 0.2s',
                                        fontFamily: 'Outfit, sans-serif',
                                    }}
                                >
                                    {loading
                                        ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
                                        : <><Star size={16} fill="white" /> Submit Feedback</>
                                    }
                                </motion.button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FeedbackModal;
