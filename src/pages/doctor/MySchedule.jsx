import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    User,
    MoreHorizontal,
    Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToAppointments } from '../../firebase/services';

// Helper: format a Date as "YYYY-MM-DD"
const toKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Helper: format a Date as "DayName, Month DD, YYYY"
const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// Mock appointment data keyed by date string
const INITIAL_APPOINTMENTS = {
    // ── Today (Feb 26, 2026) ──
    '2026-02-26': [
        { time: '09:00 AM', patient: 'John Doe', type: 'General Checkup', status: 'Completed' },
        { time: '10:30 AM', patient: 'Jane Smith', type: 'Consultation', status: 'Booked' },
        { time: '11:45 AM', patient: 'Robert Brown', type: 'Follow Up', status: 'Booked' },
        { time: '01:00 PM', patient: '-', type: 'Lunch Break', status: 'Break' },
        { time: '02:30 PM', patient: 'Alice Williams', type: 'Clinical Exam', status: 'Cancelled' },
        { time: '04:00 PM', patient: 'Michael Davis', type: 'Report Review', status: 'Booked' },
    ],
    // ── Yesterday (Feb 25, 2026) ──
    '2026-02-25': [
        { time: '09:30 AM', patient: 'Sara Connor', type: 'Cardiology Review', status: 'Completed' },
        { time: '11:00 AM', patient: 'Tom Hardy', type: 'Follow Up', status: 'Completed' },
        { time: '01:00 PM', patient: '-', type: 'Lunch Break', status: 'Break' },
        { time: '03:00 PM', patient: 'Nina Patel', type: 'Consultation', status: 'Completed' },
        { time: '04:30 PM', patient: 'Chris Evans', type: 'General Checkup', status: 'Cancelled' },
    ],
    // ── Feb 24, 2026 ──
    '2026-02-24': [
        { time: '10:00 AM', patient: 'Bruce Wayne', type: 'Neurology Consult', status: 'Completed' },
        { time: '11:30 AM', patient: 'Diana Prince', type: 'Follow Up', status: 'Completed' },
        { time: '01:00 PM', patient: '-', type: 'Lunch Break', status: 'Break' },
        { time: '02:00 PM', patient: 'Clark Kent', type: 'Annual Checkup', status: 'Completed' },
    ],
    // ── Feb 27, 2026 (tomorrow) ──
    '2026-02-27': [
        { time: '09:00 AM', patient: 'Lena Rao', type: 'Dermatology', status: 'Booked' },
        { time: '10:30 AM', patient: 'James Watt', type: 'Blood Test Review', status: 'Booked' },
        { time: '01:00 PM', patient: '-', type: 'Lunch Break', status: 'Break' },
        { time: '02:00 PM', patient: 'Meera Kapoor', type: 'ENT Consultation', status: 'Booked' },
        { time: '03:30 PM', patient: 'Alan Grant', type: 'Orthopaedics', status: 'Booked' },
    ],
    // ── Mar 3, 2026 ──
    '2026-03-03': [
        { time: '09:00 AM', patient: 'Elena Mir', type: 'Annual Checkup', status: 'Booked' },
        { time: '11:00 AM', patient: 'Sam Wilson', type: 'Cardiology', status: 'Booked' },
        { time: '01:00 PM', patient: '-', type: 'Lunch Break', status: 'Break' },
        { time: '03:00 PM', patient: 'Wanda Maximoff', type: 'Follow Up', status: 'Booked' },
    ],
    // ── Mar 10, 2026 ──
    '2026-03-10': [
        { time: '10:00 AM', patient: 'Peter Parker', type: 'Sports Injury', status: 'Booked' },
        { time: '12:00 PM', patient: '-', type: 'Lunch Break', status: 'Break' },
        { time: '02:30 PM', patient: 'Tony Stark', type: 'Cardiac Screening', status: 'Booked' },
    ],
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Completed': return 'var(--brand-teal)';
        case 'Booked': return 'var(--brand-primary)';
        case 'Cancelled': return 'var(--critical)';
        case 'Pending': return 'var(--warning)';
        default: return 'var(--text-muted)';
    }
};

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const MySchedule = () => {
    const { user } = useAuth();
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today);
    const [calMonth, setCalMonth] = useState(today.getMonth());   // 0-based
    const [calYear, setCalYear] = useState(today.getFullYear());

    // State for appointments so we can cancel them
    const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
    const [liveAppointments, setLiveAppointments] = useState([]);
    const [openMenuId, setOpenMenuId] = useState(null); // Track which row's menu is open
    const [filterStatus, setFilterStatus] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);


    useEffect(() => {
        const doctorId = user?.uid || user?.id;
        if (!doctorId) return undefined;

        const unsubPrimary = subscribeToAppointments({ doctorId }, (data) => setLiveAppointments(data || []));
        const refId = user?.doctorId || user?.id;
        let unsubRef = () => { };
        if (refId && refId !== doctorId) {
            unsubRef = subscribeToAppointments({ doctorRefId: refId }, (data) => {
                setLiveAppointments((prev) => {
                    const merged = [...(prev || []), ...(data || [])];
                    const seen = new Set();
                    return merged.filter((item) => {
                        if (!item?.id || seen.has(item.id)) return false;
                        seen.add(item.id);
                        return true;
                    });
                });
            });
        }

        return () => {
            unsubPrimary();
            unsubRef();
        };
    }, [user?.uid, user?.id, user?.doctorId]);
    // Slots for the selected date, mapped and filtered
    const selectedKey = toKey(selectedDate);
    const normalizedLiveSlots = (liveAppointments || [])
        .filter((appt) => {
            const key = appt?.appointmentDateKey || '';
            if (key) return key === selectedKey;
            return false;
        })
        .map((appt) => {
            const st = String(appt?.status || '').toLowerCase();
            let mappedStatus = 'Booked';
            if (st === 'pending') mappedStatus = 'Pending';
            if (st === 'accepted' || st === 'confirmed') mappedStatus = 'Booked';
            if (st === 'completed') mappedStatus = 'Completed';
            if (st === 'rejected' || st === 'cancelled') mappedStatus = 'Cancelled';

            return {
                time: appt?.time || '--',
                patient: appt?.patientName || 'Patient',
                type: appt?.appointmentType || appt?.visitType || 'Consultation',
                status: mappedStatus
            };
        });

    const sourceSlots = normalizedLiveSlots.length > 0 ? normalizedLiveSlots : (appointments[selectedKey] || []);
    const slots = sourceSlots.filter(slot => {
        if (filterStatus === 'All') return true;
        if (slot.status === 'Break') return true; // always show breaks
        return slot.status === filterStatus;
    });

    // Calendar calculations
    const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    const prevMonth = () => {
        if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
        else setCalMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
        else setCalMonth(m => m + 1);
    };

    const handlePrevDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        setSelectedDate(d);
        // Sync calendar to the right month
        setCalMonth(d.getMonth());
        setCalYear(d.getFullYear());
    };
    const handleNextDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        setSelectedDate(d);
        setCalMonth(d.getMonth());
        setCalYear(d.getFullYear());
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDayClick = (day) => {
        const d = new Date(calYear, calMonth, day);
        setSelectedDate(d);
    };

    const todayKey = toKey(today);
    const hasAppointments = (day) => {
        const k = toKey(new Date(calYear, calMonth, day));
        const hasLive = (liveAppointments || []).some((appt) => (appt?.appointmentDateKey || '') === k);
        return hasLive || !!appointments[k];
    };

    const handleCancelAppointment = (dateKey, index) => {
        setAppointments(prev => {
            const newAppointments = { ...prev };
            const daySlots = [...newAppointments[dateKey]];
            daySlots[index] = { ...daySlots[index], status: 'Cancelled' };
            newAppointments[dateKey] = daySlots;
            return newAppointments;
        });
        setOpenMenuId(null);
    };

    // Stats derived from selected-day slots
    const stats = {
        booked: slots.filter(s => s.status === 'Booked').length,
        completed: slots.filter(s => s.status === 'Completed').length,
        cancelled: slots.filter(s => s.status === 'Cancelled').length,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                    My Schedule
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Manage your daily appointments and time blocks.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
                gap: '1.5rem'
            }}>
                {/* ── Main Schedule Panel ── */}
                <div
                    className="glass"
                    style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)' }}
                >
                    {/* Date Navigator */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <button
                                className="glass"
                                onClick={handlePrevDay}
                                style={{ padding: '8px', color: 'white', cursor: 'pointer' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                {formatDate(selectedDate)}
                            </h2>
                            <button
                                className="glass"
                                onClick={handleNextDay}
                                style={{ padding: '8px', color: 'white', cursor: 'pointer' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="glass"
                                style={{
                                    padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                                    color: filterStatus !== 'All' ? 'var(--brand-primary)' : 'var(--text-muted)',
                                    background: filterStatus !== 'All' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                                    border: filterStatus !== 'All' ? '1px solid var(--brand-primary)' : '1px solid var(--border-glass)',
                                    cursor: 'pointer'
                                }}
                            >
                                <Filter size={18} /> {filterStatus === 'All' ? 'Filter' : filterStatus}
                            </button>
                            <AnimatePresence>
                                {isFilterOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="glass"
                                        style={{
                                            position: 'absolute', top: '100%', right: 0, marginTop: '8px', padding: '8px',
                                            borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)',
                                            boxShadow: 'var(--shadow-lg)', zIndex: 20, minWidth: '160px',
                                            display: 'flex', flexDirection: 'column', gap: '4px'
                                        }}
                                    >
                                        {['All', 'Booked', 'Completed', 'Cancelled'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => { setFilterStatus(status); setIsFilterOpen(false); }}
                                                style={{
                                                    width: '100%', padding: '8px 12px', textAlign: 'left',
                                                    background: filterStatus === status ? 'rgba(59,130,246,0.1)' : 'transparent',
                                                    border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600',
                                                    color: filterStatus === status ? 'var(--brand-primary)' : 'white',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {status === 'All' ? 'Show All' : status}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Slot List */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedKey}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                        >
                            {slots.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '3rem 1rem',
                                    color: 'var(--text-muted)',
                                    borderRadius: '16px',
                                    border: '1px dashed var(--border-glass)',
                                }}>
                                    <p style={{ fontSize: '1rem', fontWeight: '600' }}>No appointments found</p>
                                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                        {filterStatus !== 'All' ? `You have no ${filterStatus.toLowerCase()} appointments on this day.` : 'Select another date from the calendar.'}
                                    </p>
                                </div>
                            ) : (
                                slots.map((slot, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '1.25rem',
                                            borderRadius: '16px',
                                            background: slot.status === 'Break'
                                                ? 'rgba(255,255,255,0.01)'
                                                : 'rgba(255,255,255,0.03)',
                                            border: '1px solid var(--border-glass)',
                                            position: 'relative'
                                        }}
                                    >
                                        {slot.status !== 'Break' && (
                                            <div style={{
                                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                                width: '4px', background: getStatusColor(slot.status),
                                                borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px'
                                            }} />
                                        )}

                                        <div style={{ minWidth: '100px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                            {slot.time}
                                        </div>

                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {slot.status === 'Break' ? (
                                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    {slot.type}
                                                </span>
                                            ) : (
                                                <>
                                                    <div style={{
                                                        width: '40px', height: '40px', borderRadius: '50%',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <User size={20} color="var(--text-muted)" />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>{slot.patient}</h4>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{slot.type}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div style={{
                                            padding: '6px 16px', borderRadius: '20px',
                                            fontSize: '0.75rem', fontWeight: '700',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: getStatusColor(slot.status),
                                        }}>
                                            {slot.status}
                                        </div>

                                        <div style={{ position: 'relative' }}>
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === i ? null : i)}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '1.5rem', padding: '4px' }}
                                            >
                                                <MoreHorizontal size={20} />
                                            </button>
                                            <AnimatePresence>
                                                {openMenuId === i && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        className="glass"
                                                        style={{
                                                            position: 'absolute',
                                                            top: '100%',
                                                            right: 0,
                                                            marginTop: '8px',
                                                            padding: '8px',
                                                            borderRadius: '12px',
                                                            background: 'var(--bg-surface)',
                                                            border: '1px solid var(--border-glass)',
                                                            boxShadow: 'var(--shadow-lg)',
                                                            zIndex: 10,
                                                            minWidth: '160px'
                                                        }}
                                                    >
                                                        <button
                                                            onClick={() => handleCancelAppointment(selectedKey, i)}
                                                            disabled={slot.status !== 'Booked'}
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                textAlign: 'left',
                                                                background: slot.status === 'Booked' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                color: slot.status === 'Booked' ? 'var(--critical)' : 'var(--text-muted)',
                                                                fontSize: '0.85rem',
                                                                fontWeight: '600',
                                                                cursor: slot.status === 'Booked' ? 'pointer' : 'not-allowed',
                                                                opacity: slot.status === 'Booked' ? 1 : 0.5
                                                            }}
                                                        >
                                                            Cancel Appointment
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ── Right Sidebar ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Calendar */}
                    <div
                        className="glass"
                        style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)' }}
                    >
                        {/* Month Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>
                                {MONTH_NAMES[calMonth]} {calYear}
                            </h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={prevMonth}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={nextMonth}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Day-of-week labels */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '4px', textAlign: 'center',
                            fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem',
                        }}>
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <span key={d}>{d}</span>
                            ))}
                        </div>

                        {/* Date grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                            {/* Empty leading cells */}
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}

                            {/* Day cells */}
                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1;
                                const cellKey = toKey(new Date(calYear, calMonth, day));
                                const isSelected = cellKey === selectedKey;
                                const isToday = cellKey === todayKey;
                                const hasAppt = hasAppointments(day);

                                return (
                                    <div
                                        key={day}
                                        onClick={() => handleDayClick(day)}
                                        style={{
                                            position: 'relative',
                                            padding: '8px 0',
                                            borderRadius: '8px',
                                            background: isSelected
                                                ? 'var(--brand-primary)'
                                                : isToday
                                                    ? 'rgba(99,102,241,0.15)'
                                                    : 'transparent',
                                            color: isSelected
                                                ? 'white'
                                                : isToday
                                                    ? 'var(--brand-primary)'
                                                    : 'inherit',
                                            fontSize: '0.85rem',
                                            fontWeight: isSelected || isToday ? '700' : '400',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            border: isToday && !isSelected ? '1px solid var(--brand-primary)' : '1px solid transparent',
                                        }}
                                    >
                                        {day}
                                        {/* Dot indicator for days with appointments */}
                                        {hasAppt && !isSelected && (
                                            <span style={{
                                                position: 'absolute', bottom: '2px',
                                                left: '50%', transform: 'translateX(-50%)',
                                                width: '4px', height: '4px',
                                                borderRadius: '50%',
                                                background: 'var(--brand-primary)',
                                                display: 'block',
                                            }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stats for selected day */}
                    <div
                        className="glass"
                        style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)' }}
                    >
                        <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                            Stats — {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'Booked', value: stats.booked, color: 'var(--brand-primary)' },
                                { label: 'Completed', value: stats.completed, color: 'var(--brand-teal)' },
                                { label: 'Cancelled', value: stats.cancelled, color: 'var(--critical)' },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem' }}>{label}</span>
                                    <span style={{ fontWeight: '700', color }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MySchedule;


