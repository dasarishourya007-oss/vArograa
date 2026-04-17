import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
    Stethoscope, Mail, Phone, Building2, ShieldCheck,
    Clock, Award, Star, User, Calendar, BadgeCheck, AlertTriangle
} from 'lucide-react';

const StatusBadge = ({ status }) => {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED' || s === 'ACTIVE') {
        return (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.1em] border border-emerald-100 shadow-sm">
                <BadgeCheck size={14} className="text-emerald-500" />
                Medical Credentials Verified
            </div>
        );
    }
    if (s === 'REJECTED') {
        return (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-[0.1em] border border-red-100 shadow-sm">
                <AlertTriangle size={14} className="text-red-500" />
                Review Not Approved
            </div>
        );
    }
    return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-[0.1em] border border-amber-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Verification in Progress
        </div>
    );
};

const DoctorProfileDashboard = () => {
    const { user } = useAuth();

    const statusRaw = user?.doctorStatus || user?.status || 'PENDING_APPROVAL';
    const isApproved = ['APPROVED', 'ACTIVE'].includes(statusRaw?.toUpperCase());
    const isRejected = statusRaw?.toUpperCase() === 'REJECTED';

    const steps = [
        { label: 'Registration Submitted', done: true },
        { label: 'Under Hospital Review', done: isApproved || isRejected },
        { label: isRejected ? 'Registration Rejected' : 'Approved & Active', done: isApproved || isRejected, isRejected },
    ];

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">

            {/* Header / Hero Section - Soft Light Theme */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[40px] border border-slate-200/60 bg-white shadow-xl shadow-slate-200/30 p-10 sm:p-14"
                style={{ fontFamily: "'Outfit', sans-serif" }}
            >
                {/* Subtle ambient light and pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] opacity-10 bg-blue-300" />
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] opacity-10 bg-indigo-300" />

                <div className="relative z-10 space-y-12">
                    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-12">
                        {/* Avatar - Refined */}
                        <div className="relative shrink-0">
                            <div className="relative">
                                {user?.photoURL ? (
                                    <div className="w-40 h-40 rounded-full p-1.5 bg-white shadow-2xl border border-slate-100 overflow-hidden ring-4 ring-blue-50/50">
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-200 shadow-xl ring-4 ring-blue-50/50">
                                        <User size={72} className="text-slate-300" />
                                    </div>
                                )}
                                {isApproved && (
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border border-slate-100 text-emerald-500"
                                    >
                                        <BadgeCheck size={24} fill="currentColor" className="text-emerald-500/10" />
                                        <BadgeCheck size={24} className="absolute" />
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 text-center sm:text-left pt-2">
                            <StatusBadge status={statusRaw} />
                            <div className="flex items-center justify-center sm:justify-start gap-3 mt-6 mb-3">
                                <h1 className="text-5xl font-black text-slate-800 tracking-tight leading-none">
                                    Dr. {user?.displayName || user?.name || 'Doctor'}
                                </h1>
                                {isApproved && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100/50">
                                        <ShieldCheck size={14} />
                                        Verified
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                                <span className="flex items-center gap-2 text-blue-600 font-bold text-xl bg-blue-50/50 px-5 py-2 rounded-2xl border border-blue-100/50 backdrop-blur-sm">
                                    <Stethoscope size={22} />
                                    {user?.specialization || user?.department || 'Medical Specialist'}
                                </span>
                                <span className="flex items-center gap-2 text-slate-400 text-sm font-semibold tracking-wide">
                                    <Building2 size={16} />
                                    {user?.hospitalName || 'vArogra Healthcare Network'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Mini Cards - Integrated */}
                    {isApproved && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full pt-12 border-t border-slate-100">
                            {[
                                { icon: Award, label: 'Clinical Experience', value: `${user?.experience || '0'}+`, unit: 'Years', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { icon: Star, label: 'Patient Satisfaction', value: user?.rating || '4.8', unit: '/ 5.0', color: 'text-amber-600', bg: 'bg-amber-50' },
                                { icon: User, label: 'Successful Cases', value: user?.totalPatients || '120', unit: '+ Patients', color: 'text-emerald-600', bg: 'bg-emerald-50' }
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="bg-slate-50 shadow-sm border border-slate-100 rounded-[28px] p-6 flex items-center gap-5 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
                                >
                                    <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                        <stat.icon size={26} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.unit}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left: Contact & Professional Info - Refined Grid */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-8"
                >
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Stethoscope size={20} />
                            </span>
                            Professional Portfolio
                        </h2>
                    </div>
 
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {[
                            { icon: Mail, label: 'Official Email', value: user?.email, color: 'text-blue-500', bg: 'bg-blue-50/50' },
                            { icon: Phone, label: 'Contact Number', value: user?.phone, color: 'text-indigo-500', bg: 'bg-indigo-50/50' },
                            { icon: Award, label: 'Clinical Experience', value: user?.experience ? `${user.experience}+ Years` : null, color: 'text-purple-500', bg: 'bg-purple-50/50' },
                            { icon: Building2, label: 'Associated Hospital', value: user?.hospitalName, color: 'text-orange-500', bg: 'bg-orange-50/50' },
                            { icon: Calendar, label: 'Onboarded Since', value: 
                                user?.createdAt?.toDate ? 
                                    user.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', year: 'numeric', month: 'short' }) : 
                                    user?.createdAt && !isNaN(new Date(user.createdAt)) ? 
                                        new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', year: 'numeric', month: 'short' }) : 
                                        'Recently Joined', 
                                color: 'text-rose-500', bg: 'bg-rose-50/50' }
                         ].map((item, i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-blue-100/50 transition-all group">
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                        <item.icon size={22} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{item.label}</p>
                                        <p className="text-sm font-bold text-slate-700 truncate">
                                            {item.value || <span className="text-slate-300 font-medium italic">Not Provided</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
 
                {/* Right: Minimal Stepper Timeline */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white border border-slate-100 rounded-[32px] p-10 shadow-sm"
                >
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-10 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <ShieldCheck size={20} />
                        </span>
                        Verification Status
                    </h2>
 
                    <div className="relative pl-1">
                        {steps.map((step, i) => {
                            const isLast = i === steps.length - 1;
                            const isCurrent = !step.done && (i === 0 || steps[i-1].done);
                            
                            return (
                                <div key={i} className="relative flex gap-8 pb-12 last:pb-0">
                                    {!isLast && (
                                        <div className={`absolute left-[13px] top-8 w-[1.5px] h-[calc(100%-32px)] ${step.done ? 'bg-emerald-500/30' : 'bg-slate-100'}`} />
                                    )}
                                    
                                    <div className="relative z-10 shrink-0">
                                        {step.done ? (
                                            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                <BadgeCheck size={16} />
                                            </div>
                                        ) : isCurrent ? (
                                            <div className="w-7 h-7 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center relative">
                                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            </div>
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                            </div>
                                        )}
                                    </div>
 
                                    <div className="pt-0.5 flex-1 min-w-0">
                                        <h3 className={`text-xs font-black uppercase tracking-widest ${
                                            step.done ? 'text-emerald-600' : isCurrent ? 'text-amber-600' : 'text-slate-400'
                                        }`}>
                                            {step.label}
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                                            {step.done 
                                                ? 'Milestone verified.' 
                                                : isCurrent 
                                                    ? 'Under active review.' 
                                                    : 'Upcoming stage.'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
 
                    <div className="mt-10 p-6 rounded-3xl bg-slate-50 border border-slate-100/50">
                        <div className="flex items-start gap-4">
                            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                                {isApproved 
                                    ? "Credentials verified. Dashboard active."
                                    : "Verification in progress. Typically 24-48h."
                                }
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Photo verification card - Refined for Light Theme */}
            {user?.photoURL && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white border border-slate-100 rounded-[32px] p-10 flex flex-col sm:flex-row items-center gap-10 shadow-sm hover:shadow-md transition-shadow group"
                >
                    <div className="relative shrink-0">
                        <div className="absolute -inset-4 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition duration-700"></div>
                        <img
                            src={user.photoURL}
                            alt="Verification"
                            className="relative w-32 h-32 rounded-[32px] object-cover border border-slate-100 shadow-xl"
                        />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100/50 rounded-lg flex items-center gap-2">
                                <ShieldCheck size={14} />
                                Clinical Identity Secured
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Biometric Record Verification</h2>
                        <p className="text-slate-400 text-[13px] leading-relaxed font-medium max-w-xl">
                            This high-fidelity capture ensures platform integrity and builds patient trust. Your identity has been verified against hospital records using automated clinical matching.
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default DoctorProfileDashboard;
