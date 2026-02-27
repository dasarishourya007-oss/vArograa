import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Lock, User, Calendar as CalendarIcon,
    MapPin, ChevronDown, Loader2, ArrowLeft,
    ShieldCheck, Facebook, Twitter, Chrome, Apple
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const UnifiedAuth = () => {
    const navigate = useNavigate();
    const { loginPatient, registerPatient, loginSocial } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [signupData, setSignupData] = useState({
        name: '', email: '', password: '', address: '', age: '', birthDate: '', gender: 'Male'
    });

    useEffect(() => {
        if (signupData.birthDate) {
            const bDate = new Date(signupData.birthDate);
            const today = new Date();
            let age = today.getFullYear() - bDate.getFullYear();
            const m = today.getMonth() - bDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
            setSignupData(prev => ({ ...prev, age: age >= 0 ? age.toString() : '' }));
        }
    }, [signupData.birthDate]);

    const handleSocialLogin = async (provider) => {
        setErrorMsg('');
        setIsLoading(true);
        try {
            const result = await loginSocial(provider, 'patient');
            if (result.success) navigate('/dashboard/patient');
            else setErrorMsg(result.message || `${provider} login failed.`);
        } catch (err) {
            setErrorMsg("Social login failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuth = async (e) => {
        if (e) e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);
        try {
            let result;
            if (isLogin) {
                result = await loginPatient(email, password);
            } else {
                result = await registerPatient(signupData);
            }

            if (result.success) {
                navigate('/dashboard/patient');
            } else {
                setErrorMsg(result.message || (isLogin ? "Login failed" : "Registration failed"));
            }
        } catch (err) {
            setErrorMsg("Authentication error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans selection:bg-blue-500/30">
            {/* Background Glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 40%, #eff6ff 100%)' }}>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[440px] z-10"
            >
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl shadow-blue-500/20 mb-6 group cursor-pointer"
                    >
                        <ShieldCheck className="text-white w-9 h-9" />
                    </motion.div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">vArogra</h1>
                    <p className="text-slate-500 font-medium">
                        {isLogin ? "Enter your credentials to access the command center." : "Initialize your secure health protocol."}
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                    {/* Error Toast */}
                    <AnimatePresence>
                        {errorMsg && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-4 left-4 right-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold py-2 px-4 rounded-xl text-center backdrop-blur-md"
                            >
                                {errorMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {isLogin ? (
                            <motion.form
                                key="login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleAuth}
                                className="space-y-5 pt-4"
                            >
                                <AuthInput
                                    icon={<Mail size={18} />}
                                    type="email"
                                    placeholder="Authorized Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <AuthInput
                                    icon={<Lock size={18} />}
                                    type="password"
                                    placeholder="Security Code"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />

                                <div className="flex items-center justify-between text-xs px-1">
                                    <label className="flex items-center gap-2 text-slate-500 cursor-pointer hover:text-slate-700 transition-colors">
                                        <input type="checkbox" className="rounded border-slate-200 bg-slate-50 text-blue-600 focus:ring-blue-500/20" />
                                        Keep session active
                                    </label>
                                    <button type="button" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">Recover Access</button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Establish Secure Link"}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="signup"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleAuth}
                                className="space-y-4 pt-4"
                            >
                                <AuthInput
                                    icon={<User size={18} />}
                                    placeholder="Display Name"
                                    value={signupData.name}
                                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <AuthInput
                                        icon={<Mail size={16} />}
                                        type="email"
                                        placeholder="Email"
                                        value={signupData.email}
                                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                        required
                                    />
                                    <AuthInput
                                        icon={<Lock size={16} />}
                                        type="password"
                                        placeholder="Password"
                                        value={signupData.password}
                                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <AuthInput
                                        icon={<CalendarIcon size={18} />}
                                        placeholder="Birth Date"
                                        value={signupData.birthDate}
                                        readOnly
                                        onClick={() => setShowCalendar(!showCalendar)}
                                    />
                                    {showCalendar && (
                                        <div className="absolute top-full left-0 z-50 mt-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-2xl">
                                            <input
                                                type="date"
                                                className="bg-transparent text-slate-900 border-none outline-none h-10 w-40"
                                                onChange={(e) => {
                                                    setSignupData({ ...signupData, birthDate: e.target.value });
                                                    setShowCalendar(false);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <AuthInput
                                    icon={<MapPin size={18} />}
                                    placeholder="Operational Sector (Address)"
                                    value={signupData.address}
                                    onChange={(e) => setSignupData({ ...signupData, address: e.target.value })}
                                    required
                                />

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Initialize Identity"}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Social Auth */}
                    <div className="mt-8">
                        <div className="relative flex items-center justify-center mb-8">
                            <div className="h-px bg-slate-100 w-full absolute" />
                            <span className="bg-white px-4 text-[10px] font-black text-slate-400 tracking-widest uppercase z-10">Neural Login</span>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <SocialButton icon={<Chrome className="w-5 h-5" />} onClick={() => handleSocialLogin('google')} />
                            <SocialButton icon={<Facebook className="w-5 h-5" />} onClick={() => handleSocialLogin('facebook')} />
                            <SocialButton icon={<Twitter className="w-5 h-5" />} onClick={() => handleSocialLogin('x')} />
                            <SocialButton icon={<Apple className="w-5 h-5" />} onClick={() => handleSocialLogin('apple')} />
                        </div>
                    </div>
                </div>

                {/* Footer Switcher */}
                <div className="text-center mt-8">
                    <p className="text-slate-500 text-sm font-medium">
                        {isLogin ? "New to the grid?" : "Already verified?"}{' '}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
                            className="text-slate-900 font-bold hover:text-blue-600 transition-colors ml-1"
                        >
                            {isLogin ? "Request Access" : "Secure Sign In"}
                        </button>
                    </p>
                    <div className="mt-8 flex flex-col items-center gap-2">
                        <p className="text-[10px] font-black text-slate-600 tracking-[0.2em] uppercase">
                            © 2026 VAROGRA QUANTUM HEALTHCARE • ENCRYPTED SESSION
                        </p>
                        <div className="h-1 w-12 bg-blue-600/30 rounded-full" />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const AuthInput = ({ icon, ...props }) => (
    <div className="group relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            {icon}
        </div>
        <input
            {...props}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all hover:bg-slate-100/50"
        />
    </div>
);

const SocialButton = ({ icon, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.05)' }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex items-center justify-center h-14 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
    >
        {icon}
    </motion.button>
);

export default UnifiedAuth;
