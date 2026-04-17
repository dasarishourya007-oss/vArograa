import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Star, Phone, Clock,
    IndianRupee,
    ChevronRight, ShieldCheck, Calendar, Info
} from 'lucide-react';
import { hospitals as mockHospitals } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';

const SYMPTOM_OPTIONS = [
    'Fever',
    'Headache',
    'Stomach Pain',
    'Cold and Cough',
    'Skin Problems',
    'Heart Problems',
    'Joint Pain',
    'Child Health',
    "Women's Health"
];

const SYMPTOM_SPECIALTY_RULES = {
    'Fever': ['general', 'physician', 'family medicine', 'internal medicine'],
    'Headache': ['general', 'physician', 'family medicine', 'internal medicine', 'neuro', 'ent'],
    'Stomach Pain': ['general', 'physician', 'family medicine', 'internal medicine', 'gastro'],
    'Cold and Cough': ['general', 'physician', 'family medicine', 'internal medicine', 'pulmo', 'chest', 'ent'],
    'Skin Problems': ['dermat'],
    'Heart Problems': ['cardio', 'heart'],
    'Joint Pain': ['ortho', 'rheumat'],
    'Child Health': ['pediatric', 'child'],
    "Women's Health": ['gynec', 'obstet']
};

const COMMON_SYMPTOMS = new Set(['Fever', 'Headache', 'Stomach Pain', 'Cold and Cough']);

const getSpecialtyText = (doctor) => String(
    doctor?.specialty || doctor?.specialization || doctor?.department || ''
).toLowerCase();

const deriveSymptomsFromSpecialty = (doctor) => {
    const specialtyText = getSpecialtyText(doctor);
    return Object.entries(SYMPTOM_SPECIALTY_RULES)
        .filter(([, keywords]) => keywords.some((key) => specialtyText.includes(key)))
        .map(([symptom]) => symptom);
};

const normalizeSymptoms = (doctor) => {
    const fromDoctor = [
        ...(Array.isArray(doctor?.diseases) ? doctor.diseases : []),
        ...(Array.isArray(doctor?.conditions) ? doctor.conditions : []),
        ...(Array.isArray(doctor?.symptoms) ? doctor.symptoms : []),
        ...(Array.isArray(doctor?.expertise) ? doctor.expertise : [])
    ]
        .map((item) => String(item || '').trim())
        .filter(Boolean);

    const fromSpecialty = deriveSymptomsFromSpecialty(doctor);

    return Array.from(new Set([...fromDoctor, ...fromSpecialty]));
};


const formatSpecialtyLabel = (doctor) => {
    const raw = String(doctor?.specialty || doctor?.specialization || doctor?.department || '').trim();
    if (!raw) return 'General Medicine';

    const lower = raw.toLowerCase();
    if (lower.includes('general') || lower.includes('physician')) return 'General Medicine';
    if (lower.includes('dermat')) return 'Dermatology';
    if (lower.includes('cardio') || lower.includes('heart')) return 'Cardiology';
    if (lower.includes('pediatric') || lower.includes('child')) return 'Pediatrics';
    if (lower.includes('gastro')) return 'Gastroenterology';
    if (lower.includes('ortho')) return 'Orthopedics';
    if (lower.includes('gynec') || lower.includes('obstet')) return 'Gynecology';

    return raw;
};
const getDoctorPriorityForSymptoms = (doctor, selectedSymptoms) => {
    const specialtyText = getSpecialtyText(doctor);

    if (selectedSymptoms.some((s) => COMMON_SYMPTOMS.has(s))) {
        if (
            specialtyText.includes('general') ||
            specialtyText.includes('physician') ||
            specialtyText.includes('family medicine') ||
            specialtyText.includes('internal medicine')
        ) return 0;
    }

    if (selectedSymptoms.includes('Skin Problems') && specialtyText.includes('dermat')) return 0;
    if (selectedSymptoms.includes('Heart Problems') && (specialtyText.includes('cardio') || specialtyText.includes('heart'))) return 0;

    return 1;
};


const HospitalDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { allDoctors, allHospitals } = useAuth();
    const [liveDoctors, setLiveDoctors] = useState([]);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);

    useEffect(() => {
        let unsubscribe = () => {};
        const fetchDoctors = async () => {
            try {
                const { collection, query, where, onSnapshot } = await import('firebase/firestore');
                const { db } = await import('../firebase/config');
                if (!db) return;

                const q = query(collection(db, 'hospitals', id, 'doctors'));
                
                unsubscribe = onSnapshot(q, (snapshot) => {
                    const docs = snapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(d => (d.status || '').toUpperCase() === 'APPROVED');
                    
                    setLiveDoctors(docs.length > 0 ? docs : (allDoctors || []).filter(d => d.hospitalId === id && (d.status || '').toUpperCase() === 'APPROVED'));
                }, (err) => {
                    console.error('Subcollection subscription failed:', err);
                    setLiveDoctors((allDoctors || []).filter(d => d.hospitalId === id && (d.status || '').toUpperCase() === 'APPROVED'));
                });
            } catch (err) {
                console.error('Real-time setup failed:', err);
                setLiveDoctors((allDoctors || []).filter(d => d.hospitalId === id && d.status === 'APPROVED'));
            }
        };
        fetchDoctors();
        return () => unsubscribe();
    }, [id, allDoctors]);

    const hospital = allHospitals.find(h => h.id === id) || mockHospitals.find(h => h.id === id);

    const hospitalDoctors = useMemo(() => {
        const merged = [...(liveDoctors || []), ...((hospital?.doctors) || [])];
        const seen = new Set();
        return merged.filter((doctor) => {
            const key = doctor?.id || `${doctor?.name || ''}-${doctor?.specialty || doctor?.specialization || ''}`;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [liveDoctors, hospital]);

    const doctorsWithSymptoms = useMemo(() => {
        return hospitalDoctors.map((doctor) => ({
            ...doctor,
            diseaseTags: normalizeSymptoms(doctor)
        }));
    }, [hospitalDoctors]);

    const filteredDoctors = useMemo(() => {
        if (selectedSymptoms.length === 0) return doctorsWithSymptoms;

        return doctorsWithSymptoms
            .filter((doctor) => selectedSymptoms.every((symptom) => doctor.diseaseTags.includes(symptom)))
            .sort((a, b) => {
                const pa = getDoctorPriorityForSymptoms(a, selectedSymptoms);
                const pb = getDoctorPriorityForSymptoms(b, selectedSymptoms);
                if (pa !== pb) return pa - pb;
                return String(a?.name || '').localeCompare(String(b?.name || ''));
            });
    }, [doctorsWithSymptoms, selectedSymptoms]);

    const toggleSymptom = (symptom) => {
        setSelectedSymptoms((prev) =>
            prev.includes(symptom)
                ? prev.filter((s) => s !== symptom)
                : [...prev, symptom]
        );
    };

    if (!hospital) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
            <div className="bg-p-100 p-6 rounded-full mb-4">
                <Info size={40} className="text-p-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Hospital Not Found</h2>
            <button onClick={() => navigate('/')} className="btn-primary px-8 py-3 rounded-2xl">Back to Home</button>
        </div>
    );

    const hospitalMode = hospital?.hospitalMode || 'manual';
    const isBusy = hospitalMode === 'busy' || hospitalMode === 'full';

    const modeBanner = (() => {
        switch (hospitalMode) {
            case 'auto': return {
                bg: 'linear-gradient(135deg, #052e16, #14532d)',
                border: 'rgba(34,197,94,0.4)',
                color: '#4ade80',
                icon: '⚡',
                title: 'Auto-Dispatch Active',
                desc: 'Requests are automatically assigned to the next available doctor.'
            };
            case 'busy': return {
                bg: 'linear-gradient(135deg, #451a03, #78350f)',
                border: 'rgba(245,158,11,0.5)',
                color: '#fbbf24',
                icon: '⛔',
                title: 'Hospital Temporarily Unavailable',
                desc: 'This hospital is currently not accepting new appointments. Please try again later or contact them directly.'
            };
            case 'full': return {
                bg: 'linear-gradient(135deg, #3b0000, #7f1d1d)',
                border: 'rgba(239,68,68,0.6)',
                color: '#f87171',
                icon: '🚨',
                title: '🚨 High Traffic — Hospital at Full Capacity',
                desc: 'This hospital is experiencing very high patient traffic and is not accepting bookings at this time. Please try a different hospital.'
            };
            default: return null;
        }
    })();


    return (
        <div className="container min-h-screen bg-[#fcfdfe] pb-32 animate-entrance">
            <div className="relative h-[300px] overflow-hidden">
                <img
                    src={hospital.photoURL || hospital.image || hospital.hospital_photo || hospital.hospitalPhoto || '/images/default-hospital.png'}
                    alt={hospital.name || hospital.hospitalName || 'Hospital'}
                    className="w-full h-full object-cover"
                    style={{ filter: isBusy ? 'grayscale(40%) brightness(0.8)' : 'none', transition: 'filter 0.4s' }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/10" />
                {hospitalMode === 'full' && (
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(239,68,68,0.3) 0%, transparent 50%)', pointerEvents: 'none' }} />
                )}

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 w-12 h-12 glass flex items-center justify-center rounded-2xl shadow-lg border-none active:scale-90 transition-transform z-20"
                >
                    <ArrowLeft size={22} color="white" strokeWidth={2.5} />
                </button>

                <div className="absolute top-6 right-6 z-20">
                    <div className="glass px-4 py-2 rounded-2xl shadow-lg">
                        <span className="text-white font-bold text-xs tracking-wider">VERIFIED</span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 -mt-10 glass p-8 rounded-t-[40px] shadow-2xl border-none min-h-[400px]">
                {/* Mode Banner */}
                {modeBanner && (
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '1rem 1.25rem',
                        borderRadius: '16px',
                        background: modeBanner.bg,
                        border: `1px solid ${modeBanner.border}`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                    }}>
                        <div style={{ color: modeBanner.color, flexShrink: 0, marginTop: '2px' }}>{modeBanner.icon}</div>
                        <div>
                            <p style={{ fontWeight: 800, fontSize: '0.9rem', color: modeBanner.color, marginBottom: '2px' }}>{modeBanner.title}</p>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{modeBanner.desc}</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-1.5 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-extrabold text-main tracking-tight leading-none">{hospital.name}</h1>
                            <ShieldCheck size={20} className="text-success" />
                        </div>
                        <p className="flex items-center gap-1.5 text-muted text-sm font-medium opacity-80">
                            <MapPin size={14} className="text-p-500" /> {hospital.address}
                        </p>
                        {hospital.phone && (
                            <p className="flex items-center gap-1.5 text-p-600 text-sm font-bold mt-1">
                                <Phone size={14} /> {hospital.phone}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-success text-white font-black text-lg shadow-lg shadow-success/20">
                        {hospital.rating} <Star size={16} fill="white" stroke="none" />
                    </div>
                </div>

                <div className="flex gap-2.5 mb-8">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border border-border/50 shadow-sm ${
                        isBusy ? 'bg-rose-50 text-rose-600'
                        : hospital.isOpen ? 'bg-p-50 text-p-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                        <Clock size={12} />
                        {isBusy
                            ? (hospitalMode === 'full' ? 'HIGH TRAFFIC' : 'UNAVAILABLE')
                            : hospital.isOpen ? 'OPEN NOW' : 'CLOSED'
                        }
                    </div>
                    {hospital.hasEmergency && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/10 text-danger text-[10px] font-black tracking-widest border border-danger/20">
                            EMERGENCY AVAILABLE
                        </div>
                    )}
                </div>

                <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }} className="p-6 rounded-[28px] mb-8 border border-success/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-success/20 p-1.5 rounded-lg flex items-center justify-center">
                            <IndianRupee size={18} className="text-success" strokeWidth={3} />
                        </div>
                        <h3 className="text-success font-extrabold text-sm opacity-80 tracking-wide">ESTIMATED COST</h3>
                    </div>
                    <p className="text-2xl font-black text-slate-800">{hospital.costRange}</p>
                    <p className="text-[11px] text-success/60 mt-1 font-semibold uppercase tracking-tighter">*BASED ON COMMON OPD TREATMENTS</p>
                </div>

                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-1.5 h-6 bg-p-500 rounded-full" />
                        <h3 className="text-[17px] font-extrabold text-main tracking-tight">Main Facilities</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {hospital.facilities?.map((fac, index) => (
                            <div key={index} className="px-5 py-3 glass rounded-2xl text-[13px] font-bold text-slate-700 shadow-sm border-white/40">
                                {fac}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-10">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-violet-500 rounded-full" />
                            <h3 className="text-[17px] font-extrabold text-main tracking-tight">Find Doctors by Health Concern</h3>
                        </div>
                        <button className="text-p-600 text-xs font-black">SEE ALL</button>
                    </div>

                    <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Select Your Symptoms or Health Concern</p>
                        <div className="flex flex-wrap gap-2">
                            {SYMPTOM_OPTIONS.map((symptom) => {
                                const active = selectedSymptoms.includes(symptom);
                                return (
                                    <button
                                        key={symptom}
                                        onClick={() => toggleSymptom(symptom)}
                                        className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${active
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                            }`}
                                    >
                                        {symptom}
                                    </button>
                                );
                            })}
                            {selectedSymptoms.length > 0 && (
                                <button
                                    onClick={() => setSelectedSymptoms([])}
                                    className="px-3 py-2 rounded-xl text-[11px] font-bold border border-rose-200 bg-rose-50 text-rose-600"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {filteredDoctors.length === 0 && (
                            <div className="p-5 rounded-2xl border border-dashed border-slate-300 text-sm font-bold text-slate-500 text-center bg-white">
                                No doctors found for selected symptoms. Try removing one filter.
                            </div>
                        )}

                        {filteredDoctors.map((doctor, idx) => (
                            <div
                                key={doctor.id || idx}
                                onClick={(e) => { e.stopPropagation(); navigate(`/doctor/${doctor.id}`); }}
                                className="flex items-center justify-between p-4 bg-white rounded-[24px] border border-border/30 shadow-md active:scale-95 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="relative shrink-0">
                                        <img src={doctor.photoURL || doctor.image || '/images/default-doctor.png'} alt={doctor.name} className={`w-14 h-14 rounded-2xl object-cover shadow-sm ${doctor.isOnline === false ? 'grayscale' : ''}`} />
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${doctor.isOnline === false ? 'bg-slate-400' : (doctor.status === 'Available' || doctor.status === 'APPROVED' ? 'bg-success' : doctor.status === 'In Consultation' ? 'bg-orange-500' : 'bg-slate-400')}`} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h4 className="text-[15px] font-extrabold text-main tracking-tight leading-tight group-hover:text-p-600 transition-colors uppercase truncate">{doctor.name}</h4>
                                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider">{formatSpecialtyLabel(doctor)}</p>
                                        {doctor.diseaseTags?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {doctor.diseaseTags.slice(0, 4).map((tag) => (
                                                    <span key={`${doctor.id || idx}-${tag}`} className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest ${doctor.isOnline === false ? 'bg-slate-100 text-slate-500' : (doctor.status === 'Available' || doctor.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : doctor.status === 'In Consultation' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-500')}`}>
                                        {doctor.isOnline === false ? 'OFFLINE' : (doctor.status === 'APPROVED' ? 'AVAILABLE' : (doctor.status?.toUpperCase() || 'ABSENT'))}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isBusy) navigate(`/book-appointment/${hospital.id}?doctor=${doctor.id || doctor.uid || doctor.doctorId}`);
                                        }}
                                        disabled={isBusy}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                                            isBusy ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-p-600 text-white shadow-lg active:scale-90 hover:bg-p-700'
                                        }`}
                                    >
                                        BOOK NOW
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[420px] glass p-3 rounded-[28px] shadow-2xl z-[100] flex gap-3 border-white/50">
                <button
                    className="flex-1 bg-white glass border-none h-14 px-6 rounded-2xl font-black text-p-600 text-sm flex items-center justify-center gap-2 active:scale-90 transition-transform shadow-sm"
                    onClick={() => window.location.href = 'tel:9999999999'}
                >
                    <Phone size={18} strokeWidth={2.5} /> EMERGENCY
                </button>
                <button
                    className="flex-[1.5] h-14 rounded-2xl font-black text-white text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-transform border-none cursor-pointer"
                    style={{
                        background: isBusy
                            ? (hospitalMode === 'full' ? '#991b1b' : '#78350f')
                            : '#2563eb', // FIXED: Use absolute brand blue instead of undefined variable
                        boxShadow: isBusy ? 'none' : '0 10px 25px rgba(37, 99, 235, 0.4)',
                        opacity: isBusy ? 0.7 : 1,
                        cursor: isBusy ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isBusy}
                    onClick={() => { if (!isBusy) navigate(`/book-appointment/${hospital.id}`); }}
                >
                    {isBusy
                        ? <><Info size={20} strokeWidth={2.5} /> {hospitalMode === 'full' ? 'HIGH TRAFFIC' : 'UNAVAILABLE'}</>
                        : <><Calendar size={20} strokeWidth={2.5} /> BOOK NOW</>
                    }
                </button>
            </div>
        </div>
    );
};

export default HospitalDetail;