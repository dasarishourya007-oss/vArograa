import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import MapComponent from '../../components/MapComponent';
import {
    ArrowLeft, ShieldCheck, Phone, User, MapPin,
    Calendar as CalendarIcon, CheckCircle2, Search,
    Navigation, Loader2, ChevronLeft, ChevronRight, Lock, ChevronDown, Mail
} from 'lucide-react';
import { hospitals as mockHospitals } from '../../utils/mockData';

// --- Custom Components ---

const InputGroup = ({ icon, label, children, onClick, style }) => (
    <div onClick={onClick} className="flex flex-col gap-1.5" style={style}>
        {label && <label className="text-xs font-bold text-slate-500 ml-1">{label}</label>}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-emerald-500 focus-within:bg-white transition-all">
            {icon && <div className="text-emerald-500">{icon}</div>}
            {children}
        </div>
    </div>
);

// --- View Components ---

const CalendarPicker = ({ value, onChange, onClose }) => {
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
    const [view, setView] = useState('days'); // 'days' | 'months' | 'years'

    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    const handleDateSelect = (day) => {
        const newDate = new Date(currentYear, currentMonth, day);
        setSelectedDate(newDate);
        onChange(newDate.toISOString().split('T')[0]);
        onClose();
    };

    const handleMonthSelect = (mIndex) => {
        setViewDate(new Date(currentYear, mIndex, 1));
        setView('days');
    };

    const handleYearSelect = (y) => {
        setViewDate(new Date(y, currentMonth, 1));
        setView('days');
    };

    const renderDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentMonth, currentYear);
        const firstDay = firstDayOfMonth(currentMonth, currentYear);
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} style={{ width: '32px', height: '32px' }} />);
        for (let d = 1; d <= totalDays; d++) {
            const isSelected = selectedDate && selectedDate.getDate() === d && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear;
            days.push(
                <button key={d} onClick={() => handleDateSelect(d)} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isSelected ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-50 text-slate-700'}`}>
                    {d}
                </button>
            );
        }
        return <div className="grid grid-cols-7 gap-1 text-center mt-2">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-xs font-bold text-slate-400 h-6">{d}</div>)}{days}</div>;
    };

    const renderMonths = () => (
        <div className="grid grid-cols-3 gap-2 mt-2">
            {months.map((m, i) => (
                <button key={m} onClick={() => handleMonthSelect(i)} className={`p-2 rounded-lg text-sm font-semibold ${i === currentMonth ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
                    {m}
                </button>
            ))}
        </div>
    );

    const renderYears = () => {
        const years = [];
        for (let y = new Date().getFullYear(); y >= 1900; y--) years.push(y);
        return (
            <div className="grid grid-cols-4 gap-2 mt-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                {years.map(y => (
                    <button key={y} onClick={() => handleYearSelect(y)} className={`p-2 rounded-lg text-sm font-semibold ${y === currentYear ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
                        {y}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 w-72">
            <div className="flex justify-between items-center mb-2 bg-slate-50 p-2 rounded-xl">
                {view === 'days' && <button onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))} className="p-1 hover:bg-slate-200 rounded-full text-slate-500"><ChevronLeft size={16} /></button>}

                <div className="flex items-center gap-2 flex-1 justify-center">
                    <button onClick={() => setView('months')} className="flex items-center gap-1 font-bold text-slate-700 hover:text-blue-600 px-2 py-1 rounded transition-colors">
                        {months[currentMonth]} <ChevronDown size={14} className="opacity-50" />
                    </button>
                    <button onClick={() => setView('years')} className="flex items-center gap-1 font-bold text-slate-700 hover:text-blue-600 px-2 py-1 rounded transition-colors">
                        {currentYear} <ChevronDown size={14} className="opacity-50" />
                    </button>
                </div>

                {view === 'days' && <button onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))} className="p-1 hover:bg-slate-200 rounded-full text-slate-500"><ChevronRight size={16} /></button>}
            </div>

            {view === 'days' && renderDays()}
            {view === 'months' && renderMonths()}
            {view === 'years' && renderYears()}

            {view !== 'days' && (
                <button onClick={() => setView('days')} className="w-full mt-2 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg">
                    Back to Calendar
                </button>
            )}
        </div>
    );
};

// --- View Components (Moved Outside) ---

