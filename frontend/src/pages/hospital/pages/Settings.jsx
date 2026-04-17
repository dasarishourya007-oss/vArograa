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
    Monitor,
    Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../../firebase/config';
import { uploadHospitalPhoto } from '../../../firebase/uploadImage';

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
    const { logout, user, role, updateUserProfilePhoto } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const fileToCompressedDataUrl = (file, maxDimension = 320, quality = 0.72) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ratio = Math.min(1, maxDimension / Math.max(img.width, img.height, 1));
                canvas.width = Math.max(1, Math.round(img.width * ratio));
                canvas.height = Math.max(1, Math.round(img.height * ratio));
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const getLocalLogoKey = (hospitalId) => `varogra_hospital_logo_${hospitalId}`;
    const getPersistedHospitalPhoto = (hospitalId) => {
        if (!hospitalId) return '';
        try {
            return localStorage.getItem(getLocalLogoKey(hospitalId)) || '';
        } catch {
            return '';
        }
    };

    const withTimeout = (promise, ms = 30000) => Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timed out.')), ms))
    ]);

    const persistHospitalPhotoLocally = (hospitalId, photoURL, localPhoto = '') => {
        if (!hospitalId || !photoURL) return;
        const raw = localStorage.getItem('varogra_hospitals');
        const list = raw ? JSON.parse(raw) : [];
        const updated = (list || []).map((h) => {
            const hid = h?.id || h?.hospitalId;
            return hid === hospitalId ? { ...h, photoURL } : h;
        });
        localStorage.setItem('varogra_hospitals', JSON.stringify(updated));

        const snapshot = localPhoto || (String(photoURL).startsWith('data:image/') ? photoURL : '');
        if (snapshot) {
            localStorage.setItem(getLocalLogoKey(hospitalId), snapshot);
        }
    };
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

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [pendingLogoFile, setPendingLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
    
    React.useEffect(() => {
        if (location?.state?.requirePhotoUpload) {
            setStatusMsg({ type: 'error', text: 'Please upload hospital logo now. This is required after login.' });
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location, navigate]);

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

    const handleLogoSelect = async (file) => {
        if (!file) return;
        try {
            const preview = await fileToCompressedDataUrl(file);
            setPendingLogoFile(file);
            setLogoPreview(preview);
            setStatusMsg({ type: '', text: '' });
        } catch (error) {
            console.error('Preview failed:', error);
            setStatusMsg({ type: 'error', text: 'Unable to read selected image. Please try another file.' });
        }
    };

    const handleSaveProfile = async () => {
        const hospitalId = user?.uid || user?.id || user?.hospitalId || localStorage.getItem('varogra_hospital_id');

        if (!hospitalId) {
            setStatusMsg({ type: 'error', text: 'Hospital ID not found. Please login again.' });
            return;
        }

        setIsSavingProfile(true);
        setStatusMsg({ type: '', text: '' });

        try {
            if (pendingLogoFile) {
                const localSnapshot = logoPreview || await fileToCompressedDataUrl(pendingLogoFile);
                if (!auth?.currentUser?.uid) {
                    const localUrl = logoPreview || await fileToCompressedDataUrl(pendingLogoFile);
                    if (typeof updateUserProfilePhoto === 'function') updateUserProfilePhoto(localUrl);
                    persistHospitalPhotoLocally(hospitalId, localUrl);
                    setStatusMsg({ type: 'success', text: 'Logo saved in demo mode. It will persist on refresh.' });
                } else {
                    try {
                        const downloadURL = await withTimeout(uploadHospitalPhoto(hospitalId, pendingLogoFile), 30000);
                        if (typeof updateUserProfilePhoto === 'function') {
                            updateUserProfilePhoto(downloadURL);
                        }
                        persistHospitalPhotoLocally(hospitalId, downloadURL, localSnapshot);
                        setStatusMsg({ type: 'success', text: 'Hospital logo updated! Visible to all patients now.' });
                    } catch (cloudError) {
                        console.error('Cloud upload failed, falling back to local save:', cloudError);
                        const localUrl = logoPreview || await fileToCompressedDataUrl(pendingLogoFile);
                        if (typeof updateUserProfilePhoto === 'function') updateUserProfilePhoto(localUrl);
                        persistHospitalPhotoLocally(hospitalId, localUrl);
                        setStatusMsg({ type: 'success', text: 'Cloud was slow, logo saved locally.' });
                    }
                }

                setPendingLogoFile(null);
                setLogoPreview(null);
            } else {
                setStatusMsg({ type: 'success', text: 'Profile changes saved.' });
            }

            markSaved('profile');
        } catch (error) {
            console.error('Upload failed:', error);
            setStatusMsg({ type: 'error', text: error?.message || 'Upload failed. Please try again.' });
        } finally {
            setIsSavingProfile(false);
        }
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
                        {statusMsg.text && (
                            <div style={{
                                padding: '12px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                background: statusMsg.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: statusMsg.type === 'success' ? '#22c55e' : '#ef4444'
                            }}>
                                {statusMsg.text}
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1rem' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '24px',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-glass)',
                                    overflow: 'hidden'
                                }}>
                                    <img
                                        src={logoPreview || user?.photoURL || getPersistedHospitalPhoto(user?.uid || user?.id || user?.hospitalId || localStorage.getItem('varogra_hospital_id')) || '/images/default-hospital.png'}
                                        alt="Hospital Logo"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <label style={{
                                    position: 'absolute',
                                    bottom: '-10px',
                                    right: '-10px',
                                    width: '36px',
                                    height: '36px',
                                    background: 'var(--brand-primary)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    border: '3px solid var(--bg-main)'
                                }}>
                                    <Camera size={18} />
                                    <input
                                        type="file"
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={(e) => { handleLogoSelect(e.target.files[0]); e.target.value = ''; }}
                                        disabled={isSavingProfile}
                                    />
                                </label>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '4px' }}>Hospital Logo</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>This logo will be visible to all patients on the dashboard.</p>
                            </div>
                        </div>
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
                        <button className="btn-premium" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleSaveProfile} disabled={isSavingProfile}>
                            <Save size={16} /> {isSavingProfile ? 'Saving...' : 'Save Changes'}
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
