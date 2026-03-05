import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import {
    Package, Truck, CheckCircle, Clock,
    ArrowLeft, LogOut, DollarSign, ShoppingBag,
    TrendingUp, User, MapPin, Star, Settings, Image as ImageIcon,
    Plus, Search, Receipt, Users, Trash2, Edit, Save, ScanLine, Printer, Eye, Boxes, HeartPulse, Wallet, Camera, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import { subscribeToOrders, updateOrderStatus } from '../firebase/services';

const billInputStyle = { width: '100%', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '15px', transition: 'all 0.3s' };

// --- Premium Design System Tokens ---
const premiumCard = {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '24px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

const inputStyle = { padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#f8fafc', fontSize: '14px', color: '#0f172a', transition: 'all 0.2s' };
const labelStyle = { fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };
const thStyle = { padding: '16px 24px', fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' };
const tdStyle = { padding: '20px 24px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f8fafc' };
const iconBtnStyle = { padding: '8px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' };

// --- Helper Components ---
const StatCard = ({ icon, title, value, variant = 'info' }) => {
    const colors = {
        info: { bg: '#eff6ff', color: '#3b82f6' },
        success: { bg: '#f0fdf4', color: '#10b981' },
        warning: { bg: '#fffbeb', color: '#f59e0b' },
        danger: { bg: '#fef2f2', color: '#ef4444' }
    };
    const c = colors[variant] || colors.info;
    return (
        <div style={{ ...premiumCard, padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', backgroundColor: c.bg, color: c.color, borderRadius: '16px' }}>
                {icon}
            </div>
            <div>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{value}</h3>
            </div>
        </div>
    );
};

const SidebarLink = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '14px',
            border: 'none',
            backgroundColor: active ? '#10b981' : 'transparent',
            color: active ? 'white' : '#475569',
            fontWeight: active ? '700' : '600',
            fontSize: '14px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease',
            width: '100%'
        }}
    >
        <span style={{ display: 'flex', opacity: active ? 1 : 0.7 }}>{icon}</span>
        {label}
    </button>
);

const AnimatedNumber = ({ value, prefix = '', suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => {
        let start = 0;
        const duration = 1000;
        const stepTime = Math.abs(Math.floor(duration / (value || 1)));
        const timer = setInterval(() => {
            start += Math.ceil(value / 60);
            if (start >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(start);
            }
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

const KPIBlock = ({ icon, title, value, prefix, suffix, growth, color = '#10b981' }) => (
    <motion.div
        whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
        style={{ ...premiumCard, flex: 1, padding: '24px', position: 'relative', overflow: 'hidden' }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>{title}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
                <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
            </h3>
            {growth && (
                <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    style={{ fontSize: '12px', fontWeight: '800', color: growth === 'Danger' ? '#ef4444' : '#10b981', backgroundColor: growth === 'Danger' ? '#fef2f2' : '#f0fdf4', padding: '4px 8px', borderRadius: '6px', marginBottom: '6px' }}
                >
                    {growth}
                </motion.span>
            )}
        </div>
    </motion.div>
);

const AlertItem = ({ title, meta, level }) => (
    <motion.div
        animate={level === 'critical' ? { opacity: [1, 0.7, 1] } : {}}
        transition={level === 'critical' ? { duration: 2, repeat: Infinity } : {}}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}
    >
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: level === 'critical' ? '#ef4444' : '#f59e0b' }} />
        <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: '700' }}>{title}</p>
            <p style={{ fontSize: '12px', opacity: 0.6 }}>{meta}</p>
        </div>
    </motion.div>
);

const TimelineItem = ({ title, time, desc }) => (
    <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#10b981', border: '4px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{title}</h5>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{time}</span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b' }}>{desc}</p>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        'Confirmed': { bg: '#eff6ff', color: '#2563eb' },
        'Preparing': { bg: '#fffbeb', color: '#d97706' },
        'Out for delivery': { bg: '#f3f4f6', color: '#4b5563' },
        'Delivered': { bg: '#f0fdf4', color: '#16a34a' }
    };
    const s = styles[status] || styles['Confirmed'];
    return (
        <span style={{
            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
            backgroundColor: s.bg, color: s.color, textTransform: 'uppercase'
        }}>
            {status}
        </span>
    );
};

const TableRow = ({ children }) => (
    <motion.tr
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer' }}
        onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.firstChild.style.borderLeft = '2px solid #10b981';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.firstChild.style.borderLeft = '2px solid transparent';
        }}
    >
        {children}
    </motion.tr>
);

const RevenueChart = ({ data = [40, 60, 45, 90, 65, 80, 50], labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], color = '#10b981', currency = '₹' }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const max = Math.max(...data, 100);
    const height = 180; // Compact height
    const width = 500;
    const padding = 30;

    // Generate path points
    const points = data.map((val, i) => {
        const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
        const y = height - 40 - (val / max) * (height - 70); // Tighter vertical spread
        return { x, y, value: val, label: labels[i] };
    });

    // Create a smooth SVG path
    const pathData = points.reduce((acc, p, i, a) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = a[i - 1];
        const cx = (prev.x + p.x) / 2;
        return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    }, '');

    const areaData = `${pathData} V ${height - 35} H ${padding} Z`;

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Horizontal Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                    <line
                        key={i}
                        x1={padding}
                        y1={padding + p * (height - 70)}
                        x2={width - padding}
                        y2={padding + p * (height - 70)}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                    />
                ))}

                {/* Vertical Data Indicators */}
                {points.map((p, i) => (
                    <line
                        key={i}
                        x1={p.x}
                        y1={padding}
                        x2={p.x}
                        y2={height - 40}
                        stroke={hoveredIndex === i ? color : "#f8fafc"}
                        strokeWidth={hoveredIndex === i ? 2 : 1}
                        strokeDasharray={hoveredIndex === i ? "0" : "4 4"}
                        style={{ transition: 'all 0.3s ease' }}
                    />
                ))}

                <motion.path
                    d={areaData}
                    fill="url(#chartGrad)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                />

                <motion.path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {points.map((p, i) => (
                    <motion.g
                        key={i}
                        style={{ cursor: 'pointer' }}
                        onPointerEnter={() => setHoveredIndex(i)}
                        onPointerLeave={() => setHoveredIndex(null)}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                    >
                        <motion.circle
                            cx={p.x}
                            cy={p.y}
                            r={hoveredIndex === i ? 8 : 6}
                            fill="white"
                            stroke={color}
                            strokeWidth="3"
                            animate={{ r: hoveredIndex === i ? 8 : 6, strokeWidth: hoveredIndex === i ? 4 : 3 }}
                        />
                        <text x={p.x} y={height - 12} textAnchor="middle" fontSize="11" fontWeight="700" fill={hoveredIndex === i ? color : "#94a3b8"} style={{ transition: 'fill 0.3s ease' }}>{p.label}</text>
                    </motion.g>
                ))}
            </svg>

            {/* Tooltip */}
            <AnimatePresence>
                {hoveredIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        style={{
                            position: 'absolute',
                            left: `${(points[hoveredIndex].x / width) * 100}%`,
                            top: `${(points[hoveredIndex].y / height) * 100}%`,
                            transform: 'translate(-50%, -120%)',
                            backgroundColor: 'white',
                            color: 'var(--text-primary)',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                            zIndex: 100,
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                            border: '1px solid #f1f5f9'
                        }}
                    >
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>{points[hoveredIndex].label}</div>
                        <div style={{ fontSize: '18px', fontWeight: '800' }}>{currency}{points[hoveredIndex].value.toLocaleString()}</div>
                        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '12px', height: '12px', backgroundColor: 'white', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MedicalStoreDashboard = () => {
    const { user, loading, updateProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [chartFilter, setChartFilter] = useState('W');
    const [filter, setFilter] = useState('all');
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [availableItems, setAvailableItems] = useState({});
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [realOrders, setRealOrders] = useState([]);

    useEffect(() => {
        if (!user) return;
        const storeId = user.uid || user.id;
        const unsub = subscribeToOrders(storeId, (data) => {
            setRealOrders(data);
        });
        return () => unsub();
    }, [user]);

    // Inventory Management State
    const [inventorySearch, setInventorySearch] = useState('');
    const [globalSearch, setGlobalSearch] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [showInvModal, setShowInvModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [invForm, setInvForm] = useState({
        brandName: '', genericName: '', saltComposition: '',
        category: 'Analgesic', price: '', stock: '',
        packSize: '', form: 'Tablet', rx: false
    });

    // Patient Management State
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [patientForm, setPatientForm] = useState({ name: '', mobile: '', age: '', gender: 'Male' });
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const getChartData = () => {
        switch (chartFilter) {
            case 'D':
                return {
                    data: [12000, 18000, 15000, 24000, 21000, 32000, 28000, 42000],
                    labels: ['8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM']
                };
            case 'M':
                return {
                    data: [420000, 380000, 510000, 480000, 590000, 620000],
                    labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']
                };
            case 'W':
            default:
                return {
                    data: [42000, 58000, 45000, 72000, 61000, 89000, 74000],
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                };
        }
    };

    const currentData = getChartData();

    // --- Mock Data from MediFlow ---
    const [inventory, setInventory] = useState([
        { id: 1, brandName: 'Dolo 650', genericName: 'Paracetamol', saltComposition: 'Paracetamol 650mg IP', category: 'Analgesic', price: 30.00, stock: 120, packSize: 15, form: 'Tablet', rx: false },
        { id: 2, brandName: 'Citrogin', genericName: 'Levocetirizine', saltComposition: 'Levocetirizine 5mg', category: 'Antihistamine', price: 18.00, stock: 8, packSize: 10, form: 'Tablet', rx: true },
        { id: 3, brandName: 'Augmentin 625', genericName: 'Amoxicillin + Clavulanic Acid', saltComposition: 'Amoxicillin 500mg, Clavulanic Acid 125mg', category: 'Antibiotic', price: 210.00, stock: 45, packSize: 10, form: 'Tablet', rx: true },
        { id: 4, brandName: 'Benadryl', genericName: 'Diphenhydramine', saltComposition: 'Diphenhydramine 12.5mg/5ml', category: 'Cough Syrup', price: 110.00, stock: 15, packSize: 1, form: 'Syrup', rx: false },
        { id: 5, brandName: 'Metffull 500', genericName: 'Metformin', saltComposition: 'Metformin 500mg', category: 'Antidiabetic', price: 40.00, stock: 85, packSize: 15, form: 'Tablet', rx: true },
    ]);

    const [patients, setPatients] = useState([
        { id: 'CUST-1001', name: 'Abhinav G', mobile: '9876543210', history: [{ id: 'INV-5001', date: '2024-10-20', total: 450, items: 'Paracetamol, Cetirizine' }] },
        { id: 'CUST-1002', name: 'John Doe', mobile: '9123456789', history: [] }
    ]);

    // --- Billing State ---
    const [billing, setBilling] = useState({
        currentItems: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        customerName: '',
        customerMobile: '',
        linkedRx: null
    });
    const [billSearch, setBillSearch] = useState('');
    const [selectedMed, setSelectedMed] = useState(null);
    const [saleType, setSaleType] = useState('strip'); // 'strip' | 'single'
    const [posQty, setPosQty] = useState(1);
    const [rxAnalysisMode, setRxAnalysisMode] = useState(null); // 'digital' | 'offline'
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // --- Settings & Configuration ---
    const [storeSettings, setStoreSettings] = useState({
        currency: '₹',
        taxRate: 12, // 12% GST default
        thermalFooter: 'Thank you for choosing vArogra. Get well soon!',
        lowStockAlert: 20,
        enableNotifications: true,
        fastCheckout: false
    });

    // Profile State
    const [profileForm, setProfileForm] = useState({
        storeName: user?.name || '',
        address: user?.address || '',
        phone: user?.phone || user?.primaryPhone || '',
        inChargeName: user?.inChargeName || '',
        licenseNo: 'DL-2024-5512',
        gstNo: '27AAAAA0000A1Z5',
        foundedYear: '2020'
    });
    const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
    const [checklist, setChecklist] = useState([
        { id: 1, l: 'Verify pending Rx', d: true },
        { id: 2, l: 'Cold storage check', d: false },
        { id: 3, l: 'EOD Revenue Reconciliation', d: false }
    ]);

    const toggleChecklistTask = (id) => {
        setChecklist(prev => prev.map(t => t.id === id ? { ...t, d: !t.d } : t));
    };

    const handleRestockAll = () => {
        setInventory(prev => prev.map(item => ({
            ...item,
            stock: item.stock < 20 ? 120 : item.stock
        })));
        alert("Restocked all low-stock items to standard levels!");
    };

    const handleSaveInv = (e) => {
        if (e) e.preventDefault();
        if (!invForm.brandName || !invForm.category || !invForm.price || !invForm.stock) {
            return alert("Please fill all required fields.");
        }

        const itemData = {
            ...invForm,
            id: editingItem ? editingItem.id : Date.now(),
            price: parseFloat(invForm.price),
            stock: parseFloat(invForm.stock),
            packSize: parseInt(invForm.packSize) || 1
        };

        if (editingItem) {
            setInventory(prev => prev.map(i => i.id === editingItem.id ? itemData : i));
        } else {
            setInventory(prev => [...prev, itemData]);
        }

        setShowInvModal(false);
        setEditingItem(null);
        setInvForm({ brandName: '', genericName: '', saltComposition: '', category: 'Analgesic', price: '', stock: '', packSize: '', form: 'Tablet', rx: false });
    };

    const deleteInvItem = (id) => {
        if (confirm("Are you sure you want to remove this item?")) {
            setInventory(prev => prev.filter(i => i.id !== id));
        }
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setInvForm({ ...item });
        setShowInvModal(true);
    };

    const handleSavePatient = (e) => {
        if (e) e.preventDefault();
        if (!patientForm.name || !patientForm.mobile) return alert("Required fields missing");

        const newPatient = {
            ...patientForm,
            id: `CUST-${1000 + patients.length + 1}`,
            history: []
        };
        setPatients(prev => [...prev, newPatient]);
        setShowPatientModal(false);
        setPatientForm({ name: '', mobile: '', age: '', gender: 'Male' });
        alert("Patient registered successfully!");
    };

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showSearchResults && !e.target.closest('.search-container')) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSearchResults]);

    if (loading || !user) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 40%, #eff6ff 100%)',
                color: 'var(--text-primary)'
            }}>
                <div style={{ padding: '20px', backgroundColor: '#10b981', borderRadius: '14px', marginBottom: '20px', color: 'white' }}>
                    <HeartPulse size={32} className="animate-pulse" />
                </div>
                <h2 style={{ fontWeight: '800', fontSize: '18px' }}>Initializing Pharmacy Portal...</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Securing your session</p>
            </div>
        );
    }

    const myOrders = realOrders;

    // Global Search Logic
    const searchResults = {
        meds: inventory.filter(i =>
            i.brandName.toLowerCase().includes(globalSearch.toLowerCase()) ||
            i.genericName.toLowerCase().includes(globalSearch.toLowerCase())
        ).slice(0, 5),
        patients: patients.filter(p =>
            p.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
            p.mobile.includes(globalSearch)
        ).slice(0, 5),
        orders: myOrders.filter(o =>
            o.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
            (o.userName && o.userName.toLowerCase().includes(globalSearch.toLowerCase()))
        ).slice(0, 5)
    };

    const hasResults = globalSearch.length > 0 && (searchResults.meds.length > 0 || searchResults.patients.length > 0 || searchResults.orders.length > 0);

    // --- Billing Logic ---
    const calculateTotals = () => {
        const subtotal = billing.currentItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const tax = subtotal * (storeSettings.taxRate / 100);
        setBilling(prev => ({ ...prev, subtotal, tax, total: subtotal + tax }));
    };

    const addToBill = (medicine, qty = 1) => {
        const existing = billing.currentItems.find(i => i.id === medicine.id);
        const incomingQty = parseInt(qty) || 1;

        if (existing) {
            const updated = billing.currentItems.map(i =>
                i.id === medicine.id ? { ...i, qty: i.qty + incomingQty } : i
            );
            syncBillingTotals(updated);
        } else {
            const updated = [...billing.currentItems, { ...medicine, qty: incomingQty }];
            syncBillingTotals(updated);
        }
    };

    // Use a direct update instead of useEffect for simplicity in this demo structure
    const syncBillingTotals = (items) => {
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const tax = subtotal * (storeSettings.taxRate / 100);
        setBilling(prev => ({ ...prev, currentItems: items, subtotal, tax, total: subtotal + tax }));
    };

    const updateBillQty = (id, qty) => {
        const updated = billing.currentItems.map(i => i.id === id ? { ...i, qty: parseInt(qty) || 1 } : i);
        syncBillingTotals(updated);
    };

    const removeFromBill = (id) => {
        const updated = billing.currentItems.filter(i => i.id !== id);
        syncBillingTotals(updated);
    };

    const analyzeDigitalRX = (mode = 'digital') => {
        setIsAnalyzing(true);
        setRxAnalysisMode(mode);

        // Simulate more realistic analysis time and results
        setTimeout(() => {
            let detectedIds = [];
            let statusMsg = "";

            if (mode === 'digital') {
                detectedIds = [1, 3]; // Dolo and Augmentin
                statusMsg = "Digital Prescription Verified: 2 medications found.";
            } else {
                detectedIds = [2]; // Citrogin (OCR style detection)
                statusMsg = "Offline Prescription Scanned: Levocetirizine detected.";
            }

            let currentItems = [...billing.currentItems];
            let addedCount = 0;

            detectedIds.forEach(id => {
                const med = inventory.find(m => m.id === id);
                if (med && !currentItems.find(ci => ci.originalId === id)) {
                    currentItems.push({
                        ...med,
                        id: `${med.id}-strip`,
                        name: med.brandName,
                        saleType: 'strip',
                        price: med.price,
                        originalPrice: med.price,
                        originalId: med.id,
                        qty: 1
                    });
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                syncBillingTotals(currentItems);
                alert(statusMsg);
            } else {
                alert("Scan complete. Items are already in your cart or not in stock.");
            }

            setIsAnalyzing(false);
            setRxAnalysisMode(null);
        }, 1800);
    };


    const toggleAvailability = (orderId, index) => {
        setAvailableItems(prev => ({
            ...prev,
            [orderId]: {
                ...(prev[orderId] || {}),
                [index]: !prev[orderId]?.[index]
            }
        }));
    };

    const isAllAvailable = (order) => {
        const items = order.items || ['Amoxicillin 500mg', 'Paracetamol 650mg'];
        return items.every((_, i) => availableItems[order.id]?.[i]);
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            // real-time listener will update the list
        } catch (error) {
            console.error("Status update failed:", error);
            alert("Failed to update status.");
        }
    };

    const callDeliveryAgent = (orderId) => {
        alert(`Requesting delivery partner for Order ${orderId.slice(0, 8)}...`);
        setTimeout(() => {
            alert(`Partner Assigned! Agent 'Rajesh' is picking up the order.`);
            handleStatusUpdate(orderId, 'Preparing');
        }, 2000);
    };

    const handleCheckout = async () => {
        if (billing.currentItems.length === 0) return alert("Cart is empty!");
        setIsCheckoutLoading(true);

        // Record the order in the system
        const orderData = {
            storeId: user?.uid || user?.id,
            storeName: user?.name,
            patientName: billing.customerName || 'Walk-in Customer',
            customerMobile: billing.customerMobile,
            items: billing.currentItems.map(i => `${i.name} (${i.qty} ${i.saleType === 'strip' ? 'Strips' : 'Units'})`),
            total: billing.total,
            status: 'Delivered', // POS sales are usually immediate
            type: 'pos',
            date: new Date().toISOString()
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Place order in context (this updates localStorage and state)
        placeOrder(orderData);

        // Update Inventory with unit-level precision
        setInventory(prev => prev.map(item => {
            const billedItems = billing.currentItems.filter(i => i.originalId === item.id);
            if (billedItems.length === 0) return item;

            let totalUnitsToReduce = 0;
            billedItems.forEach(b => {
                if (b.saleType === 'strip') {
                    totalUnitsToReduce += b.qty;
                } else {
                    totalUnitsToReduce += b.qty / item.packSize;
                }
            });

            return { ...item, stock: Math.max(0, parseFloat((item.stock - totalUnitsToReduce).toFixed(2))) };
        }));

        setIsCheckoutLoading(false);
        setCheckoutSuccess(true);

        setTimeout(() => {
            setCheckoutSuccess(false);
            setBilling({
                currentItems: [], subtotal: 0, tax: 0, total: 0,
                customerName: '', customerMobile: '', linkedRx: null
            });
            // Switch to orders tab to show the success
            setActiveTab('orders');
        }, 2000);
    };

    const handleProfileUpdate = (e) => {
        if (e) e.preventDefault();
        setProfileMsg({ type: '', text: '' });

        const res = updateProfile(profileForm);
        if (res.success) {
            setProfileMsg({ type: 'success', text: 'Pharmacy profile updated successfully!' });
        } else {
            setProfileMsg({ type: 'error', text: res.message || 'Failed to update profile' });
        }
    };

    const simulateMapPicker = () => {
        const locs = ['17.4483° N, 78.3915° E', '17.3850° N, 78.4867° E'];
        const pick = locs[Math.floor(Math.random() * locs.length)];
        alert(`Google Maps Link Established!\nCoordinates: ${pick}`);
        updateProfile({ location: pick });
    };

    const simulateImgUpload = () => {
        const imgs = ['https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=400'];
        updateProfile({ image: imgs[0] });
        alert('Store storefront image updated!');
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Inter, sans-serif' }}>
            {/* Sidebar Navigation */}
            <div style={{
                width: '260px',
                backgroundColor: 'white',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                padding: '32px 20px',
                borderRight: '1px solid #f1f5f9',
                position: 'fixed',
                height: '100vh',
                zIndex: 100,
                left: 0,
                top: 0
            }}>
                {/* Branding */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', padding: '0 12px' }}>
                    <div style={{ padding: '8px', backgroundColor: '#10b981', borderRadius: '12px', color: 'white' }}>
                        <HeartPulse size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>vArogra</h1>
                        <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>Pharmacy Management</p>
                    </div>
                </div>

                {/* Nav Links */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <SidebarLink active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<TrendingUp size={18} />} label="Overview" />
                    <SidebarLink active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ShoppingBag size={18} />} label="Orders" />
                    <SidebarLink active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package size={18} />} label="Inventory" />
                    <SidebarLink active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} icon={<Receipt size={18} />} label="Smart POS" />
                    <SidebarLink active={activeTab === 'patients'} onClick={() => setActiveTab('patients')} icon={<Users size={18} />} label="Patients" />

                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', padding: '0 16px' }}>Account</p>
                        <SidebarLink active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={18} />} label="Profile" />
                        <SidebarLink active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="Settings" />
                    </div>
                </nav>

                {/* Footer Section */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={() => setActiveTab('billing')}
                        style={{
                            width: '100%',
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '14px',
                            borderRadius: '14px',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={18} /> New Prescription
                    </button>

                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.1)',
                            borderRadius: '12px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            fontWeight: '700',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                            e.currentTarget.style.color = '#ef4444';
                        }}
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{
                flex: 1,
                marginLeft: '260px',
                background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 40%, #eff6ff 100%)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <header style={{
                    height: '80px',
                    backgroundColor: 'white',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 40px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 90
                }}>
                    <div className="search-container" style={{ position: 'relative', width: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            placeholder="Search orders, patients, or medicine..."
                            value={globalSearch}
                            onChange={(e) => {
                                setGlobalSearch(e.target.value);
                                setShowSearchResults(true);
                            }}
                            onFocus={() => setShowSearchResults(true)}
                            style={{ ...inputStyle, width: '100%', paddingLeft: '48px', border: 'none', backgroundColor: '#f8fafc' }}
                        />

                        {/* Global Search Results Dropdown */}
                        <AnimatePresence>
                            {showSearchResults && hasResults && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        backgroundColor: 'white',
                                        borderRadius: '16px',
                                        marginTop: '12px',
                                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                                        border: '1px solid #f1f5f9',
                                        zIndex: 1000,
                                        overflow: 'hidden',
                                        maxHeight: '400px',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <div style={{ padding: '12px', overflowY: 'auto' }}>
                                        {searchResults.meds.length > 0 && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <p style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', padding: '0 12px 8px' }}>Medications</p>
                                                {searchResults.meds.map(med => (
                                                    <div
                                                        key={`med-${med.id}`}
                                                        onClick={() => {
                                                            setActiveTab('inventory');
                                                            setInventorySearch(med.brandName);
                                                            setShowSearchResults(false);
                                                            setGlobalSearch('');
                                                        }}
                                                        style={{ padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <div>
                                                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{med.brandName}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748b' }}>{med.genericName}</div>
                                                        </div>
                                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#10b981' }}>{storeSettings.currency}{med.price}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {searchResults.patients.length > 0 && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <p style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', padding: '0 12px 8px' }}>Patients</p>
                                                {searchResults.patients.map(p => (
                                                    <div
                                                        key={`pat-${p.id}`}
                                                        onClick={() => {
                                                            setActiveTab('patients');
                                                            setPatientSearch(p.name);
                                                            setShowSearchResults(false);
                                                            setGlobalSearch('');
                                                        }}
                                                        style={{ padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center' }}
                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>{p.name[0]}</div>
                                                        <div>
                                                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{p.name}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748b' }}>{p.mobile}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {searchResults.orders.length > 0 && (
                                            <div>
                                                <p style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', padding: '0 12px 8px' }}>Orders</p>
                                                {searchResults.orders.map(o => (
                                                    <div
                                                        key={`ord-${o.id}`}
                                                        onClick={() => {
                                                            setActiveTab('orders');
                                                            setFilter('all');
                                                            setShowSearchResults(false);
                                                            setGlobalSearch('');
                                                        }}
                                                        style={{ padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <div>
                                                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{o.id}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748b' }}>{o.userName || 'Unknown Patient'}</div>
                                                        </div>
                                                        <StatusBadge status={o.status} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fcfcfd', textAlign: 'center' }}>
                                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Showing top results for "{globalSearch}"</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ display: 'flex', gap: '16px', color: '#64748b' }}>
                            <motion.button whileHover={{ scale: 1.1 }} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                                <ShoppingBag size={20} />
                                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', border: '2px solid white' }} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                                <Receipt size={20} />
                            </motion.button>
                        </div>

                        <div style={{ height: '32px', width: '1px', backgroundColor: '#f1f5f9' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{user?.name || 'Dr. Sarah Chen'}</p>
                                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Chief Pharmacist</p>
                            </div>
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Sarah'}`}
                                alt="Profile"
                                style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f1f5f9' }}
                            />
                        </div>
                    </div>
                </header>

                <main style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                style={{ display: 'grid', gap: '32px' }}
                            >
                                {/* KPI Strip */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                                    <div style={premiumCard}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <div style={{ padding: '10px', backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: '12px' }}><DollarSign size={20} /></div>
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', backgroundColor: '#f0fdf4', padding: '4px 8px', borderRadius: '8px', height: 'fit-content' }}>+12.5%</span>
                                        </div>
                                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Today's Revenue</p>
                                        <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                                            {storeSettings.currency}{myOrders.filter(o => new Date(o.createdAt?.seconds * 1000 || o.date).toDateString() === new Date().toDateString()).reduce((a, c) => a + (c.total || 0), 0).toFixed(2)}
                                        </h3>
                                    </div>
                                    <div style={premiumCard}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <div style={{ padding: '10px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '12px' }}><ShoppingBag size={20} /></div>
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6', backgroundColor: '#f0f9ff', padding: '4px 8px', borderRadius: '8px', height: 'fit-content' }}>+8%</span>
                                        </div>
                                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Total Orders</p>
                                        <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{myOrders.length}</h3>
                                    </div>
                                    <div style={premiumCard}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <div style={{ padding: '10px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '12px' }}><Package size={20} /></div>
                                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', backgroundColor: '#fff1f2', padding: '4px 8px', borderRadius: '8px', height: 'fit-content' }}>CRITICAL</span>
                                        </div>
                                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Stock Alerts</p>
                                        <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{inventory.filter(i => i.stock < storeSettings.lowStockAlert).length}</h3>
                                    </div>
                                    <div style={premiumCard}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <div style={{ padding: '10px', backgroundColor: '#f5f3ff', color: '#8b5cf6', borderRadius: '12px' }}><Users size={20} /></div>
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#8b5cf6', backgroundColor: '#f5f3ff', padding: '4px 8px', borderRadius: '8px', height: 'fit-content' }}>+42</span>
                                        </div>
                                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Active Customers</p>
                                        <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{patients.length}</h3>
                                    </div>
                                </div>

                                {/* Visual Split */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 340px', gap: '32px' }}>
                                    <div style={{ display: 'grid', gap: '32px' }}>
                                        {/* Chart Section */}
                                        <div style={{ ...premiumCard, minHeight: '340px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>Revenue Intelligence</h3>
                                                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>Real-time earnings trajectory</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f8fafc', padding: '4px', borderRadius: '12px' }}>
                                                    {['D', 'W', 'M'].map(t => (
                                                        <button
                                                            key={t}
                                                            onClick={() => setChartFilter(t)}
                                                            style={{
                                                                border: 'none',
                                                                background: chartFilter === t ? 'white' : 'transparent',
                                                                color: chartFilter === t ? '#10b981' : '#64748b',
                                                                padding: '6px 14px',
                                                                borderRadius: '9px',
                                                                fontSize: '12px',
                                                                fontWeight: '700',
                                                                cursor: 'pointer',
                                                                boxShadow: chartFilter === t ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            {t === 'D' ? 'Day' : t === 'W' ? 'Week' : 'Month'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ flex: 1, marginBottom: '20px', paddingBottom: '10px' }}>
                                                <AnimatePresence mode="wait">
                                                    <motion.div
                                                        key={chartFilter}
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        transition={{ duration: 0.3 }}
                                                        style={{ height: '100%', width: '100%', minHeight: '220px' }}
                                                    >
                                                        <RevenueChart data={currentData.data} labels={currentData.labels} currency={storeSettings.currency} />
                                                    </motion.div>
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        {/* Table Section */}
                                        <div style={premiumCard}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>Recent Prescription Orders</h3>
                                                <button
                                                    onClick={() => setActiveTab('orders')}
                                                    style={{ color: '#10b981', fontSize: '13px', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}
                                                >
                                                    View Archives
                                                </button>
                                            </div>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ ...thStyle, paddingLeft: 0 }}>PATIENT</th>
                                                        <th style={thStyle}>MEDICATION</th>
                                                        <th style={thStyle}>STATUS</th>
                                                        <th style={{ ...thStyle, paddingRight: 0, textAlign: 'right' }}>AMOUNT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {myOrders.slice(0, 5).map((order) => (
                                                        <tr key={order.id}>
                                                            <td style={{ ...tdStyle, paddingLeft: 0 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#64748b' }}>
                                                                        {(order.userName || order.patientName || 'P')[0]}
                                                                    </div>
                                                                    <span style={{ fontWeight: '700' }}>{order.userName || order.patientName || 'Unknown Patient'}</span>
                                                                </div>
                                                            </td>
                                                            <td style={tdStyle}>
                                                                <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {Array.isArray(order.items) ? order.items.join(', ') : (order.medication || 'Check Order')}
                                                                </div>
                                                            </td>
                                                            <td style={tdStyle}>
                                                                <StatusBadge status={order.status} />
                                                            </td>
                                                            <td style={{ ...tdStyle, paddingRight: 0, textAlign: 'right', fontWeight: '800' }}>
                                                                {storeSettings.currency}{(order.total || 0).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {myOrders.length === 0 && (
                                                        <tr>
                                                            <td colSpan="4" style={{ ...tdStyle, textAlign: 'center', opacity: 0.5, padding: '40px' }}>
                                                                No recent prescription orders found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Sidebar Right */}
                                    <div style={{ display: 'grid', gap: '32px', alignContent: 'start' }}>
                                        <div style={{ ...premiumCard, border: '1px solid #fee2e2', backgroundColor: '#fffafb' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                                <Package size={18} style={{ color: '#ef4444' }} />
                                                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ef4444' }}>Critical Stock</h3>
                                            </div>
                                            <div style={{ display: 'grid', gap: '12px' }}>
                                                {inventory.filter(i => i.stock < 20).map((item, i) => (
                                                    <div key={i} style={{ padding: '14px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #fee2e2' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: '700' }}>{item.brandName}</span>
                                                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#ef4444' }}>{item.stock} left</span>
                                                        </div>
                                                        <div style={{ height: '4px', width: '100%', backgroundColor: '#fef2f2', borderRadius: '2px' }}>
                                                            <div style={{ height: '100%', width: `${(item.stock / 20) * 100}%`, backgroundColor: '#ef4444', borderRadius: '2px' }} />
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={handleRestockAll}
                                                    style={{ marginTop: '8px', padding: '12px', width: '100%', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                                                >
                                                    Restock Inventory
                                                </button>
                                            </div>
                                        </div>

                                        <div style={premiumCard}>
                                            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }}>Operational Checklist</h3>
                                            <div style={{ display: 'grid', gap: '16px' }}>
                                                {checklist.map((task) => (
                                                    <div key={task.id}
                                                        onClick={() => toggleChecklistTask(task.id)}
                                                        style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}
                                                    >
                                                        <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: task.d ? '#10b981' : 'transparent', borderColor: task.d ? '#10b981' : '#e2e8f0' }}>
                                                            {task.d && <CheckCircle size={14} color="white" />}
                                                        </div>
                                                        <span style={{ fontSize: '13px', fontWeight: '600', color: task.d ? '#94a3b8' : '#334155', textDecoration: task.d ? 'line-through' : 'none' }}>{task.l}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'orders' && (
                            <motion.div
                                key="orders"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                style={{ display: 'grid', gap: '32px' }}
                            >
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                                    <StatCard icon={<ShoppingBag />} title="Total Orders" value={myOrders.length} variant="info" />
                                    <StatCard icon={<TrendingUp />} title="Revenue" value={`${storeSettings.currency}${myOrders.reduce((a, c) => a + (c.total || 0), 0).toFixed(2)}`} variant="success" />
                                    <StatCard icon={<Clock />} title="Pending Action" value={myOrders.filter(o => o.status === 'Confirmed').length} variant="warning" />
                                </div>

                                <div style={premiumCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Order Stream</h3>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {['All', 'Confirmed', 'Preparing', 'Delivered'].map(s => (
                                                <button key={s} onClick={() => setFilter(s.toLowerCase())} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #f1f5f9', background: filter === s.toLowerCase() ? '#10b981' : 'white', color: filter === s.toLowerCase() ? 'white' : '#64748b', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>{s}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gap: '20px' }}>
                                        {myOrders.filter(o => filter === 'all' || o.status.toLowerCase() === filter).map(order => (
                                            <div key={order.id} style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                    <div style={{ width: '48px', height: '48px', backgroundColor: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><ShoppingBag size={24} /></div>
                                                    <div>
                                                        <p style={{ fontWeight: '800', fontSize: '16px' }}>Order #{order.id.slice(-6).toUpperCase()}</p>
                                                        <p style={{ fontSize: '13px', color: '#64748b' }}>{order.userName || order.patientName} • {Array.isArray(order.items) ? order.items.length : 1} Items</p>
                                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                            {order.status === 'pending' && <button onClick={() => handleStatusUpdate(order.id, 'Confirmed')} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>ACCEPT</button>}
                                                            {order.status === 'Confirmed' && <button onClick={() => callDeliveryAgent(order.id)} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={12} /> CALL AGENT</button>}
                                                            {order.status === 'Preparing' && <button onClick={() => handleStatusUpdate(order.id, 'Out for delivery')} style={{ padding: '6px 12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>DISPATCH</button>}
                                                            {order.status === 'Out for delivery' && <button onClick={() => handleStatusUpdate(order.id, 'Delivered')} style={{ padding: '6px 12px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>COMPLETE</button>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontWeight: '800', fontSize: '18px', color: '#0f172a', marginBottom: '4px' }}>{storeSettings.currency}{order.total?.toFixed(2)}</p>
                                                    <StatusBadge status={order.status} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'inventory' && (
                            <motion.div
                                key="inventory"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                style={{ display: 'grid', gap: '32px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ position: 'relative', width: '400px' }}>
                                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input
                                            placeholder="Search stock by name, category..."
                                            value={inventorySearch}
                                            onChange={e => setInventorySearch(e.target.value)}
                                            style={{ ...inputStyle, width: '100%', paddingLeft: '48px' }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingItem(null);
                                            setInvForm({ brandName: '', genericName: '', saltComposition: '', category: 'Analgesic', price: '', stock: '', packSize: '', form: 'Tablet', rx: false });
                                            setShowInvModal(true);
                                        }}
                                        style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                    ><Plus size={18} /> Add New Entry</button>
                                </div>

                                <div style={premiumCard}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ ...thStyle, paddingLeft: 0 }}>ITEM NAME</th>
                                                <th style={thStyle}>CATEGORY</th>
                                                <th style={thStyle}>STOCK LEVEL</th>
                                                <th style={thStyle}>UNIT PRICE</th>
                                                <th style={{ ...thStyle, paddingRight: 0, textAlign: 'right' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventory.filter(item =>
                                                item.brandName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                                                item.category.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                                                item.genericName.toLowerCase().includes(inventorySearch.toLowerCase())
                                            ).map(item => (
                                                <tr key={item.id}>
                                                    <td style={{ ...tdStyle, paddingLeft: 0 }}>
                                                        <div style={{ fontWeight: '700' }}>{item.brandName}</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>{item.genericName}</div>
                                                        {item.rx && <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: '800', marginTop: '2px' }}>RX REQUIRED</div>}
                                                    </td>
                                                    <td style={tdStyle}>{item.category}</td>
                                                    <td style={tdStyle}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ height: '6px', width: '60px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', width: `${Math.min((item.stock / 120) * 100, 100)}%`, backgroundColor: item.stock < 20 ? '#ef4444' : '#10b981' }} />
                                                            </div>
                                                            <span style={{ fontWeight: '700', color: item.stock < 20 ? '#ef4444' : '#0f172a' }}>{item.stock}</span>
                                                        </div>
                                                    </td>
                                                    <td style={tdStyle}>{storeSettings.currency}{parseFloat(item.price).toFixed(2)}</td>
                                                    <td style={{ ...tdStyle, paddingRight: 0, textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                            <button style={iconBtnStyle} onClick={() => { setSelectedMed(item); setActiveTab('billing'); }} title="Add to POS"><Plus size={16} /></button>
                                                            <button style={iconBtnStyle} onClick={() => openEditModal(item)} title="Edit Item"><Edit size={16} /></button>
                                                            <button style={{ ...iconBtnStyle, color: '#ef4444' }} onClick={() => deleteInvItem(item.id)} title="Delete Item"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'billing' && (
                            <motion.div
                                key="billing"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}
                            >
                                <div style={{ display: 'grid', gap: '32px' }}>
                                    <div style={premiumCard}>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px' }}>Smart Checkout</h3>
                                        <div style={{ position: 'relative', marginBottom: '32px' }}>
                                            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input
                                                placeholder="Search by Brand, Generic Name, or Salt..."
                                                value={billSearch}
                                                onChange={e => setBillSearch(e.target.value)}
                                                style={{ ...inputStyle, width: '100%', paddingLeft: '52px', height: '56px', fontSize: '16px', border: '2px solid #f1f5f9' }}
                                            />
                                            <AnimatePresence>
                                                {billSearch && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        style={{ position: 'absolute', top: '70px', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 10, overflow: 'hidden' }}
                                                    >
                                                        {inventory.filter(m =>
                                                            m.brandName.toLowerCase().includes(billSearch.toLowerCase()) ||
                                                            m.genericName.toLowerCase().includes(billSearch.toLowerCase()) ||
                                                            m.saltComposition.toLowerCase().includes(billSearch.toLowerCase())
                                                        ).map(m => (
                                                            <button
                                                                key={m.id}
                                                                onClick={() => {
                                                                    setSelectedMed(m);
                                                                    setSaleType('strip');
                                                                    setPosQty(1);
                                                                    setBillSearch('');
                                                                }}
                                                                style={{ width: '100%', padding: '16px', border: 'none', background: 'none', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}
                                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            >
                                                                <div>
                                                                    <p style={{ fontWeight: '700', fontSize: '14px' }}>{m.brandName}</p>
                                                                    <p style={{ fontSize: '12px', color: '#64748b' }}>{m.genericName} • {m.form}</p>
                                                                    <p style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>{m.saltComposition}</p>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <p style={{ fontWeight: '800', color: '#10b981' }}>{storeSettings.currency}{m.price.toFixed(2)}</p>
                                                                    <span style={{ fontSize: '11px', fontWeight: '700', color: m.stock < 10 ? '#ef4444' : '#64748b' }}>Stock: {m.stock}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div style={{ display: 'grid', gap: '16px' }}>
                                            {selectedMed ? (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    style={{ ...premiumCard, border: '2px solid #10b981', backgroundColor: '#f0fdf4' }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                                        <div>
                                                            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#065f46' }}>{selectedMed.brandName}</h4>
                                                            <p style={{ fontSize: '13px', color: '#047857' }}>{selectedMed.genericName} • {selectedMed.saltComposition}</p>
                                                        </div>
                                                        <button onClick={() => setSelectedMed(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><Trash2 size={20} /></button>
                                                    </div>

                                                    <div style={{ display: 'grid', gap: '20px' }}>
                                                        {selectedMed.form === 'Tablet' || selectedMed.form === 'Capsule' ? (
                                                            <div>
                                                                <label style={{ fontSize: '11px', fontWeight: '800', color: '#059669', display: 'block', marginBottom: '8px' }}>SALE TYPE</label>
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    {['strip', 'single'].map(type => (
                                                                        <button
                                                                            key={type}
                                                                            onClick={() => setSaleType(type)}
                                                                            style={{
                                                                                flex: 1,
                                                                                padding: '10px',
                                                                                borderRadius: '10px',
                                                                                border: '1px solid',
                                                                                borderColor: saleType === type ? '#10b981' : '#d1fae5',
                                                                                backgroundColor: saleType === type ? '#10b981' : 'white',
                                                                                color: saleType === type ? 'white' : '#065f46',
                                                                                fontSize: '13px',
                                                                                fontWeight: '700',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            {type === 'strip' ? 'Full Strip' : 'Single Tablet'}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <label style={{ fontSize: '11px', fontWeight: '800', color: '#059669', display: 'block', marginBottom: '8px' }}>SALE TYPE</label>
                                                                <div style={{ padding: '10px', borderRadius: '10px', border: '1px solid #d1fae5', backgroundColor: 'white', color: '#065f46', fontSize: '13px', fontWeight: '700' }}>
                                                                    Full Bottle / Unit
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <label style={{ fontSize: '11px', fontWeight: '800', color: '#059669', display: 'block', marginBottom: '4px' }}>PRICE</label>
                                                                <p style={{ fontSize: '20px', fontWeight: '900', color: '#065f46' }}>
                                                                    {storeSettings.currency}{(saleType === 'single' ? (selectedMed.price / selectedMed.packSize) : selectedMed.price).toFixed(2)}
                                                                    <span style={{ fontSize: '12px', opacity: 0.6, fontWeight: '700' }}> / {saleType === 'single' ? 'tab' : 'strip'}</span>
                                                                </p>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <label style={{ fontSize: '11px', fontWeight: '800', color: '#059669', display: 'block', marginBottom: '8px' }}>QUANTITY</label>
                                                                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #d1fae5', borderRadius: '10px', padding: '4px' }}>
                                                                    <button onClick={() => setPosQty(Math.max(1, posQty - 1))} style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '800' }}>-</button>
                                                                    <span style={{ width: '40px', textAlign: 'center', fontWeight: '900', color: '#065f46' }}>{posQty}</span>
                                                                    <button onClick={() => setPosQty(posQty + 1)} style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '800' }}>+</button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {posQty > (saleType === 'strip' ? selectedMed.stock : selectedMed.stock * selectedMed.packSize) && (
                                                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '12px', color: '#ef4444', fontWeight: '800' }}>⚠️ Insufficient Stock!</motion.p>
                                                        )}

                                                        <button
                                                            disabled={posQty > (saleType === 'strip' ? selectedMed.stock : selectedMed.stock * selectedMed.packSize)}
                                                            onClick={() => {
                                                                const itemPrice = saleType === 'single' ? (selectedMed.price / selectedMed.packSize) : selectedMed.price;
                                                                addToBill({
                                                                    ...selectedMed,
                                                                    id: `${selectedMed.id}-${saleType}`,
                                                                    name: selectedMed.brandName,
                                                                    saleType,
                                                                    price: itemPrice,
                                                                    originalPrice: selectedMed.price,
                                                                    originalId: selectedMed.id
                                                                }, posQty);
                                                                setSelectedMed(null);
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                padding: '16px',
                                                                backgroundColor: '#10b981',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '14px',
                                                                fontWeight: '800',
                                                                cursor: 'pointer',
                                                                opacity: posQty > (saleType === 'strip' ? selectedMed.stock : selectedMed.stock * selectedMed.packSize) ? 0.5 : 1
                                                            }}
                                                        >
                                                            Add to Checkout Order
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <div style={{ padding: '60px', textAlign: 'center', opacity: 0.5, backgroundColor: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                                                    <Search size={48} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
                                                    <p style={{ fontWeight: '600' }}>Search and select a medicine</p>
                                                    <p style={{ fontSize: '13px' }}>Configure sale type and quantity here</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: '32px', alignContent: 'start' }}>
                                    <div style={{ ...premiumCard, backgroundColor: '#0f172a', color: 'white' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', color: 'white' }}>Current Checkout Order</h3>
                                        <div style={{ display: 'grid', gap: '12px', maxHeight: '400px', overflowY: 'auto', marginBottom: '32px', paddingRight: '8px' }}>
                                            {billing.currentItems.length > 0 ? (
                                                billing.currentItems.map(item => (
                                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155' }}>
                                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                            <div style={{ width: '40px', height: '40px', backgroundColor: '#334155', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><ShoppingBag size={20} /></div>
                                                            <div>
                                                                <p style={{ fontWeight: '700', fontSize: '14px', color: 'white' }}>{item.name}</p>
                                                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>{item.saleType === 'strip' ? 'Full Strip' : 'Single Tablet'} • {storeSettings.currency}{item.price.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: '10px', padding: '4px', border: '1px solid #334155' }}>
                                                                <button onClick={() => updateBillQty(item.id, item.qty - 1)} style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px', color: 'white' }}>-</button>
                                                                <span style={{ width: '30px', textAlign: 'center', fontWeight: '800', fontSize: '14px', color: 'white' }}>{item.qty}</span>
                                                                <button onClick={() => updateBillQty(item.id, item.qty + 1)} style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px', color: 'white' }}>+</button>
                                                            </div>
                                                            <p style={{ width: '80px', textAlign: 'right', fontWeight: '800', fontSize: '16px', color: '#10b981' }}>{storeSettings.currency}{(item.price * item.qty).toFixed(2)}</p>
                                                            <button onClick={() => removeFromBill(item.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                                                    <p style={{ fontWeight: '600', fontSize: '14px', color: '#94a3b8' }}>Add items to see checkout summary</p>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Patient Identification</label>
                                            <div style={{ display: 'grid', gap: '12px' }}>
                                                <input
                                                    placeholder="Patient Name"
                                                    value={billing.customerName}
                                                    onChange={e => setBilling({ ...billing, customerName: e.target.value })}
                                                    style={{ ...billInputStyle, backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white' }}
                                                />
                                                <input
                                                    placeholder="Phone Number"
                                                    value={billing.customerMobile}
                                                    onChange={e => setBilling({ ...billing, customerMobile: e.target.value })}
                                                    style={{ ...billInputStyle, backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white' }}
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#94a3b8' }}>
                                                    <span>Subtotal</span>
                                                    <span>{storeSettings.currency}{billing.subtotal.toFixed(2)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#94a3b8' }}>
                                                    <span>GST ({storeSettings.taxRate}%)</span>
                                                    <span>{storeSettings.currency}{billing.tax.toFixed(2)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: '900', color: 'white', marginTop: '12px' }}>
                                                    <span>Total</span>
                                                    <span>{storeSettings.currency}{billing.total.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleCheckout}
                                                disabled={isCheckoutLoading || checkoutSuccess || billing.currentItems.length === 0}
                                                style={{
                                                    width: '100%',
                                                    padding: '20px',
                                                    backgroundColor: checkoutSuccess ? '#10b981' : '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '16px',
                                                    fontWeight: '800',
                                                    fontSize: '16px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '12px',
                                                    marginTop: '8px',
                                                    opacity: (isCheckoutLoading || billing.currentItems.length === 0) ? 0.7 : 1
                                                }}
                                            >
                                                {isCheckoutLoading ? (
                                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                                                ) : checkoutSuccess ? (
                                                    <><CheckCircle size={24} /> Order Completed</>
                                                ) : (
                                                    <><Printer size={20} /> Complete & Print Invoice</>
                                                )}
                                            </button>
                                        </div>

                                        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', border: '1px solid #e5e7eb', marginTop: '32px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: '#1e293b' }}>AI Rx Analysis</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <button
                                                    disabled={isAnalyzing}
                                                    onClick={() => analyzeDigitalRX('offline')}
                                                    style={{ padding: '16px', borderRadius: '14px', border: '1px solid #e5e7eb', backgroundColor: rxAnalysisMode === 'offline' ? '#eef2ff' : '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: isAnalyzing ? 0.6 : 1 }}
                                                >
                                                    {isAnalyzing && rxAnalysisMode === 'offline' ? (
                                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><ScanLine size={24} color="#6366f1" /></motion.div>
                                                    ) : <ScanLine size={24} color="#6366f1" />}
                                                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#6366f1' }}>{isAnalyzing && rxAnalysisMode === 'offline' ? 'SCANNING...' : 'OFFLINE'}</span>
                                                </button>
                                                <button
                                                    disabled={isAnalyzing}
                                                    onClick={() => analyzeDigitalRX('digital')}
                                                    style={{ padding: '16px', borderRadius: '14px', border: '1px solid #e5e7eb', backgroundColor: rxAnalysisMode === 'digital' ? '#f0fdf4' : '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: isAnalyzing ? 0.6 : 1 }}
                                                >
                                                    {isAnalyzing && rxAnalysisMode === 'digital' ? (
                                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Eye size={24} color="#10b981" /></motion.div>
                                                    ) : <Eye size={24} color="#10b981" />}
                                                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#10b981' }}>{isAnalyzing && rxAnalysisMode === 'digital' ? 'ANALYZING...' : 'DIGITAL AI'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'patients' && (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} key="patients">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                        <input
                                            placeholder="Search patients by name or phone..."
                                            value={patientSearch}
                                            onChange={e => setPatientSearch(e.target.value)}
                                            style={{ ...inputStyle, paddingLeft: '48px', width: '100%' }}
                                        />
                                    </div>
                                    <Button onClick={() => setShowPatientModal(true)}><Plus size={18} style={{ marginRight: '8px' }} /> New Patient Registration</Button>
                                </div>

                                <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #f3f4f6' }}>
                                                <th style={thStyle}>PATIENT</th>
                                                <th style={thStyle}>CONTACT</th>
                                                <th style={thStyle}>LAST VISIT</th>
                                                <th style={thStyle}>TOTAL SPENT</th>
                                                <th style={thStyle}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {patients.filter(p =>
                                                p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                                                p.mobile.includes(patientSearch)
                                            ).map(p => (
                                                <tr key={p.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                                    <td style={tdStyle}>
                                                        <div style={{ fontWeight: '700', color: '#111827' }}>{p.name}</div>
                                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {p.id} {p.age ? `• ${p.age}Y` : ''}</div>
                                                    </td>
                                                    <td style={tdStyle}>{p.mobile}</td>
                                                    <td style={tdStyle}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Clock size={14} color="#9ca3af" />
                                                            {p.history[0]?.date || 'New Patient'}
                                                        </div>
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <span style={{ fontWeight: '700', color: '#10b981' }}>{storeSettings.currency}{p.history.reduce((acc, curr) => acc + curr.total, 0)}</span>
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <button
                                                            style={iconBtnStyle}
                                                            onClick={() => {
                                                                setSelectedPatient(p);
                                                                setShowHistoryModal(true);
                                                            }}
                                                            title="View Visit History"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '40px' }}
                            >
                                <div style={premiumCard}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '32px', color: '#0f172a' }}>Pharmacy Establishment Details</h3>
                                    <div style={{ display: 'grid', gap: '24px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                            <div>
                                                <label style={labelStyle}>PHARMACY NAME</label>
                                                <input value={profileForm.storeName} onChange={e => setProfileForm({ ...profileForm, storeName: e.target.value })} style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>CHIEF PHARMACIST</label>
                                                <input value={profileForm.inChargeName} onChange={e => setProfileForm({ ...profileForm, inChargeName: e.target.value })} style={inputStyle} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>REGISTERED OPERATIONAL ADDRESS</label>
                                            <input value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                            <div>
                                                <label style={labelStyle}>DRUG LICENSE NO</label>
                                                <input value={profileForm.licenseNo} onChange={e => setProfileForm({ ...profileForm, licenseNo: e.target.value })} style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>GSTIN / TAX ID</label>
                                                <input value={profileForm.gstNo} onChange={e => setProfileForm({ ...profileForm, gstNo: e.target.value })} style={inputStyle} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                            <div>
                                                <label style={labelStyle}>CONTACT HEADLINE</label>
                                                <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>FOUNDING YEAR</label>
                                                <input value={profileForm.foundedYear} onChange={e => setProfileForm({ ...profileForm, foundedYear: e.target.value })} style={inputStyle} />
                                            </div>
                                        </div>
                                        <button onClick={handleProfileUpdate} style={{ width: 'fit-content', padding: '14px 32px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', marginTop: '16px', cursor: 'pointer' }}>Update Digital Credentials</button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: '32px', alignContent: 'start' }}>
                                    <div style={{ ...premiumCard, textAlign: 'center' }}>
                                        <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 24px' }}>
                                            <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${profileForm.storeName}`} style={{ width: '100%', height: '100%', borderRadius: '24px', backgroundColor: '#f1f5f9' }} alt="Store" />
                                            <button style={{ position: 'absolute', bottom: '-8px', right: '-8px', width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#10b981', color: 'white', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={simulateImgUpload}><Camera size={16} /></button>
                                        </div>
                                        <h4 style={{ fontWeight: '800', fontSize: '18px' }}>{profileForm.storeName}</h4>
                                        <p style={{ fontSize: '13px', color: '#64748b' }}>Verified Medical Establishment</p>
                                    </div>
                                    <div style={{ ...premiumCard, backgroundColor: '#fef2f2', border: '1px solid #fee2e2' }}>
                                        <h4 style={{ fontWeight: '800', color: '#ef4444', marginBottom: '8px' }}>Danger Zone</h4>
                                        <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '20px', opacity: 0.8 }}>Closing your pharmacy account is permanent and cannot be undone.</p>
                                        <button style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #fee2e2', background: 'white', color: '#ef4444', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Deactivate Store</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'settings' && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '40px' }}
                            >
                                <div style={premiumCard}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '32px', color: '#0f172a' }}>Store Configurations</h3>

                                    <div style={{ display: 'grid', gap: '32px' }}>
                                        <section>
                                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#64748b', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Defaults</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                                <div>
                                                    <label style={labelStyle}>BASE CURRENCY</label>
                                                    <select value={storeSettings.currency} onChange={e => setStoreSettings({ ...storeSettings, currency: e.target.value })} style={inputStyle}>
                                                        <option value="₹">INR (₹)</option>
                                                        <option value="$">USD ($)</option>
                                                        <option value="£">GBP (£)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>TAX RATE (GST %)</label>
                                                    <input type="number" value={storeSettings.taxRate} onChange={e => setStoreSettings({ ...storeSettings, taxRate: e.target.value })} style={inputStyle} />
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#64748b', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>POS Operations</h4>
                                            <div style={{ display: 'grid', gap: '20px' }}>
                                                <div>
                                                    <label style={labelStyle}>RECEIPT FOOTER TEXT</label>
                                                    <textarea
                                                        value={storeSettings.thermalFooter}
                                                        onChange={e => setStoreSettings({ ...storeSettings, thermalFooter: e.target.value })}
                                                        style={{ ...inputStyle, minHeight: '80px', resize: 'none', paddingTop: '12px' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '14px' }}>
                                                    <div>
                                                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Fast Checkout Mode</p>
                                                        <p style={{ fontSize: '11px', color: '#64748b' }}>Skip confirmation and print instantly</p>
                                                    </div>
                                                    <input type="checkbox" checked={storeSettings.fastCheckout} onChange={e => setStoreSettings({ ...storeSettings, fastCheckout: e.target.checked })} style={{ width: '20px', height: '20px', accentColor: '#10b981' }} />
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#64748b', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Logic</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '14px' }}>
                                                <div>
                                                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Low Stock Threshold</p>
                                                    <p style={{ fontSize: '11px', color: '#64748b' }}>Alert when stock drops below {storeSettings.lowStockAlert} units</p>
                                                </div>
                                                <input type="number" value={storeSettings.lowStockAlert} onChange={e => setStoreSettings({ ...storeSettings, lowStockAlert: e.target.value })} style={{ ...inputStyle, width: '80px', textAlign: 'center' }} />
                                            </div>
                                        </section>

                                        <button onClick={() => alert("Settings optimized and persisted!")} style={{ width: 'fit-content', padding: '14px 32px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Apply Global Settings</button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: '32px', alignContent: 'start' }}>
                                    <div style={premiumCard}>
                                        <h4 style={{ fontWeight: '800', fontSize: '16px', marginBottom: '16px' }}>System Health</h4>
                                        <div style={{ display: 'grid', gap: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ color: '#64748b' }}>API Status</span>
                                                <span style={{ color: '#10b981', fontWeight: '700' }}>Operational</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ color: '#64748b' }}>Database Latency</span>
                                                <span style={{ color: '#10b981', fontWeight: '700' }}>24ms</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ color: '#64748b' }}>Version</span>
                                                <span style={{ fontWeight: '700' }}>v4.2.1-stable</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ ...premiumCard, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
                                        <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.1)', width: 'fit-content', borderRadius: '12px', marginBottom: '16px' }}><Shield size={20} /></div>
                                        <h4 style={{ fontWeight: '800', fontSize: '16px', marginBottom: '8px' }}>Advanced Security</h4>
                                        <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '16px' }}>Two-factor authentication and session logging enabled for your pharmacy.</p>
                                        <button style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Manage Access</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={logout}
            />

            <AnimatePresence>
                {showHistoryModal && selectedPatient && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            style={{ backgroundColor: 'white', borderRadius: '28px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' }}
                        >
                            <div style={{ padding: '40px 40px 24px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Patient History</h3>
                                        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>{selectedPatient.name} • {selectedPatient.id}</p>
                                    </div>
                                    <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
                                </div>
                            </div>

                            <div style={{ padding: '24px 40px 40px', overflowY: 'auto', flex: 1 }}>
                                {selectedPatient.history && selectedPatient.history.length > 0 ? (
                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        {selectedPatient.history.map((visit) => (
                                            <div key={visit.id} style={{ padding: '20px', borderRadius: '18px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Visit Date</div>
                                                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{visit.date}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Invoice</div>
                                                        <div style={{ fontWeight: '700', color: '#10b981' }}>#{visit.id}</div>
                                                    </div>
                                                </div>
                                                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '12px' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Medications Purchased</div>
                                                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>{visit.items}</p>
                                                </div>
                                                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Total Transaction Value:</span>
                                                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>{storeSettings.currency}{visit.total}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                        <div style={{ width: '64px', height: '64px', backgroundColor: '#f1f5f9', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#94a3b8' }}>
                                            <Clock size={32} />
                                        </div>
                                        <h4 style={{ fontWeight: '700', color: '#1e293b' }}>No Purchase History</h4>
                                        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>This patient hasn't made any purchases yet.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                {showPatientModal && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            style={{ backgroundColor: 'white', borderRadius: '28px', width: '100%', maxWidth: '500px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>New Patient Entry</h3>
                                <button onClick={() => setShowPatientModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
                            </div>

                            <form onSubmit={handleSavePatient} style={{ display: 'grid', gap: '20px' }}>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>FULL NAME*</label>
                                    <input
                                        value={patientForm.name}
                                        onChange={e => setPatientForm({ ...patientForm, name: e.target.value })}
                                        placeholder="e.g. Rahul Sharma"
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>CONTACT NUMBER*</label>
                                    <input
                                        value={patientForm.mobile}
                                        onChange={e => setPatientForm({ ...patientForm, mobile: e.target.value })}
                                        placeholder="10-digit mobile"
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>AGE</label>
                                        <input
                                            type="number"
                                            value={patientForm.age}
                                            onChange={e => setPatientForm({ ...patientForm, age: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>GENDER</label>
                                        <select
                                            value={patientForm.gender}
                                            onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}
                                            style={inputStyle}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    style={{ width: '100%', padding: '16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '700', fontSize: '16px', marginTop: '16px', cursor: 'pointer' }}
                                >
                                    Register Patient
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showInvModal && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            style={{ backgroundColor: 'white', borderRadius: '28px', width: '100%', maxWidth: '600px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{editingItem ? 'Edit Medication' : 'Add New Medication'}</h3>
                                <button onClick={() => setShowInvModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
                            </div>

                            <form onSubmit={handleSaveInv} style={{ display: 'grid', gap: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>BRAND NAME*</label>
                                        <input
                                            value={invForm.brandName}
                                            onChange={e => setInvForm({ ...invForm, brandName: e.target.value })}
                                            placeholder="e.g. Dolo 650"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>GENERIC NAME</label>
                                        <input
                                            value={invForm.genericName}
                                            onChange={e => setInvForm({ ...invForm, genericName: e.target.value })}
                                            placeholder="e.g. Paracetamol"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: '8px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>SALT COMPOSITION</label>
                                    <input
                                        value={invForm.saltComposition}
                                        onChange={e => setInvForm({ ...invForm, saltComposition: e.target.value })}
                                        placeholder="e.g. Paracetamol 650mg IP"
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>CATEGORY</label>
                                        <select
                                            value={invForm.category}
                                            onChange={e => setInvForm({ ...invForm, category: e.target.value })}
                                            style={inputStyle}
                                        >
                                            {['Analgesic', 'Antihistamine', 'Antibiotic', 'Cough Syrup', 'Antidiabetic', 'Supplements'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        <label style={labelStyle}>UNIT PRICE ({storeSettings.currency})*</label>
                                        <input
                                            type="number" step="0.01"
                                            value={invForm.price}
                                            onChange={e => setInvForm({ ...invForm, price: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>STOCK (STRIPS)*</label>
                                        <input
                                            type="number"
                                            value={invForm.stock}
                                            onChange={e => setInvForm({ ...invForm, stock: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '14px', marginTop: '8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={invForm.rx}
                                        onChange={e => setInvForm({ ...invForm, rx: e.target.checked })}
                                        id="rxReq"
                                    />
                                    <label htmlFor="rxReq" style={{ fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>Prescription Required (Schedule H/H1)</label>
                                </div>

                                <button
                                    type="submit"
                                    style={{ width: '100%', padding: '16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '700', fontSize: '16px', marginTop: '16px', cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    {editingItem ? 'Update Medication' : 'Add Medication to Inventory'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default MedicalStoreDashboard;
