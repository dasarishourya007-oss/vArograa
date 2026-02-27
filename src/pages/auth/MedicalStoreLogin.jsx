import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Store, Key, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import Button from '../../components/Button';
import { motion, AnimatePresence } from 'framer-motion';

const MedicalStoreLogin = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const { loginMedicalStore, completeLogin } = useAuth();

    const [step, setStep] = useState(1); // 1: Credentials, 2: OTP
    const [code, setCode] = useState('');
    const [pin, setPin] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [storeData, setStoreData] = useState(null);

    const handleInitialLogin = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Master Login Shortcut
        if (code === '123' && pin === 'dsa') {
            setTimeout(async () => {
                const res = await loginMedicalStore(code, pin);
                setLoading(false);
                if (res && res.success) {
                    const userObj = { ...res.store, role: 'medical_store' };
                    completeLogin(userObj);
                    navigate('/dashboard/pharmacy');
                }
            }, 500);
            return;
        }

        // Simulate initial check
        setTimeout(async () => {
            const res = await loginMedicalStore(code.toUpperCase(), pin);
            if (res && res.success) {
                setStoreData(res.store);
                setStep(2);
                setLoading(false);
                alert(`Medical Store Login OTP: 1234`); // Simulation
            } else if (code.toUpperCase().startsWith('MSTR-')) {
                // Demo fallback if not in mock data
                const mockStore = {
                    name: 'Demo Medical Store',
                    code: code.toUpperCase(),
                    role: 'medical_store',
                    id: 'demo-store',
                    phone: '+91 98765 43210',
                    address: 'Hitech City, Hyderabad'
                };
                setStoreData(mockStore);
                setStep(2);
                setLoading(false);
                alert(`Medical Store Login OTP: 1234`);
            } else {
                setLoading(false);
                setError('Invalid Store Code. Code should start with MSTR-');
            }
        }, 1000);
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value !== '' && index < 3) {
            const nextInput = document.getElementById(`store-otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            if (otp.join('') === '1234') {
                const userObj = { ...storeData, role: 'medical_store' };
                completeLogin(userObj);
                navigate('/dashboard/pharmacy');
            } else {
                setLoading(false);
                setError('Invalid OTP. Please try again.');
            }
        }, 1200);
    };

    return (
        <div className={isEmbedded ? "" : "auth-wrapper"}>
            <div className={isEmbedded ? "" : "auth-card p-6"}>
                <button
                    onClick={() => step === 1 ? navigate('/login') : setStep(1)}
                    style={{ background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}
                >
                    <ArrowLeft size={20} />
                    <span className="font-bold">Back</span>
                </button>

                <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '16px' }}>
                    <div style={{ display: 'inline-flex', padding: '20px', backgroundColor: 'var(--brand-secondary)', borderRadius: '24px', color: 'var(--brand-primary)', marginBottom: '16px' }}>
                        <Store size={32} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Pharmacy Portal</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Medical Store Management</p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.form
                            key="s-step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleInitialLogin}
                            className="flex-col"
                            style={{ gap: '20px' }}
                        >
                            {error && (
                                <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '12px', fontSize: '14px', textAlign: 'center', border: '1px solid #fee2e2', fontWeight: 'bold' }}>
                                    {error}
                                </div>
                            )}

                            <div className="input-field flex-col">
                                <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Store Code</label>
                                <div style={{ position: 'relative' }}>
                                    <Store size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input
                                        type="text"
                                        placeholder="MSTR-XXXX"
                                        required
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: '600' }}
                                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                </div>
                            </div>

                            <div className="input-field flex-col">
                                <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Passkey / PIN</label>
                                <div style={{ position: 'relative' }}>
                                    <Key size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input
                                        type="password"
                                        placeholder="••••"
                                        required
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: '600' }}
                                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                </div>
                            </div>

                            <Button type="submit" size="block" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin text-white" /> : 'Continue to OTP'}
                            </Button>

                            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>New pharmacy? </span>
                                <button
                                    type="button"
                                    onClick={() => navigate('/register/medical-store')}
                                    style={{ color: '#10b981', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    Register Medical Store
                                </button>
                            </div>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="s-step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleVerifyOtp}
                            className="flex-col"
                            style={{ gap: '24px' }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#10b981', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                                    <ShieldCheck size={48} />
                                </div>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Two-Factor Auth</h2>
                                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
                                    Please enter the security code sent to your registered store device.
                                </p>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            id={`store-otp-${i}`}
                                            type="number"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            style={{ width: '56px', height: '64px', borderRadius: '16px', border: '2px solid #e2e8f0', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#1e293b', outline: 'none' }}
                                            onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    ))}
                                </div>
                                {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '12px', fontWeight: 'bold' }}>{error}</p>}
                            </div>

                            <Button type="submit" size="block" disabled={loading || otp.some(v => v === '')}>
                                {loading ? <Loader2 className="animate-spin text-white" /> : 'Verify & Access Dashboard'}
                            </Button>

                            <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                                Resend code in <span style={{ color: '#10b981', fontWeight: 'bold' }}>0:59</span>
                            </p>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MedicalStoreLogin;
