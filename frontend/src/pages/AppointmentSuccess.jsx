import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, MapPin, Share2, Download, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const AppointmentSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { appointment } = location.state || {};

    if (!appointment) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#fcfdfe]">
            <div className="bg-p-50 p-6 rounded-full mb-4">
                <Calendar size={40} className="text-p-600" />
            </div>
            <h2 className="text-xl font-black text-main mb-2">No Appointment Found</h2>
            <button onClick={() => navigate('/')} className="btn-primary px-8 py-3 rounded-2xl border-none">Back to Home</button>
        </div>
    );

    return (
        <div className="container min-h-screen bg-[#fcfdfe] pb-10 flex flex-col items-center animate-entrance">
            {/* Celebration Header */}
            <div className="pt-20 pb-12 flex flex-col items-center text-center px-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    className="w-24 h-24 bg-success rounded-full flex items-center justify-center shadow-lg shadow-success/30 mb-6"
                >
                    <CheckCircle2 size={48} color="white" strokeWidth={3} />
                </motion.div>
                <h1 className="text-3xl font-black text-main tracking-tight mb-2 uppercase">Booking Confirmed</h1>
                <p className="text-sm font-bold text-muted opacity-70">Your appointment is successfully scheduled</p>
            </div>

            {/* Premium Ticket Card */}
            <div className="w-full px-6 mb-12">
                <div className="relative glass p-8 rounded-[40px] shadow-2xl border-white/60 overflow-hidden">
                    {/* Ticket "Cuts" */}
                    <div className="absolute top-1/2 -left-4 w-8 h-8 rounded-full bg-[#fcfdfe] -translate-y-1/2 shadow-inner" />
                    <div className="absolute top-1/2 -right-4 w-8 h-8 rounded-full bg-[#fcfdfe] -translate-y-1/2 shadow-inner" />

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black tracking-[2px] text-p-600 uppercase">Hospital</span>
                            <h3 className="text-xl font-black text-main leading-tight">{appointment.hospitalName}</h3>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <MapPin size={12} className="text-muted" />
                                <span className="text-xs font-bold text-muted">A-602, Medical District</span>
                            </div>
                        </div>

                        <div className="w-full h-px border-b border-dashed border-border/60 my-2" />

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black tracking-[2px] text-p-600 uppercase">Doctor</span>
                                <p className="text-[15px] font-black text-main uppercase">{appointment.doctorName}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black tracking-[2px] text-p-600 uppercase">Token No.</span>
                                <p className="text-[24px] font-black text-p-600">#{appointment.token || '01'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black tracking-[2px] text-p-600 uppercase">Consulting Fee</span>
                                <p className="text-[15px] font-black text-main">â‚¹{appointment.consultingFee || '500'}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black tracking-[2px] text-p-600 uppercase">Reminders</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                    <span className="text-[11px] font-bold text-success">Active (5m before)</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black tracking-[2px] text-p-600 uppercase">Date</span>
                                <p className="text-[15px] font-black text-main flex items-center gap-1.5">
                                    <Calendar size={14} strokeWidth={2.5} /> Today
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black tracking-[2px] text-p-600 uppercase">Time</span>
                                <p className="text-[15px] font-black text-main flex items-center gap-1.5">
                                    <Clock size={14} strokeWidth={2.5} /> {appointment.time}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Actions */}
                <div className="flex gap-4 mt-8">
                    <button className="flex-1 glass h-14 rounded-2xl flex items-center justify-center gap-2 font-black text-main text-xs border-none active:scale-95 transition-all">
                        <Share2 size={16} /> SHARE
                    </button>
                    <button className="flex-1 glass h-14 rounded-2xl flex items-center justify-center gap-2 font-black text-main text-xs border-none active:scale-95 transition-all">
                        <Download size={16} /> DOWNLOAD
                    </button>
                </div>
            </div>

            {/* Primary Back to Home */}
            <div className="w-full px-6 mt-auto">
                <button
                    onClick={() => navigate('/')}
                    className="w-full btn-primary h-16 rounded-[24px] flex items-center justify-center gap-3 font-black text-lg tracking-tight border-none active:scale-95 transition-all shadow-xl"
                >
                    <Home size={22} strokeWidth={2.5} /> Back to Home
                </button>
                <button
                    onClick={() => navigate('/dashboard/patient?tab=appointments')}
                    className="w-full mt-4 h-10 bg-transparent border-none font-bold text-p-600 text-sm active:opacity-60 transition-all"
                >
                    View My Appointments
                </button>
            </div>
        </div>
    );
};

export default AppointmentSuccess;

