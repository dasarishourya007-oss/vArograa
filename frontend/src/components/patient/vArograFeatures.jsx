import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    Heart,
    Activity,
    Thermometer,
    Droplets,
    History,
    ShieldAlert,
    ChevronRight,
    Loader2,
    CheckCircle2,
    MapPin,
    Phone,
    Navigation,
    X
} from 'lucide-react';
import { createSOSRequest, subscribeToVitals } from '../../firebase/services';
import { haversineKm, samePlace } from '../../utils/geo';
import { reverseGeocodeNominatim, extractAddressFieldsFromNominatim } from '../../utils/geocode';

const VitalItem = ({ icon, label, value, unit, color }) => {
    const IconCmp = icon;
    return (
        <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex-1">
            <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
                {IconCmp && <IconCmp size={18} />}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
            <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-black text-slate-800">{value || '--'}</span>
                <span className="text-[9px] font-bold text-slate-400">{unit}</span>
            </div>
        </div>
    );
};

const getHospitalCoords = (h) => {
    const loc = h?.location;
    const lat =
        typeof h?.latitude === 'number' ? h.latitude :
            typeof h?.lat === 'number' ? h.lat :
                typeof loc?.latitude === 'number' ? loc.latitude :
                    typeof loc?.lat === 'number' ? loc.lat :
                        Number(h?.latitude ?? h?.lat ?? loc?.latitude ?? loc?.lat);

    const lng =
        typeof h?.longitude === 'number' ? h.longitude :
            typeof h?.lng === 'number' ? h.lng :
                typeof h?.lon === 'number' ? h.lon :
                    typeof loc?.longitude === 'number' ? loc.longitude :
                        typeof loc?.lng === 'number' ? loc.lng :
                            typeof loc?.lon === 'number' ? loc.lon :
                                Number(h?.longitude ?? h?.lng ?? h?.lon ?? loc?.longitude ?? loc?.lng ?? loc?.lon);

    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

// --- AI SOS Emergency Button ---
export const AISOSButton = ({ patientId, hospitals = [], patientProfile = null }) => {
    const [status, setStatus] = useState('idle'); // idle | locating | ready | sending | sent
    const [panelOpen, setPanelOpen] = useState(false);
    const [coords, setCoords] = useState(null);
    const [place, setPlace] = useState(null);
    const [error, setError] = useState(null);

    const ranked = useMemo(() => {
        if (!coords) return [];
        const profile = patientProfile || {};
        const mandal = profile.mandal || profile?.defaultAddress?.mandal || '';
        const district = profile.district || profile?.defaultAddress?.district || '';

        const scored = (hospitals || [])
            .map((h) => {
                const hc = getHospitalCoords(h);
                const km = hc ? haversineKm(coords, hc) : null;
                const mandalScore = samePlace(h?.mandal, mandal) ? 0 : samePlace(h?.district, district) ? 1 : 2;
                return {
                    ...h,
                    _km: km,
                    _scope: mandalScore
                };
            })
            .sort((a, b) => {
                if (a._scope !== b._scope) return a._scope - b._scope;
                const ak = typeof a._km === 'number' ? a._km : Number.POSITIVE_INFINITY;
                const bk = typeof b._km === 'number' ? b._km : Number.POSITIVE_INFINITY;
                return ak - bk;
            });

        return scored.slice(0, 3);
    }, [coords, hospitals, patientProfile]);

    const getCurrentLocation = async () => {
        if (!('geolocation' in navigator)) throw new Error('Geolocation not supported.');

        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 0
            });
        });

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const c = { lat, lng };

        let resolved = null;
        try {
            const payload = await reverseGeocodeNominatim(lat, lng);
            resolved = extractAddressFieldsFromNominatim(payload);
        } catch {
            resolved = null;
        }

        return { coords: c, place: resolved };
    };

    const startSOS = async () => {
        setError(null);
        setPanelOpen(true);
        setStatus('locating');
        try {
            const { coords: c, place: p } = await getCurrentLocation();
            setCoords(c);
            setPlace(p);
            setStatus('ready');
        } catch (e) {
            setError(e?.message || 'Could not get your location.');
            setStatus('idle');
        }
    };

    const sendSOS = async (hospital) => {
        if (!patientId) return;
        setError(null);
        setStatus('sending');

        try {
            const loc = {
                lat: coords?.lat,
                lng: coords?.lng,
                address: place?.displayName || 'Current Location',
                state: place?.state || '',
                district: place?.district || '',
                mandal: place?.mandal || '',
                pincode: place?.pincode || ''
            };

            await createSOSRequest({
                patientId,
                hospitalId: hospital?.id || hospital?.hospitalId || null,
                location: loc,
                type: 'AI_EMERGENCY'
            });

            setStatus('sent');
            setTimeout(() => {
                setStatus('idle');
                setPanelOpen(false);
            }, 4000);
        } catch (e) {
            console.error('SOS Failed:', e);
            setError('SOS failed. Please try again.');
            setStatus('ready');
        }
    };

    const openNavigation = (hospital) => {
        const hc = getHospitalCoords(hospital);
        if (!hc) return;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${hc.lat},${hc.lng}`)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="fixed bottom-24 right-5 z-50">
            <AnimatePresence>
                {panelOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        className="absolute bottom-20 right-0 w-[320px] bg-white rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden"
                    >
                        <div className="p-4 bg-rose-600 text-white flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <ShieldAlert size={18} />
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest">SOS Emergency</p>
                                    <p className="text-[11px] font-bold opacity-90">
                                        {status === 'locating'
                                            ? 'Detecting your location...'
                                            : status === 'ready'
                                                ? 'Nearest hospitals shown below'
                                                : status === 'sending'
                                                    ? 'Sending SOS...'
                                                    : status === 'sent'
                                                        ? 'SOS sent'
                                                        : 'Tap SOS to start'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => status !== 'sending' && (setPanelOpen(false), setStatus('idle'))}
                                className="p-2 rounded-2xl bg-white/15 active:scale-95"
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-4">
                            {error && <p className="text-[11px] font-bold text-rose-600 mb-3">{error}</p>}

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 mb-3">
                                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Your location</p>
                                <p className="text-xs font-black text-slate-900 mt-1 line-clamp-2">
                                    {place?.displayName || (coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : '--')}
                                </p>
                                {(place?.mandal || place?.district) && (
                                    <p className="text-[11px] font-bold text-slate-500 mt-1">
                                        {place?.mandal ? `Mandal: ${place.mandal}` : ''}{place?.district ? `  District: ${place.district}` : ''}
                                    </p>
                                )}
                            </div>

                            {status === 'locating' && (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="animate-spin text-rose-600" size={28} />
                                </div>
                            )}

                            {status !== 'locating' && ranked.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    {ranked.map((h) => (
                                        <div key={h.id} className="border border-slate-100 rounded-2xl p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-slate-900 truncate">
                                                        {h.name || h.hospitalName || 'Hospital'}
                                                    </p>
                                                    <p className="text-[11px] font-bold text-slate-500 line-clamp-1">
                                                        {h.address || h.location || ''}
                                                    </p>
                                                    {typeof h._km === 'number' && (
                                                        <p className="text-[11px] font-black text-rose-600 mt-1">
                                                            {h._km.toFixed(h._km < 10 ? 1 : 0)} km away
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openNavigation(h)}
                                                        className="p-2 rounded-xl bg-slate-100 text-slate-700 active:scale-95"
                                                        aria-label="Navigate"
                                                    >
                                                        <Navigation size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => (window.location.href = `tel:${h.phone || '108'}`)}
                                                        className="p-2 rounded-xl bg-slate-100 text-slate-700 active:scale-95"
                                                        aria-label="Call"
                                                    >
                                                        <Phone size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                disabled={status === 'sending' || status === 'sent'}
                                                onClick={() => sendSOS(h)}
                                                className="mt-3 w-full py-3 rounded-2xl bg-rose-600 text-white text-[11px] font-black tracking-widest uppercase shadow-lg shadow-rose-200 disabled:opacity-60 active:scale-95"
                                            >
                                                {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Sent' : 'Send SOS to this hospital'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {status !== 'locating' && ranked.length === 0 && (
                                <div className="text-center py-6">
                                    <MapPin className="mx-auto text-slate-300" size={28} />
                                    <p className="text-xs font-black text-slate-800 mt-2">No nearby hospitals loaded</p>
                                    <p className="text-[11px] font-bold text-slate-500 mt-1">Set your address to improve SOS discovery.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (status === 'idle' ? startSOS() : setPanelOpen(true))}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all ${status === 'sent' ? 'bg-emerald-500' : 'bg-rose-600 animate-pulse'
                    }`}
                style={{ border: '4px solid rgba(255,255,255,0.3)' }}
            >
                {status === 'locating' || status === 'sending' ? (
                    <Loader2 className="text-white animate-spin" size={32} />
                ) : status === 'sent' ? (
                    <CheckCircle2 className="text-white" size={32} />
                ) : (
                    <ShieldAlert className="text-white" size={32} />
                )}
            </motion.button>
        </div>
    );
};

