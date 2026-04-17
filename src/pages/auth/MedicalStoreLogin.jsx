import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Store, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const MedicalStoreLogin = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const { loginMedicalStore, completeLogin } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await loginMedicalStore(email.trim(), password);
            if (res?.success) {
                const userObj = { ...res.store, role: 'medical_store' };
                localStorage.setItem('userRole', 'medical_store');
                completeLogin(userObj);
                navigate('/dashboard/pharmacy');
                return;
            }
            setError(res?.message || 'Login failed.');
        } catch (err) {
            setError(err?.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={isEmbedded ? "" : "auth-wrapper"}>
            <div className={isEmbedded ? "" : "auth-card p-6"}>
                <button
                    onClick={() => navigate('/login')}
                    style={{ background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}
                >
                    <ArrowLeft size={20} />
                    <span className="font-bold">Back</span>
                </button>

                <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '16px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-1px' }}>Pharmacy Portal</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '700' }}>Medical Store Management</p>
                </div>

                <motion.form
                    key="store-email-login"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onSubmit={handleLogin}
                    className="flex-col"
                    style={{ gap: '20px' }}
                >
                    {error && (
                        <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '12px', fontSize: '14px', textAlign: 'center', border: '1px solid #fee2e2', fontWeight: 'bold' }}>
                            {error}
                        </div>
                    )}

                    <div className="input-field flex-col">
                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="email"
                                placeholder="store@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: '600' }}
                                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                    </div>

                    <div className="input-field flex-col">
                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="password"
                                placeholder="Enter password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: '600' }}
                                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="animate-spin text-white" size={18} /> : 'Login to Pharmacy Dashboard'}
                    </button>

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
            </div>
        </div>
    );
};

export default MedicalStoreLogin;
