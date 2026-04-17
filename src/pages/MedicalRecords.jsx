import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    FileText, 
    Calendar, 
    User, 
    Download, 
    ChevronRight, 
    Search,
    Filter,
    ArrowLeft,
    Clock,
    Activity,
    ExternalLink,
    Package,
    ShoppingBag,
    CheckCircle,
    AlertCircle,
    X,
    MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MedicalRecords = ({ onNavigate }) => {
    const isTabMode = !!onNavigate;
    const navigate = useNavigate();
    const { prescriptions, orders, appointments, user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [fullScreenImage, setFullScreenImage] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'prescriptions' | 'orders' | 'appointments'

    const getRecordTime = (record) => {
        if (record.createdAt?.seconds) return record.createdAt.seconds * 1000;
        if (record.createdAt && typeof record.createdAt === 'string') return new Date(record.createdAt).getTime();
        if (record.timestamp) return new Date(record.timestamp).getTime();
        if (record.date && record.time) return new Date(`${record.date} ${record.time}`).getTime();
        return 0;
    };

    // Normalize prescriptions
    const normalizedPrescriptions = (prescriptions || []).map(p => ({ ...p, _type: 'prescription' }));
    
    // Normalize DELIVERED orders
    const normalizedOrders = (orders || [])
        .filter(o => ['DELIVERED', 'COMPLETED', 'PAID'].includes((o.status || '').toUpperCase()))
        .map(o => ({ 
            ...o, 
            _type: 'order',
            title: o.storeName || 'Pharmacy Order',
            subtitle: (o.items || []).join(', ')
        }));

    // Normalize COMPLETED appointments
    const normalizedAppointments = (appointments || [])
        .filter(a => (a.status || '').toLowerCase() === 'completed')
        .map(a => ({
            ...a,
            _type: 'appointment',
            title: a.doctorName || 'Medical Consultation',
            subtitle: a.hospitalName || 'Health Center'
        }));

    const allRecords = [...normalizedPrescriptions, ...normalizedOrders, ...normalizedAppointments]
        .sort((a, b) => getRecordTime(b) - getRecordTime(a));

    const visibleRecords = allRecords
        .filter(record => {
            if (activeTab === 'prescriptions') return record._type === 'prescription';
            if (activeTab === 'orders') return record._type === 'order';
            if (activeTab === 'appointments') return record._type === 'appointment';
            return true;
        })
        .filter(record => {
            const q = searchQuery.toLowerCase();
            if (!q) return true;
            if (record._type === 'prescription') {
                return record.doctorName?.toLowerCase().includes(q) ||
                    record.diagnosis?.toLowerCase().includes(q) ||
                    (record.medicines || []).some(m => m.name?.toLowerCase().includes(q));
            }
            if (record._type === 'appointment') {
                return record.doctorName?.toLowerCase().includes(q) ||
                    record.hospitalName?.toLowerCase().includes(q) ||
                    record.reason?.toLowerCase().includes(q);
            }
            return record.storeName?.toLowerCase().includes(q) ||
                (record.items || []).some(item => item.toLowerCase().includes(q));
        });

    const formatDate = (record) => {
        const time = getRecordTime(record);
        if (!time) return 'N/A';
        return new Date(time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const statusColor = (status) => {
        switch ((status || '').toUpperCase()) {
            case 'DELIVERED': return { bg: '#f0fdf4', text: '#166534', border: '#dcfce7' };
            case 'COMPLETED': return { bg: '#eff6ff', text: '#1e40af', border: '#dbeafe' };
            case 'PAID': return { bg: '#f0fdf4', text: '#166534', border: '#dcfce7' };
            default: return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
        }
    };

    return (
        <div style={{ 
            minHeight: isTabMode ? 'auto' : '100vh', 
            backgroundColor: isTabMode ? 'transparent' : '#f8fafc', 
            paddingBottom: '100px',
            fontFamily: 'Inter, sans-serif'
        }}>
            {!isTabMode && (
                <header style={{ 
                    backgroundColor: 'white', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 100,
                    borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <ArrowLeft size={24} color="#1e293b" />
                    </button>
                    <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Medical Records</h1>
                </header>
            )}

            {isTabMode && (
                <div style={{ padding: '32px 24px 16px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Medical History</h1>
                    <p style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Prescriptions, Orders & Appointments</p>
                </div>
            )}

            <main style={{ padding: isTabMode ? '0 24px' : '20px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="text" 
                        placeholder="Search your records..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ 
                            width: '100%', padding: '14px 16px 14px 44px', borderRadius: '16px', 
                            border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '15px', outline: 'none'
                        }} 
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                    {[
                        { id: 'all', label: `All (${allRecords.length})` }, 
                        { id: 'prescriptions', label: `Prescriptions (${normalizedPrescriptions.length})` }, 
                        { id: 'orders', label: `Pharmacy (${normalizedOrders.length})` },
                        { id: 'appointments', label: `Appointments (${normalizedAppointments.length})` }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '8px 16px', borderRadius: '24px', border: 'none',
                                fontWeight: '700', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
                                backgroundColor: activeTab === tab.id ? '#1e293b' : '#f1f5f9',
                                color: activeTab === tab.id ? 'white' : '#64748b'
                            }}
                        >{tab.label}</button>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {visibleRecords.length > 0 ? (
                        visibleRecords.map((record) => (
                            record._type === 'order' ? (
                                <OrderCard key={record.id} record={record} formatDate={formatDate} onClick={() => setSelectedRecord(record)} />
                            ) : record._type === 'appointment' ? (
                                <AppointmentCard key={record.id} record={record} formatDate={formatDate} onClick={() => setSelectedRecord(record)} />
                            ) : (
                                <RecordCard key={record.id} record={record} formatDate={formatDate} onClick={() => setSelectedRecord(record)} />
                            )
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <FileText size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#475569' }}>No records found</h3>
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence>
                {selectedRecord && (
                    <RecordDetail 
                        record={selectedRecord} 
                        onClose={() => setSelectedRecord(null)} 
                        formatDate={formatDate}
                        statusColor={statusColor}
                        onViewImage={(url) => setFullScreenImage(url)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {fullScreenImage && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ 
                            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', 
                            zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '20px'
                        }}
                        onClick={() => setFullScreenImage(null)}
                    >
                        <button 
                            onClick={() => setFullScreenImage(null)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <X size={24} color="black" />
                        </button>
                        <motion.img 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            src={fullScreenImage} 
                            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', cursor: 'zoom-out' }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const OrderCard = ({ record, formatDate, onClick }) => (
    <div onClick={onClick} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
        <div style={{ width: '48px', height: '48px', backgroundColor: '#f0fdf4', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={24} color="#22c55e" />
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontWeight: '800' }}>{record.storeName}</h4>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{formatDate(record)}</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{record.subtitle}</p>
        </div>
        <ChevronRight size={18} color="#cbd5e1" />
    </div>
);

const AppointmentCard = ({ record, formatDate, onClick }) => (
    <div onClick={onClick} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
        <div style={{ width: '48px', height: '48px', backgroundColor: '#eff6ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} color="#3b82f6" />
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontWeight: '800' }}>Dr. {record.doctorName}</h4>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{formatDate(record)}</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{record.hospitalName}</p>
        </div>
        <ChevronRight size={18} color="#cbd5e1" />
    </div>
);

const RecordCard = ({ record, formatDate, onClick }) => (
    <div onClick={onClick} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '48px', height: '48px', backgroundColor: '#f0fdfa', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} color="#0d9488" />
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontWeight: '800', color: '#0f172a' }}>Dr. {record.doctorName}</h4>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{formatDate(record)}</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{record.diagnosis || 'Medical Consultation'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {record.imageUrl && <span style={{ fontSize: '10px', background: '#f0fdfa', color: '#0d9488', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>DIGITAL</span>}
            <ChevronRight size={18} color="#cbd5e1" />
        </div>
    </div>
);

const RecordDetail = ({ record, onClose, formatDate, statusColor, onViewImage }) => {
    const isOrder = record._type === 'order';
    const isAppointment = record._type === 'appointment';
    const isPrescription = record._type === 'prescription';
    const sc = statusColor(record.status);
    const hasImage = record.imageUrl || record.whiteboardDataUrl;

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            onClick={onClose}
        >
            <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                style={{ backgroundColor: 'white', width: '100%', maxWidth: '600px', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '24px', maxHeight: '95vh', overflowY: 'auto' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ width: '40px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', margin: '0 auto 20px' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isPrescription ? 'Clinical Prescription' : isOrder ? 'Pharmacy Order' : 'Appointment Receipt'}
                            {isPrescription && hasImage && <span style={{ fontSize: '10px', background: '#ccfbf1', color: '#0f766e', padding: '4px 10px', borderRadius: '100px' }}>VERIFIED DIGITAL</span>}
                        </h2>
                        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{formatDate(record)}</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer' }}>
                        <X size={20} color="#64748b" />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Prescription High-Fidelity Image Preview */}
                    {isPrescription && hasImage && (
                        <div style={{ position: 'relative' }}>
                            <div 
                                onClick={() => onViewImage(record.imageUrl || record.whiteboardDataUrl)}
                                style={{ 
                                    width: '100%', 
                                    aspectRatio: '1 / 1.4', 
                                    backgroundColor: '#f8fafc', 
                                    borderRadius: '16px', 
                                    overflow: 'hidden', 
                                    border: '1px solid #e2e8f0',
                                    cursor: 'zoom-in',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                }}
                            >
                                <img 
                                    src={record.imageUrl || record.whiteboardDataUrl} 
                                    alt="Digital Prescription" 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                                <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.7)', color: 'white', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ExternalLink size={12} /> View Full
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                {isOrder ? <Package size={20} color="#0d9488" /> : <Stethoscope size={20} color="#0d9488" />}
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>{record.doctorName || record.storeName}</h4>
                                <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>{record.hospitalName || record.location || 'General Hub'}</p>
                            </div>
                        </div>
                    </div>

                    {isPrescription && (
                        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '24px' }}>
                            <h5 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consultation Details</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>DIAGNOSIS</span>
                                    <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#1e293b' }}>{record.diagnosis || 'General Checkup'}</p>
                                </div>
                                {record.medicines && record.medicines.length > 0 && (
                                    <div>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>MEDICATIONS (Rx)</span>
                                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {record.medicines.map((m, i) => (
                                                <div key={i} style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontWeight: '800', color: '#0f172a' }}>{m.name}</span>
                                                        <span style={{ color: '#0d9488', fontWeight: '800', fontSize: '13px' }}>{m.dose || m.dosage}</span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{m.frequency} • {m.duration}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {record.notes && (
                                    <div>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>DOCTOR'S NOTES</span>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>{record.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {isOrder && (
                        <div>
                            <h5 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: '#475569' }}>Items</h5>
                            <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                                {record.items?.map((item, i) => (
                                    <div key={i} style={{ padding: '12px', borderBottom: i === record.items.length - 1 ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{item}</span>
                                        <span style={{ fontWeight: '700' }}>x1</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isAppointment && record.reason && (
                        <div>
                            <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '800', color: '#475569' }}>Reason for Visit</h5>
                            <p style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '12px', margin: 0, fontSize: '14px' }}>{record.reason}</p>
                        </div>
                    )}

                    <div style={{ padding: '16px', backgroundColor: sc.bg, border: `1px solid ${sc.border}`, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={18} color={sc.text} />
                        <span style={{ fontWeight: '800', color: sc.text, fontSize: '14px' }}>Status: {record.status || 'Completed'}</span>
                    </div>

                    <button onClick={onClose} style={{ marginTop: '10px', width: '100%', padding: '16px', borderRadius: '16px', backgroundColor: '#1e293b', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MedicalRecords;
