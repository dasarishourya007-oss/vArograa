import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Calendar, Clock, MapPin, User, LogOut, Package, Video,
    AlertCircle, Send, Bot, Loader2, ShoppingBag, ShoppingCart,
    Search, Upload, Star, Navigation, Navigation2, Plus, Minus, FileText, Zap, DollarSign, ChevronRight, Award,
    Bike, CheckCircle, Map, ArrowLeft, ArrowRight, Phone, PhoneOff, MicOff, ShieldCheck, CloudUpload, History, HelpCircle,
    Stethoscope, Heart, Baby, Eye, FlaskConical, Grid, Ear, Megaphone, Settings, Camera, X, Mic, Volume2, Square, Sun, ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';
import SafeErrorBoundary from '../components/SafeErrorBoundary';
import VoiceAssistant from '../components/VoiceAssistant';
import PaymentScreen from './PaymentScreen';
import AppointmentDetails from './AppointmentDetails';
import { getAIResponse, analyzePrescription, identifyMedicine } from '../services/aiService';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import { hospitals as mockHospitals, medicalStores as mockMedicalStores } from '../utils/mockData';
import { getHospitals, getDoctors, uploadProfilePhoto } from '../firebase/services';
import { updateUserProfilePhoto } from '../firebase/auth';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import LocationPicker from '../components/LocationPicker';
import HospitalCard from '../components/HospitalCard';
import MapComponent from '../components/MapComponent';
import { AISOSButton, VitalsCard, AITriageHistory } from '../components/patient/vArograFeatures';
import Button from '../components/Button';
import AddressSetupModal from '../components/patient/AddressSetupModal';
import EditProfileView from '../components/patient/tabs/EditProfileView';
import MedicalHistoryView from '../components/patient/tabs/MedicalHistoryView';
import SupportView from '../components/patient/tabs/SupportView';
import SettingsView from '../components/patient/tabs/SettingsView';
import FeedbackModal from '../components/patient/FeedbackModal';
import { recordConsultationFeedback } from '../firebase/services';

const ACTIVE_APPOINTMENT_STATUSES = ['pending', 'approved', 'confirmed', 'accepted'];
const INACTIVE_APPOINTMENT_STATUSES = ['completed', 'rejected', 'cancelled', 'canceled'];
const ACTIVE_ORDER_STATUSES = ['pending', 'preparing', 'out for delivery', 'confirmed'];

const parseReminderDateTime = (dateValue, timeValue, fallbackValue = null) => {
    if (dateValue) {
        const dateStr = String(dateValue).slice(0, 10);
        const baseDate = new Date(`${dateStr}T00:00:00`);
        if (!Number.isNaN(baseDate.getTime())) {
            if (timeValue) {
                const timeText = String(timeValue).trim();
                const meridianMatch = timeText.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

                if (meridianMatch) {
                    let hours = Number(meridianMatch[1]);
                    const minutes = Number(meridianMatch[2]);
                    const meridian = meridianMatch[3].toUpperCase();
                    if (meridian === 'PM' && hours < 12) hours += 12;
                    if (meridian === 'AM' && hours === 12) hours = 0;
                    baseDate.setHours(hours, minutes, 0, 0);
                    return baseDate;
                }

                const directDate = new Date(`${dateStr}T${timeText}`);
                if (!Number.isNaN(directDate.getTime())) {
                    return directDate;
                }
            }

            return baseDate;
        }
    }

    if (!fallbackValue) return null;
    const fallbackDate = new Date(fallbackValue);
    return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
};

const getReminderUrgency = (minutesUntil) => {
    if (minutesUntil !== null && minutesUntil <= 15) {
        return { color: 'bg-rose-500', glow: 'shadow-rose-500/20', tagColor: 'text-rose-600' };
    }

    if (minutesUntil !== null && minutesUntil <= 60) {
        return { color: 'bg-amber-500', glow: 'shadow-amber-500/20', tagColor: 'text-amber-600' };
    }

    return { color: 'bg-emerald-500', glow: 'shadow-emerald-500/20', tagColor: 'text-emerald-600' };
};

