import React from 'react';
import { 
    Printer, Share2, Download, CheckCircle2, 
    FileText, ShieldCheck, Activity, Pill,
    ChevronDown, MapPin, Phone
} from 'lucide-react';
import { motion } from 'framer-motion';

const OfficialPrescriptionReport = ({ rx, onClose, isDashboardView = false }) => {
    if (!rx) return null;

    const handleShare = async () => {
        const shareData = {
            title: `Prescription: ${rx.diagnosis}`,
            text: `Medical Report for ${rx.patientName} - Issued on ${rx.date}`,
            url: window.location.href // In a real app, this would be a unique link
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`, '_blank');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    return (
        <div className={`bg-white ${isDashboardView ? 'rounded-[28px] border border-slate-100 shadow-sm overflow-hidden' : 'w-full max-w-2xl mx-auto rounded-[32px] overflow-hidden'}`}>
            {/* Paper Header (Official Hospital Branding) */}
            <div className="p-8 pb-6 border-b border-slate-100 relative overflow-hidden bg-slate-50/50">
                {/* Dim vArogra Watermark */}
                <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12 pointer-events-none">
                    <Activity size={240} />
                </div>

                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-1">
                            {rx.hospitalName || "JAGNYASENI HOSPITAL"}
                        </h1>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">O.P.D. TICKET & CLINICAL SUMMARY</p>
                        <div className="flex items-center gap-4 mt-4 text-[11px] font-bold text-slate-500">
                            <span className="flex items-center gap-1"><MapPin size={12} /> BEHERAMAL, JHARSUGUDA</span>
                            <span className="flex items-center gap-1"><Phone size={12} /> +91 99381XXXXX</span>
                        </div>
                    </div>
                    {!isDashboardView && onClose && (
                        <button onClick={onClose} className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400">
                            <ChevronDown size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Patient & Clinic Metadata Section */}
            <div className="px-8 py-6 bg-white grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-slate-50">
                <MetadataBox label="PATIENT ID" value={rx.patientId?.slice(-8).toUpperCase() || "N/A"} />
                <MetadataBox label="DATE" value={rx.date} />
                <MetadataBox label="NAME" value={rx.patientName} highlight />
                <MetadataBox label="AGE / SEX" value={`${rx.age || '--'}Y / ${rx.gender || '--'}`} />
            </div>

            <div className="p-8 space-y-8">
                {/* Clinical Findings */}
                <section>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 block">Primary Diagnosis / Clinical Findings</label>
                    <div className="p-5 rounded-2xl bg-blue-50/30 border border-blue-100/50">
                        <p className="text-lg font-black text-slate-800 leading-tight">{rx.diagnosis}</p>
                    </div>
                </section>

                {/* Medications Table */}
                <section>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 block">Rx: Medications & Dosage</label>
                    <div className="border border-slate-100 rounded-[24px] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-5 py-3 border-b border-slate-100">Medicine Name</th>
                                    <th className="px-5 py-3 border-b border-slate-100 text-center">Frequency</th>
                                    <th className="px-5 py-3 border-b border-slate-100 text-right">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rx.medicines?.map((m, idx) => (
                                    <tr key={idx} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="font-black text-slate-800 leading-none mb-1">{m.name}</p>
                                            <p className="text-[11px] font-bold text-slate-400">{m.dose} · {m.instructions}</p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-black uppercase">
                                                {m.frequency}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className="text-sm font-black text-slate-700">{m.duration}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Additional Advice */}
                {rx.notes && (
                    <section>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 block">Advice & Instructions</label>
                        <div className="relative p-6 rounded-3xl bg-amber-50/30 border border-amber-100/50 italic font-bold text-slate-600 text-[15px] leading-relaxed">
                            <span className="absolute -top-3 left-4 px-2 bg-white text-amber-500"><Activity size={14} /></span>
                            "{rx.notes}"
                        </div>
                    </section>
                )}

                {/* Validation Footer */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <ShieldCheck size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-800 tracking-tight">VERIFIED DIGITAL RECORD</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hospital Reg No. #9932/09</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authenticated by</p>
                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">DR. {rx.doctorName?.toUpperCase() || "MEDICAL OFFICER"}</p>
                    </div>
                </div>
            </div>

            {/* Official Footer / Share Bar */}
            <div className="p-8 bg-slate-900 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-80">Varogra Platform</p>
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Clinical Integrity Ensured</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleShare}
                        className="p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                    >
                        <Share2 size={18} /> Share
                    </button>
                    <button className="p-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest px-6">
                        <Printer size={18} /> Print
                    </button>
                </div>
            </div>
        </div>
    );
};

const MetadataBox = ({ label, value, highlight }) => (
    <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
        <p className={`text-[13px] font-black uppercase tracking-tight ${highlight ? 'text-blue-600 font-extrabold' : 'text-slate-800'}`}>
            {value || "--"}
        </p>
    </div>
);

export default OfficialPrescriptionReport;
