import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, CheckCircle, Loader2, Send } from 'lucide-react';

const FeedbackModal = ({ isOpen, onClose, appointment, onSave }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSaving(true);
        try {
            await onSave(appointment.id, { rating, feedback, createdAt: new Date().toISOString() });
            setIsDone(true);
            setTimeout(() => {
                onClose();
                setIsDone(false);
            }, 3000);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                />
                
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl border border-white overflow-hidden"
                >
                    {isDone ? (
                        <div className="flex flex-col items-center py-6 text-center">
                            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                                <CheckCircle size={40} className="text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Thank you!</h3>
                            <p className="text-sm font-bold text-slate-500">Your feedback helps us improve the consultation experience for everyone.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Consultation Feedback</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Rate your experience</p>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-xl bg-slate-50 text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm">
                                    <img src={appointment?.image || "https://images.unsplash.com/photo-1559839734-2b71f1536785?auto=format&fit=crop&q=80&w=100"} alt="Doc" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800 tracking-tight">Dr. {appointment?.doctorName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{appointment?.specialty || 'General Hub'}</p>
                                </div>
                            </div>

                            <div className="flex justify-center gap-2 mb-8">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(0)}
                                        onClick={() => setRating(star)}
                                        className="transition-transform active:scale-95"
                                    >
                                        <Star 
                                            size={40} 
                                            className={`${(hover || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} transition-colors`} 
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea 
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Any thoughts on the consultation?"
                                className="w-full p-5 rounded-3xl bg-slate-50 border border-slate-100 font-bold text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all h-28 mb-6 resize-none"
                            />

                            <button 
                                onClick={handleSubmit}
                                disabled={rating === 0 || isSaving}
                                className="w-full py-4 rounded-[20px] bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                                {isSaving ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FeedbackModal;
