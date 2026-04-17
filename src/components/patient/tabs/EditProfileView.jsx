import React, { useState } from 'react';
import { 
    User, Calendar, Droplets, Phone, MapPin, 
    ShieldCheck, QrCode, Camera, Save, ArrowLeft,
    Heart, CreditCard, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { updatePatientProfile } from '../../../firebase/services';

const EditProfileView = ({ user, onBack }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        age: user?.age || '',
        dob: user?.dob || '',
        gender: user?.gender || '',
        bloodGroup: user?.bloodGroup || '',
        phone: user?.phone || '',
        emergencyContact: user?.emergencyContact || '',
        address: user?.address || '',
        abhaId: user?.abhaId || '',
        insuranceProvider: user?.insuranceProvider || '',
        insuranceNumber: user?.insuranceNumber || '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updatePatientProfile(user.uid, formData);
            alert("Profile updated successfully!");
            onBack();
        } catch (error) {
            console.error(error);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const detectLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setFormData(prev => ({ 
                    ...prev, 
                    address: `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}` 
                }));
            });
        }
    };

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-6 flex items-center gap-4">
                <button onClick={onBack} className="p-2 rounded-xl bg-slate-50 text-slate-600 active:scale-90 transition-all">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Edit Profile</h1>
            </header>

            <div className="p-6 space-y-8">
                {/* Photo Section */}
                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-[32px] overflow-hidden border-4 border-slate-50 shadow-xl">
                            <img 
                                src={user?.photoURL || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button className="absolute -bottom-2 -right-2 p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-90 transition-all">
                            <Camera size={20} />
                        </button>
                    </div>
                </div>

                {/* Personal Info */}
                <section className="space-y-4">
                    <SectionLabel icon={User} label="Basic Information" />
                    <div className="grid grid-cols-1 gap-4">
                        <InputGroup label="Full Name" name="displayName" value={formData.displayName} onChange={handleChange} placeholder="Enter your full name" />
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Age" name="age" value={formData.age} onChange={handleChange} placeholder="Years" />
                            <InputGroup label="Gender" name="gender" value={formData.gender} onChange={handleChange} placeholder="Select" />
                        </div>
                        <InputGroup label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} placeholder="e.g. O+" icon={Droplets} />
                    </div>
                </section>

                {/* Contact */}
                <section className="space-y-4">
                    <SectionLabel icon={Phone} label="Contact & Emergency" />
                    <div className="space-y-4">
                        <InputGroup label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="Mobile number" />
                        <InputGroup label="Emergency Contact" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} placeholder="Name & Number" icon={Heart} />
                        <div className="relative group">
                            <InputGroup label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Full address" icon={MapPin} />
                            <button 
                                onClick={detectLocation}
                                className="absolute right-4 bottom-3 text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95"
                            >
                                Get GPS
                            </button>
                        </div>
                    </div>
                </section>

                {/* Advanced Features */}
                <section className="space-y-4">
                    <SectionLabel icon={ShieldCheck} label="Advanced Medical ID" />
                    <div className="space-y-4">
                        <InputGroup label="ABHA / Health ID" name="abhaId" value={formData.abhaId} onChange={handleChange} placeholder="14-digit number" />
                        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-white shadow-sm">
                                    <QrCode size={24} className="text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800">Emergency Access QR</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Visible on lock screen</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-300" />
                        </div>
                        <InputGroup label="Insurance Provider" name="insuranceProvider" value={formData.insuranceProvider} onChange={handleChange} />
                    </div>
                </section>

                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full py-5 rounded-[24px] bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    {loading ? 'Saving Changes...' : 'Save Profile'}
                </button>
            </div>
        </div>
    );
};

const SectionLabel = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-blue-500" />
        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
);

const InputGroup = ({ label, icon: Icon, ...props }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-slate-500 ml-1">{label}</label>
        <div className="relative">
            {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />}
            <input 
                {...props}
                className={`w-full py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-800 text-sm ${Icon ? 'pl-11 pr-4' : 'px-4'}`}
            />
        </div>
    </div>
);

const ChevronRight = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m9 18 6-6-6-6"/>
    </svg>
);

export default EditProfileView;
