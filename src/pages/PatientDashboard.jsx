import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Calendar, Clock, MapPin, User, LogOut, Package, Video,
    AlertCircle, Send, Bot, Loader2, ShoppingBag,
    Search, Upload, Star, Navigation, Plus, FileText, Zap, DollarSign, ChevronRight,
    Bike, CheckCircle, Map, ArrowLeft, Phone, PhoneOff, MicOff, ShieldCheck,
    Stethoscope, Heart, Baby, Eye, FlaskConical, Grid, Ear, Megaphone, Settings, Camera, X, Mic, Volume2, Square
} from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';
import SafeErrorBoundary from '../components/SafeErrorBoundary';
import VoiceAssistant from '../components/VoiceAssistant';
import PaymentScreen from './PaymentScreen';
import AppointmentDetails from './AppointmentDetails';
import { getAIResponse, analyzePrescription } from '../utils/AIService';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import { hospitals as mockHospitals, medicalStores as mockMedicalStores } from '../utils/mockData';
import { getHospitals, getDoctors, uploadProfilePhoto } from '../firebase/services';
import { updateUserProfilePhoto } from '../firebase/auth';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import LocationPicker from '../components/LocationPicker';
import HospitalCard from '../components/HospitalCard';
import MedicineSearch from './MedicineSearch';

