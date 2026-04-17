import React, { useState } from 'react';
import {
    Droplets,
    AlertTriangle,
    Calendar,
    Plus,
    History,
    TrendingUp,
    ArrowDown,
    Activity,
    Thermometer,
    Search,
    MapPin,
    Building2,
    Globe,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RequestBloodModal = ({ isOpen, onClose, selectedType, onOrderPlace, onOrderCancel }) => {
    const [modalStep, setModalStep] = useState('type'); // 'type', 'hospital', 'placed', 'tracking'
    const [selectedBloodType, setSelectedBloodType] = useState(selectedType);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, sending, sent, accepted
    const [communityStatus, setCommunityStatus] = useState('idle'); // idle, broadcasting, notified, matching, confirmed
    const [orderId, setOrderId] = useState(null);

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const hospitals = [
        { id: 'central', name: 'Central Command', dist: 'Local Hub', stock: 'User Hospital', status: 'Primary' }
    ];

    const timeoutRefs = React.useRef([]);

    React.useEffect(() => {
        if (isOpen) {
            setModalStep(selectedType === 'NETWORK_HUB' ? 'type' : 'hospital');
            setSelectedBloodType(selectedType === 'NETWORK_HUB' ? null : selectedType);
            setSelectedHospital(hospitals[0]);
            setStatus('idle');
            setCommunityStatus('idle');
            setOrderId(null);
            timeoutRefs.current.forEach(clearTimeout);
            timeoutRefs.current = [];
        }
    }, [isOpen, selectedType]);

    const handleInitialize = () => {
        if (!selectedHospital) {
            alert("PROTOCOL ERROR: Please select a target hospital for the protocol.");
            return;
        }

        const id = `${selectedBloodType}-UNI-${Math.floor(Math.random() * 9000) + 1000}`;
        setOrderId(id);

        onOrderPlace({
            id,
            type: selectedBloodType,
            hospital: selectedHospital.name,
            mode: 'UNIVERSAL',
            status: 'sending',
            communityStatus: 'broadcasting',
            notifiedCount: 0,
            timestamp: new Date().toLocaleTimeString()
        });

        setModalStep('placed');
        setStatus('sending');
        setCommunityStatus('broadcasting');

        // Hospital Protocol
        const t1 = setTimeout(() => {
            setStatus('sent');
            const t2 = setTimeout(() => setStatus('accepted'), 3000);
            timeoutRefs.current.push(t2);
        }, 1500);
        timeoutRefs.current.push(t1);

        // Community Protocol
        const c1 = setTimeout(() => {
            setCommunityStatus('notified');
            const c2 = setTimeout(() => {
                setCommunityStatus('matching');
                const c3 = setTimeout(() => setCommunityStatus('confirmed'), 4000);
                timeoutRefs.current.push(c3);
            }, 2500);
            timeoutRefs.current.push(c2);
        }, 1000);
        timeoutRefs.current.push(c1);
    };

    const handleCancel = () => {
        timeoutRefs.current.forEach(clearTimeout);
        timeoutRefs.current = [];
        if (orderId) onOrderCancel(orderId);
        alert(`vArogra PROTOCOL: Request ${orderId || 'DISPATCH'} cancelled. Intercepting regional transfer...`);
        resetAndClose();
    };

    const resetAndClose = () => {
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={modalStep !== 'placed' && modalStep !== 'tracking' ? resetAndClose : undefined}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)' }}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="glass"
                        style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', position: 'relative', zIndex: 1, borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)' }}
                    >
                        {modalStep === 'type' && (
                            <>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem' }}>
                                    <div style={{ padding: '12px', background: 'var(--brand-primary)', borderRadius: 'var(--radius-lg)', color: 'white' }}>
                                        <Droplets size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Universal Asset Search</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Searching regional networks and local community for <span style={{ color: 'var(--brand-primary)', fontWeight: 'bold' }}>{selectedBloodType || 'units'}</span>.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
                                    {bloodTypes.map(type => (
                                        <motion.div
                                            key={type}
                                            whileHover={{ scale: 1.05, background: 'rgba(59, 130, 246, 0.05)' }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedBloodType(type)}
                                            style={{
                                                padding: '1.5rem 1rem',
                                                borderRadius: 'var(--radius-lg)',
                                                border: selectedBloodType === type ? '2px solid var(--brand-primary)' : '1px solid var(--border-glass)',
                                                background: selectedBloodType === type ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                fontSize: '1.2rem',
                                                fontWeight: '800',
                                                color: selectedBloodType === type ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {type}
                                        </motion.div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={resetAndClose} className="btn-premium" style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-glass)' }}>Cancel</button>
                                    <button
                                        disabled={!selectedBloodType}
                                        onClick={() => setModalStep('hospital')}
                                        className="btn-premium"
                                        style={{ flex: 2, opacity: !selectedBloodType ? 0.5 : 1 }}
                                    >
                                        Proceed to Target Selection
                                    </button>
                                </div>
                            </>
                        )}

                        {modalStep === 'hospital' && (
                            <>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '12px', background: 'var(--brand-primary)', borderRadius: 'var(--radius-lg)', color: 'white' }}>
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Target Hospital</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Requesting <span style={{ color: 'var(--brand-primary)', fontWeight: 'bold' }}>{selectedBloodType}</span> from regional network.</p>
                                    </div>
                                </div>

                                {/* Hospital selection removed, Central Command is auto-selected */}
                                <div style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '10px' }}>
                                            <Globe size={18} color="var(--brand-primary)" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Hub Vicinity Broadcast</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Local donors near this hospital will be notified upon protocol initialization.</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={() => setModalStep('type')} className="btn-premium" style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-glass)' }}>
                                        Back
                                    </button>
                                    <button
                                        onClick={handleInitialize}
                                        className="btn-premium"
                                        style={{ flex: 2 }}
                                    >
                                        Initialize Protocol
                                    </button>
                                </div>
                            </>
                        )}

                        {modalStep === 'placed' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ textAlign: 'center', padding: '1rem 0' }}
                            >
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'var(--success)',
                                    borderRadius: 'var(--radius-xl)',
                                    margin: '0 auto 2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 10px 30px rgba(34, 197, 149, 0.3)'
                                }}>
                                    <CheckCircle2 size={40} color="white" />
                                </div>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '0.5rem' }}>Universal Protocol Initiated</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
                                    Protocol {orderId} dispatched to regional institutions & local vicinity.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <button onClick={() => setModalStep('tracking')} className="btn-premium" style={{ width: '100%' }}>
                                        Track Order Status
                                    </button>
                                    <button
                                        onClick={resetAndClose}
                                        className="btn-premium"
                                        style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}
                                    >
                                        Close Hub
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {modalStep === 'tracking' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ textAlign: 'center', padding: '1rem 0' }}
                            >
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: status === 'accepted' ? 'var(--success)' : 'var(--brand-primary)',
                                    borderRadius: 'var(--radius-xl)',
                                    margin: '0 auto 2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: status === 'accepted' ? '0 10px 30px rgba(34, 197, 149, 0.3)' : '0 10px 30px rgba(59, 130, 246, 0.3)',
                                    transition: 'background 0.5s ease'
                                }}>
                                    {status === 'accepted' ? <CheckCircle2 size={40} color="white" /> : <Globe size={40} color="white" />}
                                </div>

                                <h3 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '0.5rem' }}>Live Order Tracking</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Protocol {orderId} monitoring active.</p>
                                <div style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Building2 size={16} color="var(--text-muted)" />
                                                <span style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.9rem' }}>Hospital Network</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '6px', height: '6px', borderRadius: '50%',
                                                    background: status === 'accepted' ? 'var(--success)' : 'var(--brand-primary)',
                                                    animation: status !== 'accepted' ? 'pulse-kf 1s infinite' : 'none'
                                                }} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: status === 'accepted' ? 'var(--success)' : 'var(--brand-primary)', textTransform: 'uppercase' }}>
                                                    {status === 'accepted' ? 'Accepted' : status === 'sent' ? 'Routed' : 'Handshake'}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Globe size={16} color="var(--brand-primary)" />
                                                <span style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.9rem' }}>Hub Vicinity (Sender)</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '6px', height: '6px', borderRadius: '50%',
                                                    background: communityStatus === 'confirmed' ? 'var(--success)' : 'var(--brand-primary)',
                                                    animation: communityStatus !== 'confirmed' ? 'pulse-kf 1s infinite' : 'none'
                                                }} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: communityStatus === 'confirmed' ? 'var(--success)' : 'var(--brand-primary)', textTransform: 'uppercase' }}>
                                                    {communityStatus === 'confirmed' ? 'Donor Found' : communityStatus === 'matching' ? 'Matching' : communityStatus === 'notified' ? 'Notified' : 'Broadcasting'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={resetAndClose} className="btn-premium" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', boxShadow: 'none', border: '1px solid var(--border-glass)', width: '100%' }}>
                                        {status === 'accepted' ? 'Close & View Log' : 'Return to Hub'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const BloodCard = ({ item, onRequest }) => {
    const isCritical = item.status === 'Critical' || item.needed === 'Emergency';

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className={`card ${isCritical ? 'premium-glow' : ''}`}
            style={{
                position: 'relative',
                overflow: 'hidden',
                background: isCritical ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-surface)',
                border: isCritical ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-glass)'
            }}
        >
            {isCritical && (
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '150px',
                    height: '150px',
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
                    zIndex: 0
                }} />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', position: 'relative' }}>
                <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: 'var(--radius-lg)',
                    background: isCritical ? 'var(--critical)' : 'var(--bg-main)',
                    color: isCritical ? 'white' : 'var(--brand-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    boxShadow: isCritical ? '0 8px 20px rgba(239, 68, 68, 0.4)' : 'none'
                }}>
                    {item.type}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onRequest(item.type)}
                        style={{
                            padding: '8px 12px',
                            background: isCritical ? 'var(--brand-primary)' : 'var(--bg-main)',
                            color: isCritical ? 'white' : 'var(--text-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            border: isCritical ? 'none' : '1px solid var(--border-glass)',
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            boxShadow: isCritical ? '0 5px 15px rgba(59, 130, 246, 0.3)' : 'none',
                            transition: 'var(--transition)'
                        }}
                    >
                        REQUEST
                    </motion.button>
                </div>
            </div>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '4px', letterSpacing: '-1.5px' }}>
                    {item.units} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0' }}>Units</span>
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <Calendar size={14} /> Exp: {item.expiry}
                </div>
            </div>

            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Protocol</span>
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: isCritical ? 'var(--critical)' : 'var(--success)',
                        background: isCritical ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '20px'
                    }}>
                        {item.needed.toUpperCase()}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

