import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Info, CheckCircle, AlertCircle, Trash2, Package, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createOrder } from '../firebase/services';
import { useNavigate } from 'react-router-dom';

// Mock Database
const medicineDb = [
    { id: 1, brandName: 'Dolo 650', genericName: 'Paracetamol', salt: 'Paracetamol 650mg', strength: '650mg', form: 'Tablet', packSize: 15, stripPrice: 30, stock: 150 },
    { id: 2, brandName: 'Citrogin', genericName: 'Levocetirizine', salt: 'Levocetirizine Hydrochloride', strength: '5mg', form: 'Tablet', packSize: 10, stripPrice: 18, stock: 80 },
    { id: 3, brandName: 'Pan 40', genericName: 'Pantoprazole', salt: 'Pantoprazole Sodium', strength: '40mg', form: 'Tablet', packSize: 15, stripPrice: 145, stock: 45 },
    { id: 4, brandName: 'Augmentin 625 Duo', genericName: 'Amoxicillin + Clavulanic Acid', salt: 'Amoxicillin 500mg, Clavulanic Acid 125mg', strength: '625mg', form: 'Tablet', packSize: 10, stripPrice: 220, stock: 20 },
    { id: 5, brandName: 'Calpol 500', genericName: 'Paracetamol', salt: 'Paracetamol 500mg', strength: '500mg', form: 'Tablet', packSize: 15, stripPrice: 15, stock: 300 },
    { id: 6, brandName: 'Benadryl', genericName: 'Diphenhydramine', salt: 'Diphenhydramine HCl', strength: '150ml', form: 'Syrup', packSize: 1, stripPrice: 120, stock: 15 },
];

