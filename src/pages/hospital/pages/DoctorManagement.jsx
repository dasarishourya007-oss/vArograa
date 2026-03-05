import React, { useState, useEffect } from 'react';
import {
    UserPlus,
    Search,
    Trash2,
    User,
    Mail,
    Stethoscope,
    ShieldCheck,
    MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase/config';

const DoctorManagement = () => {
    const [doctors, setDoctors] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newDoc, setNewDoc] = useState({
        name: '',
        email: '',
        specialization: ''
    });

    const hospitalId = auth?.currentUser?.uid || 'demo-hospital-id';

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, "doctors"), where("hospitalId", "==", hospitalId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setDoctors(docs);
        });
        return unsubscribe;
    }, [hospitalId]);

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "doctors"), {
                ...newDoc,
                hospitalId,
                role: 'doctor',
                status: 'approved', // Direct adds by admin are pre-approved
                createdAt: new Date().toISOString()
            });
            setNewDoc({ name: '', email: '', specialization: '' });
            setIsAdding(false);
            alert("Doctor added successfully to your network.");
        } catch (error) {
            console.error("Error adding doctor:", error);
            alert("Failed to add doctor.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this doctor?")) {
            await deleteDoc(doc(db, "doctors", id));
        }
    };

    const handleApprove = async (id) => {
        try {
            await updateDoc(doc(db, "doctors", id), {
                status: 'approved'
            });
        } catch (error) {
            console.error("Error approving doctor:", error);
            alert("Failed to approve doctor.");
        }
    };

    const pendingDoctors = doctors.filter(d => d.status === 'pending');

    // Default to approved if status is missing for backward compatibility
    const activeDoctors = doctors.filter(d => d.status !== 'pending' && (
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.specialization && d.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
    ));

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '0.5rem' }}>Medical Staff Directory</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage your hospital's specialized medical personnel.</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAdding(true)}
                    className="btn-premium"
                    style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    <UserPlus size={20} /> Add Specialist
                </motion.button>
            </div>

            {/* Pending Approvals Section */}
            {pendingDoctors.length > 0 && (
                <div style={{ marginBottom: '3rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShieldCheck size={24} /> Pending Approvals ({pendingDoctors.length})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <AnimatePresence>
                            {pendingDoctors.map((docItem, idx) => (
                                <motion.div
                                    key={docItem.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="card"
                                    style={{
                                        padding: '2rem',
                                        border: '2px dashed #fcd34d',
                                        background: '#fffbeb'
                                    }}
                                >
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '4px', color: '#92400e' }}>{docItem.name}</h3>
                                    <div style={{ color: '#d97706', fontWeight: '700', fontSize: '0.85rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
                                        {docItem.specialty || docItem.specialization || 'General'}
                                    </div>
                                    <div style={{ color: '#b45309', fontSize: '0.9rem', marginBottom: '4px' }}>Phone: {docItem.phone}</div>
                                    <div style={{ color: '#b45309', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{docItem.email}</div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleDelete(docItem.id)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #f87171', color: '#ef4444', fontWeight: 'bold', background: 'white' }}>Decline</button>
                                        <button onClick={() => handleApprove(docItem.id)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 'bold' }}>Approve</button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Search Bar for Active Staff */}
            <div className="card" style={{ marginBottom: '2.5rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-surface)' }}>
                <Search size={20} color="var(--text-muted)" />
                <input
                    type="text"
                    placeholder="Search active staff by name or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '1rem' }}
                />
            </div>

            {/* Active Staff Grid */}
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                Active Staff
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <AnimatePresence>
                    {activeDoctors.map((docItem, idx) => (
                        <motion.div
                            key={docItem.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.05 }}
                            className="card"
                            style={{
                                padding: '2rem',
                                position: 'relative',
                                border: '1px solid var(--border-glass)',
                                background: 'var(--bg-surface)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-teal))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <User size={30} />
                                </div>
                                <button onClick={() => handleDelete(docItem.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '4px' }}>{docItem.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-primary)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
                                <Stethoscope size={14} /> {docItem.specialty || docItem.specialization || 'General'}
                            </div>

                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Mail size={14} /> {docItem.email}
                            </div>

                            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="pill" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', fontSize: '0.75rem' }}>
                                    Active Status
                                </span>
                                <motion.button whileHover={{ x: 5 }} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    View Stats <ChevronRight size={16} />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Modal for Adding Doctor */}
            <AnimatePresence>
                {isAdding && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="card"
                            style={{ width: '500px', padding: '3rem', position: 'relative' }}
                        >
                            <h3 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '2rem' }}>Add New Specialist</h3>
                            <form onSubmit={handleAddDoctor}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem' }}>Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newDoc.name}
                                        onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem' }}>Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={newDoc.email}
                                        onChange={(e) => setNewDoc({ ...newDoc, email: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem' }}>Specialization</label>
                                    <input
                                        type="text"
                                        required
                                        value={newDoc.specialization}
                                        onChange={(e) => setNewDoc({ ...newDoc, specialization: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" onClick={() => setIsAdding(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                                    <button type="submit" className="btn-premium" style={{ flex: 1 }}>Register Doctor</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DoctorManagement;
