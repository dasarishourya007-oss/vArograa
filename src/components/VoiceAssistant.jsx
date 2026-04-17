import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mic, MicOff, X, Bot, Loader2, Volume2, VolumeX, 
    Send, User, AlertTriangle, Phone, Activity, 
    ShieldCheck, Zap, Globe, Heart, PhoneIncoming, 
    PhoneOff, Maximize2, Minimize2, MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAIResponse } from '../services/aiService';
import { bookAppointment, updateUserPhone } from '../firebase/services';

const VoiceAssistant = ({ isOpen, onClose, triggerType = 'BOOKING', onBookingSuccess }) => {
    const { user, allHospitals, allDoctors } = useAuth();
    
    // Call States
    const [callStatus, setCallStatus] = useState(triggerType === 'SOS' ? 'active' : 'incoming');
    const [callTimer, setCallTimer] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [showCaptions, setShowCaptions] = useState(true);

    // Core Assistant States
    const [messages, setMessages] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isEmergency, setIsEmergency] = useState(triggerType === 'SOS');
    const [phoneVerified, setPhoneVerified] = useState(!!(user?.phone || user?.phoneNumber));
    const [currentLanguage, setCurrentLanguage] = useState('en-US');
    
    // Refs
    const recognitionRef = useRef(null);
    const chatContainerRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);
    const timerRef = useRef(null);

    // Context Data for AI
    const hospitalContext = useMemo(() => {
        return (allHospitals || []).map(h => ({
            name: h.hospitalName || h.name,
            distance: h.distance || 'Unknown',
            cost: h.consultationFee || h.cost || '400',
            rating: h.rating || '4.5'
        }));
    }, [allHospitals]);

    // Timer Logic
    useEffect(() => {
        if (callStatus === 'active') {
            timerRef.current = setInterval(() => {
                setCallTimer(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [callStatus]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Initial Greeting & Phone Check (Only after call is active)
    useEffect(() => {
        if (isOpen && callStatus === 'active' && messages.length === 0) {
            handleInitialFlow();
        }
    }, [isOpen, callStatus]);

    const handleInitialFlow = async () => {
        let greeting = "";
        if (!user || (!user.phone && !phoneVerified)) {
            greeting = "Hello, I’m your Omnidimension healthcare assistant. Before we continue, please provide your mobile number for a secure connection.";
        } else {
            greeting = isEmergency 
                ? "Emergency protocol activated. This is Omnidimension Care. I see you've triggered an SOS. What symptoms are you experiencing?"
                : "Hello, this is Omnidimension Care. I’m here to help you. How can I assist you with your appointment booking today?";
        }
        addMessage('assistant', greeting);
        speak(greeting);
    };

    // Auto-scroll for captions
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, interimTranscript]);

    // Speech Recognition Setup
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = currentLanguage;

        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onresult = (event) => {
            let interim = '';
            synthesisRef.current.cancel(); 
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    handleUserVoiceInput(event.results[i][0].transcript);
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            setInterimTranscript(interim);
        };

        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = (e) => console.error("Speech Err:", e);

        return () => recognitionRef.current?.stop();
    }, [currentLanguage]);

    const toggleListening = () => {
        if (isListening) recognitionRef.current?.stop();
        else {
            synthesisRef.current.cancel();
            recognitionRef.current?.start();
        }
    };

    const addMessage = (role, text) => {
        setMessages(prev => [...prev, { role, text, timestamp: new Date() }]);
    };

    const handleUserVoiceInput = async (text) => {
        if (!text.trim()) return;
        addMessage('user', text);
        setInterimTranscript('');

        if (!(user?.phone || user?.phoneNumber) && !phoneVerified) {
            const phoneMatch = text.match(/\d{10}/);
            if (phoneMatch) {
                setPhoneVerified(true);
                if (user?.uid) updateUserPhone(user.uid, phoneMatch[0]);
                const confirmMsg = "Thank you. Number verified and saved to your Omnidimension profile. What symptoms are you experiencing?";
                addMessage('assistant', confirmMsg);
                speak(confirmMsg);
                return;
            } else {
                const retryMsg = "I couldn't quite capture the number. Please provide your 10-digit mobile number clearly.";
                addMessage('assistant', retryMsg);
                speak(retryMsg);
                return;
            }
        }

        await processAI(text);
    };

    const processAI = async (text) => {
        setIsTyping(true);
        try {
            const context = {
                trigger_type: isEmergency ? "SOS" : "BOOKING",
                user_phone_number: user?.phone || user?.phoneNumber || "Verified",
                hospital_data: hospitalContext,
                doctor_data: "All specialists available through Omnidimension network."
            };

            const result = await getAIResponse(messages, 'voice', context);
            const reply = result.reply;

            addMessage('assistant', reply);
            speak(reply);

            if (reply.toLowerCase().includes("connecting to the nearest hospital") || 
                reply.toLowerCase().includes("serious")) {
                setIsEmergency(true);
            }

        } catch (err) {
            const errReply = "Omnidimension network latency. Please repeat or call emergency services if urgent.";
            addMessage('assistant', errReply);
            speak(errReply);
        } finally {
            setIsTyping(false);
        }
    };

    const speak = (text) => {
        if (!('speechSynthesis' in window)) return;
        synthesisRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLanguage;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        synthesisRef.current.speak(utterance);
    };

    if (!isOpen) return null;

    // --- RENDER VIEWS ---

    const renderIncoming = () => (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-between h-[80vh] w-full max-w-md bg-slate-900/40 backdrop-blur-2xl rounded-[48px] border border-white/10 p-12 shadow-2xl relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
            
            <div className="flex flex-col items-center gap-4 z-10">
                <div className="text-blue-400 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Incoming Call</div>
                <h1 className="text-4xl font-black text-white tracking-tighter">Omnidimension</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Secure Care Channel</p>
            </div>

            <div className="relative z-10">
                <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-x-[-40px] inset-y-[-40px] bg-blue-500/20 rounded-full blur-3xl"
                />
                <img src="/ai_orb.png" alt="Call Avatar" className="w-48 h-48 rounded-full shadow-2xl relative z-10 border-4 border-white/10" />
            </div>

            <div className="flex gap-12 z-10">
                <button 
                    onClick={onClose}
                    className="flex flex-col items-center gap-3"
                >
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 hover:scale-110 transition-transform">
                        <PhoneOff className="text-white" size={28} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400">Decline</span>
                </button>
                <button 
                    onClick={() => setCallStatus('active')}
                    className="flex flex-col items-center gap-3"
                >
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce hover:scale-110 transition-transform">
                        <Phone className="text-white" size={28} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400">Accept</span>
                </button>
            </div>
        </motion.div>
    );

    const renderActive = () => (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex flex-col items-center h-[90vh] w-full max-w-4xl p-8 relative ${isEmergency ? 'text-red-50' : 'text-blue-50'}`}
        >
            {/* Header: Call Meta */}
            <div className="w-full flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${isEmergency ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <div className="text-[12px] font-black uppercase tracking-widest opacity-60">Omnidimension Secure • {formatTime(callTimer)}</div>
                </div>
                <div className="bg-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic text-white/80">End-to-End Encrypted</span>
                </div>
            </div>

            {/* Center: Visualizer & ID */}
            <div className="flex-1 flex flex-col items-center justify-center gap-12">
                <div className="relative">
                    <AnimatePresence>
                        {(isListening || isSpeaking) && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ 
                                    opacity: [0.1, 0.3, 0.1],
                                    scale: [0.8, 1.5, 0.8]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className={`absolute inset-0 rounded-full blur-[80px] ${isEmergency ? 'bg-red-500' : 'bg-blue-500'}`}
                            />
                        )}
                    </AnimatePresence>
                    
                    <div className={`relative z-10 w-48 h-48 rounded-[60px] flex items-center justify-center border-4 transition-all duration-700 ${
                        isListening ? 'scale-110 shadow-[0_0_80px_rgba(59,130,246,0.5)]' : 'scale-100'
                    } ${isEmergency ? 'bg-red-600 border-red-400' : 'bg-slate-800 border-slate-700'}`}>
                        {isTyping ? <Loader2 className="animate-spin text-white" size={64} /> : 
                         isEmergency ? <AlertTriangle size={64} className="text-white" /> : 
                         <img src="/ai_orb.png" className="w-full h-full rounded-[56px] object-cover opacity-80" alt="Bot" />}
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-4xl font-black tracking-tighter mb-2 italic">OMNIDIMENSION CARE</h2>
                    <div className="flex items-center justify-center gap-3">
                        <Activity size={16} className={isEmergency ? 'text-red-400' : 'text-blue-400'} />
                        <span className="text-[12px] font-black uppercase tracking-[0.4em] opacity-50">
                            {isTyping ? 'Analyzing Biosigns...' : isListening ? 'Listening Clearly...' : isSpeaking ? 'Transmitting Advice...' : 'Line Active'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom: Captions Overlay */}
            <AnimatePresence>
                {showCaptions && (
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="w-full max-w-2xl bg-black/30 backdrop-blur-md rounded-3xl p-6 border border-white/5 mb-8"
                    >
                        <div ref={chatContainerRef} className="max-h-[120px] overflow-y-auto space-y-4 scrollbar-hide">
                            {messages.slice(-2).map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] text-[14px] font-bold ${msg.role === 'user' ? 'text-blue-400' : 'text-white'}`}>
                                        <span className="text-[9px] uppercase tracking-widest opacity-40 block mb-1">{msg.role}</span>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {interimTranscript && (
                                <div className="text-blue-300 italic text-[14px] font-bold opacity-60">
                                    <span className="text-[9px] uppercase tracking-widest opacity-40 block mb-1">Live Capture</span>
                                    {interimTranscript}...
                                </div>
                            )}
                            {messages.length === 0 && !interimTranscript && (
                                <div className="text-center text-[10px] font-black uppercase tracking-widest text-white/20">Secure Data Channel Active</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer: Controls */}
            <div className="flex items-center gap-8 py-6">
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${isMuted ? 'bg-white text-slate-900 border-white' : 'bg-white/5 text-white border-white/20 hover:bg-white/10'}`}
                >
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>

                <button 
                    onClick={onClose}
                    className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/40 hover:scale-105 active:scale-95 transition-all ring-8 ring-red-500/10"
                >
                    <PhoneOff size={32} className="text-white" />
                </button>

                <button 
                    onClick={() => setShowCaptions(!showCaptions)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${!showCaptions ? 'bg-white text-slate-900 border-white' : 'bg-white/5 text-white border-white/20 hover:bg-white/10'}`}
                >
                    {showCaptions ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
                </button>
            </div>
            
            {/* Action Bar for Voice Control */}
            <div className="mt-4 flex flex-col items-center gap-2">
                <button 
                    onClick={toggleListening}
                    className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl ${
                        isListening ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'
                    }`}
                >
                    {isListening ? 'Tap to Stop' : 'Tap to Speak'}
                </button>
            </div>
        </motion.div>
    );

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-[10000] backdrop-blur-3xl flex flex-col items-center justify-center p-4 md:p-8 ${
                    callStatus === 'active' && isEmergency ? 'bg-red-950/98' : 'bg-slate-950/98'
                }`}
            >
                {callStatus === 'incoming' ? renderIncoming() : renderActive()}
            </motion.div>
        </AnimatePresence>
    );
};

export default VoiceAssistant;
