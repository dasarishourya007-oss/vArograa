import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Lock, Loader2, ArrowLeft,
    ShieldCheck, Facebook, Twitter, Chrome, Apple,
    Building2, MapPin, User, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HospitalLogin = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const { loginSocial, loginPatient } = useAuth(); // Reusing login logic where compatible

    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [email, setEmail] = useState('admin@healthlink.com');
    const [password, setPassword] = useState('password');

    const handleSocialLogin = async (provider) => {
        setErrorMsg('');
        setIsLoading(true);
        try {
            const result = await loginSocial(provider, 'hospital');
            if (result.success) {
                localStorage.setItem('userRole', 'hospital');
                navigate('/hospital');
            } else {
                setErrorMsg(result.message || `${provider} login failed.`);
            }
        } catch (err) {
            setErrorMsg("Social authentication failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = (e) => {
        if (e) e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        // Simulating medical grid authentication
        setTimeout(() => {
            if (email && password) {
                localStorage.setItem('userRole', 'hospital');
                navigate('/hospital');
            } else {
                setErrorMsg("Invalid coordinates. Connection refused.");
                setIsLoading(false);
            }
        }, 1500);
    };

    return (
        <div className={isEmbedded ? "" : "min-h-screen bg-white flex items-center justify-center p-4 font-sans selection:bg-emerald-500/30 overflow-hidden"}>
            {/* Background Glow */}
            {!isEmbedded && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 40%, #eff6ff 100%)' }}>
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/5 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-600/5 blur-[120px] rounded-full" />
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[460px] z-10"
            >
                {/* Brand Header */}
                {!isEmbedded && (
                    <div className="text-center mb-10">
                        <motion.button
                            onClick={() => navigate('/')}
                            whileHover={{ scale: 1.1 }}
                            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl shadow-2xl shadow-emerald-500/20 mb-6 group transition-all"
                        >
                            <Building2 className="text-white w-10 h-10" />
                        </motion.button>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-3">vArogra <span className="text-emerald-600">Hospital</span></h1>
                        <p className="text-slate-500 font-medium">Administrative Command Center Portal</p>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-2xl border border-slate-200 rounded-[40px] p-10 shadow-2xl relative">
                    <AnimatePresence>
                        {errorMsg && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-4 left-4 right-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold py-3 px-4 rounded-2xl text-center"
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
                                onSubmit={handleLogin}
                                className="space-y-6 pt-2"
                            >
                                <AuthInput
                                    icon={<Mail size={20} />}
                                    type="email"
                                    placeholder="Admin Email / ID"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <AuthInput
                                    icon={<Lock size={20} />}
                                    type="password"
                                    placeholder="Secure Protocol Key"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-emerald-900/40 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                                >
                                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Establish Secure Link"}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="signup"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4 pt-2"
                            >
                                <AuthInput icon={<Building2 size={18} />} placeholder="Hospital Entity Name" />
                                <AuthInput icon={<MapPin size={18} />} placeholder="Global Sector Coordinates" />
                                <AuthInput icon={<User size={18} />} placeholder="Chief Medical Admin" />
                                <AuthInput icon={<Phone size={18} />} placeholder="Emergency Sync Line" />

                                <button className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl hover:bg-slate-100 transition-all mt-4">
                                    Request Activation
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Social Auth */}
                    <div className="mt-12">
                        <div className="relative flex items-center justify-center mb-8">
                            <div className="h-px bg-slate-100 w-full absolute" />
                            <span className="bg-white px-4 text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase z-10">Multi-Factor Sync</span>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <SocialButton icon={<Chrome className="w-5 h-5" />} onClick={() => handleSocialLogin('google')} />
                            <SocialButton icon={<Facebook className="w-5 h-5" />} onClick={() => handleSocialLogin('facebook')} />
                            <SocialButton icon={<Twitter className="w-5 h-5" />} onClick={() => handleSocialLogin('x')} />
                            <SocialButton icon={<Apple className="w-5 h-5" />} onClick={() => handleSocialLogin('apple')} />
                        </div>
                    </div>
                </div>

                {/* Footer Footer */}
                <div className="text-center mt-10">
                    <p className="text-slate-500 text-sm font-medium">
                        {isLogin ? "Entity not registered?" : "Already synchronized?"}{' '}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
                            className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors ml-1"
                        >
                            {isLogin ? "Apply for License" : "Verify Credentials"}
                        </button>
                    </p>
                    <div className="mt-10 flex flex-col items-center gap-2">
                        <p className="text-[10px] font-black text-slate-600 tracking-[0.25em] uppercase">
                            © 2026 VAROGRA QUANTUM HEALTHCARE • BIOMETRIC ENCRYPTION
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const AuthInput = ({ icon, ...props }) => (
    <div className="group relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-all">
            {icon}
        </div>
        <input
            {...props}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/40 focus:bg-white transition-all"
        />
    </div>
);

const SocialButton = ({ icon, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.05)' }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex items-center justify-center h-16 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 hover:text-emerald-600 transition-all shadow-sm"
    >
        {icon}
    </motion.button>
);

export default HospitalLogin;