const MedicineSearch = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [medicines, setMedicines] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedMed, setSelectedMed] = useState(null);
    const [saleType, setSaleType] = useState('strip'); // 'strip' or 'single'
    const [quantity, setQuantity] = useState(1);
    // eslint-disable-next-line no-unused-vars
    const [loading, setLoading] = useState(false);
    const [pharmacies, setPharmacies] = useState([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Mock Database moved above component

    useEffect(() => {
        const fetchPharmacies = async () => {
            try {
                // If we're navigated from a specific hospital, we might want to filter by that
                // For now, let's ensure we only show APPROVED stores globally or by hospitalId
                const q = query(
                    collection(db, "medical_stores"),
                    where("status", "==", "APPROVED")
                );
                const snap = await getDocs(q);
                const p = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPharmacies(p);
                if (p.length > 0) setSelectedPharmacy(p[0]);
            } catch (err) {
                console.error("Error fetching pharmacies:", err);
            }
        };
        fetchPharmacies();
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length > 1) {
            setLoading(true);
            const timer = setTimeout(() => {
                const results = medicineDb.filter(m =>
                    m.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.salt.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setMedicines(results);
                setLoading(false);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setMedicines([]);
        }
    }, [searchQuery]);

    const handleAddToCart = () => {
        if (!selectedMed) return;

        const singlePrice = selectedMed.stripPrice / selectedMed.packSize;
        const finalPrice = saleType === 'strip' ? selectedMed.stripPrice : singlePrice;
        const totalCost = finalPrice * quantity;

        // Stock Validation
        const requestedStock = saleType === 'strip' ? quantity * selectedMed.packSize : quantity;
        if (requestedStock > selectedMed.stock) {
            alert(`Insufficient Stock! Only ${selectedMed.stock} individual units available.`);
            return;
        }

        const cartItem = {
            id: Date.now(),
            medId: selectedMed.id,
            name: selectedMed.brandName,
            type: saleType,
            quantity: quantity,
            price: finalPrice,
            total: totalCost
        };

        setCart([...cart, cartItem]);
        setSelectedMed(null);
        setSearchQuery('');
        setQuantity(1);
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

    return (
        <div style={{ padding: '20px', fontFamily: 'var(--font-main)', maxWidth: '450px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-main)' }}>Medicine Search</h2>

            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'white',
                    padding: '12px 16px',
                    borderRadius: '20px',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid #eee'
                }}>
                    <Search size={20} color="var(--p-500)" style={{ marginRight: '12px' }} />
                    <input
                        type="text"
                        placeholder="Search Brand, Generic or Salt..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '16px', fontWeight: '600' }}
                    />
                </div>

                <AnimatePresence>
                    {medicines.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: 'white',
                                borderRadius: '20px',
                                marginTop: '8px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                zIndex: 100,
                                overflow: 'hidden',
                                border: '1px solid #eee'
                            }}
                        >
                            {medicines.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => setSelectedMed(m)}
                                    style={{
                                        padding: '16px',
                                        borderBottom: '1px solid #f8f9fa',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fb'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>{m.brandName}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.genericName} • {m.strength}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--p-500)', marginTop: '4px' }}>{m.salt}</div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Selection Panel */}
            <AnimatePresence>
                {selectedMed && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card-premium"
                        style={{ padding: '24px', marginBottom: '24px', border: '2px solid var(--p-500)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{selectedMed.brandName}</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{selectedMed.genericName} • {selectedMed.form}</p>
                            </div>
                            <button onClick={() => setSelectedMed(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <AlertCircle size={20} color="#94a3b8" />
                            </button>
                        </div>

                        <div style={{ background: 'var(--brand-secondary)', padding: '12px', borderRadius: '12px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>Composition</div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedMed.salt}</div>
                        </div>

                        {selectedMed.form === 'Tablet' || selectedMed.form === 'Capsule' ? (
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                <button
                                    onClick={() => setSaleType('strip')}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: saleType === 'strip' ? '2px solid var(--p-500)' : '2px solid #eee',
                                        background: saleType === 'strip' ? 'var(--p-50)' : 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Layers size={18} color={saleType === 'strip' ? 'var(--p-500)' : '#94a3b8'} style={{ marginBottom: '4px' }} />
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: saleType === 'strip' ? 'var(--p-500)' : '#64748b' }}>Full Strip</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{selectedMed.packSize} units</div>
                                </button>
                                <button
                                    onClick={() => setSaleType('single')}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: saleType === 'single' ? '2px solid var(--p-500)' : '2px solid #eee',
                                        background: saleType === 'single' ? 'var(--p-50)' : 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Package size={18} color={saleType === 'single' ? 'var(--p-500)' : '#94a3b8'} style={{ marginBottom: '4px' }} />
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: saleType === 'single' ? 'var(--p-500)' : '#64748b' }}>Single Unit</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Loose tablet</div>
                                </button>
                            </div>
                        ) : (
                            <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '8px' }}>
                                <Info size={16} color="#ef4444" />
                                <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: '600' }}>Only full bottle available for Syrups.</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', padding: '8px 16px', borderRadius: '12px' }}>
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>-</button>
                                <span style={{ width: '30px', textAlign: 'center', fontWeight: '800', fontSize: '18px' }}>{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>+</button>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Price</div>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--p-600)' }}>
                                    Rs.{((saleType === 'strip' ? selectedMed.stripPrice : selectedMed.stripPrice / selectedMed.packSize) * quantity).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '16px',
                                border: 'none',
                                background: 'var(--p-500)',
                                color: 'white',
                                fontWeight: '800',
                                fontSize: '16px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <ShoppingCart size={20} /> Add to Cart
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart Section */}
            {cart.length > 0 && (
                <div className="card-premium" style={{ padding: '24px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h4 style={{ fontWeight: '800' }}>Your Cart ({cart.length})</h4>
                        <div style={{ color: 'var(--p-600)', fontWeight: '900' }}>Rs.{cartTotal.toFixed(2)}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{item.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.quantity} x {item.type}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '800' }}>Rs.{item.total.toFixed(2)}</div>
                                    <button onClick={() => removeFromCart(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '8px', display: 'block' }}>SELECT PHARMACY</label>
                        <select
                            value={selectedPharmacy?.id || ''}
                            onChange={(e) => setSelectedPharmacy(pharmacies.find(p => p.id === e.target.value))}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', marginBottom: '20px', fontSize: '14px', fontWeight: '700' }}
                        >
                            {pharmacies.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.address || 'Local'})</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={async () => {
                            if (!selectedPharmacy) return alert("Select a pharmacy first");
                            setIsCheckingOut(true);
                            try {
                                const orderData = {
                                    patientId: user?.uid || user?.id,
                                    patientName: user?.name || 'Patient',
                                    userName: user?.name,
                                    storeId: selectedPharmacy.id,
                                    storeName: selectedPharmacy.name,
                                    items: cart.map(i => `${i.name} (${i.quantity} ${i.type})`),
                                    total: cartTotal,
                                    status: 'pending'
                                };
                                await createOrder(orderData);
                                alert("Order placed successfully! The pharmacy will notify you soon.");
                                setCart([]);
                                navigate('/dashboard/patient');
                            } catch (err) {
                                console.error(err);
                                alert("Failed to place order.");
                            } finally {
                                setIsCheckingOut(false);
                            }
                        }}
                        disabled={isCheckingOut}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '16px',
                            border: 'none',
                            background: isCheckingOut ? '#94a3b8' : '#10b981',
                            color: 'white',
                            fontWeight: '800',
                            fontSize: '16px',
                            cursor: 'pointer'
                        }}
                    >
                        {isCheckingOut ? 'Processing...' : 'Place Order'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MedicineSearch;
