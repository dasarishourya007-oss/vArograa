import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Search, MapPin, Navigation, Plus, ChevronRight,
    X, Home, Briefcase, Map as MapIcon, Compass, MoreHorizontal, Share2, ArrowLeft, Check
} from 'lucide-react';
import MapComponent from './MapComponent';

const LocationPicker = ({ isOpen, onClose, onSelect }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({ name: '', details: '', latlng: null });
    const [mapCenter, setMapCenter] = useState([17.3850, 78.4867]); // Default Hyderabad
    const [isLocating, setIsLocating] = useState(false);

    const savedAddresses = [
        {
            id: 1,
            type: 'College',
            icon: MapPin,
            address: 'cmr boys hostel 2, 2 Floor, boys hostel 2, CMR Engineering College, Kandlakoya (V, Medchal ...',
            phone: '+91-8885631859',
            distance: '302 m'
        },
        {
            id: 2,
            type: 'Home',
            icon: Home,
            address: '16-12/3,naspur,ccc,mancherial, ccc main Rd,naspur, mancherial,Telangana, India, Telan...',
            distance: '177 km'
        }
    ];

    const nearbyLocations = [
        { id: 101, name: 'CMR Engineering College', address: 'Medchal Rd, Medchal, Kandlakoya, Seethariguda', distance: '188 m' },
        { id: 102, name: 'Priyanka Reddy Boys Hostel', address: 'Medchal, Kandlakoya', distance: '262 m' }
    ];

    const filteredSaved = savedAddresses.filter(addr =>
        addr.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addr.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredNearby = nearbyLocations.filter(loc =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSearchAddress = async (query) => {
        if (!query) return;
        setIsLocating(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const newCoords = [parseFloat(lat), parseFloat(lon)];
                setMapCenter(newCoords);
                setNewAddress(prev => ({ ...prev, details: display_name, latlng: newCoords }));
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsLocating(false);
        }
    };

    const handleMapClick = async (latlng) => {
        const coords = [latlng.lat, latlng.lng];
        setNewAddress(prev => ({ ...prev, latlng: coords }));
        setMapCenter(coords);

        // Reverse geocode to get address details
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                setNewAddress(prev => ({ ...prev, details: data.display_name }));
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error);
        }
    };

    const handleSaveAddress = () => {
        if (!newAddress.name) {
            alert(t('enter_address_name_alert'));
            return;
        }
        onSelect(newAddress.name);
        setIsAddingAddress(false);
        onClose();
    };

    const handleCurrentLocation = () => {
        if (!("geolocation" in navigator)) {
            alert(t('geolocation_not_supported'));
            return;
        }

        setIsFetching(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const data = await response.json();
                    // Get a short version of the address (city/area)
                    const parts = data.display_name.split(',');
                    const shortAddress = parts.length > 2 ? `${parts[0]}, ${parts[1]}` : data.display_name;
                    onSelect(shortAddress);
                } catch {
                    onSelect(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                } finally {
                    setIsFetching(false);
                    onClose();
                }
            },
            (error) => {
                setIsFetching(false);
                if (error.code === 1) {
                    alert(t('allow_location_access'));
                } else {
                    alert(t('unable_fetch_location'));
                }
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[3000] flex justify-end flex-col items-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                />

                {/* Drawer */}
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-[480px] h-[92vh] bg-[#f8f9fb] rounded-t-[32px] overflow-hidden flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-6 bg-white border-b border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <button onClick={onClose} className="p-1 -ml-1">
                                <ChevronRight className="rotate-90 text-slate-800" size={28} />
                            </button>
                            <h2 className="text-[20px] font-black text-slate-900 tracking-tight">{t('select_location')}</h2>
                        </div>

                        {/* Search Bar */}
                        <div className="flex items-center gap-3 bg-white border-2 border-slate-100 px-4 py-3 rounded-2xl shadow-sm focus-within:border-red-500 transition-colors">
                            <Search size={22} className="text-red-500" strokeWidth={3} />
                            <input
                                type="text"
                                placeholder={t('search_area_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    {!isAddingAddress ? (
                        <div className="flex-1 overflow-y-auto pb-10">
                            {/* Quick Actions */}
                            <div className="bg-white px-6 py-2 space-y-1">
                                <button
                                    onClick={handleCurrentLocation}
                                    disabled={isFetching}
                                    className="w-full flex items-center justify-between py-4 group active:opacity-60 disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                            {isFetching ? <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <Compass className="text-red-500" size={20} strokeWidth={3} />}
                                        </div>
                                        <span className="text-[15px] font-black text-red-600">
                                            {isFetching ? t('fetching_location') : t('use_current_location')}
                                        </span>
                                    </div>
                                    {!isFetching && <ChevronRight size={18} className="text-slate-400" />}
                                </button>

                                <div className="h-[1px] bg-slate-100 ml-14" />

                                <button
                                    onClick={() => setIsAddingAddress(true)}
                                    className="w-full flex items-center justify-between py-4 group active:opacity-60"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                            <Plus className="text-red-500" size={20} strokeWidth={3} />
                                        </div>
                                        <span className="text-[15px] font-black text-red-600">{t('add_address')}</span>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-400" />
                                </button>
                            </div>

                            {/* Saved Addresses */}
                            <div className="mt-8 px-6">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('saved_addresses')}</h3>
                                <div className="space-y-4">
                                    {filteredSaved.map(addr => (
                                        <div
                                            key={addr.id}
                                            onClick={() => { onSelect(addr.type); onClose(); }}
                                            className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1">
                                                    <addr.icon size={22} className="text-slate-700" strokeWidth={2.5} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-[15px] font-black text-slate-900">{addr.type}</h4>
                                                        <span className="text-[10px] font-black text-slate-400">{addr.distance}</span>
                                                    </div>
                                                    <p className="text-[12px] font-bold text-slate-500 leading-relaxed mt-1 line-clamp-2">
                                                        {addr.address}
                                                    </p>
                                                    {addr.phone && (
                                                        <p className="text-[11px] font-black text-slate-400 mt-2">
                                                            {t('phone_number')}: {addr.phone}
                                                        </p>
                                                    )}

                                                    <div className="flex gap-3 mt-4">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); alert('More Options'); }}
                                                            className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"
                                                        >
                                                            <MoreHorizontal size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); alert('Sharing Address'); }}
                                                            className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"
                                                        >
                                                            <Share2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Nearby Locations */}
                            <div className="mt-8 px-6">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('nearby_locations_picker')}</h3>
                                <div className="space-y-1">
                                    {filteredNearby.map(loc => (
                                        <button
                                            key={loc.id}
                                            onClick={() => {
                                                onSelect(loc.name);
                                                onClose();
                                            }}
                                            className="w-full flex items-start gap-4 p-4 hover:bg-white rounded-2xl transition-colors text-left"
                                        >
                                            <div className="mt-1">
                                                <MapPin size={20} className="text-slate-700" strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 border-b border-slate-100 pb-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[14px] font-black text-slate-900">{loc.name}</h4>
                                                    <span className="text-[10px] font-black text-slate-400">{loc.distance}</span>
                                                </div>
                                                <p className="text-[12px] font-bold text-slate-500 mt-0.5">{loc.address}</p>
                                            </div>
                                        </button>
                                    ))}
                                    {filteredSaved.length === 0 && filteredNearby.length === 0 && (
                                        <div className="text-center py-10">
                                            <p className="text-slate-400 font-bold">{t('no_locations_found')} "{searchTerm}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col bg-white overflow-hidden">
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsAddingAddress(false)} className="p-2 -ml-2 hover:bg-slate-50 rounded-full">
                                        <ArrowLeft size={24} className="text-slate-800" />
                                    </button>
                                    <h3 className="text-lg font-black text-slate-900">{t('add_detailed_address')}</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">{t('address_name')}</label>
                                        <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:border-red-500 transition-colors">
                                            <MapPin size={18} className="text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder={t('address_name_placeholder')}
                                                value={newAddress.name}
                                                onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                                                className="bg-transparent border-none outline-none w-full font-bold text-slate-800 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-end">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">{t('location_search')}</label>
                                            <span className="text-[10px] font-bold text-red-500 mb-1">{t('press_enter_to_search')}</span>
                                        </div>
                                        <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:border-red-500 transition-colors">
                                            <Search size={18} className="text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder={t('search_area_detailed_placeholder')}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSearchAddress(e.target.value);
                                                    }
                                                }}
                                                className="bg-transparent border-none outline-none w-full font-bold text-slate-800 text-sm"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousSibling;
                                                    handleSearchAddress(input.value);
                                                }}
                                                className="text-[11px] font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
                                            >
                                                {t('locate')}
                                            </button>
                                            {isLocating && <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 relative group">
                                <MapComponent
                                    center={mapCenter}
                                    markers={newAddress.latlng ? [{ position: newAddress.latlng, title: newAddress.name || 'New Address' }] : []}
                                    onMapClick={handleMapClick}
                                    zoom={15}
                                />

                                {/* Inner GPS Button */}
                                <button
                                    onClick={() => {
                                        setIsLocating(true);
                                        navigator.geolocation.getCurrentPosition((pos) => {
                                            const coords = [pos.coords.latitude, pos.coords.longitude];
                                            handleMapClick({ lat: coords[0], lng: coords[1] });
                                            setIsLocating(false);
                                        }, () => setIsLocating(false));
                                    }}
                                    className="absolute top-4 right-4 w-12 h-12 bg-white rounded-2xl shadow-2xl z-[1000] flex items-center justify-center active:scale-90 transition-all border border-slate-100"
                                >
                                    <Navigation className="text-red-500" size={20} strokeWidth={3} />
                                </button>

                                {/* Map Instructions */}
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full z-[1000] pointer-events-none transition-opacity group-hover:opacity-0">
                                    <p className="text-[10px] font-black text-white whitespace-nowrap">
                                        {t('tap_to_pin')}
                                    </p>
                                </div>

                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] z-[1000]">
                                    <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white/20 mb-4 animate-slide-up">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{t('selected_location')}</p>
                                        <p className="text-[12px] font-bold text-slate-800 line-clamp-2 leading-relaxed">
                                            {newAddress.details || t('tap_or_search_to_select')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSaveAddress}
                                        disabled={!newAddress.latlng || !newAddress.name}
                                        className="w-full bg-red-600 text-white py-4 rounded-[20px] font-black text-sm shadow-xl shadow-red-200 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                                    >
                                        {t('save_address_continue')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LocationPicker;
