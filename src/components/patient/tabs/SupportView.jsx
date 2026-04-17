import React from 'react';
import { 
    Mail, MessageSquare, Phone, HelpCircle, 
    AlertTriangle, ArrowLeft, ChevronRight,
    Headset, Play, ShieldAlert, Bot
} from 'lucide-react';
import { motion } from 'framer-motion';

const SupportView = ({ onBack, onVoiceAssistant }) => {
    const contactOptions = [
        { icon: Mail, label: 'Email Support', desc: 'support@varogra.com', color: 'text-blue-600', bg: 'bg-blue-50' },
        { icon: Phone, label: 'Call Helpdesk', desc: '+1 800 VAROGRA', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { icon: MessageSquare, label: 'Live Chat', desc: 'Typical reply: 2 mins', color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    const faqs = [
        "How do I book an appointment?",
        "Where can I find my medical reports?",
        "How to add an emergency contact?",
        "What is ABHA ID?"
    ];

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-6 flex items-center gap-4">
                <button onClick={onBack} className="p-2 rounded-xl bg-slate-50 text-slate-600 active:scale-90">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Help & Support</h1>
            </header>

            <div className="p-6 space-y-8">
                {/* SOS & AI Assistant Section */}
                <div className="flex gap-4">
                    <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 p-5 rounded-[32px] bg-rose-600 text-white shadow-xl shadow-rose-200 flex flex-col items-center gap-3"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                            <ShieldAlert size={28} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-center">Emergency SOS</span>
                    </motion.button>
                    
                    <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={onVoiceAssistant}
                        className="flex-1 p-5 rounded-[32px] bg-blue-600 text-white shadow-xl shadow-blue-200 flex flex-col items-center gap-3"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                            <Bot size={28} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-center">AI Assistant</span>
                    </motion.button>
                </div>

                {/* Direct Contact */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Connect with us</h3>
                    <div className="space-y-3">
                        {contactOptions.map((opt, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer">
                                <div className={`w-12 h-12 rounded-2xl ${opt.bg} ${opt.color} flex items-center justify-center`}>
                                    <opt.icon size={22} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-800">{opt.label}</p>
                                    <p className="text-[11px] font-bold text-slate-400">{opt.desc}</p>
                                </div>
                                <ChevronRight size={18} className="text-slate-300" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* FAQs */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Global FAQs</h3>
                        <button className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Expand All</button>
                    </div>
                    <div className="space-y-2">
                        {faqs.map((q, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-600 flex items-center justify-between active:scale-[0.99] transition-all">
                                <span>{q}</span>
                                <Plus size={16} className="text-slate-400" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Report Issue */}
                <button className="w-full p-5 rounded-[24px] bg-slate-900 text-white shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <AlertTriangle size={20} className="text-amber-400" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Report Application Bug</span>
                </button>
            </div>
        </div>
    );
};

const Plus = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14m-7-7v14"/>
    </svg>
);

export default SupportView;
