import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, MapPin, Clock, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { listenToSOSRequests } from '../../firebase/services';

export const SOSAlertPanel = () => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const unsub = listenToSOSRequests((data) => {
            setAlerts(data);
        });
        return () => unsub();
    }, []);

    if (alerts.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="text-rose-600 animate-pulse" size={24} />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active SOS Emergencies</h2>
            </div>
            <div className="flex flex-col gap-3">
                <AnimatePresence>
                    {alerts.map((alert) => (
                        <motion.div
                            key={alert.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="bg-rose-50 border border-rose-100 p-5 rounded-[24px] shadow-sm flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                                    <ShieldAlert size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-rose-900 uppercase">Emergency Request</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                                            <MapPin size={12} />
                                            {alert.location?.address || 'Location Shared'}
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                            <Clock size={12} />
                                            {new Date(alert.createdAt?.seconds * 1000).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="px-6 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-200 active:scale-95 transition-all">
                                ACCEPT & NOTIFY
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export const PatientTriageInsight = ({ triageData }) => {
    if (!triageData) return null;

    return (
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mt-4">
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-amber-500" size={16} />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">AI Pre-Consultation Insight</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
                {triageData.symptoms?.map((s, i) => (
                    <span key={i} className="text-[9px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-600 uppercase">
                        {s}
                    </span>
                ))}
            </div>
            <p className="text-[11px] font-bold text-slate-500 leading-snug">
                <span className="text-amber-600">Risk: {triageData.riskLevel.toUpperCase()}</span> • {triageData.aiResponse}
            </p>
        </div>
    );
};
