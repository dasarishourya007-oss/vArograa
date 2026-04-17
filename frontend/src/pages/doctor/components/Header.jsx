import React from 'react';
import {
    Bell,
    Search,
    Globe,
    MessageSquare,
    Zap,
    LayoutDashboard,
    CalendarClock,
    MonitorPlay,
    Droplets,
    FileBarChart,
    FileText,
    LayoutGrid,
    ChevronDown,
    User,
    Shield,
    LogOut
} from 'lucide-react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

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

    const navSections = [
        { title: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard/doctor' },
        { title: 'My Schedule', icon: <CalendarClock size={18} />, path: '/dashboard/doctor/schedule' },
        { title: 'Live Consultation', icon: <MonitorPlay size={18} />, path: '/dashboard/doctor/live' },
        { title: 'Patient History', icon: <FileText size={18} />, path: '/dashboard/doctor/history' },
        { title: 'Alerts', icon: <Bell size={18} />, path: '/dashboard/doctor/notifications' },
    ];

    const filteredSections = navSections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => setSearchQuery(e.target.value);

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
            if (filteredSections[selectedIndex]) handleSelect(filteredSections[selectedIndex]);
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
                height: 'var(--header-height, 80px)',
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
                    border-color: rgba(59, 130, 246, 0.4) !important;
                    background: white !important;
                    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
                }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
                <div style={{ position: 'relative', width: isSearchFocused ? '450px' : '380px', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <Search size={18} style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: isSearchFocused ? 'var(--brand-primary, #3B82F6)' : 'var(--text-muted, #94A3B8)',
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
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
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
                            transition: 'all 0.3s ease'
                        }}
                    />
                    <AnimatePresence>
                        {isSearchFocused && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                style={{
                                    position: 'absolute',
                                    top: '120%',
                                    left: 0,
                                    right: 0,
                                    background: 'white',
                                    border: '1px solid var(--border-glass, rgba(0, 0, 0, 0.08))',
                                    borderRadius: '16px',
                                    padding: '8px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                    zIndex: 1000
                                }}
                            >
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94A3B8)', padding: '8px 12px', fontWeight: '800', letterSpacing: '1px' }}>QUICK NAV</p>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {filteredSections.map((item, i) => (
                                        <div
                                            key={i}
                                            onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '10px',
                                                color: i === selectedIndex ? 'var(--text-primary)' : 'var(--text-secondary, #64748B)',
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
                                            <div style={{ color: 'var(--brand-primary, #3B82F6)' }}>{item.icon}</div>
                                            {item.title}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                        style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success, #22C55E)', boxShadow: '0 0 8px var(--success, #22C55E)' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--success, #22C55E)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Clinical Link Active
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ position: 'relative' }}>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>Dr. {user?.displayName || user?.name || 'Doctor'}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94A3B8)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                Clinical Profile <ChevronDown size={12} style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                            </p>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--radius-lg, 12px)',
                                background: 'linear-gradient(135deg, var(--brand-primary, #3B82F6), var(--brand-teal, #14B8A6))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                            }}
                        >
                            <span style={{ fontSize: '0.9rem', color: 'white' }}>{user?.displayName?.[0] || user?.name?.[0] || 'D'}</span>
                        </motion.div>
                    </div>

                    <AnimatePresence>
                        {isUserMenuOpen && (
                            <>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setIsUserMenuOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0, x: -20 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                                    style={{
                                        position: 'absolute', top: '120%', right: 0, width: '220px',
                                        background: 'white', border: '1px solid var(--border-glass, rgba(0, 0, 0, 0.08))',
                                        borderRadius: '16px', padding: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 999
                                    }}
                                >
                                    {[
                                        { icon: User, label: 'Doctor Profile', action: () => navigate('/dashboard/doctor/profile') },
                                        { icon: Shield, label: 'HIPAA Compliance', action: () => alert('Compliance check active.') },
                                        { icon: LogOut, label: 'Secure Sign Out', action: logout, danger: true }
                                    ].map((item, b) => (
                                        <div
                                            key={b}
                                            onClick={() => { item.action(); setIsUserMenuOpen(false); }}
                                            style={{
                                                padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px',
                                                cursor: 'pointer', transition: '0.2s', color: item.danger ? 'var(--critical, #EF4444)' : 'var(--text-primary)', fontSize: '0.85rem'
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