const BloodBank = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedType, setSelectedType] = useState('');
    const [activeOrders, setActiveOrders] = useState([]);

    const openRequest = (type) => {
        setSelectedType(type);
        setIsModalOpen(true);
    };

    const handleOrderPlace = (order) => {
        setActiveOrders(prev => [order, ...prev]);
    };

    const handleOrderCancel = (id) => {
        setActiveOrders(prev => prev.filter(o => o.id !== id));
    };

    // Simulation effect for dashboard orders
    React.useEffect(() => {
        const interval = setInterval(() => {
            setActiveOrders(prev => prev.map(order => {
                let nextOrder = { ...order };

                // Hospital logic
                if (nextOrder.status === 'sending') nextOrder.status = 'sent';
                else if (nextOrder.status === 'sent') nextOrder.status = 'accepted';

                // Community logic
                if (nextOrder.communityStatus === 'broadcasting') {
                    nextOrder.communityStatus = 'notified';
                    nextOrder.notifiedCount = Math.floor(Math.random() * 50) + 20;
                }
                else if (nextOrder.communityStatus === 'notified') nextOrder.communityStatus = 'matching';
                else if (nextOrder.communityStatus === 'matching') nextOrder.communityStatus = 'confirmed';

                return nextOrder;
            }));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const [bloodStock] = useState([
        { type: 'A+', units: 45, status: 'Normal', expiry: 'Jan 2026', needed: 'Ready' },
        { type: 'A-', units: 8, status: 'Critical', expiry: 'Feb 2026', needed: 'High' },
        { type: 'B+', units: 32, status: 'Normal', expiry: 'Mar 2026', needed: 'Ready' },
        { type: 'B-', units: 12, status: 'Low', expiry: 'Feb 2026', needed: 'High' },
        { type: 'O+', units: 65, status: 'Normal', expiry: 'Apr 2026', needed: 'Ready' },
        { type: 'O-', units: 2, status: 'Critical', expiry: 'Dec 2025', needed: 'Emergency' },
        { type: 'AB+', units: 15, status: 'Low', expiry: 'Jan 2026', needed: 'Medium' },
        { type: 'AB-', units: 4, status: 'Critical', expiry: 'Dec 2025', needed: 'High' },
    ]);

    return (
        <div>
            <RequestBloodModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedType={selectedType}
                onOrderPlace={handleOrderPlace}
                onOrderCancel={handleOrderCancel}
            />

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4rem',
                padding: '2.5rem',
                background: 'linear-gradient(90deg, rgba(20, 184, 166, 0.05), transparent)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-glass)'
            }}>
                <div>
                    <h2 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '0.5rem' }}>Bio-Inventory Hub</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: '500' }}>Orchestrating regional blood assets in real-time.</p>
                        <motion.div
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{ padding: '6px 14px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--brand-primary)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <div style={{ width: '6px', height: '6px', background: 'var(--brand-primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--brand-primary)' }} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: '800', letterSpacing: '0.1em' }}>NETWORK EXCHANGE LIVE</span>
                        </motion.div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Scan Serial..." style={{ padding: '16px 20px 16px 54px', background: 'var(--bg-main)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', fontSize: '1rem', width: '300px', outline: 'none', transition: 'var(--transition)' }} onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'} />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: 'var(--shadow-lg)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openRequest('NETWORK_HUB')}
                        className="btn-premium"
                        style={{
                            background: 'linear-gradient(135deg, var(--brand-teal), #0D9488)',
                            padding: '16px 32px',
                            fontSize: '1rem',
                            fontWeight: '800',
                            letterSpacing: '0.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 10px 25px rgba(20, 184, 166, 0.3)'
                        }}
                    >
                        <Globe size={20} />
                        NETWORK REQUEST
                    </motion.button>

                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                {bloodStock.map((item, idx) => (
                    <BloodCard key={idx} item={item} onRequest={openRequest} />
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
                <div className="card" style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Consumption Velocity</h3>
                        <Activity size={24} color="var(--brand-primary)" />
                    </div>
                    <div style={{
                        height: '240px',
                        background: 'var(--bg-main)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-glass)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none" style={{ display: 'block' }}>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* Grid Lines */}
                            {[0, 1, 2, 3].map(i => (
                                <line
                                    key={i}
                                    x1="0" y1={37.5 * i}
                                    x2="400" y2={37.5 * i}
                                    stroke="rgba(255,255,255,0.03)"
                                    strokeWidth="1"
                                />
                            ))}

                            {/* Animated Line */}
                            <motion.path
                                d="M0,100 Q50,80 100,110 T200,70 T300,90 T400,60"
                                fill="none"
                                stroke="var(--brand-primary)"
                                strokeWidth="3"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            />

                            {/* Area Gradient */}
                            <motion.path
                                d="M0,100 Q50,80 100,110 T200,70 T300,90 T400,60 L400,150 L0,150 Z"
                                fill="url(#chartGradient)"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 2.5, delay: 0.5 }}
                            />

                            {/* Scanning Pulse Effect */}
                            <motion.rect
                                width="2"
                                height="150"
                                fill="var(--brand-primary)"
                                animate={{ x: [0, 400] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                            />
                        </svg>

                        {/* Stats Overlay */}
                        <div style={{
                            position: 'absolute',
                            top: '20px',
                            right: '25px',
                            textAlign: 'right'
                        }}>
                            <motion.p
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-1px' }}
                            >
                                +12.4%
                            </motion.p>
                            <p style={{ fontSize: '0.65rem', color: 'var(--available)', fontWeight: '800', textTransform: 'uppercase' }}>Optimized Flow</p>
                        </div>

                        <div style={{ position: 'absolute', bottom: '15px', left: '20px', display: 'flex', gap: '15px' }}>
                            {['08:00', '12:00', '16:00', '20:00'].map(time => (
                                <span key={time} style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '600' }}>{time}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Active Network Orders</h3>
                        <Globe size={24} color="var(--brand-primary)" />
                    </div>

                    {activeOrders.length === 0 ? (
                        <div style={{
                            padding: '3rem 2rem',
                            textAlign: 'center',
                            background: 'var(--bg-main)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px dashed var(--border-glass)',
                            color: 'var(--text-muted)'
                        }}>
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>No active asset transfers.</p>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Initialize "NETWORK REQUEST" to monitor regional handshake.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                            {activeOrders.map((order) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    style={{
                                        padding: '1.2rem',
                                        background: 'var(--bg-main)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-glass)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: 'var(--radius-lg)',
                                                background: 'var(--brand-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '1rem',
                                                fontWeight: '900',
                                                boxShadow: '0 5px 15px rgba(59, 130, 246, 0.3)'
                                            }}>
                                                {order.type}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '2px' }}>Protocol {order.id}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.timestamp}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleOrderCancel(order.id)}
                                            style={{
                                                background: order.status === 'accepted' && order.communityStatus === 'confirmed' ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.1)',
                                                border: order.status === 'accepted' && order.communityStatus === 'confirmed' ? '1px solid var(--border-glass)' : '1px solid rgba(239, 68, 68, 0.3)',
                                                color: order.status === 'accepted' && order.communityStatus === 'confirmed' ? 'var(--text-muted)' : 'var(--critical)',
                                                fontSize: '0.65rem',
                                                fontWeight: '800',
                                                cursor: 'pointer',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {(order.status === 'accepted' && order.communityStatus === 'confirmed') ? 'DISMISS' : 'CANCEL'}
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Building2 size={12} color="var(--text-muted)" />
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.hospital}</span>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: order.status === 'accepted' ? 'var(--success)' : 'var(--brand-primary)', textTransform: 'uppercase' }}>
                                                {order.status === 'accepted' ? 'Handshake Finalized' : order.status === 'sent' ? 'Asset Routing' : 'Synchronizing'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Globe size={12} color="var(--brand-primary)" />
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hub Vicinity Broadcast</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {order.notifiedCount > 0 && (
                                                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--brand-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                        {order.notifiedCount} Notified
                                                    </span>
                                                )}
                                                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: order.communityStatus === 'confirmed' ? 'var(--success)' : 'var(--brand-primary)', textTransform: 'uppercase' }}>
                                                    {order.communityStatus === 'confirmed' ? 'Donor Response' : order.communityStatus === 'matching' ? 'Matching' : 'Broadcasting'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BloodBank;
