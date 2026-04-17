import React, { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Camera, CheckCircle, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadHospitalPhoto } from '../firebase/uploadImage';

const DEFAULT_HOSPITAL_IMAGE = '/images/default-hospital.png';

const HospitalHome = () => {
    const { user, currentHospital, allHospitals, setUser, setCurrentHospital, updateProfile } = useAuth();
    const fallbackHospitalId = user?.id || user?.uid;
    const fallbackHospital = allHospitals.find(h => h.id === fallbackHospitalId);
    const hospital = currentHospital || fallbackHospital;
    const hospitalId = hospital?.id || fallbackHospitalId;
    const hospitalName = hospital?.hospitalName || hospital?.name || user?.displayName || 'Hospital Profile';
    const hospitalLocation = hospital?.address || hospital?.location || 'Add your location details to highlight your presence';
    const [photoPreview, setPhotoPreview] = useState(hospital?.photoURL || hospital?.image || DEFAULT_HOSPITAL_IMAGE);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    useEffect(() => {
        if (hospital?.photoURL) {
            setPhotoPreview(hospital.photoURL);
        } else {
            setPhotoPreview(hospital?.image || DEFAULT_HOSPITAL_IMAGE);
        }
    }, [hospital]);

    const [editName, setEditName] = useState(hospitalName);
    const [isEditingName, setIsEditingName] = useState(false);

    useEffect(() => {
        setEditName(hospitalName);
    }, [hospitalName]);

    const handlePhotoUpload = async (file) => {
        if (!file || !hospitalId) return;
        setStatus({ type: '', text: '' });
        setIsUploading(true);
        try {
            const downloadURL = await uploadHospitalPhoto(hospitalId, file);
            setPhotoPreview(downloadURL);
            setStatus({ type: 'success', text: 'Hospital image updated.' });
            setCurrentHospital(prev => prev ? { ...prev, photoURL: downloadURL } : prev);
            setUser(prev => prev ? { ...prev, photoURL: downloadURL } : prev);
        } catch (error) {
            console.error('Hospital image upload failed:', error);
            setStatus({ type: 'error', text: 'Upload failed. Please try again.' });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const handleNameUpdate = async () => {
        if (!editName.trim()) return;
        setStatus({ type: '', text: '' });
        try {
            const result = await updateProfile({ hospitalName: editName, displayName: editName });
            if (result.success) {
                setCurrentHospital(prev => prev ? { ...prev, hospitalName: editName, name: editName } : prev);
                setIsEditingName(false);
                setStatus({ type: 'success', text: 'Hospital name updated.' });
            } else {
                setStatus({ type: 'error', text: result.message || 'Failed to update name.' });
            }
        } catch (error) {
            console.error('Name update failed:', error);
            setStatus({ type: 'error', text: 'Something went wrong.' });
        }
    };

    const handleFileInputChange = (event) => {
        const file = event.target.files?.[0];
        handlePhotoUpload(file);
    };

    return (
        <div className="min-h-screen bg-[#f5f7fb]">
            <Header title={hospitalName} subtitle="Manage your profile & brand image" />
            <main className="px-6 py-8 space-y-6 max-w-5xl mx-auto">
                <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <img
                                src={photoPreview}
                                alt={hospitalName}
                                className="w-[120px] h-[120px] rounded-[32px] border border-slate-100 object-cover shadow-md transition-transform group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 border-4 border-white rounded-2xl p-2 shadow-lg text-white">
                                <Camera size={20} />
                            </div>
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] flex items-center justify-center">
                                <span className="text-white text-[10px] font-black uppercase tracking-widest">Update</span>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            {isEditingName ? (
                                <div className="flex items-center gap-4 w-full mb-6">
                                    <div className="flex-1 max-w-[320px] relative">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleNameUpdate()}
                                            autoFocus
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[28px] py-4 px-8 text-2xl font-black text-slate-800 shadow-sm focus:shadow-md focus:border-blue-200 outline-none"
                                            placeholder="Hospital Name"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleNameUpdate}
                                        className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <CheckCircle size={24} />
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => setIsEditingName(true)}
                                    className="group/name flex items-center gap-4 mb-6 cursor-pointer"
                                >
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tight group-hover/name:text-blue-600 transition-colors">
                                        {hospitalName}
                                    </h2>
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover/name:bg-blue-50 group-hover/name:text-blue-600 transition-all opacity-0 group-hover/name:opacity-100 transform translate-x-[-10px] group-hover/name:translate-x-0">
                                        <Edit2 size={18} />
                                    </div>
                                </div>
                            )}
                            <p className="text-sm font-bold text-slate-500 ml-4">{hospitalLocation}</p>
                            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mt-3 font-black ml-4">Official Registration Name</p>
                        </div>
                        <div className="w-full md:w-auto mt-4 md:mt-0">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full md:w-auto px-10 py-5 rounded-[28px] bg-white border border-slate-100 text-slate-900 font-black text-sm uppercase tracking-[0.1em] hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Camera size={20} />
                                UPLOAD YOUR PHOTO
                            </button>
                        </div>
                    </div>
                    {status.text && (
                        <div className={`mt-4 p-3 rounded-2xl text-sm font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${status.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {status.text}
                        </div>
                    )}
                    {isUploading && (
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 animate-progress w-2/3" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Optimizing & Uploading...</span>
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileInputChange} />
                    <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileInputChange} />
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Hospital Reach</h3>
                        <p className="text-lg font-bold text-slate-900">{hospital?.services?.length || 0} Services Active</p>
                        <p className="text-[12px] text-slate-500 mt-2">Keep service list up to date so patients can discover your specialties.</p>
                    </div>
                    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Patient Reviews</h3>
                        <p className="text-lg font-bold text-slate-900">{hospital?.rating || 'N/A'}</p>
                        <p className="text-[12px] text-slate-500 mt-2">Maintain a positive brand experience with updated photos and timely responses.</p>
                    </div>
                </section>
            </main>
            <BottomNav />
        </div>
    );
};

export default HospitalHome;
