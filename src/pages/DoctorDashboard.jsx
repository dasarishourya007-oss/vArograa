import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import {
    Users, Clock, Activity, Settings, LogOut,
    CheckCircle, Camera, Upload, Trash2,
    ChevronRight, Bell, Calendar, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import Input from '../components/Input';
import { getAIResponse } from '../services/aiService';
import { useRef, useEffect } from 'react';
import { uploadDoctorPhoto } from '../firebase/uploadImage';
import ImageUpload from '../components/ImageUpload';
import { db } from '../firebase/config';
import { onSnapshot, query, collection, where } from 'firebase/firestore';
import Toast from '../components/Toast';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        user, loading, appointments, updateAppointmentStatus, updateProfile, updateUserProfilePhoto, logout,
        doctorStatus, setDoctorStatus, autoApprove, setAutoApprove, notifications
    } = useAuth();

    const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'ai-bot' | 'settings'
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
    const [showToast, setShowToast] = useState(false);
    const [toastData, setToastData] = useState({ patient: '', message: '' });

    // AI Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isAILoading, setIsAILoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isAILoading]);

    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        inChargeName: user?.inChargeName || '',
        phone: user?.phone || user?.primaryPhone || '',
        secondaryPhone: user?.secondaryPhone || ''
    });

    useEffect(() => {
        if (!loading && !user) navigate('/login');
    }, [user, loading, navigate]);

    useEffect(() => {
        if (location?.state?.requirePhotoUpload) {
            setActiveTab('settings');
            setProfileMsg({ type: 'error', text: 'Please upload your profile image to continue.' });
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location, navigate]);

    useEffect(() => {
        if (!user?.uid) return;
        const q = query(
            collection(db, "appointments"),
            where("doctorId", "==", user.uid || user.id)
        );
        const unsub = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "modified" || change.type === "added") {
                    const data = change.doc.data();
                    if (data.status === 'accepted') {
                        setToastData({
                            patient: data.patientName || 'A patient',
                            message: 'New confirmed appointment'
                        });
                        setShowToast(true);
                    }
                }
            });
        });
        return () => unsub();
    }, [user?.uid, user?.id]);

    if (loading || !user) return null;

    const myAppointments = appointments.filter(a => a.doctorId === user.id || a.doctorId === user.uid);
    const pending = myAppointments.filter(a => String(a.status).toLowerCase() === 'accepted' || a.status === 'Confirmed');

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

            const result = await getAIResponse(newHistory, 'doctor');
            setChatHistory([...newHistory, { role: 'model', text: result.reply }]);
        } catch (error) {
            console.error("AI Error:", error);
            setChatHistory([...newHistory, { role: 'model', text: "I'm having trouble analyzing the clinical data right now. Please try again." }]);
        } finally {
            setIsAILoading(false);
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

    const handlePhotoUpload = async (file) => {
        if (!file) return;
        const doctorId = user?.uid || user?.id;
        if (!doctorId) return;
        setIsUploading(true);
        setUploadProgress(10);
        try {
            setUploadProgress(30);
            const downloadURL = await uploadDoctorPhoto(doctorId, file);
            setUploadProgress(100);
            updateUserProfilePhoto(downloadURL);
            setProfileMsg({ type: 'success', text: 'Profile photo updated! It is now visible to all patients.' });
        } catch (error) {
            console.error("Upload failed:", error);
            setProfileMsg({ type: 'error', text: 'Upload failed. Please try again.' });
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 1000);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafbfc] pb-24">
            {/* Minimalist Clinical Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Dr. {user.name}</h1>
                    <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck size={12} strokeWidth={3} /> Doctor's Portal
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 text-slate-400 hover:text-teal-600 transition-colors relative"
                        >
                            <Bell size={20} />
                            {notifications.filter(n => !n.read).length > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                            )}
                        </button>
                        
                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Notifications</h3>
                                        <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                                            {notifications.filter(n => !n.read).length} New
                                        </span>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            notifications.map(n => (
                                                <div key={n.id} className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-teal-50/20' : ''}`}>
                                                    <p className="text-xs font-black text-slate-800 mb-1">{n.title}</p>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed">{n.message}</p>
                                                    <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">
                                                        {new Date(n.createdAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center">
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No notifications</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

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
                            <div className="flex flex-col items-center gap-6 mb-8 p-6 bg-slate-50/50 rounded-[32px] border border-slate-100">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                                        <img
                                            src={user.photoURL || '/images/default-doctor.png'}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-teal-600/80 backdrop-blur-sm flex items-center justify-center text-white">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[10px] font-black">{uploadProgress}%</span>
                                                    <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
                                                        <div className="h-full bg-white" style={{ width: `${uploadProgress}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all border-4 border-white">
                                        <Camera size={18} />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handlePhotoUpload(e.target.files[0])}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-black text-slate-800">Clinical Identity</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manage your public representation</p>
                                </div>
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

            <Toast 
                show={showToast} 
                message={toastData.message}
                doctorName={toastData.patient}
                onClose={() => setShowToast(false)} 
            />
        </div>
    );
};

export default DoctorDashboard;


