import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Store, ShieldCheck, ArrowLeft, Loader2, MapPin, Image as ImageIcon, CheckCircle, Copy, Plus } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import AuthLayout from '../../components/AuthLayout';
import { motion } from 'framer-motion';
import ImageUpload from '../../components/ImageUpload';
import MapComponent from '../../components/MapComponent';

const MedicalStoreRegister = () => {
    const navigate = useNavigate();
    const { registerMedicalStore } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        selectedAddress: '',
        location: '',
        email: '',
        inChargeName: '',
        primaryPhone: '',
        secondaryPhone: '',
        pin: '',
        image: null
    });

    const [error, setError] = useState('');
    const [generatedCode, setGeneratedCode] = useState(null);
    const [isAddressLoading, setIsAddressLoading] = useState(false);
    const [mapType, setMapType] = useState('satellite');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.location) {
            setError('Please pinpoint your medical store on the map.');
            return;
        }

        if (!formData.image) {
            setError('Please upload an image of the store front.');
            return;
        }

        try {
            const res = await registerMedicalStore({
                ...formData,
                address: formData.selectedAddress || formData.address
            });

            if (typeof res === 'object' && res.success === false) {
                setError(res.message);
            } else {
                setGeneratedCode(res);
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
            console.error(err);
        }
    };

    const fetchAddress = async (lat, lng) => {
        setIsAddressLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            if (data && data.display_name) {
                setFormData(prev => ({
                    ...prev,
                    selectedAddress: data.display_name,
                    location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                }));
            }
        } catch (error) {
            console.error('Error fetching address:', error);
            setFormData(prev => ({
                ...prev,
                location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            }));
        } finally {
            setIsAddressLoading(false);
        }
    };

    const handleMapClick = (latlng) => {
        fetchAddress(latlng.lat, latlng.lng);
    };

    const handleLocationFound = (loc) => {
        fetchAddress(loc[0], loc[1]);
    };

    if (generatedCode) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100"
                >
                    <div className="bg-emerald-500 p-10 text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <ShieldCheck size={40} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Registration Success</h2>
                            <p className="text-emerald-100 font-bold text-sm mt-2">Your Pharmacy Network Access is Ready</p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full -ml-12 -mb-12 blur-xl" />
                    </div>

                    <div className="p-10 text-center">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Official Store Code</p>
                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 relative group cursor-pointer active:scale-[0.98] transition-all"
                            onClick={() => {
                                navigator.clipboard.writeText(generatedCode);
                                alert('Code copied to clipboard!');
                            }}>
                            <h2 className="text-5xl font-black text-slate-800 tracking-[0.1em]">{generatedCode}</h2>
                            <div className="absolute bottom-4 right-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Copy size={16} />
                            </div>
                        </div>

                        <div className="mt-8 space-y-4 text-left bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
                            <div className="flex gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-black shrink-0">1</div>
                                <p className="text-xs font-bold text-slate-600">Save this code securely. It is your permanent login identifier.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-black shrink-0">2</div>
                                <p className="text-xs font-bold text-slate-600">Use your 4-digit Master PIN and OTP to access the portal.</p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/login/medical-store')}
                            className="mt-10 w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-widest text-sm"
                        >
                            Proceed to Login
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center p-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[700px] w-full bg-white rounded-[48px] shadow-[0_32px_64px_-16px_rgba(30,41,59,0.1)] border border-slate-100 p-10"
            >
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <div
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer mb-6"
                        >
                            <ArrowLeft size={20} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pharmacy Network</h1>
                        <p className="text-slate-400 font-bold mt-1">Register your medical store with vArogra</p>
                    </div>
                    <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <Store size={32} className="text-white" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-rose-50 text-rose-500 p-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-rose-100 flex items-center gap-3"
                        >
                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                            {error}
                        </motion.div>
                    )}


                    <div className="grid gap-6">
                        <section>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Store Details</p>
                            <div className="space-y-6">
                                <Input
                                    label="Display Name"
                                    placeholder="e.g. Apollo Pharmacy"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-700">Official Location (Satellite View)</label>
                                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                                            <button 
                                                type="button"
                                                onClick={() => setMapType('street')}
                                                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${mapType === 'street' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                            >Street</button>
                                            <button 
                                                type="button"
                                                onClick={() => setMapType('satellite')}
                                                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${mapType === 'satellite' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                            >Satellite</button>
                                        </div>
                                    </div>
                                    
                                    <div className="h-[350px] w-full rounded-[32px] overflow-hidden border border-slate-100 shadow-inner relative group">
                                        <MapComponent 
                                            mapType={mapType}
                                            onMapClick={handleMapClick}
                                            onLocationFound={handleLocationFound}
                                            markers={formData.location ? [
                                                { 
                                                    position: formData.location.split(', ').map(Number),
                                                    title: formData.name || 'Store Location'
                                                }
                                            ] : []}
                                        />
                                        {isAddressLoading && (
                                            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-[2000] flex items-center justify-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Identifying Address...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className={`p-5 rounded-3xl border transition-all ${formData.location ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.location ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                    <MapPin size={16} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coordinates Identified</p>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">
                                                {formData.location || 'Click on map to select store location'}
                                            </p>
                                        </div>

                                        {formData.selectedAddress && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 flex gap-4"
                                            >
                                                <CheckCircle size={20} className="text-blue-500 shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Detected Address</p>
                                                    <p className="text-xs font-bold text-slate-600 leading-relaxed linea-clamp-2">{formData.selectedAddress}</p>
                                                </div>
                                            </motion.div>
                                        )}

                                        <p className="text-[10px] text-slate-400 font-bold px-4 text-center leading-relaxed">
                                            The map will automatically detect your location. You can also click anywhere on the map to pin your store's exact entrance.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Store Identity & Verification</p>
                            <div className="space-y-4">
                                <ImageUpload
                                    label="Store FRONT View"
                                    image={formData.image}
                                    onImageChange={(img) => setFormData(prev => ({ ...prev, image: img }))}
                                    className="max-w-full"
                                />
                                <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest px-4">
                                    Upload a clear photo of your pharmacy's storefront
                                </p>
                            </div>
                        </section>

                        <section className="pt-4 border-t border-slate-50">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Administrative</p>
                            <div className="space-y-4">
                                <Input
                                    label="Pharmacist In-Charge"
                                    placeholder="Enter full name"
                                    value={formData.inChargeName}
                                    onChange={(e) => setFormData({ ...formData, inChargeName: e.target.value })}
                                    required
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Primary Phone"
                                        placeholder="+91..."
                                        value={formData.primaryPhone}
                                        onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Secondary"
                                        placeholder="+91..."
                                        value={formData.secondaryPhone}
                                        onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                                        required
                                    />
                                </div>

                                <Input
                                    label="Store Email"
                                    type="email"
                                    placeholder="official@store.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />

                                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                    <Input
                                        label="Master PIN (4-Digits)"
                                        type="password"
                                        placeholder="••••"
                                        maxLength={4}
                                        value={formData.pin}
                                        onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                        required
                                        className="text-center text-2xl tracking-[1em]"
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold mt-4 text-center">This PIN is required for every secure login session.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <button
                        type="submit"
                        disabled={isAddressLoading}
                        className="w-full bg-blue-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm mt-6"
                    >
                        Complete Onboarding
                    </button>

                    <p className="text-center text-sm font-bold text-slate-500 mt-8">
                        Already part of the network? <span
                            onClick={() => navigate('/login/medical-store')}
                            className="text-blue-600 cursor-pointer hover:underline underline-offset-4"
                        >Login here</span>
                    </p>
                </form>
            </motion.div>
        </div>
    );
};

export default MedicalStoreRegister;
