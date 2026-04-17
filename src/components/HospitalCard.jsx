import React from 'react';
import { Star, MapPin, Phone, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from './Badge';

const HospitalCard = ({ hospital, onClick }) => {
    const navigate = useNavigate();

    const handleCall = (e) => {
        e.stopPropagation();
        window.location.href = `tel:9999999999`; // Placeholder
    };

    const isTopRated = hospital.rating >= 5.0;
    
    return (
        <div
            onClick={onClick}
            className={`flex flex-col gap-0 mb-8 group active:scale-[1.0] transition-all duration-300 rounded-[32px] overflow-hidden ${isTopRated ? 'gold-card' : 'bg-white shadow-md border border-slate-100 hover:shadow-xl'}`}
        >
            {/* Header/Image Section */}
            <div className="relative h-[180px] overflow-hidden">
                <img
                    src={hospital.image || 'https://img.freepik.com/free-vector/hospital-building-concept-illustration_114360-8440.jpg'}
                    alt={hospital.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Top Overlay */}
                <div className="absolute top-4 left-4 flex gap-2">
                    {hospital.rating >= 4.5 && (
                        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 font-black text-[10px] tracking-wider shadow-lg ${hospital.rating >= 4.9 ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' : 'bg-white text-slate-900 border border-slate-100'}`}>
                            <Star size={12} fill="currentColor" />
                            {hospital.rating >= 4.9 ? 'PREMIUM PARTNER' : 'HIGHLY RATED'}
                        </div>
                    )}
                    <div className="px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-[10px] tracking-wider shadow-lg">
                        OPEN
                    </div>
                </div>

                {/* Distance Overlay */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-white/20">
                    <span className="text-[11px] font-black text-slate-800">{hospital.distance}</span>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-5 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1 max-w-[75%]">
                        <h3 className="text-[19px] font-black text-slate-900 tracking-tight leading-none truncate uppercase">
                            {hospital.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <MapPin size={12} className="text-p-600" />
                            <span className="text-[12px] font-bold text-slate-400 truncate">{hospital.address}</span>
                        </div>
                    </div>
                    
                    {/* Rating Badge */}
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-[12px] ${isTopRated ? 'bg-amber-50 text-amber-500 border border-amber-200' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                        <Star size={12} fill="currentColor" className={isTopRated ? 'text-amber-500' : 'text-slate-400'} />
                        <span className="text-[13px] font-black">{hospital.rating}</span>
                    </div>
                </div>

                {/* Pricing Tiers Section */}
                {hospital.consultationFees && (
                    <div className="flex gap-2 mb-4">
                        <div className="flex-1 bg-blue-50/50 p-2.5 rounded-2xl border border-blue-100/50 flex flex-col items-center">
                            <span className="text-[14px] font-black text-blue-600">₹{hospital.consultationFees.online}</span>
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-0.5">Online</span>
                        </div>
                        <div className="flex-1 bg-emerald-50/50 p-2.5 rounded-2xl border border-emerald-100/50 flex flex-col items-center">
                            <span className="text-[14px] font-black text-emerald-600">₹{hospital.consultationFees.offline}</span>
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mt-0.5">Offline</span>
                        </div>
                        <div className="flex-1 bg-violet-50/50 p-2.5 rounded-2xl border border-violet-100/50 flex flex-col items-center">
                            <span className="text-[14px] font-black text-violet-600">₹{hospital.consultationFees.home}</span>
                            <span className="text-[8px] font-black text-violet-400 uppercase tracking-widest mt-0.5">Home Visit</span>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex gap-2.5 mt-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/book-appointment/${hospital.id}`); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[20px] font-black text-[13px] tracking-wide border-none cursor-pointer transition-all active:scale-95 ${isTopRated ? 'gold-btn' : 'bg-p-600 text-white shadow-lg shadow-p-200 hover:bg-p-700'}`}
                    >
                        <Calendar size={16} strokeWidth={3} /> BOOK APPOINTMENT
                    </button>
                    <button
                        onClick={handleCall}
                        className="p-4 rounded-[20px] bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100 hover:text-p-600 transition-all active:scale-90"
                    >
                        <Phone size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HospitalCard;
