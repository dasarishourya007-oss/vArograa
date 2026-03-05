import React, { useState } from 'react';
import {
    User,
    Bell,
    LogOut,
    ChevronRight,
    Moon,
    Sun,
    Save,
    Mail,
    Smartphone,
    Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const SettingsOption = ({ icon, title, desc, children, isOpen, onToggle, danger, isSaved }) => (
    <div style={{ marginBottom: '1rem' }}>
        <motion.div
            whileHover={{ x: isOpen ? 0 : 5, background: 'rgba(255,255,255,0.03)' }}
            onClick={onToggle}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: isOpen ? '1px solid var(--brand-primary)' : '1px solid var(--border-glass)',
                background: isOpen ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-surface)',
                cursor: 'pointer',
                transition: 'var(--transition)',
                color: danger ? 'var(--critical)' : 'var(--text-primary)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-lg)',
                    background: danger ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-main)',
                    color: danger ? 'var(--critical)' : 'var(--brand-primary)'
                }}>
                    {icon}
                </div>
                <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{title}</h4>
                    <p style={{ fontSize: '0.85rem', color: danger ? 'rgba(239, 68, 68, 0.7)' : 'var(--text-muted)' }}>{desc}</p>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isSaved && !isOpen && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: '800', textTransform: 'uppercase' }}
                    >
                        Changes Saved
                    </motion.span>
                )}
                <ChevronRight
                    size={20}
                    color={danger ? 'var(--critical)' : 'var(--text-muted)'}
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: '0.3s' }}
                />
            </div>
        </motion.div>

        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                >
                    <div style={{
                        padding: '2rem',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-glass)',
                        borderTop: 'none',
                        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                        marginBottom: '1rem'
                    }}>
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const Settings = () => {
    const { logout, user, role } = useAuth();
    const [openSection, setOpenSection] = useState(null);
    const [savedStatus, setSavedStatus] = useState({});

    // Profile State
    const [profile, setProfile] = useState({
        name: 'Central Command',
        email: 'admin@varogra.com',
        role: role || 'Administrator'
    });

    // Appearance State
    const [theme, setTheme] = useState('dark');

    // Notifications State
    const [notifs, setNotifs] = useState({
        email: true,
        sms: false,
        system: true
    });

    const handleToggle = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        if (newTheme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    };

    const markSaved = (section) => {
        setSavedStatus({ ...savedStatus, [section]: true });
        setOpenSection(null);
        setTimeout(() => {
            setSavedStatus(prev => ({ ...prev, [section]: false }));
        }, 3000);
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '3.5rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '0.5rem' }}>Settings</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage your account preferences and application state.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' }}>Account Preferences</h3>

                {/* Profile Section */}
                <SettingsOption
                    icon={<User size={22} />}
                    title="Profile Information"
                    desc="Update your name, avatar, and contact details."
                    isOpen={openSection === 'profile'}
                    onToggle={() => handleToggle('profile')}
                    isSaved={savedStatus.profile}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Display Name</label>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Email Address</label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>
                        <button className="btn-premium" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => markSaved('profile')}>
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </SettingsOption>

                {/* Hospital Identity Section */}
                <SettingsOption
                    icon={<Monitor size={22} />}
                    title="Hospital Identity"
                    desc="Unique identifiers used for doctor and provider onboarding."
                    isOpen={openSection === 'identity'}
                    onToggle={() => handleToggle('identity')}
                >
                    <div style={{ padding: '0.5rem' }}>
                        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Hospital Base ID</p>
                                    <code style={{ fontSize: '1.1rem', color: 'var(--brand-primary)', fontWeight: '700', letterSpacing: '0.5px' }}>
                                        {user?.hospital_code || profile?.hospital_code || user?.uid || 'HSP-12345'}
                                    </code>
                                </div>
                                <button
                                    onClick={() => {
                                        const idToCopy = user?.hospital_code || profile?.hospital_code || user?.uid || 'HSP-12345';
                                        navigator.clipboard.writeText(idToCopy);
                                        alert('Hospital ID copied to clipboard!');
                                    }}
                                    className="btn-premium"
                                    style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '0.9rem' }}
                                >
                                    Copy ID
                                </button>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                Share this ID with doctors so they can link their profiles to your hospital during registration.
                            </p>
                        </div>
                    </div>
                </SettingsOption>

                {/* Appearance Section */}
                <SettingsOption
                    icon={theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
                    title="Appearance"
                    desc="Choose between light, dark, and system themes."
                    isOpen={openSection === 'appearance'}
                    onToggle={() => handleToggle('appearance')}
                    isSaved={savedStatus.appearance}
                >
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {[
                            { id: 'dark', icon: <Moon />, label: 'Dark Mode' },
                            { id: 'light', icon: <Sun />, label: 'Light Mode' }
                        ].map(t => (
                            <motion.div
                                key={t.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleThemeChange(t.id)}
                                style={{
                                    flex: 1,
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-lg)',
                                    border: theme === t.id ? '2px solid var(--brand-primary)' : '1px solid var(--border-glass)',
                                    background: theme === t.id ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-surface)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ color: theme === t.id ? 'var(--brand-primary)' : 'var(--text-muted)' }}>{t.icon}</div>
                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: theme === t.id ? 'var(--text-primary)' : 'var(--text-muted)' }}>{t.label}</span>
                            </motion.div>
                        ))}
                    </div>
                    <button className="btn-premium" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => markSaved('appearance')}>
                        <Save size={16} /> Save Preference
                    </button>
                </SettingsOption>

                {/* Notifications Section */}
                <SettingsOption
                    icon={<Bell size={22} />}
                    title="Notifications"
                    desc="Control which alerts you receive through the dashboard."
                    isOpen={openSection === 'notifs'}
                    onToggle={() => handleToggle('notifs')}
                    isSaved={savedStatus.notifs}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { id: 'email', icon: <Mail size={18} />, label: 'Email Notifications' },
                            { id: 'sms', icon: <Smartphone size={18} />, label: 'SMS Priority Alerts' },
                            { id: 'system', icon: <Monitor size={18} />, label: 'System Push Notifications' }
                        ].map(n => (
                            <div key={n.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ color: 'var(--text-muted)' }}>{n.icon}</div>
                                    <span style={{ fontWeight: '600' }}>{n.label}</span>
                                </div>
                                <motion.div
                                    onClick={() => setNotifs({ ...notifs, [n.id]: !notifs[n.id] })}
                                    style={{
                                        width: '44px',
                                        height: '24px',
                                        background: notifs[n.id] ? 'var(--brand-primary)' : 'var(--bg-main)',
                                        borderRadius: '20px',
                                        padding: '2px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: notifs[n.id] ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    <motion.div
                                        layout
                                        style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                                    />
                                </motion.div>
                            </div>
                        ))}
                        <button className="btn-premium" style={{ marginTop: '0.5rem', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => markSaved('notifs')}>
                            <Save size={16} /> Save Config
                        </button>
                    </div>
                </SettingsOption>

                <div style={{ margin: '1.5rem 0' }} />

                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' }}>Security & Auth</h3>
                <SettingsOption
                    icon={<LogOut size={22} />}
                    title="Sign Out System"
                    desc="Disconnect your session and clear local security tokens."
                    onToggle={logout}
                    danger
                />
            </div>
        </div>
    );
};

export default Settings;