// --- Vitals Monitoring Card ---
export const VitalsCard = ({ patientId }) => {
    const [vitals, setVitals] = useState(null);
    const [, setLoading] = useState(true);

    useEffect(() => {
        if (!patientId) return;
        const unsub = subscribeToVitals(patientId, (data) => {
            setVitals(data[0] || null);
            setLoading(false);
        });
        return () => unsub();
    }, [patientId]);

    return (
        <div className="glass p-5 rounded-[32px] border-slate-100 mb-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="text-blue-600" size={20} />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Vitals Monitoring</h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase">Live Sync</span>
            </div>

            <div className="flex gap-2">
                <VitalItem icon={Heart} label="BPM" value={vitals?.heartRate} unit="bpm" color="bg-rose-50" />
                <VitalItem icon={Activity} label="BP" value={vitals?.bloodPressure} unit="mmHg" color="bg-blue-50" />
                <VitalItem icon={Thermometer} label="Temp" value={vitals?.temperature} unit="F" color="bg-orange-50" />
                <VitalItem icon={Droplets} label="SpO2" value={vitals?.oxygenLevel} unit="%" color="bg-cyan-50" />
            </div>
        </div>
    );
};

// --- AI Triage History ---
export const AITriageHistory = ({ logs = [] }) => {
    if (logs.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                <History className="text-p-600" size={20} />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">AI Health Insights</h3>
            </div>
            <div className="flex flex-col gap-3">
                {logs.slice(0, 3).map((log, idx) => (
                    <div key={idx} className="glass p-4 rounded-2xl border-slate-100 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.riskLevel === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase">{log.riskLevel} Risk Check</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(log.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300" />
                    </div>
                ))}
            </div>
        </div>
    );
};