// Carousel Component for Today's Reminders
const ReminderCarousel = ({ onNavigate }) => {
    const { t } = useTranslation();
    const { allHospitals, appointments, bloodRequests, orders, allMedicalStores: medicalStores } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);

    const activeAppt = appointments
        .filter(a => a.status === 'Accepted' || a.status === 'Confirmed')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    const urgentBlood = bloodRequests[0];
    const activeOrder = orders.filter(o => o.status !== 'Delivered')[0];

    const slides = [
        activeAppt && {
            type: 'appointments',
            icon: <Clock size={24} className="text-white animate-pulse" />,
            color: 'bg-p-600',
            glow: 'shadow-p-600/20',
            tag: t('upcoming_appointment'),
            tagColor: 'text-p-600',
            bg: 'bg-white',
            borderColor: 'border-slate-100',
            title: `Dr. ${activeAppt?.doctorName || t('specialist')}`,
            desc: `${activeAppt?.time || ''} • ${activeAppt?.hospitalName || ''}`
        },
        urgentBlood && {
            type: 'blood',
            icon: <Heart size={24} className="text-white animate-pulse" />,
            color: 'bg-rose-500',
            glow: 'shadow-rose-500/20',
            tag: t('urgent_blood_needed'),
            tagColor: 'text-rose-500',
            bg: 'bg-white',
            borderColor: 'border-rose-100',
            title: t('donate_blood'),
            desc: `${urgentBlood?.hospitalName || ''} • ${urgentBlood?.bloodType || urgentBlood?.bloodGroup || 'O+'}`
        },
        activeOrder && {
            type: 'store',
            icon: <ShoppingBag size={24} className="text-white animate-pulse" />,
            color: 'bg-emerald-500',
            glow: 'shadow-emerald-500/20',
            tag: t('active_delivery'),
            tagColor: 'text-emerald-600',
            bg: 'bg-white',
            borderColor: 'border-emerald-100',
            title: t('track_order'),
            desc: `${activeOrder?.storeName || ''} • ${activeOrder?.status || ''}`
        }
    ].filter(Boolean);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [slides.length]);

    if (slides.length === 0) return (
        <div className="p-8 text-center glass rounded-[32px] border-dashed border-slate-200">
            <p className="text-sm font-bold text-muted">No urgent reminders for today</p>
        </div>
    );

    return (
        <div className="relative">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 50, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onClick={() => onNavigate(slides[currentIndex].type === 'blood' ? 'home' : slides[currentIndex].type)}
                    className={`relative overflow-hidden p-6 ${slides[currentIndex].bg} rounded-[32px] shadow-md border ${slides[currentIndex].borderColor} cursor-pointer active:scale-[0.98] transition-all`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-[72px] h-[72px] rounded-[24px] ${slides[currentIndex].color} flex items-center justify-center shadow-lg ${slides[currentIndex].glow} shrink-0`}>
                            {slides[currentIndex].icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${slides[currentIndex].tagColor}`}>
                                {slides[currentIndex].tag}
                            </span>
                            <h4 className="text-[18px] font-extrabold text-slate-900 mt-0.5 truncate uppercase tracking-tight">
                                {slides[currentIndex].title}
                            </h4>
                            <p className="text-[13px] text-slate-500 font-bold mt-0.5 truncate">
                                {slides[currentIndex].desc}
                            </p>
                        </div>
                        <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
                            <ChevronRight size={22} className="text-slate-400" />
                        </div>
                    </div>

                    {/* Dynamic Dots */}
                    {slides.length > 1 && (
                        <div className="absolute bottom-3 right-8 flex gap-1.5 items-center">
                            {slides.map((_, idx) => (
                                <motion.div
                                    key={idx}
                                    layout
                                    className={`h-1.5 rounded-full ${idx === currentIndex ? 'bg-blue-600' : 'bg-slate-200'}`}
                                    animate={{ width: idx === currentIndex ? 18 : 6 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
// TABS CONTENT
const HomeTab = ({ navigate, onNavigate, currentLocation, onLocationClick }) => {
    const { user, allHospitals: authHospitals } = useAuth();
    const [hospitals, setHospitals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [sortBy, setSortBy] = useState('distance'); // 'distance', 'cost', 'rating'
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Priority to hospitals synced in AuthContext (Real-time)
                if (authHospitals && authHospitals.length > 0) {
                    setHospitals(authHospitals);
                    setIsLoading(false);
                    return;
                }

                const data = await getHospitals();
                setHospitals(data.length > 0 ? data : mockHospitals);
            } catch (err) {
                console.error("Firestore error:", err);
                setHospitals(mockHospitals);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [authHospitals]);

    const handleCategorySelect = (catId) => {
        if (selectedCategory === catId) setSelectedCategory(null);
        else setSelectedCategory(catId);
    };

    // Filter logic
    const filteredHospitals = (hospitals || []).filter(h => {
        const textToSearch = searchTerm.toLowerCase();

        // 1. Match Search Term (Name or Specialty)
        const nameMatch = (h.name || '').toLowerCase().includes(textToSearch);
        const hospitalSpecialties = h.doctors ? h.doctors.map(d => d.specialty || '') : [];
        const specialtyMatch = hospitalSpecialties.some(s => s.toLowerCase().includes(textToSearch));

        // 2. Match Category
        let categoryMatch = true;
        if (selectedCategory) {
            const categoryMap = {
                'cardiology': ['cardiologist', 'heart'],
                'orthopedics': ['orthopedic', 'bone', 'muscle'],
                'pediatrics': ['pediatrician', 'child', 'baby'],
                'dermatology': ['dermatologist', 'skin'],
                'neurology': ['neurologist', 'brain'],
                'general': ['rmp doctor', 'general physician', 'consultation'],
                'ent': ['ent specialist', 'ophthalmologist', 'eye specialist'],
                'lab': ['pathology', 'diagnostic', 'lab'],
            };

            const targetSpecialties = categoryMap[selectedCategory] || [];
            categoryMatch = hospitalSpecialties.some(s =>
                targetSpecialties.some(t => s.toLowerCase().includes(t))
            ) || (selectedCategory === 'lab' && h.facilities?.some(f => f.toLowerCase().includes('lab')));
        }

        return (nameMatch || specialtyMatch) && categoryMatch;
    });

    const isBirthday = () => {
        if (!user?.birthDate) return false;
        const today = new Date();
        const birth = new Date(user.birthDate);
        return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
    };

    const categories = [
        { id: 'all', name: t('all') || 'All', icon: <Grid size={18} /> },
        { id: 'cardiology', name: t('specialties.cardiology'), icon: <Heart size={18} /> },
        { id: 'orthopedics', name: t('specialties.orthopedics'), icon: <Bike size={18} /> },
        { id: 'pediatrics', name: t('specialties.pediatrics'), icon: <Baby size={18} /> },
        { id: 'dermatology', name: t('specialties.dermatology'), icon: <Eye size={18} /> },
        { id: 'neurology', name: t('specialties.neurology'), icon: <FlaskConical size={18} /> },
        { id: 'general', name: t('specialties.general'), icon: <Stethoscope size={18} /> },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // Custom ease-out
            className="pb-24"
        >
            <Header
                variant="home"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                currentLocation={currentLocation}
                onLocationClick={onLocationClick}
                onProfileClick={() => onNavigate('profile')}
                onNotifClick={() => onNavigate('updates')}
                onLangClick={() => onNavigate('profile')}
            />

            <div className="px-5">
                {/* Unified Reminders Section - Today's Priority */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                                {t('todays_reminders')}
                            </h3>
                            <div style={{ height: '3px', width: '20px', backgroundColor: 'var(--p-500)', borderRadius: '2px', marginTop: '2px' }} />
                        </div>
                    </div>

                    <div className="relative overflow-hidden px-1">
                        <ReminderCarousel onNavigate={onNavigate} />
                    </div>
                </div>

                {searchTerm.length === 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                                    {t('find_specialist')}
                                </h3>
                                <div style={{ height: '3px', width: '20px', backgroundColor: 'var(--p-500)', borderRadius: '2px', marginTop: '2px' }} />
                            </div>
                            <button style={{ color: 'var(--p-600)', fontSize: '12px', fontWeight: '700', padding: '0 4px' }}>{t('see_all')}</button>
                        </div>

                        {/* Pill Style Category Toolbar */}
                        <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-2 -mx-5 px-5">
                            {categories.map((cat) => {
                                const isActive = (selectedCategory === cat.id) || (cat.id === 'all' && !selectedCategory);
                                return (
                                    <motion.button
                                        key={cat.id}
                                        onClick={() => cat.id === 'all' ? setSelectedCategory(null) : handleCategorySelect(cat.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all border whitespace-nowrap shrink-0 ${isActive
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                            : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                                    >
                                        <span className={isActive ? 'text-white' : 'text-blue-500'}>
                                            {cat.icon}
                                        </span>
                                        <span className="text-[13px] font-bold tracking-tight">
                                            {cat.name}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Floating Glass Filter Bar */}
                <AnimatePresence>
                    {selectedCategory && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="sticky top-6 z-50 mb-10 flex gap-2 p-1.5 glass rounded-full shadow-lg"
                        >
                            {['distance', 'cost', 'rating'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setSortBy(option)}
                                    className={`flex-1 py-3 px-3 rounded-full text-[12px] font-bold capitalize transition-all border-none ${sortBy === option
                                        ? 'bg-p-600 text-white shadow-md'
                                        : 'text-muted'
                                        }`}
                                >
                                    {t(option)}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-4">
                    <div className="flex justify-between items-center mb-6">
                        <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                            {searchTerm ? t('search_results') : (selectedCategory ? t('best_specialists') : t('hospitals_nearby'))}
                        </h3>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            background: 'var(--p-100)',
                            color: 'var(--p-700)',
                            padding: '4px 10px',
                            borderRadius: '10px'
                        }}>
                            {filteredHospitals.length} {t('found')}
                        </span>
                    </div>

                    <div className="flex flex-col gap-4">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="card-premium h-48 skeleton" />
                            ))
                        ) : filteredHospitals.length > 0 ? (
                            filteredHospitals
                                .sort((a, b) => {
                                    if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
                                    if (sortBy === 'rating') return b.rating - a.rating;
                                    return 0;
                                })
                                .map((hospital, index) => (
                                    <motion.div
                                        key={hospital.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <HospitalCard
                                            hospital={hospital}
                                            onClick={() => navigate(`/hospital/${hospital.id}`)}
                                        />
                                    </motion.div>
                                ))
                        ) : (
                            <div className="text-center py-16 px-6 card-premium glass border-dashed">
                                <div className="bg-p-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <Search size={32} className="text-p-600" strokeWidth={2.5} />
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>{t('found_no_hospitals')}</h4>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>{t('try_different_category')}</p>
                                <button
                                    onClick={() => { setSelectedCategory(null); setSearchTerm(''); }}
                                    className="px-8 py-3.5 btn-primary rounded-2xl text-sm border-none cursor-pointer"
                                >
                                    {t('reset_discovery')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </motion.div >
    );
};

const AppointmentCountdown = ({ targetTime }) => {
    const { t } = useTranslation();
    const calculateSeconds = (t) => {
        if (!t) return 0;
        const now = new Date();
        const [time, modifier] = t.split(' ');
        let [hours, minutes] = time.split(':');

        if (hours === '12') {
            hours = modifier === 'AM' ? '00' : '12';
        } else if (modifier === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }

        const target = new Date();
        target.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        const diff = Math.floor((target.getTime() - now.getTime()) / 1000);
        return diff > 0 ? diff : 0;
    };
    const [timeLeft, setTimeLeft] = useState(calculateSeconds(targetTime));

    useEffect(() => {
        // Initial sync
        setTimeLeft(calculateSeconds(targetTime));

        const interval = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [targetTime]);

    const formatDuration = (s) => {
        if (s <= 0) return t('starting_now');
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;

        if (h > 0) return `${h}h ${m}m ${sec}s`;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            animate={{ scale: [1, 1.015, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="mt-3 p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-2.5 shadow-sm"
        >
            <Clock size={16} className={`text-orange-500 ${timeLeft > 0 ? "animate-pulse" : ""}`} />
            <div>
                <p className="text-[11px] font-bold text-orange-800 uppercase tracking-wide">
                    {timeLeft > 0 ? t('starts_in') : t('session_status')}
                </p>
                <AnimatePresence mode="popLayout">
                    <motion.p
                        key={timeLeft}
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -5, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`font-black text-orange-500 font-mono tracking-tight ${timeLeft > 3600 ? 'text-base' : 'text-lg'}`}
                    >
                        {formatDuration(timeLeft)}
                    </motion.p>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};


const CheckoutView = ({ store, onConfirm, onCancel }) => {
    const { t } = useTranslation();
    const itemTotal = 450;
    const deliveryFee = store.deliveryFee || 25;
    const taxes = 18.50;
    const grandTotal = itemTotal + deliveryFee + taxes;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '20px', paddingBottom: '100px', backgroundColor: '#fff', minHeight: '100vh' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', paddingTop: '20px' }}>
                <button onClick={onCancel} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '8px' }}>{t('review_order')}</h1>
            </div>

            <div style={{ backgroundColor: '#f9fafb', borderRadius: '24px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <img src={store.image} alt={store.name} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                    <div>
                        <h3 style={{ fontWeight: 'bold', fontSize: '18px' }}>{store.name}</h3>
                        <p style={{ fontSize: '12px', color: '#666' }}>{store.address}</p>
                    </div>
                </div>

                <div style={{ borderTop: '1px dashed #ddd', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: '#666' }}>{t('medicine_item_total')}</span>
                        <span>₹{itemTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: '#666' }}>{t('delivery_fee')}</span>
                        <span>₹{deliveryFee.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: '#666' }}>{t('taxes_gst')}</span>
                        <span>₹{taxes.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '4px' }}>
                        <span>{t('grand_total')}</span>
                        <span style={{ color: 'var(--primary-color)' }}>₹{grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div style={{ backgroundColor: '#fff7ed', padding: '16px', borderRadius: '16px', border: '1px solid #ffedd5', marginBottom: '32px', display: 'flex', gap: '12px' }}>
                <div style={{ color: '#f97316' }}><Zap size={20} fill="#f97316" /></div>
                <p style={{ fontSize: '12px', color: '#9a3412', fontWeight: '500' }}>{t('free_delivery_promo')}</p>
            </div>

            <Button size="block" onClick={() => onConfirm(store.name)}>{t('place_order_pay')}</Button>
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '16px' }}>
                {t('terms_of_service_agreement')}
            </p>
        </motion.div>
    );
};

const DeliveryTrackingView = ({ order, onComplete }) => {
    const { t } = useTranslation();
    const { orders } = useAuth();
    const [isCalling, setIsCalling] = useState(false);
    const [callTime, setCallTime] = useState(0);

    // Get live status from global state
    const liveOrder = orders.find(o => o.id === order.id) || order;

    const statuses = ['Confirmed', 'Preparing', 'Out for delivery', 'Delivered'];

    // Map string status to index
    const statusIndex = Math.max(0, statuses.indexOf(liveOrder.status));

    const displayStatuses = [
        t('order_confirmed'),
        t('preparing_medicines'),
        t('out_for_delivery'),
        t('items_delivered')
    ];


    // Simulated Call Timer
    React.useEffect(() => {
        let interval;
        if (isCalling) {
            interval = setInterval(() => {
                setCallTime(prev => prev + 1);
            }, 1000);
        } else {
            setCallTime(0);
        }
        return () => clearInterval(interval);
    }, [isCalling]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCall = () => {
        setIsCalling(true);
    };

    const endCall = () => {
        setIsCalling(false);
    };

    // Simulated Map Logic
    const progress = (statusIndex / (statuses.length - 1)) * 100;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingBottom: '100px', position: 'relative' }}
        >
            {/* Calling Overlay */}
            <AnimatePresence>
                {isCalling && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 40%, #eff6ff 100%)',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '4px solid white', marginBottom: '24px', boxShadow: '0 0 40px rgba(16, 185, 129, 0.2)' }}>
                            <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200" alt="Partner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Ramesh Kumar</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '18px', marginBottom: '40px' }}>{callTime > 0 ? formatTime(callTime) : t('calling')}</p>

                        <div style={{ display: 'flex', gap: '40px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <button style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MicOff size={28} />
                                </button>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('mute')}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <button
                                    onClick={endCall}
                                    style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ef4444', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.4)', cursor: 'pointer' }}
                                >
                                    <PhoneOff size={28} />
                                </button>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{t('end')}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Live Map Box */}
            <div style={{
                height: '350px',
                backgroundColor: '#e2e8f0',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(rgba(100, 116, 139, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 116, 139, 0.05) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {/* Simulated Path */}
                <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <path d="M 50 175 Q 240 100 430 175" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="8 8" />
                </svg>

                {/* Store Point */}
                <div style={{ position: 'absolute', left: '40px', top: '175px', transform: 'translateY(-50%)', textAlign: 'center' }}>
                    <div style={{ backgroundColor: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', boxShadow: 'var(--shadow-sm)', whiteSpace: 'nowrap' }}>
                        {order.storeName}
                    </div>
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#3b82f6', border: '3px solid white', borderRadius: '50%', boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }} />
                </div>

                {/* Home Point */}
                <div style={{ position: 'absolute', right: '40px', top: '175px', transform: 'translateY(-50%)', textAlign: 'center' }}>
                    <div style={{ backgroundColor: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', boxShadow: 'var(--shadow-sm)', whiteSpace: 'nowrap' }}>
                        {t('your_location')}
                    </div>
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#ef4444', border: '3px solid white', borderRadius: '50%', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }} />
                </div>

                {/* Delivery Driver Icon */}
                <motion.div
                    animate={{
                        left: `${40 + (progress * 3.5)}px`,
                        top: `${175 - Math.sin((progress / 100) * Math.PI) * 50}px`
                    }}
                    transition={{ duration: 1, ease: "linear" }}
                    style={{
                        position: 'absolute',
                        transform: 'translate(-50%, -100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <div style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '50%',
                        marginBottom: '4px',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Bike size={24} />
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#059669', backgroundColor: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: '6px' }}>
                        {statusIndex >= 2 ? t('driving') : t('waiting')}
                    </div>
                </motion.div>

                {/* Top Controls Overlay */}
                <button
                    onClick={onComplete}
                    style={{ position: 'absolute', top: '24px', left: '20px', backgroundColor: 'white', border: 'none', padding: '12px', borderRadius: '50%', boxShadow: 'var(--shadow-md)', cursor: 'pointer' }}
                >
                    <ArrowLeft size={20} />
                </button>
            </div>

            {/* Tracking Card */}
            <div style={{ marginTop: '-40px', position: 'relative', zIndex: 10, padding: '0 20px' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '32px', padding: '24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.06)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937' }}>{displayStatuses[statusIndex]}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                            <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                            <p style={{ color: '#059669', fontSize: '14px', fontWeight: '600' }}>
                                {statusIndex === 3 ? t('delivered_successfully') : t('estimated_delivery', { minutes: 20 - statusIndex * 5 })}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
                        {displayStatuses.map((_, i) => (
                            <div key={i} style={{
                                flex: 1,
                                height: '6px',
                                borderRadius: '3px',
                                backgroundColor: i <= statusIndex ? '#10b981' : '#f1f5f9'
                            }} />
                        ))}
                    </div>


                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '24px', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid #f1f5f9' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                            <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100" alt="Partner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e2937' }}>Ramesh Kumar</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                <p style={{ fontSize: '12px', color: '#64748b' }}>4.9 • {t('2_5k_deliveries')}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleCall}
                            style={{ backgroundColor: '#10b981', color: 'white', border: 'none', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)', cursor: 'pointer' }}
                        >
                            <Phone size={20} fill="white" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


const UpdatesTab = ({ onNavigate }) => {
    const { t } = useTranslation();
    const { appointments, announcements, medicalCamps, registerForCamp } = useAuth();
    const [filter, setFilter] = useState('all');

    const handleRegister = (id) => {
        const res = registerForCamp(id);
        if (res.success) alert(t('successfully_registered_for_camp'));
        else alert(res.message);
    };

    const combinedFeed = [
        ...announcements.map(a => ({ ...a, feedType: 'announcement' })),
        ...medicalCamps.map(c => ({ ...c, feedType: 'camp' }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const filteredFeed = filter === 'all'
        ? combinedFeed
        : combinedFeed.filter(item => (filter === 'announcements' ? item.feedType === 'announcement' : item.feedType === 'camp'));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', position: 'relative' }}>
            <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-slate-100/50 px-6 pt-12 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <Megaphone className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Schedule & Feed</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Updates • Appointments</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-40">
                <div className="p-6 space-y-10">
                    {/* Schedule Section */}
                    <section>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2">Confirmed Bookings</h3>
                        <motion.div layout className="space-y-6">
                            <AnimatePresence mode="popLayout">
                                {(appointments || []).length > 0 ? (
                                    appointments.map(appt => (
                                        <motion.div
                                            key={appt.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm hover:shadow-md transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${appt.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                    {appt.status || 'Verified'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-300">ID: {appt.id?.slice(-8).toUpperCase()}</span>
                                            </div>
                                            <h4 className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">Dr. {appt.doctorName}</h4>
                                            <p className="text-xs font-bold text-slate-400 mb-6">{appt.hospitalName}</p>

                                            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Calendar size={14} /></div>
                                                    <span className="text-[11px] font-black text-slate-800">{appt.date}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Clock size={14} /></div>
                                                    <span className="text-[11px] font-black text-slate-800">{appt.time}</span>
                                                </div>
                                            </div>
                                            {appt.status === 'Accepted' && <AppointmentCountdown targetTime={appt.time} />}
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 flex flex-col items-center justify-center opacity-40 text-center grayscale">
                                        <Calendar size={48} className="mb-4 text-slate-300" />
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Schedule is Empty</p>
                                        <button onClick={() => onNavigate('home')} className="mt-4 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">Book an Appointment</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </section>

                    {/* Feed Section */}
                    <section>
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Health Intelligence</h3>
                            <div className="flex gap-2">
                                {['all', 'announcements', 'camps'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${filter === f ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <motion.div layout className="space-y-6">
                            <AnimatePresence mode="popLayout">
                                {(filteredFeed || []).length > 0 ? (
                                    filteredFeed.map(item => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                            className={`p-8 rounded-[40px] border shadow-sm transition-all hover:shadow-md ${item.feedType === 'camp' ? 'bg-emerald-50/30 border-emerald-100/50' : 'bg-white border-slate-100'}`}
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${item.feedType === 'camp' ? 'bg-emerald-500 text-white shadow-emerald-500/10' : 'bg-blue-600 text-white shadow-blue-600/10'}`}>
                                                    {item.feedType === 'camp' ? 'Public Health Event' : item.type || 'Official Update'}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-300">{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Active Now'}</span>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{item.title}</h4>
                                            <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">{item.description || item.services}</p>

                                            <div className="flex flex-wrap gap-4 p-4 bg-white/40 rounded-3xl border border-white mb-6">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    <span className="text-[11px] font-black text-slate-700">{item.location}</span>
                                                </div>
                                                {item.feedType === 'camp' && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-slate-400" />
                                                        <span className="text-[11px] font-black text-slate-700">{item.date}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {item.feedType === 'camp' && (
                                                <button
                                                    onClick={() => handleRegister(item.id)}
                                                    className="w-full py-4 rounded-2xl bg-emerald-500 text-white text-[11px] font-black shadow-xl shadow-emerald-500/20 active:scale-95 transition-all uppercase tracking-widest"
                                                >
                                                    Secure Spotted • {item.registeredCount || 0}/{item.limit || 100} Filled
                                                </button>
                                            )}
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center justify-center opacity-30 text-center grayscale">
                                        <Megaphone size={48} className="mb-4 text-slate-300" />
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Active Broadcasts</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </section>
                </div>
            </div>
        </div>
    );
};

const AIAssistantTab = ({ onNavigate }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        { role: 'model', text: t('ai_assistant_intro') || "Hello! I am your HealthLink AI Assistant. How can I help you today? You can ask me health questions, or upload a prescription to analyze." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const scrollRef = React.useRef(null);
    const fileInputRef = React.useRef(null);

    // Voice Recognition Setup
    const [recognition, setRecognition] = useState(null);

    React.useEffect(() => {
        if (window.webkitSpeechRecognition || window.SpeechRecognition) {
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';

            rec.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsRecording(false);
            };

            rec.onerror = () => setIsRecording(false);
            rec.onend = () => setIsRecording(false);

            setRecognition(rec);
        }
    }, []);

    const toggleRecording = () => {
        if (!recognition) return alert("Speech recognition not supported in this browser.");
        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
            setIsRecording(true);
        }
    };

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (customText = null) => {
        const textToSend = customText || input;
        if (!textToSend.trim() || isLoading) return;

        const userMsg = { role: 'user', text: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const { getAIResponse } = await import('../utils/AIService');
            const aiResponse = await getAIResponse([...messages, userMsg], 'patient');
            setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: t('ai_error_message') }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setShowAIModal(true);
        setAiLoading(true);
        setAiAnalysis('');

        try {
            const { identifyMedicine, analyzePrescription } = await import('../utils/AIService');
            // Check if user specifically asked for medicine identification or if we should just try prescription
            const isMedicine = window.confirm("Is this a medicine photo? (Click Cancel if it's a prescription)");

            let result;
            if (isMedicine) {
                result = await identifyMedicine(file);
            } else {
                result = await analyzePrescription(file);
            }

            setAiAnalysis(result);
        } catch (error) {
            setAiAnalysis("Sorry, I couldn't process the image. Please try again.");
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', position: 'relative' }}>
            {/* Glassmorphism Header */}
            <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-slate-100/50 px-6 pt-12 pb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Bot className="text-white" size={28} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">vArogra AI</h1>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-100">Live Assistant</span>
                                <span className="text-[10px] font-bold text-slate-400">v2.5.0 Premium</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-40">
                <div className="p-6 space-y-6">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                layout
                                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                    opacity: { duration: 0.2 }
                                }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] p-5 rounded-[28px] text-sm font-bold leading-relaxed shadow-sm transition-all ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-600/10'
                                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none hover:shadow-md'
                                    }`}>
                                    {msg.text.split('\n').map((line, idx) => (
                                        <p key={idx} className={idx > 0 ? "mt-2" : ""}>{line}</p>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="bg-white border border-slate-100 p-5 rounded-[28px] rounded-tl-none flex items-center gap-3 shadow-sm">
                                <div className="flex gap-1">
                                    {[0, 1, 2].map(dot => (
                                        <motion.div
                                            key={dot}
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ repeat: Infinity, duration: 0.8, delay: dot * 0.1 }}
                                            className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing</span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </div>

            {/* Futuristic Glass Control Bar */}
            <div className="fixed bottom-32 left-0 right-0 px-6 z-40">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/80 backdrop-blur-2xl p-3 rounded-[32px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.15)] border border-white flex items-center gap-3"
                >
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-90"
                    >
                        <Camera size={22} />
                    </button>

                    <div className="flex-1 relative flex items-center gap-2 bg-slate-50 rounded-2xl px-5 py-4">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Consult symptoms or ask AI..."
                            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                        />
                        <button
                            onClick={toggleRecording}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white text-blue-600 shadow-sm'
                                }`}
                        >
                            {isRecording ? <Square size={16} fill="white" /> : <Mic size={20} />}
                        </button>
                    </div>

                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/30 active:scale-90 transition-all disabled:grayscale disabled:opacity-30"
                    >
                        {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={22} strokeWidth={2.5} />}
                    </button>
                </motion.div>
                {isRecording && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[9px] font-black text-red-500 text-center mt-3 uppercase tracking-[0.3em] animate-pulse"
                    >
                        AI System Listening...
                    </motion.p>
                )}
            </div>

            <AIAnalyzerModal
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                analysis={aiAnalysis}
                loading={aiLoading}
            />
        </div>
    );
};

const StoreTab = () => {
    const { t } = useTranslation();
    const { appointments, placeOrder, allMedicalStores: medicalStores } = useAuth();
    const [showSuccess, setShowSuccess] = useState(false);
    const [storeSearch, setStoreSearch] = useState('');
    const [uploading, setUploading] = useState(false);
    const [selectionMode, setSelectionMode] = useState(null); // 'manual' | 'auto'
    const [checkoutStore, setCheckoutStore] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null);

    // AI Analysis State
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    const prescriptions = (appointments || []).filter(a => a.status === 'Prescribed' && a.prescription);

    const filteredStores = (medicalStores || []).filter(s =>
        (s.name || '').toLowerCase().includes(storeSearch.toLowerCase()) ||
        (s.address || '').toLowerCase().includes(storeSearch.toLowerCase())
    );

    const initiateCheckout = (store) => {
        setCheckoutStore(store);
    };

    const handleOrder = (storeName = t('the_selected_store')) => {
        setCheckoutStore(null);
        setShowSuccess(true);

        // Save order to global state for Merchant Dashboard
        const newOrder = placeOrder({
            storeName,
            storeId: checkoutStore?.id || 'ms1',
            total: 493.50, // Simulated total from checkout
            items: ['Amoxicillin', 'Paracetamol'] // Simulated items
        });

        setTimeout(() => {
            setShowSuccess(false);
            setSelectionMode(null);
            setActiveOrder(newOrder); // Use the global order object
        }, 2000);
    };


    const handleAutoSelect = () => {
        setUploading(true);
        setSelectionMode('auto');
        setTimeout(() => {
            // Find store with highest priceScore (best for customer)
            const cheapestStore = [...medicalStores].sort((a, b) => b.priceScore - a.priceScore)[0];
            setUploading(false);
            initiateCheckout(cheapestStore);
        }, 2000);
    };

    const handleUploadPrescription = () => {
        setUploading(true);
        setTimeout(() => {
            setUploading(false);
            setSelectionMode('manual');
        }, 1500);
    };

    const handleAIScan = async () => {
        setAiLoading(true);
        setShowAIModal(true);
        const result = await analyzePrescription('dummy_uri');
        setAiAnalysis(result);
        setAiLoading(false);
    };

    if (activeOrder) {
        return <DeliveryTrackingView order={activeOrder} onComplete={() => setActiveOrder(null)} />;
    }

    if (checkoutStore) {
        return <CheckoutView store={checkoutStore} onConfirm={handleOrder} onCancel={() => setCheckoutStore(null)} />;
    }

    return (
        <div style={{ paddingBottom: '100px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header / Search */}
            <div style={{ backgroundColor: '#fff', padding: '40px 20px 20px', borderBottom: '1px solid #eee' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>{t('pharmacy_store')}</h1>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: '#f3f4f6',
                    padding: '12px 16px',
                    borderRadius: '12px'
                }}>
                    <Search size={20} color="#9ca3af" />
                    <input
                        type="text"
                        placeholder={t('search_medicines_stores_placeholder')}
                        value={storeSearch}
                        onChange={(e) => setStoreSearch(e.target.value)}
                        style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
                    />
                </div>
            </div>

            <div style={{ padding: '20px' }}>
                {/* Selection Logic Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                    <div
                        onClick={handleAutoSelect}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            borderRadius: '20px',
                            padding: '16px',
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}
                    >
                        <Zap size={24} fill="white" />
                        <div>
                            <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{t('smart_select')}</p>
                            <p style={{ fontSize: '10px', opacity: 0.8 }}>{t('choose_best_price_automatically')}</p>
                        </div>
                    </div>

                    <div
                        onClick={handleAIScan}
                        style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                            borderRadius: '20px',
                            padding: '16px',
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}
                    >
                        <Bot size={24} color="#3b82f6" />
                        <div>
                            <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{t('ai_analyzer')}</p>
                            <p style={{ fontSize: '10px', opacity: 0.8 }}>{t('scan_explain_prescription')}</p>
                        </div>
                    </div>

                    <div
                        onClick={handleUploadPrescription}
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: '20px',
                            padding: '16px',
                            color: '#1f2937',
                            border: '2px dashed #e5e7eb',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            gridColumn: 'span 2'
                        }}
                    >
                        <Plus size={24} color="#3b82f6" />
                        <div>
                            <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{t('compare_stores')}</p>
                            <p style={{ fontSize: '10px', color: '#9ca3af' }}>{t('select_store_manually')}</p>
                        </div>
                    </div>
                </div>

                {uploading && (
                    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e0f2fe', borderRadius: '16px', marginBottom: '24px' }}>
                        <Loader2 className="animate-spin" style={{ margin: '0 auto', marginBottom: '8px' }} color="#3b82f6" />
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0369a1' }}>{t('searching_best_prices')}</p>
                    </div>
                )}

                {/* Nearby Stores Section */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectionMode === 'manual' ? t('choose_a_store') : t('nearby_medical_stores')}</h3>
                        <span style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '600' }}>{selectionMode === 'manual' ? t('select_one') : t('see_all')}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredStores.map(store => (
                            <div key={store.id} style={{
                                backgroundColor: '#fff',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                boxShadow: 'var(--shadow-sm)',
                                border: selectionMode === 'manual' ? '2px solid #3b82f6' : '1px solid #eee',
                                display: 'flex',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                                onClick={() => selectionMode === 'manual' && initiateCheckout(store)}
                            >
                                <img src={store.image} alt={store.name} style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                                <div style={{ padding: '12px', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ fontWeight: 'bold', fontSize: '16px' }}>{store.name}</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '6px' }}>
                                            <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e' }}>{store.rating}</span>
                                        </div>
                                    </div>
                                    <p style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>{store.address}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981' }}>{store.deliveryTime}</span>
                                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>• {store.distance}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: '8px' }}>
                                            <DollarSign size={12} color="#15803d" />
                                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#15803d' }}>{t('price_match')} {store.priceScore}%</span>
                                        </div>
                                    </div>
                                </div>
                                {!store.isOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: 'rgba(255,255,255,0.7)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 5
                                    }}>
                                        <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{t('closed')}</span>
                                    </div>
                                )}
                                {selectionMode === 'manual' && (
                                    <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center' }}>
                                        <ChevronRight size={24} color="#3b82f6" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* My Active Prescriptions */}
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>{t('digital_prescriptions')}</h3>
                    {prescriptions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {prescriptions.map(appt => (
                                <div key={appt.prescription.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{appt.prescription.medicine}</span>
                                        <span style={{ fontSize: '12px', color: '#10b981' }}>{t('order_now')}</span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#666' }}>{t('by_dr')} {appt.doctorName}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#9ca3af', fontSize: '14px' }}>{t('no_digital_prescriptions_yet')}</p>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            zIndex: 1000,
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            fontWeight: 'bold'
                        }}
                    >
                        🚀 {t('order_placed_successfully')}
                    </motion.div>
                )}
            </AnimatePresence>

            <AIAnalyzerModal
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                analysis={aiAnalysis}
                loading={aiLoading}
            />
        </div>
    );
};

const AIAnalyzerModal = ({ isOpen, onClose, analysis, loading }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                <div className="p-8 pb-4 border-b border-slate-100 flex justify-between items-center bg-p-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-p-600 flex items-center justify-center">
                            <Bot className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-main leading-tight">{t('ai_prescription_analyzer')}</h3>
                            <p className="text-[10px] font-bold text-p-600 uppercase tracking-widest">{t('varogra_smart_brain')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-white shadow-sm border border-slate-100 text-muted">
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-p-100 border-t-p-600 rounded-full animate-spin mb-6" />
                            <p className="font-bold text-main animate-pulse">{t('analyzing_prescription')}</p>
                            <p className="text-xs text-muted mt-2">{t('identifying_medicines_instructions')}</p>
                        </div>
                    ) : (
                        <div className="prose prose-slate prose-sm max-w-none">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6 font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {analysis}
                            </div>
                            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-100 flex gap-4">
                                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                                <p className="text-[11px] font-bold text-amber-800 leading-snug">
                                    {t('informational_only_disclaimer')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 pt-4 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl bg-main text-white font-black text-sm shadow-xl active:scale-95 transition-transform"
                    >
                        {t('got_it_thanks')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};


const MedicalHistoryTab = () => {
    const { t } = useTranslation();
    const { appointments } = useAuth();
    const history = appointments.filter(a => a.status === 'Completed' || a.status === 'Prescribed' || a.status === 'Accepted');

    return (
        <div className="pb-32 px-6 pt-4 animate-entrance">
            <h2 className="text-3xl font-black text-main tracking-tight mb-8">{t('medical_history')}</h2>

            <motion.div layout className="flex flex-col gap-6">
                <AnimatePresence mode="popLayout">
                    {(history || []).length > 0 ? (
                        history.map((item, index) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30, delay: index * 0.03 }}
                                className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm overflow-hidden relative"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-[10px] font-black text-p-600 uppercase tracking-widest mb-1 block">{t('hospital')}</span>
                                        <h3 className="font-black text-main text-lg">{item.hospitalName || 'Health Center'}</h3>
                                    </div>
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-p-50 text-p-700'}`}>
                                        {item.status || 'Past'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-50 block mb-1">{t('doctor')}</span>
                                        <p className="text-sm font-bold text-main">{item.doctorName || 'Dr. Specialist'}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-50 block mb-1">{t('date_time')}</span>
                                        <p className="text-sm font-bold text-main">{item.date || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle size={14} className="text-p-600" />
                                        <span className="text-[10px] font-black text-main uppercase tracking-widest">{t('reason_for_visit')}</span>
                                    </div>
                                    <p className="text-xs font-medium text-muted leading-relaxed">
                                        {item.symptoms || item.reason || 'General health checkup and routine consultation.'}
                                    </p>
                                </div>

                                {item.prescription && (
                                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package size={14} className="text-emerald-600" />
                                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{t('prescribed_medicines')}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(item.prescription.medicine || '').split(',').map((med, idx) => (
                                                <span key={idx} className="px-2 py-1 rounded-lg bg-white border border-emerald-100 text-[10px] font-bold text-emerald-800">
                                                    {med.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end">
                                    <button className="flex items-center gap-2 text-p-600 text-xs font-black uppercase tracking-wider active:scale-95 transition-transform">
                                        {t('view_summary')}
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center opacity-30 text-center">
                            <FileText size={48} className="mb-4" />
                            <p className="font-bold">{t('no_history')}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

const ProfileTab = ({ user, logout }) => {
    const { t, i18n } = useTranslation();
    const [isEditingPhoto, setIsEditingPhoto] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [tempPhoto, setTempPhoto] = useState(null);
    const [error, setError] = useState('');

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const handlePhotoSave = async () => {
        console.log("Attempting to save photo...");
        console.log("User:", user);
        console.log("Photo:", tempPhoto);

        if (!tempPhoto) {
            console.warn("No photo to save");
            return;
        }

        const userId = user?.uid || user?.id; // Fallback for legacy/demo users

        if (!userId) {
            console.error("No user ID found");
            setError("User identification failed");
            return;
        }

        setError('');
        try {
            const downloadURL = await uploadProfilePhoto(userId, tempPhoto, (progress) => {
                setUploadProgress(progress);
            });
            await updateUserProfilePhoto(userId, downloadURL);
            setIsEditingPhoto(false);
            setUploadProgress(0);
            setTempPhoto(null);
        } catch (err) {
            console.error("Upload failed", err);
            setError(`Failed to upload photo: ${err.message}`);
            setUploadProgress(0);
        }
    };

    return (
        <div className="pb-32 animate-entrance">
            {/* Profile Header */}
            <div className="relative mb-8">
                <div className="h-40 bg-gradient-to-r from-p-600 to-p-500 rounded-b-[40px] shadow-lg shadow-p-600/20" />
                <div className="px-6 -mt-12 flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-xl mb-4 overflow-hidden">
                            <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-slate-400" />
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditingPhoto(true)}
                            className="absolute bottom-4 right-0 w-8 h-8 rounded-full bg-p-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-90"
                        >
                            <Camera size={16} />
                        </button>
                    </div>
                    <h2 className="text-2xl font-black text-main">{user?.name || user?.displayName}</h2>
                    <p className="text-sm font-bold text-muted opacity-80">{user?.phone || user?.email || '+91 98765 43210'}</p>
                </div>
            </div>

            {/* Photo Upload Modal */}
            <AnimatePresence>
                {isEditingPhoto && (
                    <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !uploadProgress && setIsEditingPhoto(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="relative w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-main">Update Profile Photo</h3>
                                <button
                                    disabled={uploadProgress > 0}
                                    onClick={() => setIsEditingPhoto(false)}
                                    className="p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <ImageUpload
                                image={tempPhoto}
                                onImageChange={setTempPhoto}
                                progress={uploadProgress}
                                className="mb-6"
                            />

                            {error && <p className="text-red-500 text-xs font-bold mb-4 text-center">{error}</p>}

                            <div className="flex gap-4">
                                <button
                                    disabled={uploadProgress > 0}
                                    onClick={() => setIsEditingPhoto(false)}
                                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!tempPhoto || uploadProgress > 0}
                                    onClick={handlePhotoSave}
                                    className="flex-1 py-4 rounded-2xl bg-p-600 text-white font-bold text-sm shadow-lg shadow-p-200 disabled:opacity-50"
                                >
                                    {uploadProgress > 0 ? 'Saving...' : 'Save Photo'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Language Switcher */}
            <div className="px-6 mb-8">
                <h3 className="text-sm font-black text-main uppercase tracking-widest mb-4 opacity-50 px-2">{t('language')}</h3>
                <div className="flex gap-2">
                    {[
                        { code: 'en', label: 'English' },
                        { code: 'te', label: 'తెలుగు' },
                        { code: 'hi', label: 'हिन्दी' }
                    ].map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all ${i18n.language === lang.code ? 'bg-p-600 text-white shadow-lg' : 'bg-white text-muted border border-slate-100'}`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-6 flex flex-col gap-4">
                {[
                    { icon: User, label: t('edit_profile') || 'Edit Profile' },
                    { icon: FileText, label: t('medical_history') },
                    { icon: ShieldCheck, label: t('privacy_security') || 'Privacy & Security' },
                    { icon: Bot, label: t('help_support') || 'Help & Support' },
                ].map((item, i) => (
                    <button key={i} className="flex items-center gap-4 p-4 rounded-[24px] bg-white border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors active:scale-95 group">
                        <div className="w-10 h-10 rounded-2xl bg-p-50 flex items-center justify-center group-hover:bg-p-100 transition-colors">
                            <item.icon size={20} className="text-p-600" />
                        </div>
                        <span className="flex-1 text-left text-sm font-bold text-main">{item.label}</span>
                        <ChevronRight size={18} className="text-slate-300" />
                    </button>
                ))}
                <div className="flex flex-col gap-2">
                    <button className="flex items-center justify-between p-5 rounded-3xl bg-white border border-slate-100/50 shadow-sm active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Search size={20} />
                            </div>
                            <span className="font-bold text-main">{t('find_specialist')}</span>
                        </div>
                        <ChevronRight size={18} className="text-slate-300" />
                    </button>

                    <button className="flex items-center justify-between p-5 rounded-3xl bg-white border border-slate-100/50 shadow-sm active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Settings size={20} />
                            </div>
                            <span className="font-bold text-main">{t('settings')}</span>
                        </div>
                        <ChevronRight size={18} className="text-slate-300" />
                    </button>
                </div>
                {/* Logout Button */}
                <button
                    onClick={logout}
                    className="mt-4 flex items-center gap-4 p-4 rounded-[24px] bg-red-50 border border-red-100 shadow-sm active:scale-95 transition-transform group"
                >
                    <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                        <LogOut size={20} className="text-red-500" />
                    </div>
                    <span className="flex-1 text-left text-sm font-bold text-red-600">{t('logout')}</span>
                </button>

                <p className="text-center text-[10px] font-bold text-muted opacity-40 mt-4">
                    Version 2.4.0 • Build 2026.02
                </p>
            </div>
        </div>
    );
};


const PatientDashboard = () => {
    const navigate = useNavigate();
    const { user, logout, loading } = useAuth();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('home');
    const [notif, setNotif] = useState(null);
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState('Mancherial, Telangana');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showVoice, setShowVoice] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [activeVoiceBooking, setActiveVoiceBooking] = useState(null);

    const handleVoiceAssistant = () => {
        console.log("SOS Voice Assistant Triggered");
        setShowVoice(true);
    };

    const handleTabChange = (tab) => {
        if (tab === 'voice') {
            setShowVoice(true);
            return;
        }
        setActiveTab(tab);
    };

    // Tab Sync Logic
    const location = useLocation();
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && ['home', 'appointments', 'doctor', 'store', 'profile'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [location.search]);

    // Request Location Permission on Mount
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log("Location obtained:", latitude, longitude);

                    try {
                        // Using OpenStreetMap's Nominatim API for free reverse geocoding
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
                        const data = await response.json();

                        if (data && data.address) {
                            const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown';
                            const state = data.address.state || '';
                            const locationString = state ? `${city}, ${state}` : city;

                            setSelectedLocation(locationString);
                            setNotif(t('location_enabled') || `Location updated to ${locationString}`);
                        } else {
                            setNotif(t('location_enabled') || "Location services enabled");
                        }
                    } catch (geocodingError) {
                        console.error("Geocoding failed:", geocodingError);
                        setNotif(t('location_enabled') || "Location services enabled");
                    }

                    setTimeout(() => setNotif(null), 3000);
                },
                (error) => {
                    console.warn("Location permission denied or error:", error);
                }
            );
        }
    }, [t]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login/patient');
        }
    }, [user, loading, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login/patient');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="animate-spin text-p-600" size={32} />
            </div>
        );
    }

    if (!user) return null; // Should be handled by useEffect redirect

    return (
        <div className="container overflow-x-hidden">
            <AnimatePresence>
                {notif && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 10 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-5 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] z-[2000] p-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-3 border border-white/10 glass"
                    >
                        <div className="w-10 h-10 rounded-xl bg-p-500/20 flex items-center justify-center">
                            <Bot size={20} className="text-p-400" />
                        </div>
                        <p className="text-xs font-bold">{notif}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showVoice && (
                    <VoiceAssistant
                        isOpen={showVoice}
                        onClose={() => setShowVoice(false)}
                        onBookingSuccess={(bookingData) => {
                            setActiveVoiceBooking(bookingData || { doctor: "Dr. Sharma", hospital: "Apollo", slot: "10:30 AM" });
                            setShowVoice(false);
                            setShowPayment(true);
                        }}
                    />
                )}
            </AnimatePresence>

            {showPayment && (
                <PaymentScreen
                    appointment={activeVoiceBooking}
                    onBack={() => setShowPayment(false)}
                    onPaymentSuccess={() => {
                        setShowPayment(false);
                        setShowDetails(true);
                    }}
                />
            )}

            {showDetails && (
                <AppointmentDetails
                    appointment={activeVoiceBooking}
                    onBack={() => setShowDetails(false)}
                    onCancel={() => {
                        setShowDetails(false);
                        setNotif("Appointment cancelled");
                        setTimeout(() => setNotif(null), 3000);
                    }}
                />
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    <SafeErrorBoundary>
                        {activeTab === 'home' && (
                            <HomeTab
                                navigate={navigate}
                                onNavigate={setActiveTab}
                                currentLocation={selectedLocation}
                                onLocationClick={() => setIsLocationOpen(true)}
                            />
                        )}
                        {activeTab === 'ai-assistant' && <AIAssistantTab onNavigate={setActiveTab} />}
                        {activeTab === 'updates' && <UpdatesTab onNavigate={setActiveTab} />}
                        {activeTab === 'store' && <StoreTab />}
                        {activeTab === 'profile' && <ProfileTab user={user} logout={() => setShowLogoutConfirm(true)} />}
                        {activeTab === 'medicine' && <MedicineSearch />}
                    </SafeErrorBoundary>
                </motion.div>
            </AnimatePresence>

            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} onVoiceAssistant={handleVoiceAssistant} />

            <LocationPicker
                isOpen={isLocationOpen}
                onClose={() => setIsLocationOpen(false)}
                onSelect={setSelectedLocation}
                currentCity={selectedLocation}
            />

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                title={t('confirm_logout')}
                message={t('logout_message')}
                confirmText={t('logout')}
                cancelText={t('cancel')}
            />
        </div>
    );
};

export default PatientDashboard;
