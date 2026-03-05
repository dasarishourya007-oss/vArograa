import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Heart, Activity, Thermometer, Droplets, History, ShieldAlert, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { createSOSRequest, updatePatientVitals, subscribeToVitals, logAITriageSession } from '../../firebase/services';

// --- AI SOS Emergency Button ---
export const AISOSButton = ({ patientId, hospitalId }) => {
    const [isTriggered, setIsTriggered] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [status, setStatus] = useState('idle'); // idle, counting, sending, sent

    useEffect(() => {
        let timer;
        if (status === 'counting' && countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (status === 'counting' && countdown === 0) {
            handleSOS();
        }
        return () => clearTimeout(timer);
    }, [status, countdown]);

    const handleSOS = async () => {
        setStatus('sending');
        try {
            // In a real app, use Geolocation API here
            const location = { lat: 12.9716, lng: 77.5946, address: "Current Location" };
            await createSOSRequest({
                patientId,
                hospitalId,
                location,
                type: 'AI_EMERGENCY'
            });
            setStatus('sent');
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error) {
            console.error("SOS Failed:", error);
            setStatus('idle');
        }
    };

    return (
        <div className="fixed bottom-24 right-5 z-50">
            <AnimatePresence>
                {status === 'counting' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        className="absolute bottom-20 right-0 bg-rose-600 text-white p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-2 min-w-[120px]"
                    >
                        <span className="text-xs font-bold uppercase tracking-widest">Triggering in</span>
                        <span className="text-4xl font-black">{countdown}</span>
                        <button
                            onClick={() => setStatus('idle')}
                            className="text-[10px] font-bold underline mt-1"
                        >
                            CANCEL
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => status === 'idle' && (setCountdown(3), setStatus('counting'))}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all ${status === 'sent' ? 'bg-emerald-500' : 'bg-rose-600 animate-pulse'
                    }`}
                style={{ border: '4px solid rgba(255,255,255,0.3)' }}
            >
                {status === 'sending' ? (
                    <Loader2 className="text-white animate-spin" size={32} />
                ) : status === 'sent' ? (
                    <CheckCircle2 className="text-white" size={32} />
                ) : (
                    <ShieldAlert className="text-white" size={32} />
                )}
            </motion.button>
        </div>
    );
};

// --- Vitals Monitoring Card ---
export const VitalsCard = ({ patientId }) => {
    const [vitals, setVitals] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!patientId) return;
        const unsub = subscribeToVitals(patientId, (data) => {
            setVitals(data[0] || null);
            setLoading(false);
        });
        return () => unsub();
    }, [patientId]);

    const VitalItem = ({ icon: Icon, label, value, unit, color }) => (
        <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex-1">
            <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
                <Icon size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
            <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-black text-slate-800">{value || '--'}</span>
                <span className="text-[9px] font-bold text-slate-400">{unit}</span>
            </div>
        </div>
    );

    return (
        <div className="glass p-5 rounded-[32px] border-slate-100 mb-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="text-blue-600" size={20} />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Vitals Monitoring</h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase">Live Sync</span>
            </div>

            <div className="flex gap-2">
                <VitalItem icon={Heart} label="BPM" value={vitals?.heartRate} unit="bpm" color="bg-rose-50" />
                <VitalItem icon={Activity} label="BP" value={vitals?.bloodPressure} unit="mmHg" color="bg-blue-50" />
                <VitalItem icon={Thermometer} label="Temp" value={vitals?.temperature} unit="°F" color="bg-orange-50" />
                <VitalItem icon={Droplets} label="SpO2" value={vitals?.oxygenLevel} unit="%" color="bg-cyan-50" />
            </div>
        </div>
    );
};

// --- AI Triage History ---
export const AITriageHistory = ({ logs = [] }) => {
    if (logs.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                <History className="text-p-600" size={20} />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">AI Health Insights</h3>
            </div>
            <div className="flex flex-col gap-3">
                {logs.slice(0, 3).map((log, idx) => (
                    <div key={idx} className="glass p-4 rounded-2xl border-slate-100 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.riskLevel === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase">{log.riskLevel} Risk Check</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(log.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300" />
                    </div>
                ))}
            </div>
        </div>
    );
};
