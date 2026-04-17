import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Clock, Activity, Settings, LogOut,
    CheckCircle, Camera, Upload, Trash2,
    ChevronRight, Bell, Calendar, ShieldCheck,
    X, Type, PenTool
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import ConfirmModal from '../components/ConfirmModal';
import Input from '../components/Input';
import { getAIResponse } from '../utils/AIService';
import { subscribeToAppointments, addAppointmentPrescription, uploadPrescriptionImage } from '../firebase/services';
import WritingBoard from '../components/WritingBoard';


const DoctorDashboard = () => {
    const navigate = useNavigate();
    const {
        user, appointments, updateAppointmentStatus, updateProfile, logout,
        doctorStatus, setDoctorStatus, autoApprove, setAutoApprove,
        currentHospital
    } = useAuth();
    const hospitalName = currentHospital?.hospitalName || currentHospital?.name || user?.hospitalName || 'Hospital';

    const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'ai-bot' | 'settings'
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
    const [assignedPatients, setAssignedPatients] = useState([]);
    const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [prescriptionForm, setPrescriptionForm] = useState({ medicine: '', dosage: '', instructions: '', days: '' });
    const [isSavingPrescription, setIsSavingPrescription] = useState(false);
    const [prescriptionMessage, setPrescriptionMessage] = useState('');

    // AI Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isAILoading, setIsAILoading] = useState(false);
    const [prescriptionMode, setPrescriptionMode] = useState('text'); // 'text' | 'draw'
    const chatEndRef = useRef(null);


    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isAILoading]);

    useEffect(() => {
        const doctorId = user?.uid || user?.id;
        if (!doctorId) return () => { };
        const unsubscribe = subscribeToAppointments({
            doctorId,
            status: ['accepted', 'Accepted']
        }, (docs) => {
            setAssignedPatients(docs);
        });
        return unsubscribe;
    }, [user?.uid, user?.id]);

    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        inChargeName: user?.inChargeName || '',
        phone: user?.phone || user?.primaryPhone || '',
        secondaryPhone: user?.secondaryPhone || ''
    });

    if (!user) return null;

    const myAppointments = appointments.filter(a => a.doctorId === user.id);
    const pending = myAppointments.filter(a => a.status === 'Accepted' || a.status === 'Confirmed');

    const handleSendChat = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || isAILoading) return;

        const userMsg = { role: 'user', text: chatInput };
        const newHistory = [...chatHistory, userMsg];
        setChatHistory(newHistory);
        setChatInput('');
        setIsAILoading(true);

        try {
            // Inject clinical context
            const clinicalContext = `
                CURRENT CONTEXT:
                Doctor: Dr. ${user.name}
                Queue: ${pending.length} patients pending.
                Patient Details: ${pending.map(p => `Patient #${p.id} (${p.userName}) at ${p.time}`).join(', ') || 'Queue is currently empty.'}
                Status: ${doctorStatus}
                Auto-Approve: ${autoApprove ? 'ON' : 'OFF'}
            `;

            const historyWithContext = [
                { role: 'user', text: `SYSTEM CONTEXT (INTERNAL): ${clinicalContext}\n\nUSER QUERY: ${chatInput}` },
            ];

            const aiResponse = await getAIResponse(newHistory, 'doctor');
            setChatHistory([...newHistory, { role: 'model', text: aiResponse }]);
        } catch (error) {
            console.error("AI Error:", error);
            setChatHistory([...newHistory, { role: 'model', text: "I'm having trouble analyzing the clinical data right now. Please try again." }]);
        } finally {
            setIsAILoading(false);
        }
    };

    const handleOpenPrescription = (appointment) => {
        setSelectedAppointment(appointment);
        setPrescriptionForm({ medicine: '', dosage: '', instructions: '', days: '' });
        setPrescriptionMessage('');
        setPrescriptionMode('text');
        setPrescriptionModalOpen(true);
    };

    const handleClosePrescriptionModal = () => {
        setPrescriptionModalOpen(false);
        setSelectedAppointment(null);
        setPrescriptionMessage('');
    };

    const handlePrescriptionSubmit = async (event) => {
        if (event) event.preventDefault();
        if (!selectedAppointment?.id) return;
        if (prescriptionMode === 'text' && (!prescriptionForm.medicine.trim() || !prescriptionForm.dosage.trim())) {
            setPrescriptionMessage('Medicine and dosage are required.');
            return;
        }
        setPrescriptionMessage('');
        setIsSavingPrescription(true);
        try {
            await addAppointmentPrescription({
                appointmentId: selectedAppointment.id,
                prescription: prescriptionMode === 'text' ? {
                    medicine: prescriptionForm.medicine.trim(),
                    dosage: prescriptionForm.dosage.trim(),
                    instructions: prescriptionForm.instructions.trim(),
                    days: prescriptionForm.days.trim()
                } : null,
                doctorName: user?.name,
                patientId: selectedAppointment.patientId
            });
            handleClosePrescriptionModal();
        } catch (error) {
            console.error("Prescription save failed:", error);
            setPrescriptionMessage('Failed to save prescription.');
        } finally {
            setIsSavingPrescription(false);
        }
    };

    const handlePrescriptionDrawSave = async (dataUrl) => {
        if (!selectedAppointment?.id) return;
        setIsSavingPrescription(true);
        setPrescriptionMessage('Uploading prescription...');
        try {
            const imageUrl = await uploadPrescriptionImage(selectedAppointment.id, dataUrl);
            await addAppointmentPrescription({
                appointmentId: selectedAppointment.id,
                imageUrl: imageUrl,
                doctorName: user?.name,
                patientId: selectedAppointment.patientId
            });
            handleClosePrescriptionModal();
        } catch (error) {
            console.error("Prescription draw save failed:", error);
            setPrescriptionMessage('Failed to upload prescription.');
        } finally {
            setIsSavingPrescription(false);
        }
    };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        setProfileMsg({ type: '', text: '' });
        const res = updateProfile(profileForm);
        if (res.success) {
            setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
        } else {
            setProfileMsg({ type: 'error', text: res.message });
        }
    };

    return (
        <div className="min-h-screen bg-[#fafbfc] pb-24">
            {/* Minimalist Clinical Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">{hospitalName} · Dr. {user.name}</h1>
                    <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck size={12} strokeWidth={3} /> Doctor's Portal
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end mr-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Doctor ID</span>
                        <span className="text-xs font-bold text-slate-700">{user.code}</span>
                    </div>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="bg-rose-50 text-rose-500 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider hover:bg-rose-100 transition-colors flex items-center gap-2"
                    >
                        <LogOut size={14} strokeWidth={2.5} /> Logout
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6">
                {/* Navigation Tabs */}
                <div className="flex gap-8 mb-8 border-b border-slate-100 relative">
                    {[
                        { id: 'queue', label: 'Queue', icon: <Users size={18} /> },
                        { id: 'ai-bot', label: 'AI Reminder Bot', icon: <Activity size={18} /> },
                        { id: 'settings', label: 'Profile Settings', icon: <Settings size={18} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-4 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-teal-600' : 'text-slate-400'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="doctorTabGlow"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 rounded-t-full shadow-[0_0_12px_rgba(20,184,166,0.6)]"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Session Status Card */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Session Status</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Available', color: 'teal', glow: 'shadow-teal-500/20' },
                                    { label: 'In Appointment', color: 'blue', glow: 'shadow-blue-500/20' },
                                    { label: 'Offline', color: 'slate', glow: 'shadow-slate-500/20' }
                                ].map(s => (
                                    <button
                                        key={s.label}
                                        onClick={() => setDoctorStatus(s.label)}
                                        className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${doctorStatus === s.label
                                            ? `bg-${s.color}-50 text-${s.color}-600 shadow-lg ${s.glow} border-${s.color}-100`
                                            : 'bg-transparent text-slate-400 border border-slate-100 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${doctorStatus === s.label ? `bg-${s.color}-500 animate-pulse` : 'bg-slate-300'}`} />
                                            {s.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-12 w-[1px] bg-slate-100 hidden sm:block" />

                        <div className="flex items-center justify-between sm:justify-end gap-4 flex-1">
                            <div className="text-right">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Auto-Approve</p>
                                <p className="text-[10px] text-slate-500 font-medium">Bypass manual accept</p>
                            </div>
                            <button
                                onClick={() => setAutoApprove(!autoApprove)}
                                className={`w-14 h-8 rounded-full transition-all relative ${autoApprove ? 'bg-teal-500 shadow-lg shadow-teal-500/30' : 'bg-slate-200'
                                    }`}
                            >
                                <motion.div
                                    className="w-6 h-6 bg-white rounded-full absolute top-1 left-1 shadow-sm"
                                    animate={{ x: autoApprove ? 24 : 0 }}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'queue' && (
                        <motion.div
                            key="queue"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-4"
                        >
                            <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-black text-slate-800">My Patients</h3>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live</span>
                        </div>
                        {assignedPatients.length === 0 ? (
                            <div className="rounded-[30px] border border-dashed border-slate-200 p-6 text-center text-slate-400">
                                No accepted appointments yet.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {assignedPatients.map((appt) => (
                                    <div key={appt.id} className="flex flex-col gap-2 bg-white border border-slate-100 rounded-[28px] p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{appt.patientName || 'Patient'}</p>
                                                <p className="text-[13px] text-slate-500">{appt.date || 'Date TBD'} • {appt.time || 'Time TBD'}</p>
                                            </div>
                                            <button
                                                onClick={() => handleOpenPrescription(appt)}
                                                className="px-3 py-2 rounded-2xl bg-p-600 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-p-600/40 hover:bg-p-500 transition"
                                            >
                                                Add Prescription
                                            </button>
                                        </div>
                                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Consultation: {String(appt.visitType || appt.consultationType || 'Hospital').toUpperCase()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 px-1">Clinical Queue</h3>
                            {pending.length > 0 ? (
                                pending.map(appt => (
                                    <div key={appt.id} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-teal-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">#{appt.id} • {appt.userName || 'Patient'}</p>
                                                <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
                                                    <Clock size={12} /> {appt.time || '10:00 AM'}
                                                </p>
                                            </div>
                                        </div>
                                        {appt.status === 'Confirmed' ? (
                                            <button
                                                onClick={() => updateAppointmentStatus(appt.id, 'Accepted')}
                                                className="bg-teal-600 text-white px-6 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-teal-600/20 active:scale-95 transition-all"
                                            >
                                                Start Case
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/prescribe/${appt.id}`)}
                                                className="flex items-center gap-2 text-teal-600 font-black text-xs hover:bg-teal-50 px-4 py-2 rounded-xl transition-colors"
                                            >
                                                Open Record <ChevronRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                                        <Calendar size={40} />
                                    </div>
                                    <h4 className="text-slate-400 font-black uppercase tracking-widest text-xs">No Appointments Left</h4>
                                    <p className="text-slate-300 text-[11px] mt-1">Excellent! Your queue is clear.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.form
                            key="settings"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onSubmit={handleUpdateProfile}
                            className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50 flex flex-col gap-8"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-black text-slate-800">Clinical Configuration</h3>
                                <button type="button" onClick={() => alert('Feature coming soon')} className="text-teal-600 text-xs font-black uppercase tracking-tighter flex items-center gap-1">
                                    <Camera size={14} /> Update Photo
                                </button>
                            </div>

                            {profileMsg.text && (
                                <div className={`p-4 rounded-2xl text-xs font-bold ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {profileMsg.text}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <Input
                                    label="Full Name"
                                    value={profileForm.name}
                                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                />
                                <Input
                                    label="Official Email"
                                    value={user.email}
                                    disabled
                                />
                                <Input
                                    label="Primary Phone"
                                    value={profileForm.phone}
                                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                                />
                                <Input
                                    label="Secondary Phone"
                                    value={profileForm.secondaryPhone}
                                    onChange={e => setProfileForm({ ...profileForm, secondaryPhone: e.target.value })}
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-50 flex gap-4">
                                <button type="submit" className="bg-teal-600 text-white px-8 py-4 rounded-[20px] text-sm font-black shadow-xl shadow-teal-600/20 active:scale-95 transition-all">
                                    Update Clinical Metadata
                                </button>
                                <button type="button" onClick={() => navigate('/')} className="px-8 py-4 text-slate-400 text-sm font-bold active:scale-95 transition-all">
                                    Preview Profile
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {activeTab === 'ai-bot' && (
                        <motion.div
                            key="ai-bot"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900 rounded-[40px] p-6 text-white relative overflow-hidden flex flex-col min-h-[500px]"
                        >
                            {/* AI Header */}
                            <div className="relative z-10 flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center border border-teal-500/30">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black">Clinical Intel</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Assistant</p>
                                        </div>
                                    </div>
                                </div>
                                <Activity size={20} className="text-teal-500/20" />
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar max-h-[350px]">
                                {chatHistory.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-50">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                            <Bell size={24} className="text-teal-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">How can I assist you today, Dr. {user.name}?</p>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">Queue Analysis • Patient History • Clinical Guidelines</p>
                                        </div>
                                    </div>
                                ) : (
                                    chatHistory.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-3xl text-sm ${msg.role === 'user'
                                                ? 'bg-teal-600 text-white rounded-tr-none'
                                                : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                                                }`}>
                                                <p className="leading-relaxed">{msg.text}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isAILoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/5 border border-white/10 p-4 rounded-3xl rounded-tl-none flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="relative z-10 group">
                                <form onSubmit={handleSendChat} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Ask about your queue or patients..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-teal-500/50 transition-all placeholder:text-slate-600"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!chatInput.trim() || isAILoading}
                                        className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:hover:bg-teal-600 text-white px-5 rounded-2xl transition-all shadow-lg shadow-teal-900/40"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </form>
                            </div>

                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[100px] -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 blur-[100px] -ml-32 -mb-32" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={logout}
            />

            {/* Prescription Modal */}
            <AnimatePresence>
                {prescriptionModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Prescription for {selectedAppointment?.patientName}</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{selectedAppointment?.date} • {selectedAppointment?.time}</p>
                                </div>
                                <button
                                    onClick={handleClosePrescriptionModal}
                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-2xl w-fit">
                                    <button
                                        onClick={() => setPrescriptionMode('text')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${prescriptionMode === 'text' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        <Type size={14} /> Text Editor
                                    </button>
                                    <button
                                        onClick={() => setPrescriptionMode('draw')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${prescriptionMode === 'draw' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        <PenTool size={14} /> Digital Pad
                                    </button>
                                </div>

                                {prescriptionMessage && (
                                    <div className={`p-4 rounded-2xl text-xs font-bold mb-4 ${prescriptionMessage.includes('Failed') ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {prescriptionMessage}
                                    </div>
                                )}

                                {prescriptionMode === 'text' ? (
                                    <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Medicine Name"
                                                placeholder="e.g. Paracetamol"
                                                value={prescriptionForm.medicine}
                                                onChange={e => setPrescriptionForm({ ...prescriptionForm, medicine: e.target.value })}
                                            />
                                            <Input
                                                label="Dosage"
                                                placeholder="e.g. 1-0-1"
                                                value={prescriptionForm.dosage}
                                                onChange={e => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                                            />
                                            <Input
                                                label="Duration (Days)"
                                                placeholder="e.g. 5"
                                                value={prescriptionForm.days}
                                                onChange={e => setPrescriptionForm({ ...prescriptionForm, days: e.target.value })}
                                            />
                                            <Input
                                                label="Instructions"
                                                placeholder="After food"
                                                value={prescriptionForm.instructions}
                                                onChange={e => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSavingPrescription}
                                            className="w-full mt-6 bg-teal-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isSavingPrescription ? 'Saving...' : 'Send Text Prescription'}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="h-[450px]">
                                        <WritingBoard onSave={handlePrescriptionDrawSave} />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default DoctorDashboard;
