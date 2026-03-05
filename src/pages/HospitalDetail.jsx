import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Star, Phone, Clock,
    IndianRupee, Activity, Droplets, Microscope,
    ChevronRight, ShieldCheck, Calendar, Info
} from 'lucide-react';
import { hospitals as mockHospitals } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';

const HospitalDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [liveDoctors, setLiveDoctors] = useState([]);

    useEffect(() => {
        let isCancelled = false;
        const fetchDoctors = async () => {
            try {
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                const { db } = await import('../firebase/config');
                if (!db) return;

                const q = query(collection(db, 'hospitals', id, 'doctors'), where('status', '==', 'APPROVED'));
                const snapshot = await getDocs(q);

                if (!isCancelled) {
                    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Use subcollection docs if found, else fall back to the context cache
                    setLiveDoctors(docs.length > 0 ? docs : (allDoctors || []).filter(d => d.hospitalId === id && d.status === 'APPROVED'));
                }
            } catch (err) {
                console.error("Subcollection fetch failed:", err);
                if (!isCancelled) {
                    setLiveDoctors((allDoctors || []).filter(d => d.hospitalId === id && d.status === 'APPROVED'));
                }
            }
        };
        fetchDoctors();
        return () => { isCancelled = true; };
    }, [id, allDoctors]);

    // Priority: 1. Live data from Context/Firestore, 2. Mock fallback
    const hospital = allHospitals.find(h => h.id === id) || mockHospitals.find(h => h.id === id);

    if (!hospital) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
            <div className="bg-p-100 p-6 rounded-full mb-4">
                <Info size={40} className="text-p-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Hospital Not Found</h2>
            <button onClick={() => navigate('/')} className="btn-primary px-8 py-3 rounded-2xl">Back to Home</button>
        </div>
    );

    return (
        <div className="container min-h-screen bg-[#fcfdfe] pb-32 animate-entrance">
            {/* Header Image Section */}
            <div className="relative h-[300px] overflow-hidden">
                <img
                    src={hospital.image}
                    alt={hospital.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/10" />

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

            {/* Main Content Info Section */}
            <div className="relative z-10 -mt-10 glass p-8 rounded-t-[40px] shadow-2xl border-none min-h-[400px]">
                {/* Title & Rating */}
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

                {/* Status Badges */}
                <div className="flex gap-2.5 mb-8">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border border-border/50 shadow-sm ${hospital.isOpen ? 'bg-p-50 text-p-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Clock size={12} /> {hospital.isOpen ? 'OPEN NOW' : 'CLOSED'}
                    </div>
                    {hospital.hasEmergency && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/10 text-danger text-[10px] font-black tracking-widest border border-danger/20">
                            EMERGENCY AVAILABLE
                        </div>
                    )}
                </div>

                {/* Treatment Cost - Highlight Box */}
                <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }} className="p-6 rounded-[28px] mb-8 border border-success/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-success/20 p-1.5 rounded-lg flex items-center justify-center">
                            <IndianRupee size={18} className="text-success" strokeWidth={3} />
                        </div>
                        <h3 className="text-success font-extrabold text-sm opacity-80 tracking-wide">ESTIMATED COST</h3>
                    </div>
                    <p className="text-2xl font-black text-slate-800">{hospital.costRange}</p>
                    <p className="text-[11px] text-success/60 mt-1 font-semibold uppercase tracking-tighter">*Based on common OPD treatments</p>
                </div>

                {/* Facilities Section */}
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

                {/* Blood Bank Tracker */}
                {hospital.bloodAvailability && Object.keys(hospital.bloodAvailability).length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-1.5 h-6 bg-danger rounded-full" />
                            <h3 className="text-[17px] font-extrabold text-main tracking-tight leading-none">Blood Bank Real-time</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {Object.entries(hospital.bloodAvailability).map(([group, status]) => (
                                <div key={group} className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl border border-border/50 shadow-md">
                                    <span className="text-sm font-black text-main leading-none mb-1.5">{group}</span>
                                    <span className={`text-[9px] font-extrabold uppercase tracking-tighter ${status === 'Available' ? 'text-success' : (status === 'Low Stock' ? 'text-accent' : 'text-danger')}`}>
                                        {status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Specialists Carousel/List */}
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-violet-500 rounded-full" />
                            <h3 className="text-[17px] font-extrabold text-main tracking-tight">Expert Doctors</h3>
                        </div>
                        <button className="text-p-600 text-xs font-black">SEE ALL</button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {[...liveDoctors, ...(hospital.doctors || [])].map((doctor, idx) => (
                            <div
                                key={doctor.id || idx}
                                onClick={(e) => { e.stopPropagation(); navigate(`/doctor/${doctor.id}`); }}
                                className="flex items-center justify-between p-4 bg-white rounded-[24px] border border-border/30 shadow-md active:scale-95 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img src={doctor.image} alt={doctor.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${doctor.status === 'Available' || doctor.status === 'APPROVED' ? 'bg-success' : doctor.status === 'In Consultation' ? 'bg-orange-500' : 'bg-slate-400'}`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-[15px] font-extrabold text-main tracking-tight leading-tight group-hover:text-p-600 transition-colors uppercase">{doctor.name}</h4>
                                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider">{doctor.specialty || doctor.specialization}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest ${(doctor.status === 'Available' || doctor.status === 'APPROVED') ? 'bg-emerald-50 text-emerald-600' : doctor.status === 'In Consultation' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-500'}`}>
                                        {(doctor.status === 'APPROVED' ? 'AVAILABLE' : (doctor.status?.toUpperCase() || 'ABSENT'))}
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-p-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Floating Booking Action Island */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[420px] glass p-3 rounded-[28px] shadow-2xl z-[100] flex gap-3 border-white/50">
                <button
                    className="flex-1 bg-white glass border-none h-14 px-6 rounded-2xl font-black text-p-600 text-sm flex items-center justify-center gap-2 active:scale-90 transition-transform shadow-sm"
                    onClick={() => window.location.href = `tel:9999999999`}
                >
                    <Phone size={18} strokeWidth={2.5} /> EMERGENCY
                </button>
                <button
                    className="flex-[1.5] btn-primary h-14 rounded-2xl font-black text-white text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-transform border-none cursor-pointer"
                    onClick={() => navigate(`/book-appointment/${hospital.id}`)}
                >
                    <Calendar size={20} strokeWidth={2.5} /> BOOK NOW
                </button>
            </div>
        </div>
    );
};

export default HospitalDetail;