// Carousel Component for Today's Reminders
const ReminderCarousel = ({ onNavigate }) => {
    const { t } = useTranslation();
    const { appointments, orders, medicalCamps, campRegistrations } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const today = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);
    // 1. Upcoming Appointments
    const activeAppt = (appointments || [])
        .map(a => {
            const normalizedStatus = String(a.status || '').toLowerCase();
            const scheduleAt = parseReminderDateTime(a.date, a.time, a.timestamp || a.createdAt);
            const minutesUntil = scheduleAt ? Math.round((scheduleAt.getTime() - currentTime.getTime()) / 60000) : null;

            return {
                ...a,
                normalizedStatus,
                scheduleAt,
                minutesUntil
            };
        })
        .filter(a => {
            if (INACTIVE_APPOINTMENT_STATUSES.includes(a.normalizedStatus)) return false;
            if (!ACTIVE_APPOINTMENT_STATUSES.includes(a.normalizedStatus)) return false;
            if (!a.scheduleAt) return true;
            return a.scheduleAt >= today;
        })
        .sort((a, b) => {
            if (a.scheduleAt && b.scheduleAt) return a.scheduleAt - b.scheduleAt;
            if (a.scheduleAt) return -1;
            if (b.scheduleAt) return 1;
            return new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0);
        })[0];
    // 2. Active Orders
    const activeOrder = (orders || [])
        .map(o => ({
            ...o,
            normalizedStatus: String(o.status || '').toLowerCase(),
            orderedAt: parseReminderDateTime(null, null, o.timestamp || o.createdAt || currentTime)
        }))
        .filter(o => ACTIVE_ORDER_STATUSES.includes(o.normalizedStatus))
        .sort((a, b) => new Date(b.orderedAt || 0) - new Date(a.orderedAt || 0))[0];
    // 3. Registered Upcoming Camps
    // Match registrations with camps to get details, then filter by date
    const registeredCamps = campRegistrations.map(reg => {
        const camp = medicalCamps.find(c => c.id === reg.campId);
        return camp;
    }).filter(c => {
        if (!c) return false;
        if (!c.timestamp) return true; // fallback
        const campDate = new Date(c.timestamp);
        return campDate >= today;
    });
    const upcomingCamp = registeredCamps.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0];
    const appointmentUrgency = getReminderUrgency(activeAppt?.minutesUntil ?? null);
    const slides = [
        activeAppt && {
            type: 'appointments',
            icon: <Clock size={24} className="text-white animate-pulse" />,
            color: appointmentUrgency.color,
            glow: appointmentUrgency.glow,
            tag: activeAppt.minutesUntil !== null && activeAppt.minutesUntil <= 15 ? 'STARTING SOON' : 'BOOKED APPOINTMENT',
            tagColor: appointmentUrgency.tagColor,
            bg: 'bg-white',
            borderColor: 'border-slate-100',
            title: `Dr. ${activeAppt?.doctorName || t('specialist')}`,
            desc: `${activeAppt?.time || ''} • ${activeAppt?.hospitalName || ''}`
        },
        activeOrder && {
            type: 'store',
            icon: <Package size={24} className="text-white animate-pulse" />,
            color: 'bg-emerald-500',
            glow: 'shadow-emerald-500/20',
            tag: 'BOOKED MEDICINE',
            tagColor: 'text-emerald-600',
            bg: 'bg-white',
            borderColor: 'border-emerald-100',
            title: activeOrder?.storeName || t('track_order'),
            desc: `${activeOrder?.storeName || ''} • ${activeOrder?.status || ''}`
        },
        upcomingCamp && {
            type: 'camps', // or wherever camps should navigate to
            icon: <MapPin size={24} className="text-white animate-pulse" />,
            color: 'bg-blue-500',
            glow: 'shadow-blue-500/20',
            tag: t('upcoming_camp') || 'UPCOMING CAMP',
            tagColor: 'text-blue-500',
            bg: 'bg-white',
            borderColor: 'border-blue-100',
            title: upcomingCamp.title || upcomingCamp.hospitalName || 'Health Camp',
            desc: `${upcomingCamp.date || ''} • ${upcomingCamp.location || ''}`
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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 text-center rounded-[32px] bg-white border border-slate-100 flex flex-col items-center justify-center gap-3 shadow-md"
        >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-500 mb-1">
                <Sun size={24} className="text-emerald-500" strokeWidth={2.5} />
            </div>
            <h4 className="text-[16px] font-black text-slate-800 tracking-tight">Have a great day!</h4>
            <p className="text-[13px] font-bold text-slate-500 max-w-[200px] leading-snug">
                You have no upcoming medical activities today.
            </p>
        </motion.div>
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
const HomeTab = ({ navigate, onNavigate, currentLocation, onLocationClick, viewMode, setViewMode }) => {
    const { user, nearbyHospitals: authNearbyHospitals, loadingHospitals: authLoadingHospitals, allDoctors, userLoc, detectLocation } = useAuth();
    const [hospitals, setHospitals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [sortBy, setSortBy] = useState('distance'); // 'distance', 'cost', 'rating'
    const [triageLogs, setTriageLogs] = useState([]);
    const { t } = useTranslation();
    // Re-sync with auth discovery state
    useEffect(() => {
        setHospitals(authNearbyHospitals || []);
    }, [authNearbyHospitals]);
    const isLoading = authLoadingHospitals;
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
    // Removed shadowing viewMode state
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
                viewMode={viewMode}
                setViewMode={setViewMode}
            />
            <div className="px-5">
                {/* Unified Reminders Section - Today's Priority */}
                {viewMode === 'map' ? (
                    <div className="mt-4" style={{ height: 'calc(100vh - 200px)', borderRadius: '32px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <MapComponent
                            markers={filteredHospitals.map(h => ({
                                ...h,
                                position: [h.latitude, h.longitude],
                                title: h.name,
                                image: h.image,
                                distance: h.distance
                            }))}
                            userLocation={userLoc ? [userLoc.lat, userLoc.lng] : null}
                            onLocateMe={detectLocation}
                            center={userLoc ? [userLoc.lat, userLoc.lng] : (filteredHospitals.length > 0 ? [filteredHospitals[0].latitude, filteredHospitals[0].longitude] : [17.3850, 78.4867])}
                            zoom={13}
                        />
                    </div>
                ) : (
                    <>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
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
                                        .map((hospital, index) => {
                                            return (
                                                <motion.div
                                                    key={hospital.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true, margin: "-50px" }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className="mb-8"
                                                >
                                                    <HospitalCard
                                                        hospital={hospital}
                                                        onClick={() => navigate(`/hospital/${hospital.id}`)}
                                                    />
                                                </motion.div>
                                            )
                                        })
                                ) : (
                                    <div className="text-center py-20 px-8 card-premium glass border-dashed">
                                        <div className="bg-rose-50 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm">
                                            <MapPin size={40} className="text-rose-500" strokeWidth={2} />
                                        </div>
                                        <h4 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                                            No hospitals available in your area.
                                        </h4>
                                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '280px', margin: '0 auto 32px', fontWeight: '500' }}>
                                            We couldn't find any vArogra-linked hospitals in {user?.location || 'your area'}. Try updating your location in profile.
                                        </p>
                                        <button
                                            onClick={() => navigate('/profile')}
                                            className="px-8 py-4 btn-primary rounded-2xl text-sm font-bold border-none transition-all active:scale-95 flex items-center gap-2 mx-auto"
                                        >
                                            Update My Location
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
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
    const [bookingFor, setBookingFor] = useState('self');
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [cart, setCart] = useState({});
    const [activeCategory, setActiveCategory] = useState('All');
    const [customRequest, setCustomRequest] = useState('');
    const [prescriptionFile, setPrescriptionFile] = useState(null);
    const [orderStep, setOrderStep] = useState('selection'); // selection, sent, checkout
    const [loading, setLoading] = useState(false);
    const categories = ['All', ...new Set((store.inventory || []).map(i => i.category).filter(Boolean))];
    const updateCart = (medId, delta) => {
        setCart(prev => {
            const current = prev[medId] || 0;
            const next = Math.max(0, current + delta);
            if (next === 0) {
                const { [medId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [medId]: next };
        });
    };
    const cartItems = Object.entries(cart).map(([id, qty]) => {
        const item = store.inventory?.find(i => i.id === id);
        return { ...item, qty };
    });
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const deliveryFee = 30;
    const total = subtotal > 0 ? subtotal + deliveryFee : 0;
    const handleSendOrder = () => {
        setLoading(true);
        // Simulate real store communication network
        const timer = setTimeout(() => {
            setLoading(false);
            setOrderStep('checkout');
        }, 2200);
    };
    const handleFinalConfirm = () => {
        setLoading(true);
        setTimeout(() => {
            onConfirm({
                storeName: store.name,
                storeId: store.id,
                total,
                items: cartItems.map(i => `${i.name} (${i.qty})`),
                receiverName: bookingFor === 'other' ? receiverName : null,
                receiverPhone: bookingFor === 'other' ? receiverPhone : null,
                customRequest,
                hasPrescription: !!prescriptionFile
            });
            setLoading(false);
        }, 1500);
    };
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 40 }}
                    className="relative bg-white w-full max-w-lg max-h-[85vh] rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
                >
                    {/* Header Image Area */}
                    <div className="relative h-60 shrink-0">
                        <img src={store.image || 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=600'} className="w-full h-full object-cover" alt={store.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=600'; }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />

                        <button
                            onClick={onCancel}
                            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all border border-white/20"
                        >
                            <X size={20} />
                        </button>
                        <div className="absolute bottom-8 left-10 right-10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{store.name}</h2>
                                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
                                        <MapPin size={12} className="text-blue-500" />
                                        {(store.address || store.location || 'Unknown Location').split(',')[0]}
                                    </div>
                                </div>
                                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-white flex items-center gap-1.5">
                                    <Star size={14} fill="#f59e0b" className="text-amber-500" />
                                    <span className="text-sm font-black text-slate-900">{store.rating || '4.5'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-10 pt-6 space-y-8">
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { icon: Clock, label: 'Mins', value: store.deliveryTime || '25-35', color: 'text-blue-500' },
                                { icon: Navigation2, label: 'KM Away', value: store.distance || '2.4', color: 'text-purple-500' },
                                { icon: DollarSign, label: 'Value', value: `${store.priceScore || '98'}%`, color: 'text-emerald-500' }
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white border border-slate-100 rounded-[24px] p-5 flex flex-col items-center justify-center gap-1 hover:shadow-md transition-all">
                                    <stat.icon size={18} className={stat.color} />
                                    <span className="text-sm font-black text-slate-900">{stat.value}</span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                        {/* Mode Switcher */}
                        <div className="bg-slate-50 p-1.5 rounded-full flex gap-1 border border-slate-100/50">
                            <button
                                onClick={() => setOrderStep('selection')}
                                className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orderStep === 'selection' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                            >
                                INVENTORY
                            </button>
                            <button
                                onClick={() => setOrderStep('custom')}
                                className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orderStep === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                            >
                                REQUEST CUSTOM
                            </button>
                        </div>
                        {orderStep === 'selection' ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Zap size={14} className="text-blue-500 fill-blue-500/10" />
                                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">POPULAR MEDICINES</h3>
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">Live Stock</span>
                                </div>

                                <div className="space-y-3">
                                    {(store.inventory || []).map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            className="bg-white border border-slate-50 p-4 rounded-[32px] flex items-center gap-5 hover:shadow-xl hover:shadow-slate-200/20 transition-all group"
                                        >
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                                                <Package size={24} className="text-slate-300" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[18px] font-black text-slate-900 tracking-tight truncate">{item.name.split(' ')[0]}</h4>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                                    <p className="text-[14px] font-bold text-slate-500">₹{item.price}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <AnimatePresence>
                                                    {cart[item.id] > 0 && (
                                                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                                                            <button onClick={() => updateCart(item.id, -1)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"><Minus size={14} /></button>
                                                            <span className="text-sm font-black text-slate-900">{cart[item.id]}</span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <button
                                                    onClick={() => updateCart(item.id, 1)}
                                                    className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg active:shadow-inner"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ) : orderStep === 'custom' ? (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest px-4">Medicines List / Notes</h3>
                                    <textarea
                                        placeholder="Example: Dolo 650 (2 strips), Paracetamol (10 tablets)..."
                                        value={customRequest}
                                        onChange={(e) => setCustomRequest(e.target.value)}
                                        className="w-full h-40 p-8 rounded-[40px] bg-white border border-slate-100 text-[16px] font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-slate-50 outline-none resize-none shadow-sm"
                                    />
                                </div>
                                <div className="relative">
                                    <input type="file" id="rx-upload" className="hidden" onChange={(e) => setPrescriptionFile(e.target.files[0])} />
                                    <label
                                        htmlFor="rx-upload"
                                        className="flex flex-col items-center justify-center gap-4 w-full p-12 rounded-[48px] border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer group shadow-sm"
                                    >
                                        <div className="w-16 h-16 rounded-[24px] bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Camera size={28} className="text-blue-500" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[18px] font-black text-slate-900">{prescriptionFile ? prescriptionFile.name : 'Upload Prescription'}</p>
                                            <p className="text-[12px] font-bold text-slate-400 mt-2 uppercase tracking-widest">JPG, PNG OR PDF (MAX 5MB)</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-4">
                                    <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest px-2">Delivery Details</h3>
                                    <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100/50">
                                        <button
                                            onClick={() => setBookingFor('self')}
                                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${bookingFor === 'self' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            For Myself
                                        </button>
                                        <button
                                            onClick={() => setBookingFor('other')}
                                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${bookingFor === 'other' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            For Others
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {bookingFor === 'other' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                                                <input type="text" placeholder="Receiver's Full Name" value={receiverName} onChange={e => setReceiverName(e.target.value)} className="w-full bg-white p-4 rounded-xl border border-slate-100 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                                                <input type="tel" placeholder="Receiver's Phone Number" value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)} className="w-full bg-white p-4 rounded-xl border border-slate-100 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                                            <CheckCircle size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-md font-black text-slate-900 tracking-tight">Order Summary</h3>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ready for Shipment</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {cartItems.map(item => (
                                            <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400">x{item.qty}</div>
                                                    <span className="text-sm font-black text-slate-800">{item.name}</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-900">₹{item.price * item.qty}</span>
                                            </div>
                                        ))}

                                        <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Subtotal</span>
                                                <span>₹{subtotal}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Delivery Fee</span>
                                                <span>₹{deliveryFee}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-lg font-black text-slate-900">Grand Total</span>
                                                <span className="text-2xl font-black text-blue-600 tracking-tighter">₹{total}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 rounded-[28px] bg-violet-50 border border-violet-100 flex gap-4">
                                    <AlertCircle size={20} className="text-violet-600 shrink-0" />
                                    <p className="text-[12px] font-bold text-violet-800 leading-relaxed">
                                        Our pharmacist will verify your prescription before dispatch. Final price may adjust slightly.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                    {/* Bottom Floating Bar */}
                    {(subtotal > 0 || orderStep === 'custom' || orderStep === 'checkout') && (
                        <div className="p-10 pt-0 bg-white sticky bottom-0 border-t border-slate-50">
                            <motion.button
                                whileTap={(orderStep === 'custom' && !customRequest && !prescriptionFile) ? {} : { scale: 0.95 }}
                                onClick={(orderStep === 'custom' && !customRequest && !prescriptionFile) ? null : (orderStep === 'checkout' ? handleFinalConfirm : handleSendOrder)}
                                disabled={orderStep === 'custom' && !customRequest && !prescriptionFile}
                                className={`w-full p-6 rounded-[32px] flex items-center transition-all ${
                                    (orderStep === 'custom' && !customRequest && !prescriptionFile)
                                        ? 'bg-slate-400 text-white cursor-not-allowed justify-center shadow-none'
                                        : 'bg-slate-900 text-white shadow-2xl hover:shadow-slate-900/40 justify-between'
                                }`}
                            >
                                {orderStep === 'custom' || subtotal === 0 ? (
                                    <div className="flex-1 text-center font-black tracking-tight text-lg flex items-center justify-center gap-2">
                                        {loading ? 'Processing...' : (orderStep === 'checkout' ? 'Confirm Request' : 'Send Order Request')}
                                        {!loading && <ChevronRight size={20} />}
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Order</p>
                                            <p className="text-2xl font-black tracking-tighter">₹{total}</p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white/10 px-8 py-4 rounded-2xl group-hover:bg-blue-600 transition-all">
                                            <span className="text-[11px] font-black uppercase tracking-widest">
                                                {loading ? 'Processing...' : (orderStep === 'checkout' ? 'Confirm Payment' : 'Review & Send')}
                                            </span>
                                            {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                                        </div>
                                    </>
                                )}
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
const DeliveryTrackingView = ({ order, onComplete }) => {
    const { t } = useTranslation();
    const { orders, updateOrderStatus } = useAuth();
    const [isCalling, setIsCalling] = useState(false);
    const [callTime, setCallTime] = useState(0);
    const liveOrder = orders.find(o => o.id === order.id) || order;
    const statuses = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered'];
    const statusIndex = Math.max(0, statuses.indexOf(liveOrder.status));
    const displayStatuses = [
        { id: 'Pending', label: 'Order Received', icon: Clock, color: 'text-blue-500' },
        { id: 'Preparing', label: 'Store Packing', icon: Package, color: 'text-amber-500' },
        { id: 'Out for Delivery', label: 'On the Way', icon: MapPin, color: 'text-emerald-500' },
        { id: 'Delivered', label: 'Fulfilled', icon: CheckCircle, color: 'text-p-600' }
    ];
    useEffect(() => {
        let timer;
        if (isCalling) {
            timer = setInterval(() => setCallTime(prev => prev + 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isCalling]);

    // Simulated Bot Accept for Pharmacy Order
    useEffect(() => {
        if (liveOrder.status === 'Pending') {
            const botAcceptTimer = setTimeout(() => {
                if (updateOrderStatus) {
                    updateOrderStatus(liveOrder.id, 'Preparing');
                }
            }, 120000); // 2 minutes
            return () => clearTimeout(botAcceptTimer);
        }
    }, [liveOrder.status, liveOrder.id, updateOrderStatus]);
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    const progress = (statusIndex / (statuses.length - 1)) * 100;
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col bg-slate-50 min-h-screen"
        >
            {/* Map Area */}
            <div className="relative h-[45vh] w-full bg-slate-200">
                <MapComponent markers={[
                    { id: 'store', lat: 17.4435, lng: 78.3772, type: 'hospital', name: liveOrder.storeName },
                    { id: 'driver', lat: 17.4500, lng: 78.3800, type: 'doctor', name: 'Delivery Partner' }
                ]} />

                <button
                    onClick={onComplete}
                    className="absolute top-12 left-6 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-800 shadow-xl active:scale-90 transition-all z-10"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                            <img src={liveOrder.driver?.photo || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100"} alt="Driver" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900">{liveOrder.driver?.name || 'Arjun Sharma'}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivery Partner • 4.9�</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCalling(true)}
                        className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 active:scale-90 transition-all"
                    >
                        <Phone size={20} />
                    </button>
                </div>
            </div>
            {/* Status Panel */}
            <div className="flex-1 bg-white rounded-t-[48px] -mt-10 px-8 pt-10 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] relative z-20">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 lowercase tracking-tighter">Order {liveOrder.id}</h2>
                        <p className="text-[10px] font-black text-p-600 uppercase tracking-[0.2em] mt-1">Estimating {liveOrder.deliveryTime || '15 mins'}</p>
                    </div>
                    <div className="w-16 h-16 rounded-3xl bg-p-50 flex flex-col items-center justify-center">
                        <span className="text-[8px] font-black text-p-400 uppercase">Items</span>
                        <span className="text-xl font-black text-p-600">{liveOrder.items?.length || 0}</span>
                    </div>
                </div>
                {/* Tracking Progress */}
                <div className="relative mb-12">
                    <div className="absolute top-5 left-0 right-0 h-1 bg-slate-100 rounded-full">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-p-600 rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                        />
                    </div>
                    <div className="flex justify-between relative">
                        {displayStatuses.map((s, i) => {
                            const Icon = s.icon;
                            const isActive = i <= statusIndex;
                            return (
                                <div key={s.id} className="flex flex-col items-center gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-white shadow-xl scale-110 border border-p-100' : 'bg-slate-50'}`}>
                                        <Icon size={18} className={isActive ? s.color : 'text-slate-200'} />
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-wider text-center max-w-[60px] ${isActive ? 'text-slate-900' : 'text-slate-200'}`}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* Details Card */}
                <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Delivery Summary</h5>
                    <div className="space-y-3">
                        {liveOrder.items?.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm font-bold text-slate-700">
                                <span>{item}</span>
                                <span className="opacity-40">x1</span>
                            </div>
                        ))}
                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-[11px] font-black text-slate-900 uppercase">Total Paid</span>
                            <span className="text-lg font-black text-p-600">₹{liveOrder.total || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Calling Overlay */}
            <AnimatePresence>
                {isCalling && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] bg-slate-900 flex flex-col items-center justify-between p-20 text-white"
                    >
                        <div className="flex flex-col items-center gap-8 mt-20">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500 p-2 shadow-2xl shadow-emerald-500/20">
                                    <img src={liveOrder.driver?.photo || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100"} className="w-full h-full object-cover rounded-full" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                                    <Phone size={18} />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-3xl font-black lowercase tracking-tighter mb-2">{liveOrder.driver?.name || 'Arjun Sharma'}</h3>
                                <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-xs">Calling Security Line...</p>
                                <p className="text-6xl font-black mt-10 tracking-tighter tabular-nums">{formatTime(callTime)}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCalling(false)}
                            className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/30 active:scale-95 transition-all text-white"
                        >
                            <PhoneOff size={32} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
const UpdatesTab = ({ onNavigate }) => {
    const { t } = useTranslation();
    const { appointments, announcements, medicalCamps, registerForCamp, orders } = useAuth();
    const [activeSubTab, setActiveSubTab] = useState('schedule');
    const [filter, setFilter] = useState('all');
    const [activeOrder, setActiveOrder] = useState(null);
    const activeDeliveries = (orders || []).filter(o => o.status !== 'Delivered');
    if (activeOrder) {
        return <DeliveryTrackingView order={activeOrder} onComplete={() => setActiveOrder(null)} />;
    }
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
    
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setNotification(null);
    }, []);

    const activeOrdersList = (orders || []).filter(o => o.status !== 'Delivered').map(o => ({
        ...o,
        isPharmacyOrder: true,
        date: new Date(o.timestamp || Date.now()).toLocaleDateString(),
        time: new Date(o.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hospitalName: o.storeName,
        doctorName: 'Pharmacy Request'
    }));
    
    const allBookings = [...(appointments || []), ...activeOrdersList];
    
    const parseBookingDate = (b) => {
        if (b.timestamp) return new Date(b.timestamp);
        const parsed = new Date(`${b.date} ${b.time}`);
        return isNaN(parsed.getTime()) ? new Date(0) : parsed;
    };

    const futureBookings = allBookings.filter(b => parseBookingDate(b) > currentTime)
        .sort((a,b) => parseBookingDate(a) - parseBookingDate(b));

    const pastBookings = allBookings.filter(b => parseBookingDate(b) <= currentTime)
        .sort((a,b) => parseBookingDate(b) - parseBookingDate(a));

    const featuredAppt = futureBookings.length > 0 ? futureBookings[0] : null;
    const upcomingBookingsList = [...futureBookings.slice(1), ...pastBookings];
    const isDataLoading = false;
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
            color: '#1e293b',
            fontFamily: 'Outfit, sans-serif'
        }}>
            {/* Header Tabs */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 pt-12 pb-4">
                <div className="flex justify-center gap-12">
                    <button
                        onClick={() => setActiveSubTab('schedule')}
                        className={`text-sm font-black uppercase tracking-widest pb-2 transition-all border-b-2 ${activeSubTab === 'schedule' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent'}`}
                    >
                        My Schedule
                    </button>
                    <button
                        onClick={() => setActiveSubTab('feed')}
                        className={`text-sm font-black uppercase tracking-widest pb-2 transition-all border-b-2 ${activeSubTab === 'feed' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent'}`}
                    >
                        Health Feed
                    </button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                <AnimatePresence mode="wait">
                    {activeSubTab === 'schedule' ? (
                        <motion.div
                            key="schedule"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="p-6 space-y-8"
                        >
                            <AnimatePresence>
                                {notification && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -20 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -20 }}
                                        className="bg-blue-600 text-white px-4 py-3 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center gap-3 text-sm font-bold"
                                    >
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        {notification}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Today's Priority / Featured Appointment */}
                            <section>
                                {isDataLoading ? (
                                    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm animate-pulse h-32" />
                                ) : featuredAppt ? (
                                    (() => {
                                        const getCountdown = () => {
                                            try {
                                                const target = new Date(`${featuredAppt.date} ${featuredAppt.time}`);
                                                const diff = target - currentTime;
                                                if (diff <= 0) return { h: '00', m: '00', s: '00', tooSoon: true };
                                                const h = Math.floor(diff / (1000 * 60 * 60));
                                                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                                const s = Math.floor((diff % (1000 * 60)) / 1000);
                                                return {
                                                    h: h.toString().padStart(2, '0'),
                                                    m: m.toString().padStart(2, '0'),
                                                    s: s.toString().padStart(2, '0'),
                                                    tooSoon: h < 2
                                                };
                                            } catch {
                                                return { h: '00', m: '00', s: '00', tooSoon: false };
                                            }
                                        };
                                        const countdown = getCountdown();
                                        const timeColor = countdown.tooSoon ? 'text-red-500' : 'text-emerald-500';

                                        return (
                                            <motion.div
                                                initial={{ y: 20 }}
                                                animate={{ y: 0 }}
                                                className="bg-white rounded-[32px] p-6 border border-slate-50 shadow-sm relative overflow-hidden space-y-6 mt-2"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                                                        <Clock size={28} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                                                            {featuredAppt.isPharmacyOrder ? 'Next Delivery' : 'Next Appointment'}
                                                        </span>
                                                        <h2 className="text-[22px] font-black tracking-tight text-slate-900 leading-none mt-1 mb-1.5">
                                                            {featuredAppt.isPharmacyOrder ? featuredAppt.doctorName : `Dr. ${featuredAppt.doctorName}`}
                                                        </h2>
                                                        <div className="flex items-center gap-1.5 text-amber-600">
                                                            <MapPin size={12} fill="currentColor" className="fill-amber-600/20"/>
                                                            <p className="text-[12px] font-black lowercase">{featuredAppt.hospitalName || "Hospital Consultation"}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <div className="flex-1 bg-slate-50 rounded-2xl p-4 text-center border border-slate-100/50">
                                                        <p className={`text-2xl font-black tracking-tighter ${timeColor}`}>{countdown.h}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Hours</p>
                                                    </div>
                                                    <div className="flex-1 bg-slate-50 rounded-2xl p-4 text-center border border-slate-100/50">
                                                        <p className={`text-2xl font-black tracking-tighter ${timeColor}`}>{countdown.m}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Mins</p>
                                                    </div>
                                                    <div className="flex-1 bg-slate-50 rounded-2xl p-4 text-center border border-slate-100/50">
                                                        <p className={`text-2xl font-black tracking-tighter ${timeColor}`}>{countdown.s}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Secs</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })()
                                ) : (
                                    <div>
                                        <div className="mb-4 relative inline-block">
                                            <h3 className="text-[15px] font-black tracking-tight text-slate-900">Today's Reminders</h3>
                                            <div className="w-1/3 h-0.5 bg-blue-600 rounded-full mt-1" />
                                        </div>
                                        <div className="py-16 bg-white rounded-[40px] border border-slate-50 shadow-sm text-center">
                                            <div className="text-[40px] font-black tracking-tighter text-slate-800 mb-6">
                                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </div>
                                            <div className="w-12 h-12 rounded-full border border-emerald-100 mx-auto mb-4 flex items-center justify-center">
                                                <Sun size={20} className="text-emerald-500" />
                                            </div>
                                            <h3 className="text-[16px] font-black text-slate-900 tracking-tight mb-2">Have a great day!</h3>
                                            <p className="text-[12px] font-bold text-slate-500">You have no upcoming medical<br/>activities today.</p>
                                        </div>
                                    </div>
                                )}
                            </section>
                            {/* Rest of the Schedule */}
                            <section>
                                <h3 className="text-xl font-black tracking-tight mb-6">Upcoming Visits</h3>
                                <div className="space-y-4">
                                    {(upcomingBookingsList.length > 0) ? (
                                        upcomingBookingsList.map((booking, idx) => (
                                            <motion.div
                                                key={booking.id || idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="bg-white p-5 rounded-[28px] border border-slate-50 flex items-center justify-between group hover:border-blue-500/30 transition-all shadow-sm"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-blue-50/50 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                                                        {booking.isPharmacyOrder ? <Package size={20} /> : <Heart size={20} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-[16px] tracking-tight text-slate-800">
                                                            {booking.isPharmacyOrder ? booking.doctorName : `Dr. ${booking.doctorName}`}
                                                        </h4>
                                                        <p className="text-slate-400 text-[11px] font-bold mt-0.5">{booking.date} at {booking.time}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2 border ${booking.status === 'Confirmed' || booking.status === 'approved'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-orange-50 text-orange-600 border-orange-100'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${booking.status === 'Confirmed' || booking.status === 'approved' ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`} />
                                                    {booking.status}
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center py-10">No other upcoming visits.</p>
                                    )}
                                </div>
                            </section>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="p-6 space-y-10"
                        >
                            {/* Feed Filters */}
                            <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                                {['all', 'announcements', 'camps'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap ${filter === f ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-6">
                                {(filteredFeed || []).length > 0 ? (
                                    filteredFeed.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`p-8 rounded-[40px] border shadow-md ${item.feedType === 'camp' ? 'bg-emerald-50/30 border-emerald-500/10' : 'bg-white border-slate-50'}`}
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${item.feedType === 'camp' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
                                                    {item.feedType === 'camp' ? 'Public Health Event' : item.type || 'Official Update'}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Active Now'}</span>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-800 mb-2 tracking-tight">{item.title}</h4>
                                            <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">{item.description || item.services}</p>
                                            <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 mb-6">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    <span className="text-[11px] font-black text-slate-600">{item.location}</span>
                                                </div>
                                                {item.feedType === 'camp' && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-slate-400" />
                                                        <span className="text-[11px] font-black text-slate-600">{item.date}</span>
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
                                    <div className="py-20 flex flex-col items-center justify-center opacity-30 text-center">
                                        <Megaphone size={48} className="mb-4 text-slate-600" />
                                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No Active Broadcasts</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};
const CountdownBox = ({ value, label }) => (
    <div className="flex flex-col items-center">
        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 flex flex-col items-center justify-center shadow-inner">
            <span className="text-3xl font-black tracking-tighter text-slate-800">{value}</span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">{label}</span>
        </div>
    </div>
);

const COMMON_MEDICINES = [
    { name: 'Paracetamol', use: 'Fever / Pain' },
    { name: 'Azithromycin', use: 'Antibiotic' },
    { name: 'Omeprazole', use: 'Acidity' },
    { name: 'Cetirizine', use: 'Allergy' },
    { name: 'Metformin', use: 'Diabetes' },
    { name: 'Ibuprofen', use: 'Pain / Swelling' },
    { name: 'Amlodipine', use: 'BP' },
    { name: 'Pantoprazole', use: 'Gastric' },
    { name: 'Amoxicillin', use: 'Infection' },
    { name: 'Vitamin D3', use: 'Supplement' },
];

const LANGUAGES = [
    { code: 'en', label: 'EN', full: 'English' },
    { code: 'hi', label: 'हि', full: 'Hindi' },
    { code: 'te', label: 'తె', full: 'Telugu' },
];

const LANG_SYSTEM_PROMPTS = {
    en: 'You are vArogra AI, a helpful medical assistant. Always respond in English.',
    hi: 'आप vArogra AI हैं, एक सहायक चिकित्सा सहायक। हमेशा हिंदी में उत्तर दें।',
    te: 'మీరు vArogra AI, ఒక సహాయక వైద్య సహాయకుడు. ఎల్లప్పుడూ తెలుగులో జవాబు ఇవ్వండి.',
};

const AIAssistantTab = ({ onNavigate }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [selectedLang, setSelectedLang] = useState('en');
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
            rec.lang = selectedLang === 'hi' ? 'hi-IN' : selectedLang === 'te' ? 'te-IN' : 'en-US';
            rec.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsRecording(false);
            };
            rec.onerror = () => setIsRecording(false);
            rec.onend = () => setIsRecording(false);
            setRecognition(rec);
        }
    }, [selectedLang]);

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
            const result = await getAIResponse([...messages, userMsg], 'chat', {}, selectedLang);
            setMessages(prev => [...prev, { role: 'model', text: result.reply }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: t('ai_error_message') || "Sorry, I'm having trouble connecting to the AI. Please try again." }]);
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
            <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-slate-100/50 px-6 pt-12 pb-3">
                <div className="flex items-center justify-between mb-3">
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
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => setSelectedLang(lang.code)}
                                title={lang.full}
                                className={`px-3 py-2 rounded-xl text-[11px] font-black tracking-wide transition-all ${selectedLang === lang.code ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto no-scrollbar -mx-6 px-6">
                    <div className="flex gap-2 pb-2" style={{ width: 'max-content' }}>
                        {COMMON_MEDICINES.map(med => (
                            <button
                                key={med.name}
                                onClick={() => handleSend("Tell me about " + med.name + " - uses, dosage and side effects")}
                                className="flex flex-col items-start px-4 py-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-95 shrink-0"
                            >
                                <span className="text-[12px] font-black text-slate-800">{med.name}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{med.use}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </header>
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-40">
                <div className="max-w-4xl mx-auto p-6 space-y-6">
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
                                    {msg.text.split('\n').map((line, idx) => {
                                        // Detect Markdown Image: ![title](url)
                                        const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
                                        if (imgMatch) {
                                            const title = imgMatch[1];
                                            const url = imgMatch[2];
                                            return (
                                                <div key={idx} className="my-6 space-y-3">
                                                    <div className="rounded-[28px] overflow-hidden border-2 border-slate-100 shadow-xl shadow-slate-200/40 bg-slate-50 relative group">
                                                        <img src={url} alt={title} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
                                                        <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-sm border border-slate-100">
                                                            Visual Guide
                                                        </div>
                                                    </div>
                                                    {title && (
                                                        <div className="px-2">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                                                <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">{title}</h4>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Procedural Record v2.1 • Authenticated</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return <p key={idx} className={idx > 0 ? "mt-3" : ""}>{line}</p>;
                                    })}
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
                <div className="max-w-4xl mx-auto">
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
    const { appointments, placeOrder, allMedicalStores: medicalStores, user } = useAuth();
    const [showSuccess, setShowSuccess] = useState(false);
    const [storeSearch, setStoreSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [checkoutStore, setCheckoutStore] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null);
    // Filter Logic
    const filteredStores = (medicalStores || []).filter(s => {
        const matchesSearch = (s.name || '').toLowerCase().includes(storeSearch.toLowerCase());
        if (activeFilter === 'open') return matchesSearch && s.isOpen;
        if (activeFilter === 'rated') return matchesSearch && s.rating >= 4.5;
        if (activeFilter === 'budget') return matchesSearch && s.priceScore >= 90;
        return matchesSearch;
    });
    if (activeOrder) {
        return <DeliveryTrackingView order={activeOrder} onComplete={() => setActiveOrder(null)} />;
    }
    if (checkoutStore) {
        return <CheckoutView store={checkoutStore} onConfirm={(summary) => {
            const newOrder = placeOrder(summary);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setCheckoutStore(null);
                setActiveOrder(newOrder);
            }, 1500);
        }} onCancel={() => setCheckoutStore(null)} />;
    }
    return (
        <div className="bg-slate-50 min-h-screen pb-40">
            {/* Premium Glassmorphic Header */}
            <div className="sticky top-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-100 px-6 pt-16 pb-8">
                <div className="mb-8">
                    <h2 className="text-[32px] font-black text-slate-900 tracking-tighter leading-none mb-1">Find Pharmacy</h2>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <MapPin size={12} className="text-blue-500 fill-blue-500/10" />
                        Hitech City, Hyderabad
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white/50 px-6 py-5 rounded-[24px] border border-white shadow-xl shadow-slate-200/40 mb-8 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50/50 transition-all">
                    <Search size={22} className="text-slate-400" strokeWidth={3} />
                    <input
                        type="text"
                        placeholder="Search medicines or stores..."
                        value={storeSearch}
                        onChange={(e) => setStoreSearch(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-[15px] font-black text-slate-900 placeholder:text-slate-300"
                    />
                </div>
                <div className="flex overflow-x-auto no-scrollbar gap-3">
                    {[
                        { id: 'near', label: 'Nearby', icon: MapPin },
                        { id: 'budget', label: 'Budget', icon: DollarSign },
                        { id: 'open', label: 'Open Now', icon: Clock },
                        { id: 'rated', label: 'Top Rated', icon: Star }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id)}
                            className={`flex items-center gap-2.5 px-6 py-4 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${activeFilter === f.id ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/10' : 'bg-white/80 text-slate-400 border-white shadow-sm hover:border-slate-200'}`}
                        >
                            {f.icon && <f.icon size={14} className={activeFilter === f.id ? 'text-blue-400' : 'text-slate-300'} />}
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-8">
                <div className="flex justify-between items-end mb-8 px-2">
                    <div>
                        <h2 className="text-[20px] font-black text-slate-900 tracking-tighter mb-1">Nearby Pharmacies</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified by vArogra Network</p>
                    </div>
                    <button className="text-[10px] font-black text-blue-600 underline decoration-blue-200 underline-offset-8 uppercase tracking-[0.2em] hover:text-blue-700 transition-colors">See All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Store Cards */}
                    {filteredStores.length > 0 ? (
                        filteredStores.map(store => (
                            <motion.div
                                key={store.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setCheckoutStore(store)}
                                className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm flex flex-col items-stretch gap-0 hover:shadow-xl transition-all group cursor-pointer relative"
                            >
                                <div className="w-full h-40 shrink-0 bg-slate-100 relative">
                                    <img
                                        src={store.image || 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=200'}
                                        alt={store.name}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=200';
                                        }}
                                    />
                                    <div className="absolute top-2 left-2 bg-emerald-100/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-emerald-200 shadow-sm">
                                        <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest">OPEN</span>
                                    </div>
                                </div>

                                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-slate-900 text-[16px] truncate pr-2 leading-none">{store.name}</h4>
                                            <div className="flex items-center gap-1">
                                                <Star size={10} fill="#f59e0b" className="text-amber-500" />
                                                <span className="text-[12px] font-black text-slate-900">{store.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-400 mt-1 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                                            {store.address}
                                        </p>
                                    </div>
                                    <div className="flex justify-end items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Price Index: {store.priceScore}%</span>
                                            <div className="h-1 w-20 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${store.priceScore}%` }}
                                                    className="h-full bg-emerald-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-20 text-center">
                            <Package size={40} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold">No stores found matches your search</p>
                        </div>
                    )}
                </div>
                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-8 py-4 rounded-full font-black shadow-2xl z-[5000] flex items-center gap-3"
                        >
                            <CheckCircle size={24} />
                            Order Placed!
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
            const AIAnalyzerModal = ({isOpen, onClose, analysis, loading}) => {
    const {t} = useTranslation();
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
    const {t} = useTranslation();
            const {appointments} = useAuth();
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
            const ProfileTab = ({user, logout, profileSubTab, setProfileSubTab, onVoiceAssistant, onLogoutClick}) => {
    const {t, i18n} = useTranslation();
            const [tempPhoto, setTempPhoto] = useState(null);
            const [uploadProgress, setUploadProgress] = useState(0);
            const [error, setError] = useState('');
            const [isEditingPhoto, setIsEditingPhoto] = useState(false);
    const changeLanguage = (lng) => i18n.changeLanguage(lng);
    const handlePhotoSave = async () => {
        if (!tempPhoto) return;
            setUploadProgress(10);
            try {
            const {uploadProfilePhoto: up } = await import('../firebase/services');
            const {updateUserProfilePhoto: ua } = await import('../firebase/auth');
            const downloadURL = await up(user.uid, tempPhoto);
            await ua(user.uid, downloadURL);
            setIsEditingPhoto(false);
            setUploadProgress(0);
            setTempPhoto(null);
        } catch (err) {
                console.error(err);
            setError(`Failed to save: ${err.message}`);
            setUploadProgress(0);
        }
    };
            if (profileSubTab === 'edit') return <EditProfileView user={user} onBack={() => setProfileSubTab('menu')} />;
            if (profileSubTab === 'history') return <MedicalHistoryView user={user} onBack={() => setProfileSubTab('menu')} />;
            if (profileSubTab === 'support') return <SupportView onBack={() => setProfileSubTab('menu')} onVoiceAssistant={onVoiceAssistant} />;
            if (profileSubTab === 'settings') return <SettingsView onBack={() => setProfileSubTab('menu')} />;
            return (
            <div className="pb-32 animate-entrance bg-slate-50/10 min-h-screen">
                <div className="relative mb-8">
                    <div className="h-40 bg-gradient-to-r from-p-600 to-p-500 rounded-b-[40px] shadow-lg shadow-p-600/20" />
                    <div className="px-6 -mt-12 flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-xl mb-4 overflow-hidden">
                                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                    {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <User size={40} className="text-slate-400" />}
                                </div>
                            </div>
                            <button onClick={() => setIsEditingPhoto(true)} className="absolute bottom-4 right-0 w-8 h-8 rounded-full bg-p-600 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90"><Camera size={16} /></button>
                        </div>
                        <h2 className="text-2xl font-black text-main">{user?.displayName || user?.name || t('user')}</h2>
                        <p className="text-sm font-bold text-muted opacity-80">{user?.phone || user?.email}</p>
                    </div>
                </div>
                <AnimatePresence>
                    {isEditingPhoto && (
                        <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !uploadProgress && setIsEditingPhoto(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl overflow-hidden">
                                <div className="flex justify-between mb-6">
                                    <h3 className="text-xl font-black text-main">Update Photo</h3>
                                    <button onClick={() => setIsEditingPhoto(false)} className="p-2 bg-slate-100 text-slate-400 rounded-lg"><X size={20} /></button>
                                </div>
                                <ImageUpload image={tempPhoto} onImageChange={setTempPhoto} progress={uploadProgress} className="mb-6" />
                                {error && <p className="text-red-500 text-xs font-bold mb-4 text-center">{error}</p>}
                                <div className="flex gap-4">
                                    <button onClick={() => setIsEditingPhoto(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm">Cancel</button>
                                    <button onClick={handlePhotoSave} className="flex-1 py-4 rounded-2xl bg-p-600 text-white font-bold text-sm shadow-lg shadow-p-200 disabled:opacity-50">{uploadProgress > 0 ? 'Saving...' : 'Save Photo'}</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                <div className="px-6 mb-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Language</h3>
                    <div className="flex gap-2">
                        {[{ code: 'en', label: 'English' }, { code: 'te', label: 'తెలుగు' }, { code: 'hi', label: 'हिन्दी' }].map((lang) => (
                            <button key={lang.code} onClick={() => changeLanguage(lang.code)} className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${i18n.language === lang.code ? 'bg-p-600 text-white shadow-lg' : 'bg-white text-muted border border-slate-100'}`}>{lang.label}</button>
                        ))}
                    </div>
                </div>
                <div className="px-6 space-y-4">
                    {[
                        { icon: User, label: 'Edit Profile', id: 'edit' },
                        { icon: History, label: 'Medical History', id: 'history' },
                        { icon: HelpCircle, label: 'Help & Support', id: 'support' },
                        { icon: Settings, label: 'Settings', id: 'settings' },
                    ].map((item, i) => (
                        <button key={i} onClick={() => setProfileSubTab(item.id)} className="w-full flex items-center gap-4 p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm active:scale-[0.98] transition-all group">
                            <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-p-50 group-hover:text-p-600 transition-colors flex items-center justify-center">
                                <item.icon size={22} />
                            </div>
                            <span className="flex-1 text-left font-bold text-main">{item.label}</span>
                            <ChevronRight size={18} className="text-slate-300" />
                        </button>
                    ))}
                    <button
                        onClick={onLogoutClick}
                        className="w-full flex items-center gap-4 p-5 rounded-[28px] bg-rose-50 border border-rose-100/50 shadow-sm active:scale-[0.98] transition-all"
                    >
                        <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center">
                            <LogOut size={22} />
                        </div>
                        <span className="flex-1 text-left font-bold text-rose-600">Logout Dashboard</span>
                    </button>
                    <p className="text-center text-[10px] font-bold text-muted opacity-40 mt-6 uppercase tracking-[0.2em]">Version 2.5.0 • Build 2026.04</p>
                </div>
            </div>
            );
};

const PatientDashboard = () => {
    const navigate = useNavigate();
            const {user, logout, loading, appointments, orders, nearbyHospitals, refreshNearbyHospitals} = useAuth();
            const {t} = useTranslation();
            const [activeTab, setActiveTab] = useState('home');
            const [viewMode, setViewMode] = useState('list');
            const [notif, setNotif] = useState(null);
            const [isLocationOpen, setIsLocationOpen] = useState(false);
            const [selectedLocation, setSelectedLocation] = useState('Mancherial, Telangana');
            const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
            const [showVoice, setShowVoice] = useState(false);
            const [showPayment, setShowPayment] = useState(false);
            const [showDetails, setShowDetails] = useState(false);
            const [activeVoiceBooking, setActiveVoiceBooking] = useState(null);
            const [showAddressSetup, setShowAddressSetup] = useState(false);
            const [profileSubTab, setProfileSubTab] = useState('menu'); // 'menu' | 'edit' | 'history' | 'support' | 'settings'
            const [showFeedback, setShowFeedback] = useState(false);
            const [completedAppt, setCompletedAppt] = useState(null);
            // AI Assistant States
            const [messages, setMessages] = useState([
            {role: 'model', text: t('ai_welcome_message') || "Hello! I'm vArogra AI. How can I assist you with your health today?" }
            ]);
            const [aiInput, setAiInput] = useState('');
            const [isAiLoading, setIsAiLoading] = useState(false);
            const [showAIModal, setShowAIModal] = useState(false);
            const [aiAnalysis, setAiAnalysis] = useState('');
            const [aiLoading, setAiLoading] = useState(false);
            // Store/Pharmacy States
            const [storeSearch, setStoreSearch] = useState('');
            const [activeFilter, setActiveFilter] = useState('near');
            const [checkoutStore, setCheckoutStore] = useState(null);
            const [showSuccess, setShowSuccess] = useState(false);
            // Feed States
            const [activeSubTab, setActiveSubTab] = useState('schedule');
            const [feedFilter, setFeedFilter] = useState('all');
    // 5-Minute Reminder Logic
    useEffect(() => {
        return;
        /* const checkReminders = () => {
            const now = new Date();
            appointments.forEach(appt => {
                if (appt.status === 'approved' || appt.status === 'Confirmed' || appt.status === 'pending') {
                    try {
                        // Very basic time parsing for "HH:MM AM/PM"
                        const [timeStr, period] = appt.time.split(' ');
            const [hoursStr, minutesStr] = timeStr.split(':');
            let hours = parseInt(hoursStr);
            let minutes = parseInt(minutesStr);
            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            const apptDate = new Date();
            apptDate.setHours(hours, minutes, 0, 0);
            const diffMinutes = Math.floor((apptDate - now) / (1000 * 60));
            if (diffMinutes === 5) {
                setNotif(`🔔 Reminder: Your appointment with ${appt.doctorName} starts in 5 minutes!`);
                            // Persistent for 10 seconds
                            setTimeout(() => setNotif(null), 10000);
                        }
                    } catch (e) {
                console.error("Reminder parsing failed:", e);
                    }
                }
            });
        };
            const interval = setInterval(checkReminders, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [appointments]);

    useEffect(() => {
        const activeAppointments = (appointments || []).filter((appt) => {
            const normalizedStatus = String(appt.status || '').toLowerCase();
            return ACTIVE_APPOINTMENT_STATUSES.includes(normalizedStatus) && !INACTIVE_APPOINTMENT_STATUSES.includes(normalizedStatus);
        });

        const activeOrders = (orders || []).filter((order) =>
            ACTIVE_ORDER_STATUSES.includes(String(order.status || '').toLowerCase())
        );

        if (activeAppointments.length === 0 && activeOrders.length === 0) return;

        const triggerReminder = (key, message) => {
            const storageKey = `varogra_dashboard_notice_${key}`;
            const lastSent = Number(localStorage.getItem(storageKey) || 0);
            const nowMs = Date.now();

            if (nowMs - lastSent < 10 * 60 * 1000) return;

            setNotif(message);
            setTimeout(() => setNotif(null), 10000);
            localStorage.setItem(storageKey, String(nowMs));
        };

        const checkReminders = () => {
            const now = new Date();

            activeAppointments.forEach((appt) => {
                const appointmentAt = parseReminderDateTime(appt.date, appt.time, appt.timestamp || appt.createdAt);
                if (!appointmentAt) return;

                const diffMinutes = Math.round((appointmentAt.getTime() - now.getTime()) / (1000 * 60));
                if (diffMinutes >= 0 && diffMinutes <= 10) {
                    triggerReminder(
                        `appointment_${appt.id || appt.timestamp || appt.doctorName}`,
                        `Reminder: Your booking with ${appt.doctorName || 'the doctor'} at ${appt.hospitalName || 'the hospital'} is in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}.`
                    );
                }
            });

            activeOrders.forEach((order) => {
                triggerReminder(
                    `order_${order.id || order.timestamp || order.storeName}`,
                    `Reminder: Medicine order booked at ${order.storeName || 'the pharmacy'} is currently ${order.status || 'Pending'}.`
                );
            });
        };

        checkReminders();
        const interval = setInterval(checkReminders, 60000);
        return () => clearInterval(interval); */
    }, [appointments, orders]);

    const handleVoiceAssistant = () => {
                console.log("SOS Voice Assistant Triggered");
            setShowVoice(true);
    };
    // Appointment Completion Listener for Feedback
    useEffect(() => {
        if (!appointments) return;
        const lastCompleted = appointments.find(a =>
            (a.status === 'Completed' || a.status === 'completed') &&
            !a.feedbackRecorded
            );
            if (lastCompleted) {
                setCompletedAppt(lastCompleted);
            setShowFeedback(true);
        }
    }, [appointments]);
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
                                const stateName = data.address.state || '';
                                const locationString = stateName ? `${city}, ${stateName}` : city;
                                setSelectedLocation(locationString);
                                // Only show if it matches the current theme and doesn't disappear too fast
                                setNotif(`ACCESS SECURED: Location updated to ${locationString}`);
                            } else {
                                setNotif("ACCESS SECURED: Location services precisely calibrated.");
                            }
                        } catch (geocodingError) {
                            console.error("Geocoding failed:", geocodingError);
                            setNotif("ACCESS SECURED: Location services calibrated.");
                        }
                        // Removed the auto-timeout to let user see the "GOT IT" button
                    },
                    (error) => {
                        console.warn("Location permission denied or error:", error);
                        setNotif("Location access restricted. Area results may be limited.");
                    }
                );
        }
    }, [t]);
    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'patient') {
                const needsLocation = !user.district || !user.state || !user.latitude;
            if (needsLocation) {
                setShowAddressSetup(true);
                }
            }
        }
    }, [user, loading]);
    useEffect(() => {
        if (!loading && !user) {
                navigate('/login/patient')
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
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="notification-card"
                            >
                                <div className="notification-icon-box">
                                    <CheckCircle size={36} className="text-white" strokeWidth={3} />
                                </div>
                                <h2 className="text-[24px] font-black text-slate-900 mb-2">Notification</h2>
                                <p className="text-[16px] font-bold text-slate-500 leading-relaxed mb-4 px-4">{notif}</p>
                                <button
                                    onClick={() => setNotif(null)}
                                    className="notification-btn"
                                >
                                    GOT IT
                                </button>
                            </motion.div>
                        </div>
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
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                />
                            )}
                            {activeTab === 'ai-assistant' && <AIAssistantTab onNavigate={setActiveTab} />}
                            {activeTab === 'updates' && <UpdatesTab onNavigate={setActiveTab} />}
                            {activeTab === 'store' && <StoreTab />}
                            {activeTab === 'profile' && <ProfileTab
                                user={user}
                                logout={logout}
                                profileSubTab={profileSubTab}
                                setProfileSubTab={setProfileSubTab}
                                onVoiceAssistant={handleVoiceAssistant}
                                onLogoutClick={() => setShowLogoutConfirm(true)}
                            />}
                        </SafeErrorBoundary>
                    </motion.div>
                </AnimatePresence>
                <BottomNav activeTab={activeTab} onTabChange={handleTabChange} onVoiceAssistant={handleVoiceAssistant} />
                <LocationPicker
                    isOpen={isLocationOpen}
                    onClose={() => setIsLocationOpen(false)}
                    onSelect={(loc) => {
                        setSelectedLocation(loc);
                        setNotif(t('location_updated') || `Location updated to ${loc}`);
                    }}
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
                <FeedbackModal
                    isOpen={showFeedback}
                    onClose={() => setShowFeedback(false)}
                    appointment={completedAppt}
                    onSave={async (id, data) => {
                        await recordConsultationFeedback(id, data);
                    }}
                />
                <AddressSetupModal
                    isOpen={showAddressSetup}
                    onClose={() => setShowAddressSetup(false)}
                    onSave={() => {
                        setShowAddressSetup(false);
                        refreshNearbyHospitals();
                    }}
                />
                {/* Removed the extra floating security/SOS button as requested */}
            </div>
            );
};
            export default PatientDashboard;
