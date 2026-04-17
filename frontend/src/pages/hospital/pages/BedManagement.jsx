import React from 'react';
import { 
    LayoutGrid, 
    Home, 
    Activity, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Building2,
    Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MOCK_WARDS, MOCK_PATIENTS } from '../data/mockData';

const BedManagement = () => {
    const admittedPatients = MOCK_PATIENTS.filter(p => p.status === 'Admitted');
    
    // Calculate global metrics
    const totalBeds = MOCK_WARDS.reduce((acc, ward) => acc + ward.totalBeds, 0);
    const occupiedBeds = MOCK_WARDS.reduce((acc, ward) => acc + ward.occupied, 0);
    const availableBeds = totalBeds - occupiedBeds;
    const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

    const calculateDuration = (joinedDate) => {
        const joined = new Date(joinedDate);
        const today = new Date('2026-02-26'); // Using current system time from metadata
        const diffTime = Math.abs(today - joined);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} days`;
    };

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '0.5rem' }}>Bed Management</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Real-time hospital occupancy and ward availability tracking.</p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Total Capacity', value: totalBeds, icon: <Building2 />, color: 'var(--brand-primary)' },
                    { label: 'Occupied', value: occupiedBeds, icon: <Users />, color: 'var(--warning)' },
                    { label: 'Available', value: availableBeds, icon: <CheckCircle2 />, color: 'var(--success)' },
                    { label: 'Occupancy Rate', value: `${occupancyRate}%`, icon: <Activity />, color: 'var(--brand-teal)' }
                ].map((stat, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="card" 
                        style={{ padding: '2rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>{stat.label}</p>
                                <h3 style={{ fontSize: '2rem', fontWeight: '800' }}>{stat.value}</h3>
                            </div>
                            <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.05)', color: stat.color, borderRadius: 'var(--radius-lg)' }}>
                                {stat.icon}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Wards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                {MOCK_WARDS.map((ward, idx) => (
                    <motion.div 
                        key={ward.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + (idx * 0.1) }}
                        className="card" 
                        style={{ padding: '2rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{ward.name}</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{ward.type}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: ward.occupied / ward.totalBeds > 0.8 ? 'var(--warning)' : 'var(--text-primary)' }}>
                                    {ward.occupied}/{ward.totalBeds}
                                </span>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Beds Taken</p>
                            </div>
                        </div>

                        {/* Bed Grid Visualization */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '2rem' }}>
                            {Array.from({ length: ward.totalBeds }).map((_, bIdx) => {
                                const isOccupied = bIdx < ward.occupied;
                                return (
                                    <div 
                                        key={bIdx}
                                        style={{ 
                                            height: '32px', 
                                            borderRadius: '6px', 
                                            background: isOccupied ? 'var(--brand-primary)' : 'var(--bg-main)',
                                            border: isOccupied ? 'none' : '1px solid var(--border-glass)',
                                            boxShadow: isOccupied ? '0 0 15px rgba(59, 130, 246, 0.2)' : 'none'
                                        }}
                                        title={isOccupied ? 'Occupied' : 'Available'}
                                    />
                                );
                            })}
                        </div>

                        {/* Admitted Patients in this Ward */}
                        <div>
                            <h5 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Current Occupants</h5>
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '1rem', 
                                maxHeight: '240px', 
                                overflowY: 'auto',
                                paddingRight: '8px',
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'var(--brand-primary) transparent'
                            }}>
                                {admittedPatients.filter(p => p.ward === ward.name).map(patient => (
                                    <div key={patient.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem' }}>
                                                {patient.name[0]}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{patient.name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bed: {patient.bed}</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-teal)' }}>
                                                <Clock size={12} />
                                                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{calculateDuration(patient.joinedDate)}</span>
                                            </div>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Admitted</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default BedManagement;
