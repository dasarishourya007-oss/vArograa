import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Star, Clock, MapPin,
    Video, Hospital, Award, ThumbsUp,
    MessageCircle, ShieldCheck, IndianRupee,
    Calendar, CheckCircle2, ChevronRight, Share2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { hospitals } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';

const DoctorProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { allHospitals, allDoctors } = useAuth();

    // Priority: 1. Live doctor data, 2. Live hospital data, 3. Mock fallback
    let doctor = allDoctors.find(d => d.id === id);
    let mainHospital = null;

    if (doctor) {
        mainHospital = allHospitals.find(h => h.id === doctor.hospitalId) || allHospitals.find(h => h.name === doctor.hospitalName);
    }

    if (!doctor) {
        hospitals.forEach(h => {
            const found = h.doctors.find(d => d.id === id);
            if (found) {
                doctor = found;
                mainHospital = h;
            }
        });
    }

    if (!doctor) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#fcfdfe]">
                <h2 className="text-xl font-bold mb-4">Doctor not found</h2>
                <button onClick={() => navigate(-1)} className="btn-primary px-6 py-2 rounded-xl">Go Back</button>
            </div>
        );
    }

    return (
        <div className="container min-h-screen bg-[#fcfdfe] pb-32 animate-entrance relative">

            {/* Cinematic Hero Section */}
            <div className="relative h-[380px] w-full">
                <img
                    src={doctor.photoURL || doctor.image || '/images/default-doctor.png'}
                    alt={doctor.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />

                {/* Header Actions */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-full glass-dark backdrop-blur-md border border-white/20 active:scale-95 transition-transform"
                    >
                        <ArrowLeft size={20} className="text-white" />
                    </button>
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-full glass-dark backdrop-blur-md border border-white/20 active:scale-95 transition-transform"
                    >
                        <Share2 size={20} className="text-white" />
                    </button>
                </div>

                {/* Doctor Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-1"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            {/* Clinical Status */}
                            <div className={`px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider ${doctor.status === 'Available' ? 'bg-success/40' : doctor.status === 'In Consultation' ? 'bg-orange-500/40' : 'bg-slate-500/40'}`}>
                                {doctor.status || 'ABSENT'}
                            </div>
                            {/* Verification Status */}
                            {doctor.status === 'PENDING_APPROVAL' && (
                                <div className="px-2.5 py-1 rounded-lg backdrop-blur-md border border-amber-500/50 bg-amber-600/60 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                                    <Clock size={10} /> Pending Verification
                                </div>
                            )}
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/90 backdrop-blur-md text-white">
                                <Star size={10} fill="currentColor" />
                                <span className="text-[10px] font-black">{doctor.rating || '4.5'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black text-white leading-tight tracking-tight">{doctor.name}</h1>
                            {doctor.status === 'APPROVED' || doctor.status === 'ACTIVE' ? (
                                <ShieldCheck size={24} className="text-blue-400" fill="currentColor" />
                            ) : (
                                <ShieldCheck size={24} className="text-white/30" />
                            )}
                        </div>
                        <p className="text-lg text-slate-200 font-medium">{doctor.specialty} • {doctor.experience}+ Years</p>
                    </motion.div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="px-6 -mt-8 relative z-20">
                <div className="glass p-4 rounded-[24px] shadow-xl flex justify-between items-center border-white/50">
                    <div className="flex flex-col items-center gap-1 flex-1 border-r border-border/50">
                        <div className="w-10 h-10 rounded-2xl bg-p-50 flex items-center justify-center mb-1">
                            <Award size={20} className="text-p-600" />
                        </div>
                        <span className="text-sm font-black text-main">{doctor.experience}+</span>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Years</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-1 border-r border-border/50">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center mb-1">
                            <Star size={20} className="text-orange-500" fill="currentColor" />
                        </div>
                        <span className="text-sm font-black text-main">{doctor.rating}</span>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Rating</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-1 border-r border-border/50">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-1">
                            <MessageCircle size={20} className="text-emerald-500" />
                        </div>
                        <span className="text-sm font-black text-main">{doctor.reviewsCount || 0}</span>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Reviews</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center mb-1">
                            <Clock size={20} className="text-blue-500" />
                        </div>
                        <span className="text-sm font-black text-main">{doctor.consultingTime || '15 mins'}</span>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Wait</span>
                    </div>
                </div>
            </div>

            <div className="px-6 mt-8 flex flex-col gap-6">

                {/* About Section */}
                <div>
                    <h3 className="text-lg font-black text-main mb-3 flex items-center gap-2">
                        About Doctor
                    </h3>
                    <p className="text-sm text-muted leading-relaxed font-medium">
                        Dr. {doctor.name.split(' ').pop()} is a highly skilled {doctor.specialty} with over {doctor.experience} years of experience in treating complex cases. Dedicated to providing compassionate care using the latest medical advancements.
                    </p>
                </div>

                {/* Consultation Fees */}
                {doctor.fees && (
                    <div>
                        <h3 className="text-lg font-black text-main mb-3 flex items-center gap-2">
                            Consultation Fees
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-[24px] bg-white border border-border/50 flex flex-col items-center gap-1 shadow-sm">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Online</span>
                                <span className="text-xl font-black text-p-600">Rs.{doctor.fees.online}</span>
                            </div>
                            <div className="p-4 rounded-[24px] bg-white border border-border/50 flex flex-col items-center gap-1 shadow-sm">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Hospital</span>
                                <span className="text-xl font-black text-main">Rs.{doctor.fees.offline}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Availability */}
                {doctor.availability?.available && (
                    <div>
                        <h3 className="text-lg font-black text-main mb-3 flex items-center gap-2">
                            Next Available Slots
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {doctor.availability.available.slice(0, 4).map((time, i) => (
                                <div key={i} className="px-4 py-2 rounded-xl bg-p-50 text-p-700 text-xs font-bold border border-p-100">
                                    {time}
                                </div>
                            ))}
                            {doctor.availability.available.length > 4 && (
                                <div className="px-4 py-2 rounded-xl bg-slate-50 text-muted text-xs font-bold border border-slate-100">
                                    +{doctor.availability.available.length - 4} More
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Practice Locations */}
                {doctor.hospitals && (
                    <div>
                        <h3 className="text-lg font-black text-main mb-3 flex items-center gap-2">
                            Practice Locations
                        </h3>
                        <div className="flex flex-col gap-3">
                            {doctor.hospitals.map((h, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-[24px] bg-white border border-border/50 shadow-sm">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                        <Hospital size={20} className="text-slate-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-black text-main">{h}</h4>
                                        {h === mainHospital?.name && (
                                            <span className="text-[10px] font-bold text-success uppercase tracking-wide">Primary Location</span>
                                        )}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                        <ChevronRight size={16} className="text-slate-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Patient Reviews Preview */}
                {doctor.reviews && doctor.reviews.length > 0 && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-black text-main">Patient Stories</h3>
                            <button className="text-xs font-bold text-p-600">View All</button>
                        </div>
                        {doctor.reviews.slice(0, 2).map((review) => (
                            <div key={review.id} className="mb-4 p-4 rounded-[24px] bg-slate-50/50 border border-border/30">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-main">{review.user}</span>
                                    <div className="flex items-center gap-0.5">
                                        <Star size={10} className="text-orange-400" fill="currentColor" />
                                        <span className="text-[10px] font-bold text-orange-400">{review.rating}.0</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted leading-relaxed font-medium">"{review.comment}"</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Booking Island */}
            {doctor.fees && mainHospital && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[430px] p-2 rounded-[32px] glass shadow-2xl z-[100] border-white/60 flex items-center gap-2 backdrop-blur-xl">
                    <button
                        onClick={() => navigate(`/book-appointment/${mainHospital.id}?doctor=${doctor.id}&type=home`)}
                        className="flex-1 h-14 rounded-[24px] flex flex-col items-center justify-center gap-0.5 bg-emerald-50 hover:bg-emerald-100 transition-colors active:scale-95"
                    >
                        <span className="text-[11px] font-black text-emerald-700">🏠 Home</span>
                        <span className="text-[10px] font-bold text-emerald-500">Visit</span>
                    </button>
                    <button
                        onClick={() => navigate(`/book-appointment/${mainHospital.id}?doctor=${doctor.id}&type=online`)}
                        className="flex-1 h-14 rounded-[24px] flex flex-col items-center justify-center gap-0.5 bg-p-50 hover:bg-p-100 transition-colors active:scale-95"
                    >
                        <span className="text-[11px] font-black text-p-600">📹 Online</span>
                        <span className="text-[10px] font-bold text-p-400">Rs.{doctor.fees.online}</span>
                    </button>
                    <button
                        onClick={() => navigate(`/book-appointment/${mainHospital.id}?doctor=${doctor.id}&type=hospital`)}
                        className="flex-[1.3] h-14 rounded-[24px] flex flex-col items-center justify-center gap-0.5 btn-primary shadow-lg shadow-p-600/20 active:scale-95 border-none"
                    >
                        <span className="text-[11px] font-black text-white">🏥 Hospital</span>
                        <span className="text-[10px] font-bold text-white/80">Rs.{doctor.fees.offline}</span>
                    </button>
                </div>
            )}
            {doctor.fees && !mainHospital && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[420px] p-2 rounded-[32px] glass shadow-2xl z-[100] border-white/60 flex items-center gap-3 backdrop-blur-xl">
                    <button onClick={() => navigate(-1)} className="flex-1 h-14 rounded-[24px] flex items-center justify-center gap-2 btn-primary border-none">
                        <span className="text-[13px] font-black text-white">Go Back</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default DoctorProfile;
