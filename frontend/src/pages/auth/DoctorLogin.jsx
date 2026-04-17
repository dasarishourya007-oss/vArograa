import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, Stethoscope, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

const AuthInput = ({ icon, rightIcon, ...props }) => (
    <div className="group relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all z-10">
            {icon}
        </div>
        <input
            {...props}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-14 text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
        />
        {rightIcon && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                {rightIcon}
            </div>
        )}
    </div>
);

const mapFirebaseError = (err) => {
    const code = err?.code;
    if (code === 'auth/invalid-credential') return 'Invalid email or password.';
    if (code === 'auth/user-not-found') return 'No doctor account found with this email.';
    if (code === 'auth/wrong-password') return 'Incorrect password. Please try again.';
    if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (code === 'auth/network-request-failed') return 'Network error. Check internet and try again.';
    if (code === 'permission-denied') return 'Permission denied. Firestore rules may not be deployed.';
    return err?.message || 'Login failed. Please try again.';
};

const DoctorLogin = () => {
    const navigate = useNavigate();
    const { completeLogin } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [statusInfo, setStatusInfo] = useState(null);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setErrorMsg('');
        setStatusInfo(null);
        setIsLoading(true);

        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const uid = cred.user.uid;

            let userData = { role: 'doctor', doctorStatus: 'PENDING_APPROVAL' };
            let doctorProfile = null;
            let statusSource = 'default';

            try {
                const userDoc = await getDoc(doc(db, 'users', uid));
                if (userDoc.exists()) {
                    userData = userDoc.data();
                    if (userData.doctorStatus || userData.status) statusSource = 'users';
                }

                const doctorDoc = await getDoc(doc(db, 'doctors', uid));
                if (doctorDoc.exists()) {
                    doctorProfile = doctorDoc.data();
                    if (statusSource === 'default' && (doctorProfile?.doctorStatus || doctorProfile?.status)) {
                        statusSource = 'doctors';
                    }
                }
            } catch {
                // Keep defaults
            }

            const isDoctorAccount =
                userData.roles?.includes('doctor') ||
                userData.role === 'doctor' ||
                doctorProfile?.role === 'doctor' ||
                !!doctorProfile;

            if (!isDoctorAccount) {
                setErrorMsg('This account is not a doctor account. Please use the correct login portal.');
                setIsLoading(false);
                return;
            }

            const effectiveDoctorStatus =
                userData.doctorStatus ||
                userData.status ||
                doctorProfile?.doctorStatus ||
                doctorProfile?.status ||
                'PENDING_APPROVAL';

            const profilePhotoURL = userData?.photoURL || doctorProfile?.photoURL || cred.user?.photoURL || '';

            localStorage.setItem('userRole', 'doctor');
            completeLogin({
                uid,
                email: cred.user.email,
                ...userData,
                photoURL: profilePhotoURL,
                doctorStatus: effectiveDoctorStatus
            });

            setStatusInfo({
                status: effectiveDoctorStatus,
                source: statusSource
            });

            const isApproved = String(effectiveDoctorStatus).toUpperCase() === 'APPROVED' || String(effectiveDoctorStatus).toUpperCase() === 'ACTIVE';
            if (isApproved) {
                const requiresPhotoUpload = !profilePhotoURL;
                navigate('/dashboard/doctor', {
                    state: requiresPhotoUpload ? { requirePhotoUpload: true } : null
                });
            }
        } catch (err) {
            setErrorMsg(mapFirebaseError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const upperStatus = String(statusInfo?.status || '').toUpperCase();
    const statusColor = upperStatus === 'APPROVED' || upperStatus === 'ACTIVE'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : upperStatus === 'REJECTED'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-amber-50 border-amber-200 text-amber-700';

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans overflow-y-auto"
            style={{ background: 'linear-gradient(160deg, #eff6ff 0%, #f8fafc 40%, #f0fdf4 100%)' }}>

            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[440px] z-10 py-6"
            >
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6 transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Login
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl shadow-blue-500/20 mb-5">
                        <Stethoscope className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
                        Doctor <span className="text-blue-600">Portal</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Access your clinical workspace</p>
                </div>

                <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 rounded-[32px] p-8 shadow-2xl">
                    <AnimatePresence>
                        {errorMsg && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 text-sm font-medium py-3 px-4 rounded-2xl mb-5"
                            >
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                {errorMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {statusInfo && (
                        <div className={`border text-xs font-bold py-2 px-3 rounded-xl mb-4 ${statusColor}`}>
                            Status: {statusInfo.status} (source: {statusInfo.source})
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <AuthInput
                            icon={<Mail size={18} />}
                            type="email"
                            placeholder="doctor@hospital.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                        <AuthInput
                            icon={<Lock size={18} />}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            rightIcon={
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-slate-700 transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading
                                ? <><Loader2 className="animate-spin w-5 h-5" /> Signing In...</>
                                : 'Login to Dashboard'
                            }
                        </button>
                    </form>

                    {statusInfo && statusInfo.status !== 'APPROVED' && statusInfo.status !== 'ACTIVE' && (
                        <button
                            onClick={() => navigate('/dashboard/patient')}
                            className="w-full mt-3 py-3 border border-slate-300 text-slate-700 rounded-2xl font-bold text-sm"
                        >
                            Continue as Patient While Waiting
                        </button>
                    )}

                    <p className="text-center text-sm text-slate-500 font-medium mt-8">
                        Don't have an account?{' '}
                        <button onClick={() => navigate('/register/doctor')} className="text-blue-600 font-bold hover:underline">
                            Register as a Doctor
                        </button>
                    </p>

                    <p className="text-center text-[10px] text-slate-400 font-medium mt-6 border-t border-slate-100 pt-6">
                        Note: All registrations require hospital verification.
                        <br />You can use the platform as a patient while waiting.
                    </p>
                </div>

                <p className="text-center text-[10px] font-black text-slate-400 tracking-widest uppercase mt-6">
                    2026 vArogra Healthcare
                </p>
            </motion.div>
        </div>
    );
};

export default DoctorLogin;


