import React, { useState } from 'react';
import { 
    Search, 
    User, 
    Calendar, 
    CreditCard, 
    Stethoscope, 
    Phone, 
    Mail, 
    Shield, 
    ChevronRight,
    ArrowLeft,
    Filter,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_PATIENTS } from '../data/mockData';
import { useAppointments } from '../context/AppointmentContext';

const PatientDetailModal = ({ patient, isOpen, onClose }) => {
    if (!patient) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="glass print-record-content"
                        style={{ width: '100%', maxWidth: '700px', padding: '3.5rem', position: 'relative', zIndex: 1, borderRadius: 'var(--radius-xl)', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}
                    >
                        <style>{`
                            @media print {
                                body * { visibility: hidden; }
                                .print-record-content, .print-record-content * { visibility: visible; }
                                .print-record-content { 
                                    display: block !important; 
                                    position: absolute; 
                                    left: 0; 
                                    top: 0; 
                                    width: 100%; 
                                    padding: 20px;
                                    background: white !important;
                                    color: black !important;
                                    box-shadow: none !important;
                                    border: none !important;
                                }
                                .btn-premium { display: none !important; }
                                .card { border: 1px solid #eee !important; background: transparent !important; }
                            }
                        `}</style>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <div style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    borderRadius: '24px', 
                                    background: 'linear-gradient(135deg, var(--primary), var(--teal))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    boxShadow: '0 10px 30px var(--primary-glow)'
                                }}>
                                    {patient.name[0]}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>{patient.name}</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Patient ID: <span style={{ color: 'var(--brand-primary)', fontWeight: 'bold' }}>{patient.id}</span></p>
                                </div>
                            </div>
                            <button onClick={onClose} className="btn-premium" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '10px' }}>
                                <ArrowLeft size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div className="card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>Personal Contact</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Mail size={18} color="var(--primary)" />
                                        <span style={{ fontSize: '1rem' }}>{patient.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Phone size={18} color="var(--primary)" />
                                        <span style={{ fontSize: '1rem' }}>{patient.phone}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Shield size={18} color="var(--primary)" />
                                        <span style={{ fontSize: '1rem' }}>{patient.guardian}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>Case Details</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Calendar size={18} color="var(--teal)" />
                                        <span style={{ fontSize: '1rem' }}>Joined: {patient.joinedDate}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Calendar size={18} color="var(--busy)" />
                                        <span style={{ fontSize: '1rem' }}>Discharged: {patient.dischargedDate || 'Currently Admitted'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <User size={18} color="var(--primary)" />
                                        <span style={{ fontSize: '1rem' }}>Physician: {patient.consultedDoctor}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Clock size={18} color="var(--primary)" />
                                        <span style={{ fontSize: '1rem' }}>Location: {patient.ward || 'Outpatient Consultation'} (Bed {patient.bed || 'N/A'})</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <CreditCard size={18} color="var(--primary)" />
                                        <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>Total Paid: ${patient.amountPaid.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ marginTop: '2rem', padding: '2rem', background: 'var(--bg-gradient-card)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                <Stethoscope size={22} color="var(--brand-primary)" />
                                <h4 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Treatment Protocol</h4>
                            </div>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                {patient.treatment}
                            </p>
                        </div>

                        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
                            <button onClick={() => window.print()} className="btn-premium" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <Download size={18} /> Print Medical Log
                            </button>
                            <button onClick={onClose} className="btn-premium" style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-glass)' }}>
                                Close Record
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const PatientRecords = () => {
    const { completedHistory } = useAppointments();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Merge mock data with live history
    const allRecords = [
        ...completedHistory.map(h => ({
            id: h.token,
            name: h.name,
            email: "n/a",
            phone: "n/a",
            guardian: "n/a",
            joinedDate: "Today",
            dischargedDate: h.completedAt,
            treatment: "General OPD Consultation",
            consultedDoctor: h.doctor,
            amountPaid: 500,
            status: "Discharged",
            ward: null,
            bed: null
        })),
        ...MOCK_PATIENTS
    ];

    const filteredPatients = allRecords.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             p.treatment.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const handleViewDetails = (patient) => {
        setSelectedPatient(patient);
        setIsModalOpen(true);
    };

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <PatientDetailModal 
                patient={selectedPatient} 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '0.5rem' }}>Patient Archives</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Secure repository of all clinical and financial hospital records.</p>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Search records..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ 
                                padding: '14px 20px 14px 48px', 
                                background: 'var(--bg-main)', 
                                border: '1px solid var(--border-glass)', 
                                borderRadius: 'var(--radius-lg)', 
                                color: 'var(--text-primary)', 
                                width: '300px',
                                outline: 'none'
                            }} 
                        />
                    </div>
                    
                    <div style={{ position: 'relative' }}>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className="btn-premium" 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px',
                                background: showFilters ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                borderColor: showFilters ? 'var(--primary)' : 'var(--border-glass)'
                            }}
                        >
                            <Filter size={18} /> Filters
                        </button>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 12px)',
                                        right: 0,
                                        minWidth: '200px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-glass)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '8px',
                                        zIndex: 100,
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                >
                                    {['all', 'Admitted', 'Discharged'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setStatusFilter(status);
                                                setShowFilters(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                textAlign: 'left',
                                                background: statusFilter === status ? 'var(--brand-primary-alpha)' : 'transparent',
                                                color: statusFilter === status ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            {status === 'all' ? 'All Records' : status === 'Admitted' ? 'Admitted' : 'Discharged'}
                                            {statusFilter === status && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-primary)' }} />}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '1.5rem 2rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Patient</th>
                            <th style={{ padding: '1.5rem 2rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Treatment History</th>
                            <th style={{ padding: '1.5rem 2rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Attending Physician</th>
                            <th style={{ padding: '1.5rem 2rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Location</th>
                            <th style={{ padding: '1.5rem 2rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Period</th>
                            <th style={{ padding: '1.5rem 2rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Billing</th>
                            <th style={{ padding: '1.5rem 2rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                            <th style={{ padding: '1.5rem 2rem' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.map((patient, idx) => (
                            <motion.tr 
                                key={patient.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{ borderBottom: '1px solid var(--border-glass)', cursor: 'pointer' }}
                                onClick={() => handleViewDetails(patient)}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <td style={{ padding: '1.5rem 2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ 
                                            width: '42px', 
                                            height: '42px', 
                                            borderRadius: '12px', 
                                            background: 'var(--brand-primary-alpha)', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: 'var(--brand-primary)',
                                            fontWeight: 'bold'
                                        }}>
                                            {patient.name[0]}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{patient.name}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{patient.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1.5rem 2rem' }}>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>{patient.treatment}</p>
                                </td>
                                <td style={{ padding: '1.5rem 2rem' }}>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>{patient.consultedDoctor}</p>
                                </td>
                                <td style={{ padding: '1.5rem 2rem' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{patient.ward ? `${patient.ward} / ${patient.bed}` : 'N/A'}</p>
                                </td>
                                <td style={{ padding: '1.5rem 2rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.9rem', color: 'white' }}>{patient.joinedDate}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{patient.dischargedDate ? `to ${patient.dischargedDate}` : 'Currently Admitted'}</p>
                                    </div>
                                </td>
                                <td style={{ padding: '1.5rem 2rem' }}>
                                    <p style={{ fontWeight: '800', color: 'var(--teal)', fontSize: '1rem' }}>${patient.amountPaid.toLocaleString()}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paid in Full</p>
                                </td>
                                <td style={{ padding: '1.5rem 2rem' }}>
                                    <div style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: '6px', 
                                        padding: '6px 14px', 
                                        borderRadius: '20px',
                                        background: patient.status === 'Discharged' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                        color: patient.status === 'Discharged' ? 'var(--available)' : 'var(--primary)',
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        textTransform: 'uppercase'
                                    }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                        {patient.status}
                                    </div>
                                </td>
                                <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                                    <ChevronRight size={18} color="var(--text-muted)" />
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PatientRecords;