const LoginView = ({ email, setEmail, password, setPassword, onSubmit, onSwitch, errorMsg, isLoading }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="w-full max-w-[400px]"
    >
        <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-1.5 mb-6">
                <img src="/logo.png" alt="vArogra Logo" className="h-12 w-auto" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500 text-sm">Please enter your details to sign in</p>
        </div>

        {/* Social Buttons (Restored to Circles) */}
        <div className="flex justify-center gap-4 mb-8">
            <button
                onClick={() => onSubmit('google')}
                disabled={isLoading}
                className="w-14 h-14 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-blue-200 active:scale-95 transition-all bg-white group shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <img src="https://cdn.simpleicons.org/google" alt="Google" className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
            {['Apple', 'X'].map((p, i) => (
                <button
                    key={i}
                    onClick={() => onSubmit(p.toLowerCase())}
                    disabled={isLoading}
                    className="w-14 h-14 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-blue-200 active:scale-95 transition-all bg-white group shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <img src={`https://cdn.simpleicons.org/${p.toLowerCase()}`} alt={p} className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </button>
            ))}
        </div>

        <div className="relative flex items-center justify-center mb-8">
            <div className="h-px bg-slate-200 w-full absolute" />
            <span className="bg-slate-50 px-4 text-xs font-bold text-slate-400 uppercase z-10">OR</span>
        </div>

        <form onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
        }} className="flex flex-col gap-5">
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm">
                    <Mail size={18} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Email or 123"
                        className="bg-transparent border-none outline-none w-full font-semibold text-slate-800 placeholder:text-slate-300"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">Password</label>
                <div className="flex items-center gap-3 px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm">
                    <Lock size={18} className="text-slate-400" />
                    <input
                        type="password"
                        placeholder="••••••••"
                        className="bg-transparent border-none outline-none w-full font-semibold text-slate-800 placeholder:text-slate-300"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="flex items-center justify-between text-xs mt-[-4px]">
                <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    Remember me
                </label>
                <button type="button" className="font-bold text-slate-900 hover:underline">Forgot password?</button>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Signing in...
                    </>
                ) : (
                    'Sign in'
                )}
            </button>
        </form>

        <div className="text-center mt-8">
            {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                    {errorMsg}
                </div>
            )}
            <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <button onClick={onSwitch} className="font-bold text-slate-900 hover:underline">Sign up</button>
            </p>
        </div>
    </motion.div>
);

const SignUpView = ({ data, setData, onSubmit, onSwitch, showCalendar, setShowCalendar }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full px-2"
    >
        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-emerald-500 mb-2">Create Account</h2>
            <p className="text-slate-500 text-sm">Join vArogra for better healthcare</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <InputGroup icon={<User size={18} />} label="Full Name">
                <input name="name" placeholder="John Doe" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="bg-transparent outline-none w-full font-medium" required />
            </InputGroup>

            <div className="relative">
                <InputGroup icon={<CalendarIcon size={18} />} label="Birth Date" onClick={() => setShowCalendar(!showCalendar)} style={{ cursor: 'pointer' }}>
                    <div className={`font-medium ${!data.birthDate && 'text-slate-400'}`}>{data.birthDate || 'Select Date'}</div>
                </InputGroup>
                {showCalendar && <CalendarPicker value={data.birthDate} onChange={(d) => setData(prev => ({ ...prev, birthDate: d }))} onClose={() => setShowCalendar(false)} />}
            </div>

            <div className="flex gap-3">
                <InputGroup icon={<Mail size={18} />} label="Email Address" style={{ flex: 1.5 }}>
                    <input name="email" type="email" placeholder="john@example.com" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} className="bg-transparent outline-none w-full font-medium" required />
                </InputGroup>
                <InputGroup icon={<Lock size={18} />} label="Password" style={{ flex: 1 }}>
                    <input name="password" type="password" placeholder="••••••••" value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} className="bg-transparent outline-none w-full font-medium" required />
                </InputGroup>
            </div>

            <div className="flex gap-3">
                <InputGroup icon={<CalendarIcon size={18} />} label="Age" style={{ flex: 1, background: '#f1f5f9' }}>
                    <input name="age" value={data.age} readOnly className="bg-transparent outline-none w-full font-medium cursor-default text-slate-500" placeholder="--" />
                </InputGroup>
                <InputGroup label="Gender" style={{ flex: 1 }}>
                    <select name="gender" value={data.gender} onChange={(e) => setData({ ...data, gender: e.target.value })} className="bg-transparent outline-none w-full font-medium cursor-pointer">
                        <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                </InputGroup>
            </div>

            <InputGroup icon={<MapPin size={18} />} label="Address">
                <input name="address" placeholder="Area / City" value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} className="bg-transparent outline-none w-full font-medium" required />
            </InputGroup>

            <button type="submit" className="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] transition-all">
                Create Account
            </button>
        </form>

        <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <button onClick={onSwitch} className="font-bold text-emerald-600 hover:underline">Sign in</button>
            </p>
        </div>
    </motion.div>
);

