import React, { useState } from 'react';
import { UserCircle, Search, LogOut, MapPin, ChevronDown, Mic, Package, User, Grid, Map as MapIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';

const Header = ({ variant = 'default', searchValue, onSearchChange, currentLocation, onLocationClick, onProfileClick, onNotifClick, onLangClick, onVoiceClick, viewMode, setViewMode }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const { t } = useTranslation();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Split location for dual-line display (e.g. "Medchal, Secunderabad" -> ["Medchal", "Secunderabad"])
    const locationParts = (currentLocation || "Set Location").split(',').map(s => s.trim());
    const city = locationParts[0] || 'Set Location';
    const area = locationParts.length > 1 ? locationParts.slice(1).join(', ') : '';

    if (variant === 'home') {
        return (
            <div style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                padding: '20px 20px 28px',
                borderRadius: '0 0 40px 40px',
                color: 'white',
                marginBottom: '16px',
                position: 'relative',
                boxShadow: '0 10px 30px rgba(29, 78, 216, 0.15)',
            }}>
            <div className="max-w-4xl mx-auto">
                {/* Header Row */}
                <div className="flex justify-between items-center mb-6">
                    {/* Location Selection Pill */}
                    <div
                        className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 cursor-pointer active:scale-95 transition-all"
                        onClick={onLocationClick}
                    >
                        <MapPin size={16} className="text-white" />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <span className="text-[14px] font-black tracking-tight leading-none uppercase text-white">
                                    {city}
                                </span>
                                <ChevronDown size={12} className="text-white/70" />
                            </div>
                        </div>
                    </div>

                    {/* Pro Utility Section */}
                    <div className="flex items-center gap-2.5">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setViewMode && setViewMode(viewMode === 'map' ? 'list' : 'map')}
                            className={`w-10 h-10 rounded-2xl backdrop-blur-md transition-all border flex items-center justify-center ${viewMode === 'map' ? 'bg-white text-p-600 shadow-xl border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                        >
                            {viewMode === 'map' ? <Grid size={18} /> : <MapIcon size={18} />}
                        </motion.button>
                        
                        <motion.button
                            onClick={onProfileClick}
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md p-0.5 border border-white/30 overflow-hidden hover:bg-white/30 transition-colors"
                        >
                            <div className="w-full h-full rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={18} className="text-white" />
                                )}
                            </div>
                        </motion.button>
                    </div>
                </div>

                {/* Search Bar Nested in Blue Container */}
                <motion.div
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="flex items-center gap-3 bg-white p-4 rounded-[28px] shadow-2xl shadow-blue-900/20 border border-white"
                    style={{ height: '64px' }}
                >
                    <div className="w-10 h-10 rounded-2xl bg-p-50 flex items-center justify-center shrink-0">
                        <Search size={20} className="text-p-600" strokeWidth={3} />
                    </div>
                    <input
                        type="text"
                        placeholder={`Search "HOSPITALS"`}
                        value={searchValue}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            width: '100%',
                            fontSize: '16px',
                            color: '#0f172a',
                            fontWeight: '800',
                        }}
                        className="placeholder:text-slate-300 placeholder:font-bold"
                    />
                    <div className="flex items-center gap-2 pr-1">
                        <div className="w-[1px] h-6 bg-slate-100 mx-1" />
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={onVoiceClick}
                            className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-p-600 hover:bg-p-50 transition-colors"
                        >
                            <Mic size={20} strokeWidth={2.5} />
                        </motion.button>
                    </div>
                </motion.div>
            </div>
            </div>
        );
    }

    const handleLogout = () => {
        setShowLogoutConfirm(false);
        logout();
    };

    return (
        <div className="flex justify-between items-center p-5 bg-white border-b border-border/50">
            <img src="/pwa-192x192.png" alt="vArogra Logo" className="rounded-xl shadow-sm" style={{ height: '36px', width: 'auto' }} />
            <div className="flex items-center gap-3">
                <button className="p-1 rounded-2xl bg-p-50">
                    <UserCircle size={28} color="var(--p-600)" />
                </button>
                <button onClick={() => setShowLogoutConfirm(true)} className="p-1 rounded-2xl hover:bg-red-50 text-red-500 transition-colors">
                    <LogOut size={28} />
                </button>
            </div>
            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
            />
        </div>
    );
};

export default Header;
