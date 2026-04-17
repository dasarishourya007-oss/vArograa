import React, { useState, useEffect } from 'react';
import {
    Store,
    Search,
    Trash2,
    Mail,
    ShieldCheck,
    FileText,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase/config';

const MedicalStoreManagement = () => {
    const [stores, setStores] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const hospitalId = auth?.currentUser?.uid || 'demo-hospital-id';

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, "medical_stores"), where("hospitalId", "==", hospitalId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const storeData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setStores(storeData);
        });
        return unsubscribe;
    }, [hospitalId]);

    const handleApprove = async (id) => {
        try {
            await updateDoc(doc(db, "medical_stores", id), {
                status: 'APPROVED'
            });
            await updateDoc(doc(db, "users", id), {
                status: 'APPROVED'
            });
            alert("Medical store approved successfully.");
        } catch (error) {
            console.error("Error approving store:", error);
            alert("Failed to approve store.");
        }
    };

    const handleReject = async (id) => {
        if (window.confirm("Are you sure you want to reject this medical store?")) {
            try {
                await updateDoc(doc(db, "medical_stores", id), {
                    status: 'REJECTED'
                });
                await updateDoc(doc(db, "users", id), {
                    status: 'REJECTED'
                });
                alert("Medical store rejected.");
            } catch (error) {
                console.error("Error rejecting store:", error);
                alert("Failed to reject store.");
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this medical store from your network?")) {
            await deleteDoc(doc(db, "medical_stores", id));
        }
    };

    const pendingStores = stores.filter(s => s.status === 'PENDING_APPROVAL');
    const activeStores = stores.filter(s => s.status === 'APPROVED' && (
        s.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.license_number && s.license_number.toLowerCase().includes(searchTerm.toLowerCase()))
    ));

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <div style={{ marginBottom: '3.5rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '0.5rem' }}>Pharmacy Network</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage and approve medical stores connected to your hospital.</p>
            </div>

            {/* Pending Approvals Section */}
            {pendingStores.length > 0 && (
                <div style={{ marginBottom: '3rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShieldCheck size={24} /> Store Approval Requests ({pendingStores.length})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <AnimatePresence>
                            {pendingStores.map((store) => (
                                <motion.div
                                    key={store.id}
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
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '4px', color: '#92400e' }}>{store.store_name}</h3>
                                    <div style={{ color: '#d97706', fontWeight: '700', fontSize: '0.85rem', marginBottom: '1rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <FileText size={14} /> Lic: {store.license_number || 'N/A'}
                                    </div>
                                    <div style={{ color: '#b45309', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{store.email}</div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleReject(store.id)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #f87171', color: '#ef4444', fontWeight: 'bold', background: 'white' }}>Reject</button>
                                        <button onClick={() => handleApprove(store.id)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 'bold' }}>Approve</button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Search Bar for Active Stores */}
            <div className="card" style={{ marginBottom: '2.5rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-surface)' }}>
                <Search size={20} color="var(--text-muted)" />
                <input
                    type="text"
                    placeholder="Search approved stores by name or license..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '1rem' }}
                />
            </div>

            {/* Active Stores Grid */}
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                Approved Medical Stores
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <AnimatePresence>
                    {activeStores.map((store, idx) => (
                        <motion.div
                            key={store.id}
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
                                    background: 'linear-gradient(135deg, var(--brand-teal), #0D9488)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <Store size={30} />
                                </div>
                                <button onClick={() => handleDelete(store.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '4px' }}>{store.store_name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-teal)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
                                <FileText size={14} /> License: {store.license_number}
                            </div>

                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Mail size={14} /> {store.email}
                            </div>

                            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="pill" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', fontSize: '0.75rem' }}>
                                    Active
                                </span>
                                <motion.button whileHover={{ x: 5 }} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    View Details <ChevronRight size={16} />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MedicalStoreManagement;
