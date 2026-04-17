import React, { useState, useEffect } from 'react';
import {
    Search, Trash2, User, Mail, Stethoscope,
    Phone, Plus, X, Loader2, Eye, EyeOff,
    CheckCircle2, AlertCircle, Copy,
    UserPlus, XCircle, Users, Clock3, TriangleAlert, Filter, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../context/AuthContext';
import { createDoctorAccount } from '../../../firebase/auth';

// â”€â”€ Reusable form input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FormInput = ({ label, icon, rightIcon, ...props }) => (
    <div>
        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
        <div className="relative group">
            {icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors z-10">
                    {icon}
                </div>
            )}
            <input
                {...props}
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 ${icon ? 'pl-11' : 'pl-4'} ${rightIcon ? 'pr-11' : 'pr-4'} text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm`}
            />
            {rightIcon && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                    {rightIcon}
                </div>
            )}
        </div>
    </div>
);

// â”€â”€ Create Doctor Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CreateDoctorModal = ({ hospitalId, onClose, onCreated }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null); // { uid, tempPassword }
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const res = await createDoctorAccount(hospitalId, { name, email, department, phone });
            setResult(res);
            onCreated?.();
        } catch (err) {
            setError(
                err.code === 'auth/email-already-in-use'
                    ? 'A doctor with this email already exists.'
                    : err.message || 'Failed to create doctor account.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (result?.tempPassword) {
            navigator.clipboard.writeText(result.tempPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={result ? onClose : undefined}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            {/* Panel */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                            {result ? 'Doctor Created!' : 'Create Doctor Account'}
                        </h3>
                        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {result ? 'Share credentials with the doctor' : 'Doctor will receive login credentials'}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {/* â”€â”€ Success State â”€â”€ */}
                        {result ? (
                            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                                    <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="font-black text-emerald-800 text-sm">{name}</p>
                                        <p className="text-emerald-600 text-xs font-medium">{email}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                        Temporary Password â€” share this once
                                    </p>
                                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                        <code className="flex-1 text-lg font-black tracking-wider text-amber-900">
                                            {showPassword ? result.tempPassword : 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢'}
                                        </code>
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center hover:bg-amber-200 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button
                                            onClick={handleCopy}
                                            className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center hover:bg-amber-200 transition-colors"
                                        >
                                            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-2">
                                        This password is shown only once. Doctor should change it after first login.
                                    </p>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm tracking-wider shadow-lg active:scale-95 transition-all"
                                >
                                    Done
                                </button>
                            </motion.div>
                        ) : (
                            /* â”€â”€ Form State â”€â”€ */
                            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="space-y-4">
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-xl"
                                        >
                                            <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <FormInput label="Doctor Name" icon={<User size={16} />} type="text" placeholder="Dr. Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required />
                                <FormInput label="Email Address" icon={<Mail size={16} />} type="email" placeholder="doctor@hospital.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                <FormInput label="Department / Specialty" icon={<Stethoscope size={16} />} type="text" placeholder="Cardiology, General Surgery..." value={department} onChange={(e) => setDepartment(e.target.value)} required />
                                <FormInput label="Phone Number" icon={<Phone size={16} />} type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} required />

                                <div className="pt-1">
                                    <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                                        A temporary password will be auto-generated and shown to you after account creation.
                                    </p>
                                    <button
                                        type="submit" disabled={isLoading}
                                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm tracking-wider shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <><Loader2 className="animate-spin w-5 h-5" /> Creating Account...</> : <><Plus size={18} /> Create Doctor Account</>}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DoctorManagement = () => {
    const { user } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [hospitalScopedDoctors, setHospitalScopedDoctors] = useState([]);
    const [globalScopedDoctors, setGlobalScopedDoctors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const resolveHospitalId = () => {
        const storedHospital = (() => {
            try {
                const raw = localStorage.getItem('varogra_user');
                return raw ? JSON.parse(raw) : null;
            } catch {
                return null;
            }
        })();
        const storedRole = localStorage.getItem('userRole');

        const runtimeRole = (user?.role || '').toLowerCase();
        const runtimeHospitalId = runtimeRole === 'hospital'
            ? (user?.uid || user?.id || null)
            : null;

        const storedHospitalId = (storedRole === 'hospital' || (storedHospital?.role || '').toLowerCase() === 'hospital')
            ? (storedHospital?.hospitalId || storedHospital?.uid || storedHospital?.id || null)
            : null;

        return runtimeHospitalId || storedHospitalId || null;
    };

    const [hospitalId, setHospitalId] = useState(() => resolveHospitalId());

    useEffect(() => {
        setHospitalId(resolveHospitalId());
    }, [user]);

    useEffect(() => {
        const onStorage = (event) => {
            if (event.key === 'varogra_user' || event.key === 'userRole') {
                setHospitalId(resolveHospitalId());
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [user]);

    useEffect(() => {
        if (!db || !hospitalId) {
            setHospitalScopedDoctors([]);
            return;
        }

        const hospitalDoctorsRef = collection(db, 'hospitals', hospitalId, 'doctors');
        const unsubscribe = onSnapshot(
            hospitalDoctorsRef,
            (snapshot) => {
                const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setHospitalScopedDoctors(docs);
            },
            (error) => {
                console.error('Hospital doctors listener error:', error);
                setHospitalScopedDoctors([]);
            }
        );

        return unsubscribe;
    }, [hospitalId]);

    useEffect(() => {
        if (!db || !hospitalId) {
            setGlobalScopedDoctors([]);
            return;
        }

        const globalDoctorsRef = query(
            collection(db, 'doctors'),
            where('hospitalId', '==', hospitalId)
        );
        const unsubscribe = onSnapshot(
            globalDoctorsRef,
            (snapshot) => {
                const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setGlobalScopedDoctors(docs);
            },
            (error) => {
                console.error('Global doctors listener error:', error);
                setGlobalScopedDoctors([]);
            }
        );

        return unsubscribe;
    }, [hospitalId]);

    useEffect(() => {
        const merged = new Map();
        [...globalScopedDoctors, ...hospitalScopedDoctors].forEach((item) => {
            const key = item.email || item.uid || item.id;
            if (!key) return;
            const current = merged.get(key) || {};
            merged.set(key, { ...current, ...item, id: item.id || current.id });
        });
        setDoctors(Array.from(merged.values()));
    }, [hospitalScopedDoctors, globalScopedDoctors]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this doctor?')) {
            await deleteDoc(doc(db, 'hospitals', hospitalId, 'doctors', id));
        }
    };

    const handleApprove = async (docId) => {
        setActionLoading(docId);
        try {
            await updateDoc(doc(db, 'hospitals', hospitalId, 'doctors', docId), {
                status: 'APPROVED',
                updatedAt: serverTimestamp()
            });

            await updateDoc(doc(db, 'doctors', docId), {
                status: 'APPROVED',
                updatedAt: serverTimestamp()
            });

            try {
                await updateDoc(doc(db, 'users', docId), {
                    doctorStatus: 'APPROVED',
                    status: 'APPROVED',
                    updatedAt: serverTimestamp()
                });
            } catch (userUpdateError) {
                console.warn('User status update warning:', userUpdateError);
            }
        } catch (err) {
            console.error('Approve error:', err);
            alert('Failed to approve. Make sure you have permissions.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (docId) => {
        if (!window.confirm("Reject this doctor's registration?")) return;
        setActionLoading(docId);
        try {
            await updateDoc(doc(db, 'hospitals', hospitalId, 'doctors', docId), {
                status: 'REJECTED',
                updatedAt: serverTimestamp()
            });

            await updateDoc(doc(db, 'doctors', docId), {
                status: 'REJECTED',
                updatedAt: serverTimestamp()
            });

            try {
                await updateDoc(doc(db, 'users', docId), {
                    doctorStatus: 'REJECTED',
                    status: 'REJECTED',
                    updatedAt: serverTimestamp()
                });
            } catch (userUpdateError) {
                console.warn('User status update warning:', userUpdateError);
            }
        } catch (err) {
            console.error('Reject error:', err);
            alert('Failed to reject.');
        } finally {
            setActionLoading(null);
        }
    };

    const pendingRequests = doctors.filter(d => d.status === 'PENDING_APPROVAL' || !d.status || d.status === 'PENDING');
    const rejectedDoctors = doctors.filter(d => d.status === 'REJECTED');

    const approvedDoctors = doctors.filter(d => d.status === 'APPROVED' || d.status === 'ACTIVE');

    const filteredApprovedDoctors = approvedDoctors.filter((d) => {
        const haystack = `${d.name || ''} ${d.specialization || ''} ${d.department || ''} ${d.email || ''}`.toLowerCase();
        const searchMatch = haystack.includes(searchTerm.toLowerCase());
        if (!searchMatch) return false;
        if (statusFilter === 'all') return true;
        return (d.status || '').toLowerCase() === statusFilter;
    });

    const getInitials = (name = '') => {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'DR';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
    };

    const getStatusBadge = (statusRaw) => {
        const s = (statusRaw || '').toString().toUpperCase();
        if (s === 'APPROVED' || s === 'ACTIVE') {
            return (
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                    Approved
                </span>
            );
        }
        if (s === 'REJECTED') {
            return (
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">
                    Rejected
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                Pending
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            {/* 1) Header */}
            <div className="flex items-start justify-between gap-4 mb-8">
                <div className="min-w-0">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Doctor Team Hub</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Manage hospital doctors, approvals and staffing
                    </p>
                </div>

                <div className="shrink-0">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 shadow-sm transition whitespace-nowrap"
                    >
                        <Plus size={16} /> Invite Doctor
                    </button>
                </div>
            </div>

            {/* 2) Controls Row */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8">
                <div className="relative flex-1 min-w-0">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search doctors"
                        className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative w-full md:w-[220px] shrink-0">
                    <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 pl-9 pr-9 text-sm font-medium text-slate-900 appearance-none outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                    >
                        <option value="all">All Status</option>
                        <option value="approved">Approved</option>
                        <option value="active">Active</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* 3) Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-sm text-slate-600">Total Doctors</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{doctors.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 grid place-items-center text-slate-500 shrink-0">
                            <Users size={18} />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-sm text-slate-600">Pending Approvals</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{pendingRequests.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 grid place-items-center text-amber-700 shrink-0">
                            <Clock3 size={18} />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-sm text-slate-600">Rejected Requests</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{rejectedDoctors.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 grid place-items-center text-rose-700 shrink-0">
                            <TriangleAlert size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 4) Approved Doctors */}
            <div className="mb-8">
                <div className="flex items-end justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Approved Doctors</h2>
                        <p className="text-sm text-slate-600 mt-1">Active team members available for staffing</p>
                    </div>
                    <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 shrink-0">
                        {filteredApprovedDoctors.length} shown
                    </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    {/* Pending approvals (kept, but visually nested in the doctors section) */}
                    {pendingRequests.length > 0 && (
                        <div className="border-b border-slate-200 p-6">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 grid place-items-center text-amber-700 shrink-0">
                                        <UserPlus size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900">Pending approvals</p>
                                        <p className="text-sm text-slate-600 truncate">Review and approve incoming doctor requests</p>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 shrink-0">
                                    {pendingRequests.length} pending
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {pendingRequests.map((docItem) => (
                                    <div key={docItem.id} className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {docItem.photoURL ? (
                                                    <img
                                                        src={docItem.photoURL}
                                                        alt={docItem.name || 'Doctor'}
                                                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 border border-blue-200 text-xs shrink-0">
                                                        {getInitials(docItem.name)}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">{docItem.name}</p>
                                                    <p className="text-sm text-slate-600 truncate">
                                                        {docItem.specialization || docItem.department || 'Specialist'}
                                                    </p>
                                                </div>
                                            </div>
                                            {getStatusBadge(docItem.status)}
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                                                <Mail size={14} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{docItem.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                                                <Phone size={14} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{docItem.phone || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <button
                                                disabled={actionLoading === docItem.id}
                                                onClick={() => handleApprove(docItem.id)}
                                                className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wide transition disabled:opacity-50"
                                            >
                                                {actionLoading === docItem.id ? '...' : 'Approve'}
                                            </button>
                                            <button
                                                disabled={actionLoading === docItem.id}
                                                onClick={() => handleReject(docItem.id)}
                                                className="h-10 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wide transition disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Approved doctors list */}
                    {filteredApprovedDoctors.length > 0 ? (
                        <div className="max-h-[560px] overflow-auto">
                            <div className="divide-y divide-slate-200">
                                {filteredApprovedDoctors.map((docItem) => (
                                    <div
                                        key={docItem.id}
                                        className="px-6 h-[72px] flex items-center gap-4"
                                    >
                                        {/* Avatar + name */}
                                        <div className="flex items-center gap-3 min-w-0 flex-[1.1]">
                                            {docItem.photoURL ? (
                                                <img
                                                    src={docItem.photoURL}
                                                    alt={docItem.name || 'Doctor'}
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 border border-blue-200 text-xs shrink-0">
                                                    {getInitials(docItem.name)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{docItem.name}</p>
                                                <p className="text-sm text-slate-600 truncate">
                                                    {docItem.specialization || docItem.department || 'General'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="hidden md:flex items-center justify-center flex-[0.35]">
                                            {getStatusBadge(docItem.status)}
                                        </div>

                                        {/* Email */}
                                        <div className="hidden lg:flex items-center gap-2 text-sm text-slate-700 min-w-0 flex-[0.9]">
                                            <Mail size={14} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{docItem.email}</span>
                                        </div>

                                        {/* Phone */}
                                        <div className="hidden lg:flex items-center gap-2 text-sm text-slate-700 min-w-0 flex-[0.55]">
                                            <Phone size={14} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{docItem.phone || 'N/A'}</span>
                                        </div>

                                        {/* Compact contact on small screens */}
                                        <div className="flex lg:hidden flex-col gap-1 min-w-0 flex-[0.9]">
                                            <div className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                                                <Mail size={14} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{docItem.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                                                <Phone size={14} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{docItem.phone || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="ml-auto flex items-center justify-end">
                                            <button
                                                onClick={() => handleDelete(docItem.id)}
                                                className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition"
                                                title="Remove doctor"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-16 px-6 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 grid place-items-center mx-auto mb-4">
                                <Stethoscope size={30} className="text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900">No approved doctors yet</h3>
                            <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                                Invite doctors or approve pending requests to start building your hospital team.
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 shadow-sm transition"
                            >
                                <Plus size={16} /> Invite First Doctor
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showCreateModal && (
                    <CreateDoctorModal
                        hospitalId={hospitalId}
                        onClose={() => setShowCreateModal(false)}
                        onCreated={() => setShowCreateModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default DoctorManagement;

