import React, { useState } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    CalendarCheck,
    Clock,
    UserCheck,
    Mail,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorCard = ({ doc, onUpdateStatus }) => {
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Available': return { bg: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', shadow: 'rgba(34, 197, 94, 0.2)' };
            case 'Busy': return { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', shadow: 'rgba(245, 158, 11, 0.2)' };
            case 'Not Available': return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--critical)', shadow: 'rgba(239, 68, 68, 0.2)' };
            case 'On Leave': return { bg: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-muted)', shadow: 'rgba(148, 163, 184, 0.2)' };
            default: return { bg: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-muted)', shadow: 'transparent' };
        }
    };

    const style = getStatusStyles(doc.status);

    return (
        <motion.div
            layout
            whileHover={{ y: -5 }}
            className="card"
            style={{ padding: '2rem', display: 'flex', flexDirection: 'column', position: 'relative' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, var(--brand-secondary), white)',
                        border: '1px solid var(--border-glass)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: 'var(--brand-primary)',
                        boxShadow: 'inset 0 0 10px rgba(59, 130, 246, 0.1)'
                    }}>
                        {doc.name.split(' ').pop()[0]}
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '4px' }}>{doc.name}</h4>
                        <span className="pill" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                            {doc.spec}
                        </span>
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <motion.div
                        onClick={() => setIsStatusOpen(!isStatusOpen)}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            background: style.bg,
                            color: style.color,
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: `0 0 10px ${style.shadow}`,
                            cursor: 'pointer',
                            border: '1px solid rgba(255,255,255,0.05)',
                            transition: 'var(--transition)'
                        }}
                    >
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.color }}></div>
                        {doc.status.toUpperCase()}
                        <ChevronRight size={12} style={{ transform: isStatusOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                    </motion.div>

                    <AnimatePresence>
                        {isStatusOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                style={{
                                    position: 'absolute',
                                    top: '120%',
                                    right: 0,
                                    background: 'white',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: '12px',
                                    padding: '6px',
                                    zIndex: 100,
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                    minWidth: '140px'
                                }}
                            >
                                {['Available', 'Busy', 'Not Available', 'On Leave'].map((status) => (
                                    <div
                                        key={status}
                                        onClick={() => {
                                            onUpdateStatus(doc.id, status);
                                            setIsStatusOpen(false);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: doc.status === status ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                            background: doc.status === status ? 'var(--brand-secondary)' : 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
                                        onMouseLeave={(e) => e.target.style.background = doc.status === status ? 'rgba(255,255,255,0.05)' : 'transparent'}
                                    >
                                        <div style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: getStatusStyles(status).color
                                        }} />
                                        {status}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Department</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{doc.dept}</p>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Appointments</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--brand-teal)' }}>{doc.todayAppts} today</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)', marginTop: '1.5rem' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Next slot: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{doc.nextSlot}</span>
                </div>
            </div>
        </motion.div>
    );
};

import AddSpecialistModal from '../components/AddSpecialistModal';

const Availability = () => {
    const [doctors, setDoctors] = useState([
        { id: 1, name: 'Dr. Sarah Mitchell', dept: 'Cardiology', spec: 'Arrhythmia Specialist', status: 'Available', todayAppts: 12, nextSlot: '11:15 AM' },
        { id: 2, name: 'Dr. James Wilson', dept: 'Pediatrics', spec: 'Neonatal Care', status: 'Busy', todayAppts: 18, nextSlot: '01:30 PM' },
        { id: 3, name: 'Dr. Elena Rodriguez', dept: 'Orthopedics', spec: 'Spinal Surgery', status: 'On Leave', todayAppts: 0, nextSlot: 'Tomorrow' },
        { id: 4, name: 'Dr. Michael Chen', dept: 'General Medicine', spec: 'Internal Medicine', status: 'Available', todayAppts: 15, nextSlot: '10:45 AM' },
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleAddSpecialist = (newDoc) => {
        setDoctors(prev => [newDoc, ...prev]);
    };

    const handleUpdateStatus = (id, newStatus) => {
        setDoctors(prev => prev.map(doc =>
            doc.id === id ? { ...doc, status: newStatus } : doc
        ));
    };

    const filteredDoctors = doctors.filter(doc => {
        const query = searchQuery.toLowerCase();
        return (
            doc.name.toLowerCase().includes(query) ||
            doc.dept.toLowerCase().includes(query) ||
            doc.spec.toLowerCase().includes(query)
        );
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '0.5rem' }}>Staff Board</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Active medical practitioners currently on protocol.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: searchQuery ? 'var(--brand-primary)' : 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Find practitioner..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 14px 14px 48px',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-glass)',
                                borderRadius: 'var(--radius-lg)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                transition: 'all 0.3s'
                            }}
                            className={searchQuery ? 'search-active' : ''}
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn-premium"
                    >
                        Add Specialist
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
                <AnimatePresence>
                    {filteredDoctors.length > 0 ? (
                        filteredDoctors.map(doc => (
                            <DoctorCard
                                key={doc.id}
                                doc={doc}
                                onUpdateStatus={handleUpdateStatus}
                            />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}
                        >
                            <UserCheck size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <p>No practitioners found matching "{searchQuery}"</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AddSpecialistModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddSpecialist}
            />
        </div>
    );
};

export default Availability;
