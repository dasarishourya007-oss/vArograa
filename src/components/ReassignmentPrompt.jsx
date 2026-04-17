import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, UserCheck, X, ChevronRight, Star } from 'lucide-react';

const ReassignmentPrompt = ({
    isOpen,
    onClose,
    onAccept,
    alternativeDoctor,
    originalDoctorName
}) => {
    if (!alternativeDoctor) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-[420px] bg-white rounded-[40px] p-8 relative shadow-2xl"
                    >
                        {/* Status Badge */}
                        <div className="flex justify-center mb-6">
                            <div className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full flex items-center gap-2 border border-amber-100">
                                <AlertCircle size={14} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-wider">Slot Unavailable</span>
                            </div>
                        </div>

                        {/* Heading */}
                        <h2 className="text-2xl font-black text-main text-center leading-tight mb-2 tracking-tight">
                            Doctor Reassignment
                        </h2>
                        <p className="text-sm font-bold text-muted text-center mb-8 px-4 opacity-70">
                            Dr. {originalDoctorName} is no longer available at this time. We found another highly-rated specialist for you.
                        </p>

                        {/* Replacement Card */}
                        <div className="bg-slate-50 rounded-[32px] p-6 mb-8 border border-slate-100">
                            <div className="flex items-center gap-4">
                                <img 
                                    src={alternativeDoctor.image || 'https://via.placeholder.com/150'} 
                                    alt={alternativeDoctor.name} 
                                    className="w-16 h-16 rounded-2xl object-cover shadow-sm" 
                                />
                                <div className="flex-1">
                                    <h4 className="text-lg font-black text-main leading-none mb-1">
                                        {alternativeDoctor.name}
                                    </h4>
                                    <p className="text-[10px] font-black text-p-600 uppercase tracking-widest mb-2">
                                        {alternativeDoctor.specialization || alternativeDoctor.specialty}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-orange-500 font-black text-xs">
                                            <Star size={12} fill="currentColor" />
                                            {alternativeDoctor.rating || '4.8'}
                                        </div>
                                        <div className="text-[10px] font-bold text-muted bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                            Available Now
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => onAccept(alternativeDoctor)}
                                className="w-full bg-p-600 text-white h-14 rounded-2xl flex items-center justify-center gap-2 font-black tracking-tight active:scale-95 transition-all text-sm border-none cursor-pointer shadow-lg shadow-p-600/20"
                            >
                                <UserCheck size={18} strokeWidth={2.5} />
                                Accept & Book Now
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full bg-white text-muted h-14 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all text-sm border-2 border-slate-100 cursor-pointer"
                            >
                                Choose Another Slot
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReassignmentPrompt;
