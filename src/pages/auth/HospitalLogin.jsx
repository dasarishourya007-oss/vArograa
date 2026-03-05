import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Lock, Loader2, Eye, EyeOff,
    Building2, MapPin, User, Phone, CheckCircle2,
    AlertCircle, Navigation, Copy, ShieldCheck, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

import { useAuth } from '../../context/AuthContext';

// ── Sub-components ──────────────────────────────────────────────────────────────

const AuthInput = ({ icon, rightIcon, ...props }) => (
    <div className="group relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-all z-10">
            {icon}
        </div>
        <input
            {...props}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-14 text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm"
        />
        {rightIcon && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                {rightIcon}
            </div>
        )}
    </div>
);

// ── Main Component ──────────────────────────────────────────────────────────────

const HospitalLogin = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const { completeLogin } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    // Login fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Signup fields
    const [hospitalName, setHospitalName] = useState('');
    const [address, setAddress] = useState('');
    const [adminName, setAdminName] = useState('');
    const [phone, setPhone] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [licenseNo, setLicenseNo] = useState('');
    const [isLocating, setIsLocating] = useState(false);

    // Multi-step OTP flow
    const [step, setStep] = useState('form');         // 'form' | 'otp' | 'success'
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [enteredOtp, setEnteredOtp] = useState(['', '', '', '', '', '']);
    const [pendingUid, setPendingUid] = useState('');

    // ── Location auto-detect ──────────────────────────────────────────────────
    const detectLocation = () => {
        if (!('geolocation' in navigator)) { setErrorMsg('Geolocation not supported.'); return; }
        setIsLocating(true);
        setErrorMsg('');
        navigator.geolocation.getCurrentPosition(
            async ({ coords: { latitude, longitude } }) => {
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                    );
                    const data = await res.json();
                    if (data?.address) {
                        const a = data.address;
                        const parts = [
                            a.road || a.pedestrian || '',
                            a.suburb || a.neighbourhood || '',
                            a.city || a.town || a.village || a.county || '',
                            a.state || '',
                            a.postcode || '',
                        ].filter(Boolean);
                        setAddress(parts.join(', '));
                    } else {
                        setErrorMsg('Could not detect address. Please type it manually.');
                    }
                } catch { setErrorMsg('Location fetch failed. Please type manually.'); }
                finally { setIsLocating(false); }
            },
            (err) => {
                setIsLocating(false);
                setErrorMsg(err.code === 1
                    ? 'Location access denied. Allow permission and try again.'
                    : 'Unable to get location.');
            },
            { timeout: 10000 }
        );
    };



    // ── Login ─────────────────────────────────────────────────────────────────
    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);
        try {
            // Master Login Bypass for Hospital
            if (email === '123' && password === 'dsa') {
                localStorage.setItem('userRole', 'hospital');
                completeLogin({
                    uid: 'demo-hospital-id',
                    id: 'demo-hospital-id',
                    email: 'hospital@demo.com',
                    role: 'hospital',
                    name: 'City General Hospital'
                });
                navigate('/hospital');
                return;
            }

            if (auth) {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                localStorage.setItem('userRole', 'hospital');
                completeLogin({ uid: cred.user.uid, email: cred.user.email, role: 'hospital' });
            }
            navigate('/hospital');
        } catch (err) {
            setErrorMsg(
                err.code === 'auth/invalid-credential' ? 'Invalid email or password.' :
                    err.code === 'auth/user-not-found' ? 'No hospital account found with this email.' :
                        err.message || 'Login failed.'
            );
        } finally { setIsLoading(false); }
    };

    // ── Step 1: Submit form → generate OTP → go to OTP step ──────────────────
    const handleSignup = async (e) => {
        if (e) e.preventDefault();
        setErrorMsg(''); setSuccessMsg('');

        if (!hospitalName || !address || !adminName || !phone || !regEmail || !regPassword) {
            setErrorMsg('Please fill in all required fields.'); return;
        }
        if (regPassword !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
        if (regPassword.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }

        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
            const uid = userCredential.user.uid;
            await updateProfile(userCredential.user, { displayName: hospitalName });
            setPendingUid(uid);

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(otp);
            console.log(`[DEV] OTP for ${regEmail}: ${otp}`);

            setStep('otp');
        } catch (err) {
            setErrorMsg(
                err.code === 'auth/email-already-in-use' ? 'This email is already registered. Please login.' :
                    err.code === 'auth/weak-password' ? 'Use a stronger password (min 6 chars).' :
                        err.message || 'Registration failed.'
            );
        } finally { setIsLoading(false); }
    };

    const handleVerifyOtp = async () => {
        const entered = enteredOtp.join('');
        if (entered.length < 6) { setErrorMsg('Please enter all 6 digits.'); return; }
        if (entered !== generatedOtp) { setErrorMsg('Incorrect OTP. Please try again.'); return; }

        setIsLoading(true); setErrorMsg('');

        // Save to Firestore with 5-second timeout — never block the user
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
        );
        const saveToFirestore = (async () => {
            if (db && pendingUid) {
                await setDoc(doc(db, 'hospitals', pendingUid), {
                    id: pendingUid, name: hospitalName, address, adminName,
                    phone, email: regEmail, licenseNo: licenseNo || '',
                    role: 'hospital', isVerified: false,
                    rating: 0, doctors: [], facilities: [],
                    isOpen: true, hasEmergency: false, createdAt: serverTimestamp(),
                });
                await setDoc(doc(db, 'users', pendingUid), {
                    uid: pendingUid, displayName: hospitalName, email: regEmail,
                    role: 'hospital', hospitalId: pendingUid,
                    phone, createdAt: serverTimestamp(),
                });
            }
        })();

        try {
            await Promise.race([saveToFirestore, timeout]);
        } catch (err) {
            console.warn('Firestore save skipped (offline/timeout):', err.message);
        }

        setIsLoading(false);
        setStep('success');
    };

    // ── OTP input helpers ─────────────────────────────────────────────────────
    const handleOtpInput = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...enteredOtp];
        newOtp[index] = value.slice(-1);
        setEnteredOtp(newOtp);
        if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
    };
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !enteredOtp[index] && index > 0)
            document.getElementById(`otp-${index - 1}`)?.focus();
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(pendingUid);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };


    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className={isEmbedded ? '' : 'min-h-screen flex items-center justify-center p-4 font-sans overflow-y-auto'}
            style={!isEmbedded ? { background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 40%, #eff6ff 100%)' } : {}}>

            {!isEmbedded && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/5 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-600/5 blur-[120px] rounded-full" />
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[480px] z-10 py-6"
            >
                {/* Brand Header */}
                {!isEmbedded && (
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl shadow-2xl shadow-emerald-500/20 mb-5">
                            <Building2 className="text-white w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
                            vArogra <span className="text-emerald-600">Hospital</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">Administrative Command Center Portal</p>
                    </div>
                )}

                {/* ── Step Indicator (signup only) ── */}
                {!isLogin && (
                    <div className="flex items-center gap-2 mb-5 px-1">
                        {['form', 'otp', 'success'].map((s, i) => (
                            <React.Fragment key={s}>
                                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-black transition-all ${step === s ? 'bg-emerald-600 text-white shadow-lg' : ['form', 'otp', 'success'].indexOf(step) > i ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {['form', 'otp', 'success'].indexOf(step) > i ? '✓' : i + 1}
                                </div>
                                {i < 2 && <div className={`flex-1 h-0.5 rounded-full transition-all ${['form', 'otp', 'success'].indexOf(step) > i ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                            </React.Fragment>
                        ))}
                        <div className="ml-2 text-xs font-bold text-slate-500">
                            {step === 'form' ? 'Fill Details' : step === 'otp' ? 'Verify OTP' : 'Your Code'}
                        </div>
                    </div>
                )}

                {/* Tab Toggle (only on form step or login) */}
                {(step === 'form') && (
                    <div className="flex bg-slate-100 rounded-2xl p-1.5 mb-6">
                        <button onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
                            className={`flex-1 py-3 rounded-xl text-sm font-black tracking-wide transition-all ${isLogin ? 'bg-white text-emerald-700 shadow-md' : 'text-slate-500'}`}>
                            Login
                        </button>
                        <button onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
                            className={`flex-1 py-3 rounded-xl text-sm font-black tracking-wide transition-all ${!isLogin ? 'bg-white text-emerald-700 shadow-md' : 'text-slate-500'}`}>
                            Register Hospital
                        </button>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 rounded-[32px] p-8 shadow-2xl">

                    {/* Error / Success Banner */}
                    <AnimatePresence>
                        {errorMsg && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 text-sm font-medium py-3 px-4 rounded-2xl mb-5">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />{errorMsg}
                            </motion.div>
                        )}
                        {successMsg && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold py-3 px-4 rounded-2xl mb-5">
                                <CheckCircle2 size={16} className="shrink-0" />{successMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">

                        {/* ══ LOGIN ══ */}
                        {isLogin && step === 'form' && (
                            <motion.form key="login" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.3 }}
                                onSubmit={handleLogin} className="space-y-4">
                                <AuthInput icon={<Mail size={18} />} type="text" placeholder="Hospital Admin Email"
                                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                                <AuthInput icon={<Lock size={18} />} type={showPassword ? 'text' : 'password'} placeholder="Password"
                                    value={password} onChange={(e) => setPassword(e.target.value)} required
                                    rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
                                <button type="submit" disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Login to Dashboard'}
                                </button>
                            </motion.form>
                        )}

                        {/* ══ SIGNUP FORM ══ */}
                        {!isLogin && step === 'form' && (
                            <motion.form key="signup" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.3 }}
                                onSubmit={handleSignup} className="space-y-3">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Hospital Details</p>
                                <AuthInput icon={<Building2 size={18} />} type="text" placeholder="Hospital Name *"
                                    value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} required />

                                {/* Address with location button */}
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 z-10"><MapPin size={18} /></div>
                                    <input type="text" placeholder="Full Address *" value={address}
                                        onChange={(e) => setAddress(e.target.value)} required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-14 text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm" />
                                    <button type="button" onClick={detectLocation} disabled={isLocating} title="Auto-detect location"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all disabled:opacity-50 active:scale-90">
                                        {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                                    </button>
                                </div>
                                {address && <p className="text-[11px] text-emerald-600 font-bold pl-1 -mt-1 flex items-center gap-1"><CheckCircle2 size={11} /> Address detected</p>}

                                <AuthInput icon={<User size={18} />} type="text" placeholder="Admin / Director Name *"
                                    value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
                                <AuthInput icon={<Phone size={18} />} type="tel" placeholder="Contact Phone *"
                                    value={phone} onChange={(e) => setPhone(e.target.value)} required />
                                <AuthInput icon={<Building2 size={18} />} type="text" placeholder="License / Reg. No. (optional)"
                                    value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} />

                                <div className="pt-1">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Account Credentials</p>
                                    <div className="space-y-3">
                                        <AuthInput icon={<Mail size={18} />} type="email" placeholder="Admin Email *"
                                            value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                                        <AuthInput icon={<Lock size={18} />} type={showPassword ? 'text' : 'password'} placeholder="Create Password *"
                                            value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                                        <AuthInput icon={<Lock size={18} />} type={showPassword ? 'text' : 'password'} placeholder="Confirm Password *"
                                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                                            rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                                    {isLoading ? <><Loader2 className="animate-spin w-5 h-5" /> Creating Account...</> : <><ArrowRight size={18} /> Continue to Verify</>}
                                </button>
                                <p className="text-[11px] text-slate-400 text-center">An OTP will be sent to verify your email.</p>
                            </motion.form>
                        )}

                        {/* ══ OTP STEP ══ */}
                        {step === 'otp' && (
                            <motion.div key="otp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck size={32} className="text-emerald-600" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900">Verify Your Email</h2>
                                    <p className="text-sm text-slate-500 mt-2">
                                        An OTP has been sent to <strong className="text-slate-800">{regEmail}</strong>
                                    </p>
                                    {/* DEV only: show OTP on screen */}
                                    <div className="mt-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl inline-block">
                                        <p className="text-xs font-bold text-amber-700">Demo OTP: <span className="text-lg font-black tracking-widest">{generatedOtp}</span></p>
                                    </div>
                                </div>

                                {/* 6-box OTP input */}
                                <div className="flex gap-2 justify-center">
                                    {enteredOtp.map((digit, i) => (
                                        <input
                                            key={i}
                                            id={`otp-${i}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpInput(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className="w-12 h-14 text-center text-2xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                        />
                                    ))}
                                </div>

                                <button onClick={handleVerifyOtp} disabled={isLoading || enteredOtp.join('').length < 6}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isLoading ? <><Loader2 className="animate-spin w-5 h-5" /> Verifying...</> : <><ShieldCheck size={18} /> Verify OTP</>}
                                </button>
                                <button onClick={() => { setStep('form'); setEnteredOtp(['', '', '', '', '', '']); setGeneratedOtp(''); setErrorMsg(''); }}
                                    className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                                    ← Go back
                                </button>
                            </motion.div>
                        )}

                        {/* ══ SUCCESS STEP ══ */}
                        {step === 'success' && (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center">
                                <div>
                                    <motion.div
                                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                        className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
                                        <CheckCircle2 size={40} className="text-white" />
                                    </motion.div>
                                    <h2 className="text-2xl font-black text-slate-900">Registration Complete!</h2>
                                    <p className="text-sm text-slate-500 mt-2">Welcome to vArogra Hospital Network</p>
                                </div>

                                {/* Share ID Note */}
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
                                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Invite Your Doctors</p>
                                    <div className="flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-emerald-100">
                                        <span className="text-lg font-black text-slate-900 tracking-widest truncate">{pendingUid}</span>
                                        <button onClick={handleCopyCode}
                                            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95">
                                            {copied ? <><CheckCircle2 size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-2">
                                        Ask your doctors to select your hospital using this <b>Hospital Base ID</b> during registration.
                                    </p>
                                </div>

                                <button onClick={() => {
                                    localStorage.setItem('userRole', 'hospital');
                                    completeLogin({ uid: pendingUid, email: regEmail, role: 'hospital' });
                                    // Let the router handle navigation via AuthContext update, or fallback
                                    navigate('/hospital');
                                }}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                    <ArrowRight size={18} /> Go to Hospital Dashboard
                                </button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* Footer */}
                {step === 'form' && (
                    <div className="text-center mt-6">
                        <p className="text-slate-500 text-sm font-medium">
                            {isLogin ? "Don't have an account?" : 'Already registered?'}
                            <button onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }}
                                className="text-emerald-600 font-bold hover:text-emerald-500 transition-colors ml-2">
                                {isLogin ? 'Register Hospital' : 'Login'}
                            </button>
                        </p>
                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-4">
                            © 2026 vArogra Healthcare • HIPAA Compliant
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default HospitalLogin;
