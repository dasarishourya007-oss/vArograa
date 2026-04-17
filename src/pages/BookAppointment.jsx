import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Stethoscope, Home, Video,
    Search, Clock, CheckCircle2,
    Calendar, AlertCircle, ChevronRight,
    WifiOff, AlertOctagon, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../context/AuthContext';
import { createAppointment } from '../firebase/services';
import { checkSlotAvailability, findAvailableDoctors } from '../firebase/DoctorAvailability';
import ReassignmentPrompt from '../components/ReassignmentPrompt';
import { hospitals as mockHospitals } from '../utils/mockData';

const BookAppointment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, allHospitals, allDoctors } = useAuth();

    const queryParams = new URLSearchParams(location.search);
    const initialDoctorId = queryParams.get('doctor');
    const initialVisitType = (queryParams.get('type') || '').toLowerCase();

    // Find hospital: try Firebase first, then mock data
    const hospital =
        (allHospitals || []).find(h => h.id === id) ||
        mockHospitals.find(h => h.id === id);

    // Find doctors: try Firebase first, then mock hospital's embedded doctors
    const [firebaseDoctors, setFirebaseDoctors] = useState([]);

    useEffect(() => {
        let unsubscribe = () => {};
        const fetchDoctors = async () => {
            try {
                const { collection, query, where, onSnapshot } = await import('firebase/firestore');
                const { db } = await import('../firebase/config');
                if (!db) return;

                const q = query(collection(db, 'hospitals', id, 'doctors'), where('status', '==', 'APPROVED'));
                
                unsubscribe = onSnapshot(q, (snapshot) => {
                    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setFirebaseDoctors(docs.length > 0 ? docs : (allDoctors || []).filter(d => d.hospitalId === id && d.status === 'APPROVED'));
                }, (err) => {
                    console.error("Subcollection subscription failed:", err);
                    setFirebaseDoctors((allDoctors || []).filter(d => d.hospitalId === id && d.status === 'APPROVED'));
                });
            } catch (err) {
                console.error("Real-time setup failed:", err);
                setFirebaseDoctors((allDoctors || []).filter(d => d.hospitalId === id && d.status === 'APPROVED'));
            }
        };
        fetchDoctors();
        return () => unsubscribe();
    }, [id, allDoctors]);

    const mockDoctors = (mockHospitals.find(h => h.id === id)?.doctors || []);
    const doctorsList = firebaseDoctors.length > 0 ? firebaseDoctors : mockDoctors;

    const [selectedDoctor, setSelectedDoctor] = useState(initialDoctorId || doctorsList[0]?.id || null);

    useEffect(() => {
        if (!selectedDoctor && doctorsList.length > 0) {
            setSelectedDoctor(initialDoctorId || doctorsList[0].id);
        }
    }, [doctorsList, selectedDoctor, initialDoctorId]);
    const [visitType, setVisitType] = useState(['home', 'online', 'hospital'].includes(initialVisitType) ? initialVisitType : 'hospital');
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [selectedTime, setSelectedTime] = useState(null);
    const [customSymptom, setCustomSymptom] = useState('');
    const [doctorSearch, setDoctorSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');

    // Reassignment State
    const [showReassignment, setShowReassignment] = useState(false);
    const [alternativeDoctor, setAlternativeDoctor] = useState(null);

    if (!hospital) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
            <AlertCircle size={40} className="text-danger mb-4" />
            <h2 className="text-xl font-bold mb-2">Hospital Not Found</h2>
            <button onClick={() => navigate('/')} className="btn-primary px-6 py-2 rounded-xl">Back Home</button>
        </div>
    );

    // ===== Hospital Status Mode Guard =====
    const hospitalMode = hospital?.hospitalMode || 'manual';
    const isBusy = hospitalMode === 'busy' || hospitalMode === 'full';

    if (isBusy) {
        const isFull = hospitalMode === 'full';
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
                style={{
                    background: isFull
                        ? 'linear-gradient(180deg, #1a0000 0%, #2d0a0a 60%, #1a0000 100%)'
                        : 'linear-gradient(180deg, #1a0a00 0%, #2d1a00 60%, #1a0a00 100%)'
                }}
            >
                <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: isFull ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '2rem',
                    animation: isFull ? 'pulse 1.5s infinite' : 'none'
                }}>
                    {isFull
                        ? <AlertOctagon size={48} color="#ef4444" />
                        : <WifiOff size={48} color="#fbbf24" />
                    }
                </div>
                <h1 style={{
                    fontSize: '1.8rem', fontWeight: 900,
                    color: isFull ? '#f87171' : '#fbbf24',
                    marginBottom: '1rem'
                }}>
                    {isFull ? '🚨 High Traffic Alert' : '🟡 Hospital Unavailable'}
                </h1>
                <p style={{
                    color: 'rgba(255,255,255,0.7)',
                    maxWidth: '360px',
                    lineHeight: 1.6,
                    marginBottom: '2rem',
                    fontSize: '1rem'
                }}>
                    {isFull
                        ? 'This hospital is currently experiencing very high patient traffic and is not accepting new bookings. Please try another hospital or call directly.'
                        : 'This hospital is temporarily unavailable and not accepting new appointments. Please try again later or contact them directly.'
                    }
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '14px 28px', borderRadius: '16px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white', fontWeight: 800, cursor: 'pointer'
                        }}
                    >
                        ← Go Back
                    </button>
                    <button
                        onClick={() => window.location.href = 'tel:9999999999'}
                        style={{
                            padding: '14px 28px', borderRadius: '16px',
                            background: isFull ? '#ef4444' : '#f59e0b',
                            border: 'none',
                            color: 'white', fontWeight: 800, cursor: 'pointer'
                        }}
                    >
                        📞 Call Hospital
                    </button>
                </div>
            </div>
        );
    }

    const symptoms = ['Fever', 'Cough', 'Cold', 'Headache', 'Stomach Pain', 'Etc'];

    const filteredDoctors = doctorsList.filter(d =>
        d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        (d.specialization || d.specialty || '').toLowerCase().includes(doctorSearch.toLowerCase())
    );

    const activeDoctor = doctorsList.find(d => d.id === selectedDoctor);
    const baseTimeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];

    const isSlotInPast = (time) => {
        const today = new Date();
        const [year, month, day] = selectedDate.split('-').map(Number);
        const slotDate = new Date(year, month - 1, day);
        
        if (slotDate.setHours(0,0,0,0) > today.setHours(0,0,0,0)) return false;
        if (slotDate.setHours(0,0,0,0) < today.setHours(0,0,0,0)) return true; // Actually date picker min already handles this

        const now = new Date();
        const [timePart, ampm] = time.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        const slotTime = new Date(now);
        slotTime.setHours(hours, minutes, 0, 0);
        
        return slotTime < now;
    };

    const getSlotStatus = (time) => {
        if (isSlotInPast(time)) return 'past';
        if (activeDoctor?.availability) {
            if (activeDoctor.availability.busy?.includes(time)) return 'busy';
            if (activeDoctor.availability.available?.includes(time)) return 'available';
        }
        return 'available';
    };

    const toggleSymptom = (s) => {
        setSelectedSymptoms((prev) =>
            prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
        );
    };

    const handleConfirm = async (reassignedDoc = null) => {
        if (!selectedTime || isLoading) return;
        setIsLoading(true);
        setBookingError('');

        const targetDoctor = reassignedDoc || activeDoctor;
        const isReassigned = !!reassignedDoc;

        // 1. Double check availability if not already reassigned
        if (!isReassigned) {
            const available = await checkSlotAvailability(selectedDoctor, selectedDate, selectedTime);
            if (!available) {
                // Find alternatives in same specialization
                const alternatives = await findAvailableDoctors(
                    activeDoctor?.specialization || activeDoctor?.specialty || '',
                    selectedDate,
                    selectedTime
                );
                
                // Exclude current doctor from alternatives
                const filteredAlts = alternatives.filter(d => d.id !== selectedDoctor);

                if (filteredAlts.length > 0) {
                    setAlternativeDoctor(filteredAlts[0]);
                    setShowReassignment(true);
                    setIsLoading(false);
                    return;
                } else {
                    setBookingError('Slot no longer available and no alternative doctors found. Please choose another slot.');
                    setIsLoading(false);
                    return;
                }
            }
        }

        let finalSymptoms = [...selectedSymptoms];
        if (finalSymptoms.includes('Etc') && customSymptom.trim()) {
            finalSymptoms = finalSymptoms.filter(s => s !== 'Etc');
            finalSymptoms.push(customSymptom);
        }

        // Generate a local token as primary (fast, no Firebase dependency)
        const tokenNumber = Math.floor(Math.random() * 50) + 1;

        const consultingFee = visitType === 'online'
            ? targetDoctor?.fees?.online
            : visitType === 'home'
                ? (targetDoctor?.fees?.offline ? targetDoctor.fees.offline + 200 : 999)
                : targetDoctor?.fees?.offline;

        const resolvedDoctorId =
            targetDoctor?.uid ||
            targetDoctor?.userId ||
            targetDoctor?.doctorId ||
            (isReassigned ? targetDoctor.id : selectedDoctor) || '';

        const appointmentDateKey = selectedDate;
        // BUG FIX: Use hospital.id (Firestore doc ID) as primary so hospital portal subscriptions find it
        const resolvedHospitalId = hospital.id || hospital.uid || hospital.userId || hospital.hospitalId || '';
        const hospitalDisplayName = hospital.name || hospital.hospitalName || 'Hospital';
        const doctorDisplayName = targetDoctor?.name || targetDoctor?.doctorName || 'Any Available Doctor';
        const hospitalRefId = hospital.id || hospital.hospitalId || '';
        const appointmentType = visitType === 'home' ? 'homevisit' : visitType === 'online' ? 'online' : 'offline';
        
        const appointmentData = {
            patientId: user?.uid || 'temp-patient',
            patientName: user?.displayName || user?.name || 'Valued Patient',
            hospitalId: resolvedHospitalId,
            hospitalName: hospitalDisplayName,
            hospitalRefId,
            doctorId: resolvedDoctorId,
            doctorRefId: (isReassigned ? targetDoctor.id : selectedDoctor) || '',
            doctorName: doctorDisplayName,
            visitType,
            appointmentType,
            symptoms: finalSymptoms,
            date: appointmentDateKey,
            appointmentDateKey,
            time: selectedTime,
            status: 'pending',
            token: tokenNumber,
            consultingFee,
            isReassigned,
            originalDoctorId: isReassigned ? (activeDoctor?.uid || activeDoctor?.id || selectedDoctor) : null,
            hospitalMode  // Track mode at time of booking
        };

        try {
            const appointmentId = await createAppointment(appointmentData);
            navigate('/appointment-success', {
                replace: true,
                state: {
                    appointment: { id: appointmentId, ...appointmentData },
                    notice: isReassigned 
                        ? `Request secured with Dr. ${doctorDisplayName}. Waiting for hospital validation.`
                        : 'Your request is PENDING. Hospital administration is validating your slot and assigning clinical resources.'
                }
            });
        } catch (error) {
            console.error("Firebase booking failed:", error);
            const code = String(error?.code || '');
            if (code.includes('permission-denied') || code.includes('unauthenticated')) {
                setBookingError('Session expired. Please login again and retry booking.');
            } else {
                setBookingError('Unable to save appointment request. Please check your connection and try again.');
            }
        } finally {
            setIsLoading(false);
            setShowReassignment(false);
        }
    };

    return (
        <div className="container min-h-screen bg-[#fcfdfe] pb-32 animate-entrance">
            <header className="flex items-center gap-4 px-6 py-8 border-b border-border/40">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl glass-dark active:scale-90 transition-transform border-none cursor-pointer"
                >
                    <ArrowLeft size={20} className="text-main" strokeWidth={2.5} />
                </button>
                <h1 className="text-xl font-extrabold tracking-tight text-main">Book Appointment</h1>
            </header>

            <div className="p-6">
                {bookingError && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                        {bookingError}
                    </div>
                )}
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-p-500 rounded-full" />
                    <h3 className="text-sm font-black text-muted uppercase tracking-wider">Select Doctor</h3>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-3 glass p-4 rounded-[20px] mb-6 shadow-sm border-none">
                    <Search size={18} className="text-muted" strokeWidth={2.5} />
                    <input
                        type="text"
                        placeholder="Search doctor or specialty..."
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-sm font-bold text-main placeholder:text-muted/50"
                    />
                </div>

                {/* Doctor List */}
                <div className="flex flex-col gap-4 mb-8">
                    {doctorsList.length === 0 ? (
                        <p className="text-center text-muted font-bold py-4">No doctors available for this hospital.</p>
                    ) : filteredDoctors.length === 0 ? (
                        <p className="text-center text-muted font-bold py-4">No doctors match your search.</p>
                    ) : (
                        filteredDoctors.map(doc => {
                            const isSelected = selectedDoctor === doc.id;
                            const isOffline = doc.isOnline === false;
                            return (
                                <button
                                    type="button"
                                    key={doc.id}
                                    disabled={isOffline}
                                    onClick={() => { if(!isOffline) { setSelectedDoctor(doc.id); setSelectedTime(null); } }}
                                    className={`flex items-center gap-4 p-4 rounded-[24px] transition-all duration-300 border-none cursor-pointer text-left ${isSelected ? 'bg-p-50 shadow-md ring-2 ring-p-500/20' : 'bg-white shadow-sm hover:shadow-md'} ${isOffline ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    <div className="relative">
                                        <div className={`absolute -top-1 -left-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider z-10 ${isOffline ? 'bg-slate-400 text-white' : 'bg-emerald-500 text-white'}`}>
                                            {isOffline ? 'Offline' : 'Online'}
                                        </div>
                                        <img src={doc.image || 'https://via.placeholder.com/150'} alt={doc.name} className={`w-14 h-14 rounded-2xl object-cover ${isOffline ? 'grayscale' : ''}`} />
                                        {isSelected && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-p-500 border-2 border-white flex items-center justify-center">
                                                <CheckCircle2 size={12} color="white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`text-[15px] font-black tracking-tight leading-tight ${isSelected ? 'text-p-700' : 'text-main'}`}>
                                            {doc.name}
                                        </h4>
                                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider">{doc.specialty || doc.specialization}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {doc.rating && <span className="text-[10px] font-bold text-orange-500">⭐ {doc.rating}</span>}
                                            {doc.consultingTime && <span className="text-[10px] font-bold text-blue-500">🕐 {doc.consultingTime}</span>}
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-p-500 bg-p-500' : (isOffline ? 'border-slate-200 bg-slate-100' : 'border-border')}`}>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                        {isOffline && <div className="w-2 h-2 rounded-full bg-slate-300" />}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Date Selection */}
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-5 bg-p-500 rounded-full" />
                    <h3 className="text-sm font-black text-muted uppercase tracking-wider">Select Date</h3>
                </div>
                <div className="mb-8 relative">
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setSelectedTime(null);
                        }}
                        onClick={(e) => {
                            if(e.target.showPicker) {
                                e.target.showPicker();
                            }
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-white p-4 rounded-[20px] text-sm font-bold text-main outline-none border border-border shadow-sm appearance-none cursor-pointer"
                        style={{ colorScheme: 'light' }}
                    />
                </div>

                {/* Time Selection */}
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-5 bg-p-500 rounded-full" />
                    <h3 className="text-sm font-black text-muted uppercase tracking-wider">Select Available Time</h3>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-8">
                    {baseTimeSlots.map(time => {
                        const status = getSlotStatus(time);
                        const isBusy = status === 'busy';
                        const isPast = status === 'past';
                        const isSelected = selectedTime === time;
                        return (
                            <button
                                type="button"
                                key={time}
                                disabled={isBusy || isPast}
                                onClick={() => setSelectedTime(time)}
                                className={`py-3 px-1 rounded-xl text-[10px] font-black tracking-tighter transition-all duration-300 border-none cursor-pointer flex flex-col items-center gap-0.5 ${isSelected
                                    ? 'bg-p-600 text-white shadow-lg shadow-p-600/20 active:scale-95'
                                    : (isBusy || isPast ? 'bg-slate-50 text-slate-300 cursor-not-allowed grayscale' : 'bg-white text-main shadow-sm hover:ring-1 hover:ring-p-500/30')
                                    }`}
                            >
                                <Clock size={12} strokeWidth={3} className={isSelected ? 'text-white' : (isBusy || isPast ? 'text-slate-200' : 'text-p-400')} />
                                <span>{time}</span>
                                {isBusy && <span className="opacity-50 text-[8px] mt-0.5">BUSY</span>}
                                {isPast && <span className="opacity-50 text-[8px] mt-0.5">PASSED</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Visit Type */}
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-5 bg-p-500 rounded-full" />
                    <h3 className="text-sm font-black text-muted uppercase tracking-wider">Visit Type</h3>
                </div>
                <div className="flex gap-3 mb-8">
                    {[
                        { id: 'home', label: 'Home Visit', icon: <Home size={20} /> },
                        { id: 'online', label: 'Online', icon: <Video size={20} /> },
                        { id: 'hospital', label: 'Hospital', icon: <Stethoscope size={20} /> }
                    ].map(type => {
                        const isSelected = visitType === type.id;
                        return (
                            <button
                                type="button"
                                key={type.id}
                                onClick={() => setVisitType(type.id)}
                                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border cursor-pointer ${isSelected ? 'ring-2 ring-p-500 shadow-lg' : 'bg-white hover:bg-slate-50'}`}
                                style={{
                                    background: isSelected ? 'linear-gradient(135deg, rgba(37,99,235,0.16), rgba(59,130,246,0.1))' : '#ffffff',
                                    borderColor: isSelected ? '#2563eb' : '#e2e8f0'
                                }}
                            >
                                <div className={isSelected ? 'text-p-600' : 'text-muted'}>{type.icon}</div>
                                <span className={`text-[11px] font-black uppercase tracking-wider ${isSelected ? 'text-p-700' : 'text-muted'}`}>
                                    {type.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Symptoms Selector */}
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-5 bg-p-500 rounded-full" />
                    <h3 className="text-sm font-black text-muted uppercase tracking-wider">Symptoms</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                    {symptoms.map(sym => {
                        const isSelected = selectedSymptoms.includes(sym);
                        return (
                            <button
                                type="button"
                                key={sym}
                                onClick={() => toggleSymptom(sym)}
                                className={`px-4 py-2.5 rounded-full text-[12px] font-extrabold tracking-tight transition-all border cursor-pointer ${isSelected ? 'text-white shadow-md' : 'text-muted font-bold hover:bg-p-50 bg-white'}`}
                                style={{
                                    background: isSelected ? '#2563eb' : '#ffffff',
                                    borderColor: isSelected ? '#2563eb' : '#e2e8f0'
                                }}
                            >
                                {sym}
                            </button>
                        );
                    })}
                </div>

                {selectedSymptoms.includes('Etc') && (
                    <div className="animate-entrance">
                        <textarea
                            placeholder="Please describe your symptoms in detail..."
                            value={customSymptom}
                            onChange={(e) => setCustomSymptom(e.target.value)}
                            className="w-full glass p-5 rounded-3xl text-sm font-bold text-main placeholder:text-muted/40 outline-none border-none shadow-sm min-h-[120px] mb-8"
                        />
                    </div>
                )}
            </div>

            {/* Floating Confirm Button */}
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[420px] p-2 rounded-[32px] glass shadow-2xl z-[1000] border-white transition-all duration-500 ${selectedTime ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                <button
                    onClick={() => handleConfirm()}
                    disabled={isLoading}
                    className="w-full btn-primary h-16 rounded-[24px] flex items-center justify-center gap-3 active:scale-95 transition-all text-lg font-black tracking-tight border-none cursor-pointer disabled:opacity-60"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Checking availability...
                        </span>
                    ) : (
                        <><Calendar size={22} strokeWidth={2.5} /> Confirm Booking</>
                    )}
                </button>
            </div>

            <ReassignmentPrompt
                isOpen={showReassignment}
                onClose={() => {
                    setShowReassignment(false);
                    setSelectedTime(null);
                }}
                onAccept={(doc) => handleConfirm(doc)}
                alternativeDoctor={alternativeDoctor}
                originalDoctorName={activeDoctor?.name}
            />
        </div>
    );
};

export default BookAppointment;
















