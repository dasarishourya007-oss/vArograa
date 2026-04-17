import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

const Toast = ({ show, message, doctorName, time, onClose }) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: '-45%', x: '-50%', scale: 0.9 }}
                    animate={{ opacity: 1, y: '-50%', x: '-50%', scale: 1 }}
                    exit={{ opacity: 0, y: '-45%', x: '-50%', scale: 0.9 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        zIndex: 9999,
                        background: 'white',
                        padding: '24px 32px',
                        borderRadius: '28px',
                        boxShadow: '0 25px 70px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
                        border: '1px solid rgba(255,255,255,0.8)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px',
                        minWidth: '340px',
                        textAlign: 'center'
                    }}
                >
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'rgba(0,0,0,0.03)',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                    >
                        <X size={18} />
                    </button>

                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)'
                    }}>
                        <CheckCircle size={32} strokeWidth={2.5} />
                    </div>
                    
                    <div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                            {message || 'Action Successful'}
                        </h4>
                        {(doctorName || time) && (
                            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '600', lineHeight: '1.5' }}>
                                {doctorName} {time && <><br /><span style={{ color: 'var(--p-500)' }}>{time}</span></>}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            marginTop: '10px',
                            width: '100%',
                            padding: '14px',
                            borderRadius: '16px',
                            background: 'var(--p-500)',
                            color: 'white',
                            border: 'none',
                            fontWeight: '700',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            boxShadow: 'var(--shadow-primary)'
                        }}
                    >
                        Dismiss
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
