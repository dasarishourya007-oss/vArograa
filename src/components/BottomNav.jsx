import React, { useState, useEffect } from 'react';
import { Home, Calendar, Bot, ShoppingBag, User, AlertCircle, Package, Megaphone, Mic, Search, Droplets, FileText } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

const BottomNav = ({ activeTab, onTabChange, onVoiceAssistant }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show if scrolling up, hide if scrolling down
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-max z-[1000] flex items-center gap-4">
            {/* Utility Pill (Light Blue) - Uses animate instead of AnimatePresence to maintain layout stability */}
            <motion.div
                initial={false}
                animate={{
                    y: isVisible ? 0 : 100,
                    opacity: isVisible ? 1 : 0,
                    scale: isVisible ? 1 : 0.9
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
                className="bg-blue-50/90 backdrop-blur-2xl border border-blue-100/50 p-1.5 rounded-full flex items-center gap-6 px-5 shadow-[0_15px_35px_rgba(59,130,246,0.15)] ring-1 ring-white/20"
            >
                {/* Home Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onTabChange('home')}
                    className={`flex items-center justify-center transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Home size={22} />
                </motion.button>

                {/* Updates/Announcements Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onTabChange('updates')}
                    className={`flex items-center justify-center transition-colors ${activeTab === 'updates' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Megaphone size={22} />
                </motion.button>



                {/* SOS Button */}
                <div className="relative">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.2, 0.5],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-red-400 rounded-full blur-md pointer-events-none"
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onVoiceAssistant}
                        className={`relative font-black px-6 py-2.5 rounded-full text-[13px] shadow-[0_8px_20px_rgba(220,38,38,0.4)] transition-all active:shadow-inner ring-2 ring-red-400/50 ring-offset-2 ring-offset-blue-50/50 flex items-center gap-2 ${activeTab === 'voice' ? 'bg-red-700 ring-red-500' : 'bg-red-600 hover:bg-red-500'} text-white`}
                    >
                        <Mic size={16} />
                        SOS
                    </motion.button>
                </div>

                {/* Store Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onTabChange('store')}
                    className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all ${activeTab === 'store' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200/50 text-slate-600'}`}
                >
                    <Package size={20} />
                </motion.button>

            </motion.div>

            {/* AI Bot Pill (Green) - Fixed in place, no scroll-relative movement */}
            <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange('ai-assistant')}
                className={`relative w-14 h-14 rounded-full overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.2)] transition-all border-none cursor-pointer flex items-center justify-center bg-white p-0 ${activeTab === 'ai-assistant'
                    ? 'ring-4 ring-emerald-400 ring-offset-2 scale-110'
                    : ''
                    }`}
            >
                <img 
                    src="/ai_orb.png" 
                    alt="AI Assistant" 
                    className="w-[190%] h-[190%] object-cover shrink-0" 
                    style={{ 
                        filter: 'contrast(1.05)',
                    }}
                />
            </motion.button>
        </div>
    );
};

export default BottomNav;



