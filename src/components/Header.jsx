import React, { useState } from 'react';
import { UserCircle, Search, LogOut, MapPin, ChevronDown, Mic, Package, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';

const Header = ({ variant = 'default', searchValue, onSearchChange, currentLocation, onLocationClick, onProfileClick, onNotifClick, onLangClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Split location for dual-line display (e.g. "Medchal, Secunderabad" -> ["Medchal", "Secunderabad"])
    const [city, ...areaParts] = (currentLocation || t('mancherial_telangana')).split(',').map(s => s.trim());
    const area = areaParts.join(', ');

    if (variant === 'home') {
        return (
            <div style={{
                background: 'linear-gradient(145deg, #1d4ed8 0%, #3b82f6 40%, #06b6d4 100%)',
                padding: '16px 20px 24px',
                borderRadius: '0 0 var(--r-xl) var(--r-xl)',
                color: 'white',
                marginBottom: '12px',
                position: 'relative',
                boxShadow: '0 15px 45px -10px rgba(37, 99, 235, 0.4)'
            }}>
                {/* Simplified header row */}
                <div className="flex justify-between items-center mb-6">
                    {/* Dual-Line Location */}
                    <div
                        className="flex items-start gap-2 cursor-pointer active:opacity-70 transition-opacity"
                        onClick={onLocationClick}
                    >
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <MapPin size={18} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <span className="text-[18px] font-black tracking-tight leading-none uppercase">
                                    {city}
                                </span>
                                <ChevronDown size={14} className="text-white/60" />
                            </div>
                            <span className="text-[11px] font-bold text-white/70 tracking-wide mt-0.5">
                                {area || 'Select Area'}
                            </span>
                        </div>
                    </div>

                    {/* Pro Utility Section */}
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={onLangClick}
                            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
                        >
                            <span className="text-xs font-black">A</span>
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={onNotifClick}
                            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
                        >
                            <Package size={18} />
                        </motion.button>
                        <motion.button
                            onClick={onProfileClick}
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 rounded-full bg-white p-0.5 shadow-lg border-2 border-white/30 overflow-hidden"
                        >
                            <div className="w-full h-full rounded-full bg-p-100 flex items-center justify-center overflow-hidden">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-p-600" />
                                )}
                            </div>
                        </motion.button>
                    </div>
                </div>

                {/* Vibrant Pro Search Bar */}
                <motion.div
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="flex items-center gap-3 bg-white p-4 rounded-[24px] shadow-2xl border-none"
                    style={{ height: '60px' }}
                >
                    <Search size={22} className="text-rose-500" strokeWidth={3} />
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
                            fontSize: '15px',
                            color: '#1e293b',
                            fontWeight: '700',
                        }}
                        className="placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-3 pr-1">
                        <div className="w-[1px] h-6 bg-slate-100" />
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="p-1 text-rose-500 hover:opacity-80"
                        >
                            <Mic size={22} strokeWidth={2.5} />
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const handleLogout = () => {
        setShowLogoutConfirm(false);
        logout();
    };

    return (
        <div className="flex justify-between items-center p-5 bg-white border-b border-border/50">
            <img src="/logo.jpg" alt="vArogra Logo" style={{ height: '32px', width: 'auto' }} />
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
