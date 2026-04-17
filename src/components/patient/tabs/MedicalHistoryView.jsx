import React, { useState } from 'react';
import { 
    Activity, History, Thermometer, ShieldCheck, 
    Plus, ArrowLeft, Clock, FileText, Share2,
    Calendar, AlertCircle, Pill, ChevronRight,
    Camera, Download, CheckCircle2, ClipboardList, Printer, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToPrescriptions, updatePrescriptionStatus } from '../../../firebase/services';
import OfficialPrescriptionReport from '../../shared/OfficialPrescriptionReport';

const MedicalHistoryView = ({ user, onBack }) => {
    const [activeSection, setActiveSection] = useState('prescriptions'); // 'timeline' | 'prescriptions' | 'conditions' | 'lifelog'
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedRx, setSelectedRx] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        if (!user?.uid) return;
        const unsub = subscribeToPrescriptions(user.uid, (list) => {
            setPrescriptions(list);
            setIsLoading(false);
        });
        return () => unsub();
    }, [user?.uid]);

    const handleOpenRx = (rx) => {
        setSelectedRx(rx);
        if (rx.status !== 'viewed') {
            updatePrescriptionStatus(rx.id, 'viewed');
        }
    };

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Premium Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-6">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={onBack} className="p-2 rounded-xl bg-slate-50 text-slate-600 active:scale-90">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Medical History</h1>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['Prescriptions', 'Timeline', 'Conditions', 'LifeLog'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveSection(tab.toLowerCase())}
                            className={`flex-shrink-0 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${activeSection === tab.toLowerCase()
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            <div className="p-6">
                <AnimatePresence mode="wait">
                    {activeSection === 'prescriptions' && (
                        <motion.div
                            key="prescriptions"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-4"
                        >
                            <div className="p-5 rounded-[32px] bg-blue-600 text-white shadow-xl shadow-blue-200 mb-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">Smart Prescription System</h3>
                                <p className="text-lg font-black leading-tight">Your medical history is now synced in real-time with your specialists.</p>
                            </div>

                            {isLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                                    <Activity className="animate-spin mb-4" size={32} />
                                    <p className="text-xs font-bold uppercase tracking-widest">Loading Clinical Records...</p>
                                </div>
                            ) : prescriptions.length > 0 ? (
                                prescriptions.map((rx, i) => (
                                    <motion.div
                                        key={rx.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => handleOpenRx(rx)}
                                        className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm active:scale-[0.98] transition-all group relative overflow-hidden"
                                    >
                                        {rx.status !== 'viewed' && (
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600 text-white flex items-center justify-center rotate-45 translate-x-8 -translate-y-8 shadow-lg">
                                                <Plus size={14} className="-rotate-45 mt-4" />
                                            </div>
                                        )}
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${rx.status === 'viewed' ? 'bg-slate-50 text-slate-400' : 'bg-blue-50 text-blue-600 shadow-sm'}`}>
                                                <FileText size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rx.date}</span>
                                                    {rx.status === 'viewed' && (
                                                        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                                            <CheckCircle2 size={10} /> Viewed
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-[16px] font-black text-slate-800 tracking-tight leading-tight">{rx.diagnosis}</h4>
                                                <p className="text-[11px] font-bold text-slate-400 mt-1">Dr. {rx.doctorName || 'Specialist'}</p>
                                                
                                                <div className="mt-4 flex flex-wrap gap-1.5">
                                                    {rx.medicines.slice(0, 3).map((m, idx) => (
                                                        <span key={idx} className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600">
                                                            {m.name}
                                                        </span>
                                                    ))}
                                                    {rx.medicines.length > 3 && (
                                                        <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400">
                                                            +{rx.medicines.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center opacity-30 text-center px-10">
                                    <ClipboardList size={48} className="mb-4" />
                                    <p className="font-bold text-sm">No digital prescriptions found.</p>
                                    <p className="text-xs mt-1">Directly receive prescriptions from your verified hospitals.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeSection === 'timeline' && (
                        <motion.div
                            key="timeline"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-6"
                        >
                            {/* Summary Card */}
                            <div className="p-5 rounded-[32px] bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100/50 shadow-sm mb-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                        <Activity size={20} />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Health Summary</h3>
                                </div>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                    Your health profile is 85% complete. Adding your surgical history would improve AI accuracy by 12%.
                                </p>
                            </div>

                            {/* Timeline Items */}
                            <div className="relative pl-6 space-y-8 border-l-2 border-slate-100 ml-3">
                                <TimelineItem 
                                    date="Oct 12, 2025" 
                                    title="Consultation: Fever & Cough" 
                                    subtitle="Dr. Sharma • Apollo Hub" 
                                    type="checkup" 
                                    icon={Thermometer}
                                />
                                <TimelineItem 
                                    date="Aug 05, 2025" 
                                    title="Vaccination: Influenza" 
                                    subtitle="City Health Center" 
                                    type="vaccine" 
                                    icon={ShieldCheck}
                                />
                                <TimelineItem 
                                    date="Jun 20, 2025" 
                                    title="Pharmacy Order: BP Meds" 
                                    subtitle="MedPlus Pharmacy" 
                                    type="order" 
                                    icon={Pill}
                                />
                                <TimelineItem 
                                    date="Jan 15, 2025" 
                                    title="Surgical: Appendix Removal" 
                                    subtitle="Global Hospital" 
                                    type="surgery" 
                                    icon={History}
                                    isMajor
                                />
                            </div>
                        </motion.div>
                    )}

                    {activeSection === 'conditions' && (
                        <motion.div
                            key="conditions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <QuickStats />
                            
                            <ConditionSection title="Past Illnesses" items={['Type 2 Diabetes', 'Hypertension']} icon={AlertCircle} />
                            <ConditionSection title="Allergies" items={['Penicillin', 'Peanuts']} icon={AlertCircle} color="text-amber-500" />
                            <ConditionSection title="Current Medications" items={['Metformin 500mg (Daily)', 'Telmisartan 40mg (Daily)']} icon={Pill} />
                        </motion.div>
                    )}
                </AnimatePresence>                {/* RX Detail Modal */}
                <AnimatePresence>
                    {selectedRx && (
                        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRx(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                            <motion.div 
                                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
                                className="relative w-full max-w-2xl bg-white rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
                            >
                                <OfficialPrescriptionReport rx={selectedRx} onClose={() => setSelectedRx(null)} />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const TimelineItem = ({ date, title, subtitle, icon: Icon, isMajor }) => (
    <div className="relative">
        <div className={`absolute -left-[35px] top-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm text-white ${isMajor ? 'bg-indigo-600' : 'bg-blue-500'}`}>
            <Icon size={16} />
        </div>
        <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{date}</span>
            <div className="mt-1 p-4 rounded-3xl bg-white border border-slate-100 shadow-sm active:scale-[0.98] transition-all group">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="text-[15px] font-black text-slate-800 tracking-tight">{title}</h4>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">{subtitle}</p>
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <FileText size={12} /> View Report
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Share2 size={12} /> Share
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const QuickStats = () => (
    <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-[28px] bg-rose-50 border border-rose-100">
            <Activity className="text-rose-500 mb-2" size={20} />
            <p className="text-2xl font-black text-slate-800 tracking-tighter">120/80</p>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Avg Blood Pressure</p>
        </div>
        <div className="p-4 rounded-[28px] bg-blue-50 border border-blue-100">
            <Droplets className="text-blue-500 mb-2" size={20} />
            <p className="text-2xl font-black text-slate-800 tracking-tighter">Ab+</p>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Blood Type</p>
        </div>
    </div>
);

const ConditionSection = ({ title, items, icon: Icon, color = "text-blue-500" }) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
            <Icon size={16} className={color} />
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h4>
        </div>
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                    <ChevronRight size={16} className="text-slate-300" />
                </div>
            ))}
            <button className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:border-blue-200 hover:text-blue-500 transition-all">
                + Add {title}
            </button>
        </div>
    </div>
);

const Droplets = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M7 16.3c2.2 0 4-1.8 4-4 0-3.3-4.5-8-4.5-8s-4.5 4.7-4.5 8c0 2.2 1.8 4 4 4Z"/>
        <path d="M17 19c2.2 0 4-1.8 4-4 0-3.3-4.5-8-4.5-8s-4.5 4.7-4.5 8c0 2.2 1.8 4 4 4Z"/>
    </svg>
);

export default MedicalHistoryView;