const OtpView = ({ phone, otp, setOtp, otpRefs, onVerify, onBack }) => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Verify OTP</h2>
        <p className="text-sm text-slate-500 mb-8">
            Code sent to <span className="font-bold text-slate-800">+91 {phone}</span>
        </p>

        <div className="flex gap-3 mb-8">
            {otp.map((d, i) => (
                <input key={i} ref={el => otpRefs.current[i] = el} type="text" maxLength={1} value={d}
                    onChange={e => {
                        const val = e.target.value;
                        if (val.length > 1) return;
                        const newOtp = [...otp];
                        newOtp[i] = val;
                        setOtp(newOtp);
                        if (val && i < 5) otpRefs.current[i + 1].focus();
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1].focus();
                    }}
                    className="w-12 h-14 border-2 border-slate-200 rounded-xl text-center text-xl font-bold focus:border-emerald-500 focus:bg-white bg-slate-50 outline-none transition-all"
                />
            ))}
        </div>

        <button onClick={onVerify} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all">
            Verify & Continue
        </button>
        <button onClick={onBack} className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600">Back</button>
    </motion.div>
);

// --- Main Component ---

const PatientLogin = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const { loginPatient, loginSocial, registerPatient } = useAuth();
    const [isLoginView, setIsLoginView] = useState(true);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Login Form Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Signup Form Data
    const [signupData, setSignupData] = useState({
        name: '', email: '', password: '', address: '', age: '', birthDate: '', gender: 'Male'
    });

    const [showCalendar, setShowCalendar] = useState(false);

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

    const handleSignIn = async (socialProvider) => {
        setErrorMsg('');
        setIsLoading(true);

        try {
            let result;
            if (socialProvider && typeof socialProvider === 'string') {
                // Store intended role locally so AuthContext can use it immediately
                localStorage.setItem('userRole', 'patient');
                result = await loginSocial(socialProvider);
            } else {
                result = await loginPatient(email, password);
            }

            // REDIRECT IMMEDIATELY - result.success means Auth succeeded
            // Profile data will continue loading in the background
            if (result.success) {
                navigate('/dashboard/patient');
            } else {
                setErrorMsg(result.message || "Login failed.");
                setIsLoading(false); // Only stop loading if it failed
            }
        } catch (error) {
            setErrorMsg("An unexpected error occurred.");
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        if (e) e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);
        try {
            const result = await registerPatient(signupData);
            if (result.success) {
                navigate('/dashboard/patient');
            } else {
                setErrorMsg(result.message || 'Registration failed. Please try again.');
                setIsLoginView(false); // Stay on signup view
            }
        } catch (error) {
            setErrorMsg('An unexpected error occurred during registration.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={isEmbedded ? "" : "min-h-screen bg-slate-50 flex items-center justify-center p-4"}>
            <div className={isEmbedded ? "" : "bg-white rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] w-full max-w-[480px] p-8 relative overflow-hidden"}>
                <button onClick={() => navigate('/login')} className="absolute top-6 left-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors z-20">
                    <ArrowLeft size={20} />
                </button>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        isLoginView ? (
                            <LoginView
                                key="login"
                                email={email}
                                setEmail={setEmail}
                                password={password}
                                setPassword={setPassword}
                                onSubmit={handleSignIn}
                                onSwitch={() => setIsLoginView(false)}
                                errorMsg={errorMsg}
                                isLoading={isLoading}
                            />
                        ) : (
                            <SignUpView
                                key="signup"
                                data={signupData}
                                setData={setSignupData}
                                onSubmit={handleSignUp}
                                onSwitch={() => setIsLoginView(true)}
                                showCalendar={showCalendar}
                                setShowCalendar={setShowCalendar}
                            />
                        )
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    );
};

// (This section is now empty because components were moved up)

export default PatientLogin;
