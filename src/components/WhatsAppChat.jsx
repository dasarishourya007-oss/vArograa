import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
    Send, X, Paperclip, MoreVertical, Search, MessageSquare, 
    Hospital, User, Check, CheckCheck, Clock, ShieldCheck,
    Zap, AlertCircle, Info, ChevronLeft, Image as ImageIcon,
    Menu, Filter, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase/config';
import { 
    collection, query, where, orderBy, onSnapshot, 
    addDoc, serverTimestamp, doc, getDoc, setDoc 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const WhatsAppChat = ({ isOpen, onClose, initialTargetId }) => {
    const { user, allDoctors } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSidebar, setShowSidebar] = useState(true); // Toggle for mobile
    
    // selectedContact can be 'hub' or a doctor object
    const [selectedContact, setSelectedContact] = useState(null);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    // Filter doctors based on search
    const filteredDoctors = useMemo(() => {
        return (allDoctors || []).filter(doc => 
            doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allDoctors, searchQuery]);

    // Initialize selection
    useEffect(() => {
        if (isOpen && !selectedContact) {
            if (initialTargetId) {
                const target = allDoctors?.find(d => d.uid === initialTargetId || d.id === initialTargetId);
                if (target) {
                    setSelectedContact(target);
                } else {
                    setSelectedContact('hub');
                }
            } else {
                setSelectedContact('hub');
            }
        }
    }, [isOpen, initialTargetId, allDoctors]);

    // Derived session ID
    const sessionId = useMemo(() => {
        if (!user?.uid || !selectedContact) return null;
        if (selectedContact === 'hub') return `hospital_hub_${user?.hospitalId || 'general'}`;
        const targetId = selectedContact.uid || selectedContact.id;
        return [user.uid, targetId].sort().join('_');
    }, [user?.uid, selectedContact, user?.hospitalId]);

    // Message Subscription
    useEffect(() => {
        if (!isOpen || !sessionId) return;

        setLoading(true);
        const q = query(
            collection(db, 'chat_sessions', sessionId, 'messages'),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            setLoading(false);
            if (window.innerWidth < 768 && selectedContact !== 'hub') {
                // Auto hide sidebar on mobile when a contact is selected
                // setShowSidebar(false); 
            }
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }, (err) => {
            console.error("Chat subscription error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, sessionId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user?.uid || !sessionId) return;

        const text = newMessage;
        setNewMessage('');

        try {
            await addDoc(collection(db, 'chat_sessions', sessionId, 'messages'), {
                senderId: user.uid,
                senderName: user.name || user.displayName || 'User',
                text: text,
                timestamp: serverTimestamp(),
                type: 'text'
            });
            inputRef.current?.focus();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
    };

    if (!isOpen) return null;

    const modalContent = (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[20000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-0 md:p-6"
            style={{ pointerEvents: 'auto' }}
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                className="bg-white w-full max-w-6xl h-full md:h-[85vh] md:rounded-[32px] shadow-2xl flex overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sidebar */}
                <div className={`${showSidebar ? 'flex' : 'hidden md:flex'} w-full md:w-[380px] border-r border-slate-100 flex-col bg-[#f8fafc]`}>
                    {/* Sidebar Header */}
                    <div className="p-6 bg-white border-b border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-slate-900">Messages</h3>
                            <button onClick={onClose} className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#075e54] transition-colors" size={18} />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search doctors or staff..."
                                className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#075e54]/20 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Contacts List */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-2">
                        {/* Hospital Hub Entry */}
                        <button 
                            onClick={() => {
                                setSelectedContact('hub');
                                if (window.innerWidth < 768) setShowSidebar(false);
                            }}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl mb-1 transition-all ${selectedContact === 'hub' ? 'bg-[#075e54] text-white shadow-lg shadow-[#075e54]/20' : 'hover:bg-white text-slate-700'}`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${selectedContact === 'hub' ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>
                                <Hospital size={24} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between">
                                    <h5 className="font-black text-sm truncate">Hospital Central Hub</h5>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${selectedContact === 'hub' ? 'text-white/60' : 'text-slate-400'}`}>Group</span>
                                </div>
                                <p className={`text-[11px] font-bold truncate mt-0.5 ${selectedContact === 'hub' ? 'text-white/60' : 'text-slate-500'}`}>
                                    Broadcasts & Live Clinical Support
                                </p>
                            </div>
                        </button>

                        <div className="px-4 py-3">
                            <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Private Consultations</h6>
                        </div>

                        {filteredDoctors.map((doc) => {
                            const isSelected = selectedContact?.uid === doc.uid || selectedContact?.id === doc.id;
                            const dId = doc.uid || doc.id;
                            
                            return (
                                <button 
                                    key={dId}
                                    onClick={() => {
                                        setSelectedContact(doc);
                                        if (window.innerWidth < 768) setShowSidebar(false);
                                    }}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl mb-1 transition-all ${isSelected ? 'bg-[#075e54] text-white shadow-lg shadow-[#075e54]/20' : 'hover:bg-white text-slate-700'}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                                            {doc.image ? (
                                                <img src={doc.image} alt={doc.name} className="w-full h-full object-cover rounded-2xl" />
                                            ) : (
                                                getInitials(doc.name)
                                            )}
                                        </div>
                                        {doc.isOnline && (
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h5 className="font-black text-sm truncate">Dr. {doc.name}</h5>
                                            <div className={`w-2 h-2 rounded-full ${doc.isOnline ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                        </div>
                                        <p className={`text-[11px] font-bold truncate mt-0.5 ${isSelected ? 'text-white/60' : 'text-slate-500'}`}>
                                            {doc.specialization || 'Clinical Specialist'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}

                        {filteredDoctors.length === 0 && (
                            <div className="p-8 text-center">
                                <p className="text-sm font-bold text-slate-400">No doctors found for "{searchQuery}"</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Footer */}
                    <div className="p-6 bg-white border-t border-slate-100 hidden md:block">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-p-600 flex items-center justify-center text-white shrink-0">
                                <User size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-slate-900 truncate">{user?.name || 'My Profile'}</p>
                                <p className="text-[10px] font-bold text-p-600 uppercase tracking-widest">{user?.role || 'User'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className={`${!showSidebar ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#e5ddd5] relative`}>
                    {/* Chat Header */}
                    <div className="bg-[#075e54] text-white p-4 h-20 shrink-0 flex items-center justify-between z-10 shadow-md">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setShowSidebar(true)} className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                                <ChevronLeft size={24} />
                            </button>
                            
                            <div className="relative">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
                                    {selectedContact === 'hub' ? <Hospital size={24} /> : <User size={24} />}
                                </div>
                                {selectedContact !== 'hub' && selectedContact?.isOnline && (
                                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#075e54] rounded-full" />
                                )}
                            </div>
                            
                            <div>
                                <h4 className="font-black text-sm leading-tight">
                                    {selectedContact === 'hub' ? 'Hospital Central Hub' : `Dr. ${selectedContact?.name || 'Secured Thread'}`}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {selectedContact === 'hub' ? (
                                        <>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Live Broadcast Available</span>
                                        </>
                                    ) : (
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
                                            {selectedContact?.isOnline ? 'Online now' : 'Secure Private Link'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <button className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><Search size={20} /></button>
                            <button className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><MoreVertical size={20} /></button>
                            <button onClick={onClose} className="hidden md:flex p-2.5 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
                        </div>
                    </div>

                    {/* Messages Window */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar relative">
                        <div className="sticky top-0 z-10 flex justify-center mb-8">
                            <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-slate-200/50 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-[#075e54]" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">Health-Grade Encryption Active</span>
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {messages.length === 0 && !loading && (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                                    <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-xl border border-white/30">
                                        <MessageSquare size={36} className="text-[#075e54]" />
                                    </div>
                                    <div className="max-w-[240px]">
                                        <p className="text-sm font-black text-slate-700">No Messages Yet</p>
                                        <p className="text-[11px] font-bold text-slate-500 mt-1">Start a conversation to begin your secure consultation session.</p>
                                    </div>
                                    <button 
                                        onClick={() => inputRef.current?.focus()}
                                        className="bg-white px-6 py-3 rounded-2xl text-[10px] font-black text-[#075e54] uppercase tracking-widest shadow-lg border border-slate-100 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Send first message
                                    </button>
                                </div>
                            )}

                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === user?.uid;
                                const isSystem = msg.type === 'system';
                                
                                if (isSystem) {
                                    return (
                                        <div key={msg.id} className="flex justify-center my-6">
                                            <div className="bg-[#fff9c4] px-6 py-4 rounded-2xl border border-amber-200/50 shadow-md max-w-[85%] flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-200/50">
                                                    <Zap size={20} className="text-amber-900" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-amber-900 leading-relaxed uppercase tracking-tight mb-1">Process Update</p>
                                                    <p className="text-sm font-bold text-amber-800 leading-tight">{msg.text}</p>
                                                    <p className="text-[9px] font-black text-amber-700/60 uppercase tracking-widest mt-2">{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • System</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <motion.div 
                                        key={msg.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] group relative ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-5 py-3.5 rounded-[24px] shadow-sm relative ${
                                                isMe 
                                                ? 'bg-[#dcf8c6] rounded-tr-none text-slate-900' 
                                                : 'bg-white rounded-tl-none text-slate-900 border border-slate-100'
                                            }`}>
                                                {!isMe && selectedContact === 'hub' && (
                                                    <p className="text-[10px] font-black text-[#075e54] mb-1.5 uppercase tracking-wider">{msg.senderName}</p>
                                                )}
                                                <p className="text-[14px] font-medium leading-relaxed">{msg.text}</p>
                                                <div className="flex items-center justify-end gap-1.5 mt-1.5 opacity-50">
                                                    <span className="text-[9px] font-bold tabular-nums">
                                                        {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isMe && <CheckCheck size={14} className="text-blue-500" />}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        <div ref={scrollRef} />
                    </div>

                    {/* Chat Input Bar */}
                    <div className="bg-white/80 backdrop-blur-2xl p-6 border-t border-slate-200">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                            <button type="button" className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-700 transition-all shrink-0 active:scale-95">
                                <Paperclip size={20} />
                            </button>
                            
                            <div className="flex-1 relative">
                                <input 
                                    ref={inputRef}
                                    type="text" 
                                    value={newMessage} 
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type clinical inquiry or message..." 
                                    className="w-full bg-slate-100/50 border-2 border-transparent focus:border-[#075e54]/20 focus:bg-white rounded-[24px] py-4 px-6 text-[14px] font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                    <button type="button" className="text-slate-400 hover:text-[#075e54] transition-colors"><ImageIcon size={20} /></button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={!newMessage.trim()}
                                className="w-14 h-14 bg-[#075e54] text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-[#075e54]/30 disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shrink-0"
                            >
                                <Send size={24} />
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default WhatsAppChat;
