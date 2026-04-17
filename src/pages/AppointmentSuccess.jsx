import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Calendar, CheckCircle2, Clock, MapPin, Share2, Download, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { subscribeToAppointment } from '../firebase/services';

const STATUS_VARIANTS = {
    pending: {
        icon: Clock,
        title: 'Appointment Pending',
        description: 'Your appointment request is awaiting approval from the hospital.',
        iconBg: 'bg-amber-100',
        iconText: 'text-amber-600',
        iconShadow: 'shadow-lg shadow-amber-200/60'
    },
    confirmed: {
        icon: CheckCircle2,
        title: 'Booking Confirmed',
        description: 'Your appointment is successfully scheduled. You will receive any updates from the hospital shortly.',
        iconBg: 'bg-success',
        iconText: 'text-white',
        iconShadow: 'shadow-lg shadow-success/30'
    },
    rejected: {
        icon: AlertTriangle,
        title: 'Appointment Rejected',
        description: 'The hospital declined this request. Please try a different slot or contact them for assistance.',
        iconBg: 'bg-rose-100',
        iconText: 'text-rose-600',
        iconShadow: 'shadow-lg shadow-rose-200/70'
    }
};

const getStatusVariantKey = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (['accepted', 'approved', 'confirmed'].includes(normalized)) return 'confirmed';
    if (normalized === 'rejected') return 'rejected';
    if (normalized === 'pending' || normalized === '') return 'pending';
    return 'confirmed';
};

const FlipCard = ({ current, label }) => {
    const [prev, setPrev] = useState(current);
    const [isFlipping, setIsFlipping] = useState(false);

    useEffect(() => {
        if (current !== prev) {
            setIsFlipping(true);
            const timer = setTimeout(() => {
                setPrev(current);
                setIsFlipping(false);
            }, 600); // matching transition duration
            return () => clearTimeout(timer);
        }
    }, [current, prev]);

    return (
        <div className="flex flex-col items-center">
            <div className="flip-card-container">
                {/* Top Half (Static - shows current value behind flipping card) */}
                <div className="flip-card-top">{current}</div>
                
                {/* Bottom Half (Static - shows previous value) */}
                <div className="flip-card-bottom">{prev}</div>
                
                {/* Top Half (Flipping - starts with prev, flips to current) */}
                <div className={`flip-card-top-flip ${isFlipping ? 'flipping' : ''}`}>
                    {prev}
                </div>
                
                {/* Bottom Half (Flipping - starts with current, revealed by top flip) */}
                <div className={`flip-card-bottom-flip ${isFlipping ? 'flipping' : ''}`}>
                    {current}
                </div>
            </div>
            <span className="text-[8px] font-bold opacity-40 tracking-[2px] mt-4 uppercase">{label}</span>
            <style dangerouslySetInnerHTML={{ __html: `
                .flip-card-container {
                    position: relative;
                    width: 90px;
                    height: 100px;
                    background: transparent;
                    perspective: 400px;
                }

                .flip-card-top, .flip-card-bottom, .flip-card-top-flip, .flip-card-bottom-flip {
                    position: absolute;
                    left: 0;
                    right: 0;
                    height: 50%;
                    background: #1e293b;
                    color: white;
                    font-size: 3rem;
                    font-weight: 900;
                    text-align: center;
                    overflow: hidden;
                    border-radius: 12px;
                    display: flex;
                    justify-content: center;
                    backface-visibility: hidden;
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
                }

                .flip-card-top, .flip-card-top-flip {
                    top: 0;
                    align-items: flex-end;
                    padding-bottom: 0px;
                    line-height: 0;
                    border-bottom-left-radius: 0;
                    border-bottom-right-radius: 0;
                    border-bottom: 1px solid rgba(0,0,0,0.2);
                }

                .flip-card-bottom, .flip-card-bottom-flip {
                    bottom: 0;
                    align-items: flex-start;
                    line-height: 1;
                    border-top-left-radius: 0;
                    border-top-right-radius: 0;
                }

                .flip-card-top-flip {
                    transform-origin: bottom;
                    z-index: 3;
                }

                .flip-card-top-flip.flipping {
                    animation: flip-top 0.6s ease-in forwards;
                }

                .flip-card-bottom-flip {
                    transform-origin: top;
                    transform: rotateX(90deg);
                    z-index: 2;
                }

                .flip-card-bottom-flip.flipping {
                    animation: flip-bottom 0.6s ease-out 0.3s forwards;
                }

                @keyframes flip-top {
                    0% { transform: rotateX(0deg); }
                    100% { transform: rotateX(-90deg); }
                }

                @keyframes flip-bottom {
                    0% { transform: rotateX(90deg); }
                    100% { transform: rotateX(0deg); }
                }
            `}} />
        </div>
    );
};

const AppointmentSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { appointment, notice } = location.state || {};
    const [liveAppointment, setLiveAppointment] = useState(appointment || null);
    const [timeLeft, setTimeLeft] = useState('');
    const [timeUnits, setTimeUnits] = useState({ h: '00', m: '00', s: '00' });
    const appointmentId = appointment?.id;

    useEffect(() => {
        setLiveAppointment(appointment || null);
    }, [appointment]);

    useEffect(() => {
        if (!appointmentId) return;
        const unsubscribe = subscribeToAppointment(appointmentId, (data) => {
            if (data) setLiveAppointment(data);
        });
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [appointmentId]);

    const appointmentRecord = liveAppointment || appointment;

    // Timer Logic for Offline Appointments
    useEffect(() => {
        if (!appointmentRecord || appointmentRecord.appointmentType === 'online') return;

        const parseAppointmentDateTime = (dateValue, timeValue) => {
            if (!dateValue) return null;
            try {
                const dateStr = String(dateValue).slice(0, 10);
                if (!timeValue) return new Date(`${dateStr}T00:00:00`);

                const timeParts = String(timeValue).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                if (!timeParts) return new Date(`${dateStr}T${String(timeValue)}`);

                let hour = Number(timeParts[1]);
                const minute = Number(timeParts[2]);
                const meridian = timeParts[3].toUpperCase();
                if (meridian === 'PM' && hour < 12) hour += 12;
                if (meridian === 'AM' && hour === 12) hour = 0;
                const parsed = new Date(`${dateStr}T00:00:00`);
                parsed.setHours(hour, minute, 0, 0);
                return parsed;
            } catch { return null; }
        };

        const targetDate = parseAppointmentDateTime(appointmentRecord.date, appointmentRecord.time);
        if (!targetDate) return;

        const interval = setInterval(() => {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeUnits({ h: '00', m: '00', s: '00' });
                setTimeLeft('Happening Now');
                clearInterval(interval);
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeUnits({
                h: String(h).padStart(2, '0'),
                m: String(m).padStart(2, '0'),
                s: String(s).padStart(2, '0')
            });
            setTimeLeft(`${h}h ${m}m ${s}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [appointmentRecord]);

    const statusKey = getStatusVariantKey(appointmentRecord?.status);
    const statusConfig = STATUS_VARIANTS[statusKey] || STATUS_VARIANTS.confirmed;
    const StatusIcon = statusConfig.icon;

    if (!appointmentRecord) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#fcfdfe]">
            <div className="bg-p-50 p-6 rounded-full mb-4">
                <Calendar size={40} className="text-p-600" />
            </div>
            <h2 className="text-xl font-black text-main mb-2">No Appointment Found</h2>
            <button onClick={() => navigate('/')} className="btn-primary px-8 py-3 rounded-2xl border-none">Back to Home</button>
        </div>
    );

    const isOffline = appointmentRecord.appointmentType !== 'online';

    return (
        <div className="container min-h-screen bg-[#fcfdfe] pb-10 flex flex-col items-center animate-entrance">
            {/* Celebration Header */}
            <div className="pt-20 pb-12 flex flex-col items-center text-center px-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    className={`w-24 h-24 rounded-full flex items-center justify-center   mb-6`}
                >
                    <StatusIcon size={48} strokeWidth={3} className={statusConfig.iconText} />
                </motion.div>
                <h1 className="text-3xl font-black text-main tracking-tight mb-2 uppercase">{statusConfig.title}</h1>
                <p className="text-sm font-bold text-muted opacity-70">{statusConfig.description}</p>
                {notice && statusKey === 'pending' && (
                    <p className="text-[11px] font-bold text-muted/70 uppercase tracking-[2px] mt-2">{notice}</p>
                )}
            </div>

            {/* Premium Flip Timer Section - ONLY FOR OFFLINE */}
            {isOffline && timeLeft && (
                <div className="w-full px-6 mb-8">
                    <div className="bg-[#0f172a] rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase tracking-[4px] text-center opacity-40 mb-10">Time Until Appointment</p>
                        
                        <div className="flex justify-center items-start gap-6 relative z-10 w-full">
                            <FlipCard current={timeUnits.h} label="Hours" />
                            <div className="mt-6 text-4xl font-black opacity-20">:</div>
                            <FlipCard current={timeUnits.m} label="Mins" />
                            <div className="mt-6 text-4xl font-black opacity-20">:</div>
                            <FlipCard current={timeUnits.s} label="Secs" />
                        </div>

                        {/* Animated background elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-p-600/10 rounded-full blur-[100px]" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-success/5 rounded-full blur-[100px]" />
                    </div>
                </div>
            )}

            {/* Premium Ticket Card */}
            <div className="w-full px-6 mb-12">
                <div className="relative glass p-8 rounded-[40px] shadow-2xl border-white/60 overflow-hidden">
                    {/* Ticket "Cuts" */}
                    <div className="absolute top-1/2 -left-4 w-8 h-8 rounded-full bg-[#fcfdfe] -translate-y-1/2 shadow-inner" />
                    <div className="absolute top-1/2 -right-4 w-8 h-8 rounded-full bg-[#fcfdfe] -translate-y-1/2 shadow-inner" />

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black tracking-[2px] text-p-600 uppercase">Hospital</span>
                            <h3 className="text-xl font-black text-main leading-tight">{appointmentRecord.hospitalName}</h3>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <MapPin size={12} className="text-muted" />
                                <span className="text-xs font-bold text-muted">A-602, Medical District</span>
                            </div>
                        </div>

                        <div className="w-full h-px border-b border-dashed border-border/60 my-2" />

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black tracking-[2px] text-p-600 uppercase">Doctor</span>
                                <p className="text-[15px] font-black text-main uppercase">{appointmentRecord.doctorName}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black tracking-[2px] text-p-600 uppercase">Token No.</span>
                                <p className="text-[24px] font-black text-p-600">#{appointmentRecord.token || '01'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black tracking-[2px] text-p-600 uppercase">Consulting Fee</span>
                                <p className="text-[15px] font-black text-main">â‚¹{appointmentRecord.consultingFee || '500'}</p>
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
                                    <Clock size={14} strokeWidth={2.5} /> {appointmentRecord.time}
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

