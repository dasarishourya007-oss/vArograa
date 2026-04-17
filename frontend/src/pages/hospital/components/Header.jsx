import React from 'react';
import {
    Bell,
    Search,
    Globe,
    MessageSquare,
    Users,
    Zap,
    LayoutDashboard,
    CalendarClock,
    MonitorPlay,
    Droplets,
    FileBarChart,
    FileText,
    LayoutGrid
} from 'lucide-react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield, ChevronDown } from 'lucide-react';

const Header = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isSearchFocused, setIsSearchFocused] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(true);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
    const searchInputRef = React.useRef(null);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            setIsVisible(false);
        } else {
            setIsVisible(true);
        }
    });

    // Global Ctrl+K shortcut
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Reset selection when query changes
    React.useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    const navSections = [
        { title: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/hospital' },
        { title: 'Availability', icon: <Users size={18} />, path: '/hospital/availability' },
        { title: 'Appointments', icon: <CalendarClock size={18} />, path: '/hospital/appointments' },
        { title: 'Consultations', icon: <MonitorPlay size={18} />, path: '/hospital/live' },
        { title: 'Blood Bank', icon: <Droplets size={18} />, path: '/hospital/blood-bank' },
        { title: 'Analytics', icon: <FileBarChart size={18} />, path: '/hospital/reports' },
        { title: 'Patient Records', icon: <FileText size={18} />, path: '/hospital/records' },
        { title: 'Bed Management', icon: <LayoutGrid size={18} />, path: '/hospital/beds' },
    ];

    const filteredSections = navSections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSelect = (item) => {
        navigate(item.path);
        setIsSearchFocused(false);
        setSearchQuery('');
    };

    const handleKeyDown = (e) => {
        if (!isSearchFocused) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredSections.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredSections.length) % filteredSections.length);
        } else if (e.key === 'Enter') {
            if (filteredSections[selectedIndex]) {
                handleSelect(filteredSections[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsSearchFocused(false);
        }
    };

    return (
        <motion.header
            initial={{ y: 0 }}
            animate={{ y: isVisible ? 0 : -120 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
                height: 'var(--header-height)',
                padding: '0 2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: '0.5rem',
                zIndex: 900,
                margin: '0 0 2.5rem 0',
                pointerEvents: 'auto'
            }} className="glass">
            <style>{`
                .glass {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    border-radius: 20px;
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
                }
                .search-focus {
                    border-color: var(--primary-glow) !important;
                    background: white !important;
                    box-shadow: 0 0 15px var(--primary-glow);
                }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
                <div style={{ position: 'relative', width: isSearchFocused ? '450px' : '380px', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <Search size={18} style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: isSearchFocused ? 'var(--brand-primary)' : 'var(--text-muted)',
                        zIndex: 1,
                        transition: 'color 0.3s'
                    }} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search records (Ctrl + K)..."
                        value={searchQuery}
                        onChange={handleSearch}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => {
                            // Small delay to allow onMouseDown to trigger on results
                            setTimeout(() => setIsSearchFocused(false), 200);
                        }}
                        className={isSearchFocused ? 'search-focus' : ''}
                        style={{
                            width: '100%',
                            padding: '14px 20px 14px 48px',
                            background: 'rgba(0, 0, 0, 0.02)',
                            borderRadius: '14px',
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            outline: 'none',
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            transition: 'var(--transition)'
                        }}
                    />
                    {isSearchFocused && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            style={{
                                position: 'absolute',
                                top: '120%',
                                left: 0,
                                right: 0,
                                background: 'white',
                                border: '1px solid var(--border-glass)',
                                borderRadius: '16px',
                                padding: '8px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                zIndex: 1000
                            }}
                        >
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '8px 12px', fontWeight: '800', letterSpacing: '1px' }}>GLOBAL COMMANDS</p>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {filteredSections.length > 0 ? (
                                    filteredSections.map((item, i) => (
                                        <div
                                            key={i}
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // Prevent blur
                                                handleSelect(item);
                                            }}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '10px',
                                                color: i === selectedIndex ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                background: i === selectedIndex ? 'rgba(0,0,0,0.02)' : 'transparent',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                transition: '0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                border: i === selectedIndex ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent'
                                            }}
                                            onMouseEnter={() => setSelectedIndex(i)}
                                        >
                                            <div style={{ color: i === selectedIndex ? 'var(--brand-primary)' : 'var(--brand-primary)' }}>{item.icon}</div>
                                            {item.title}
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No sections found...</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)'
                }}>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        System Pulse: 72ms
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '8px', paddingRight: '2rem', borderRight: '1px solid var(--border-glass)' }}>
                    {[
                        { icon: Globe, label: 'Global Network', action: () => navigate('/hospital/blood-bank'), color: 'var(--brand-teal)' },
                        { icon: MessageSquare, label: 'Secure Comms', action: () => alert('[vArogra System] Opening encrypted communication channel...'), color: 'var(--brand-primary)' },
                        { icon: Bell, label: 'Priority Alerts', action: () => alert('[vArogra System] 3 pending critical laboratory results.'), hasPing: true, color: 'var(--critical)' }
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.08)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={item.action}
                            title={item.label}
                            style={{
                                padding: '10px',
                                cursor: 'pointer',
                                borderRadius: '12px',
                                color: 'var(--text-secondary)',
                                position: 'relative'
                            }}
                        >
                            <item.icon size={20} style={{ color: item.hasPing ? 'var(--critical)' : 'inherit' }} />
                            {item.hasPing && (
                                <span style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    width: '8px',
                                    height: '8px',
                                    background: 'var(--critical)',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 10px var(--critical)'
                                }} />
                            )}
                        </motion.div>
                    ))}
                </div>

                <div style={{ position: 'relative' }}>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>Central Command</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                Admin Access <ChevronDown size={12} style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                            </p>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--radius-lg)',
                                background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-teal))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                position: 'relative'
                            }}
                        >
                            <span style={{ fontSize: '0.9rem', color: 'white', margin: 'auto' }}>A</span>
                        </motion.div>
                    </div>

                    <AnimatePresence>
                        {isUserMenuOpen && (
                            <>
                                <div
                                    style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                                    onClick={() => setIsUserMenuOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0, x: -20 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                                    style={{
                                        position: 'absolute',
                                        top: '120%',
                                        right: 0,
                                        width: '220px',
                                        background: 'white',
                                        border: '1px solid var(--border-glass)',
                                        borderRadius: '16px',
                                        padding: '8px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                        zIndex: 999
                                    }}
                                >
                                    {[
                                        { icon: User, label: 'Profile & Settings', action: () => navigate('/hospital/settings') },
                                        { icon: Shield, label: 'Security Protocols', action: () => alert('Opening Security Hub...') },
                                        { icon: LogOut, label: 'Sign Out System', action: logout, danger: true }
                                    ].map((item, b) => (
                                        <div
                                            key={b}
                                            onClick={() => {
                                                item.action();
                                                setIsUserMenuOpen(false);
                                            }}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                cursor: 'pointer',
                                                transition: '0.2s',
                                                color: item.danger ? 'var(--critical)' : 'var(--text-primary)',
                                                fontSize: '0.85rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <item.icon size={16} />
                                            <span style={{ fontWeight: '600' }}>{item.label}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.header>
    );
};

export default Header;
