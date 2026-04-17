import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, CheckCircle, ArrowLeft, XCircle, RefreshCw, FileText } from 'lucide-react';

const AppointmentDetails = ({ appointment, onBack, onCancel }) => {
    return (
        <div className="fixed inset-0 z-[4000] bg-slate-50 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-black tracking-tight">Appointment Details</h1>
            </div>

            {/* Success Card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-emerald-600 rounded-[32px] p-8 text-white mb-8 text-center relative overflow-hidden"
            >
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight mb-1">Confirmed</h2>
                    <p className="text-emerald-100 font-bold text-sm tracking-wide">ID: {appointment?.appointmentId || 'APT456'}</p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </motion.div>

            {/* Details Section */}
            <div className="flex flex-col gap-6">
                {/* Entity Info */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-p-100 flex items-center justify-center text-p-600">
                            <User size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">{appointment?.doctor || 'Dr. Sharma'}</h3>
                            <p className="text-xs font-bold text-slate-500">General Physician • {appointment?.hospital || 'Apollo Hospital'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase text-slate-400">Date</span>
                            <div className="flex items-center gap-2 text-slate-900">
                                <Calendar size={14} className="text-blue-600" />
                                <span className="text-sm font-bold">Today, 22 Feb</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-right">
                            <span className="text-[10px] font-black uppercase text-slate-400">Time</span>
                            <div className="flex items-center gap-2 justify-end text-slate-900">
                                <Clock size={14} className="text-blue-600" />
                                <span className="text-sm font-bold">{appointment?.slot || '10:30 AM'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Column */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-1">Payment Status</h4>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700">
                                <ShieldCheck size={18} />
                            </div>
                            <span className="text-sm font-black text-emerald-800 uppercase tracking-tight">Success</span>
                        </div>
                        <span className="text-sm font-black text-emerald-800">Rs.500</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-col gap-4">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onCancel}
                    className="w-full h-16 rounded-[24px] bg-white text-rose-600 font-black text-lg border-2 border-slate-100 shadow-sm flex items-center justify-center gap-2"
                >
                    <XCircle size={20} />
                    CANCEL APPOINTMENT
                </motion.button>
                <div className="flex gap-4">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 h-14 rounded-[20px] bg-slate-900 text-white font-black text-sm flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} />
                        RESCHEDULE
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 h-14 rounded-[20px] bg-slate-900 text-white font-black text-sm flex items-center justify-center gap-2"
                    >
                        <FileText size={18} />
                        E-RECEIPT
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default AppointmentDetails;
