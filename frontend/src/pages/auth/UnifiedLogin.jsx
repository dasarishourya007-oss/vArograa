import React, { useState } from 'react';
import PatientLogin from './PatientLogin';
import MedicalStoreLogin from './MedicalStoreLogin';
import HospitalLogin from './HospitalLogin';
import { motion, AnimatePresence } from 'framer-motion';

const UnifiedLogin = () => {
    const [role, setRole] = useState('patient'); // 'patient' | 'pharmacy' | 'hospital'

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-4">
            {/* Unified Toggle Container */}
            <div className="w-full max-w-[540px] mb-6 bg-white p-2 rounded-[24px] shadow-sm flex border border-slate-100">
                <button
                    onClick={() => setRole('patient')}
                    className={`flex-1 py-4 rounded-2xl text-xs sm:text-sm font-bold transition-all ${role === 'patient' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Patient
                </button>
                <button
                    onClick={() => setRole('hospital')}
                    className={`flex-1 py-4 rounded-2xl text-xs sm:text-sm font-bold transition-all ${role === 'hospital' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Hospital
                </button>
                <button
                    onClick={() => setRole('pharmacy')}
                    className={`flex-1 py-4 rounded-2xl text-xs sm:text-sm font-bold transition-all ${role === 'pharmacy' ? 'bg-teal-600 text-white shadow-lg shadow-teal-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Pharmacy
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={role}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="w-full"
                >
                    {role === 'patient' ? <PatientLogin isEmbedded={true} /> :
                        role === 'hospital' ? <HospitalLogin isEmbedded={true} /> :
                            <MedicalStoreLogin isEmbedded={true} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default UnifiedLogin;
