import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, ShieldCheck } from 'lucide-react';

const ContactSpecialistModal = ({ isOpen, onClose, practitioner }) => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = (e) => {
        e.preventDefault();
        setSending(true);
        // Simulate encrypted transmission
        setTimeout(() => {
            setSending(false);
            setSent(true);
            setTimeout(() => {
                setSent(false);
                setMessage('');
                onClose();
            }, 2000);
        }, 1500);
    };

    if (!practitioner) return null;

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
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="glass"
                        style={{
                            width: '100%',
                            maxWidth: '450px',
                            position: 'relative',
                            padding: '2.5rem',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '24px',
                            background: 'rgba(15, 23, 42, 0.95)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <button
                            onClick={onClose}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--primary)'
                                }}>
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Secure Channel</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>To: {practitioner.name}</p>
                                </div>
                            </div>
                        </div>

                        {sent ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ textAlign: 'center', padding: '2rem' }}
                            >
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--available)',
                                    margin: '0 auto 1.5rem',
                                    border: '1px solid var(--available)'
                                }}>
                                    <ShieldCheck size={32} />
                                </div>
                                <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Transmission Success</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Message encrypted and delivered via node 512x.</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSend}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <textarea
                                        required
                                        placeholder="Type your priority message..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '150px',
                                            padding: '1rem',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid var(--border-glass)',
                                            borderRadius: '16px',
                                            color: 'white',
                                            fontSize: '0.9rem',
                                            resize: 'none',
                                            outline: 'none',
                                            transition: 'var(--transition)'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
                                    />
                                </div>

                                <button
                                    disabled={sending}
                                    className="btn-premium"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        opacity: sending ? 0.7 : 1
                                    }}
                                >
                                    {sending ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                                        />
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Encrypt & Send
                                        </>
                                    )}
                                </button>

                                <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <ShieldCheck size={12} /> Priority Level 4 Encryption Active
                                </p>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ContactSpecialistModal;
