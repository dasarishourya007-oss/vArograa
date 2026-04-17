import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    TrendingUp,
    Users,
    Activity,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

const Analytics = () => {
    const [timeRange, setTimeRange] = React.useState('month');

    const periodData = {
        day: [
            { name: '08:00', patients: 45, admitted: 30, discharged: 15, revenue: 2200 },
            { name: '10:00', patients: 82, admitted: 50, discharged: 32, revenue: 3800 },
            { name: '12:00', patients: 115, admitted: 70, discharged: 45, revenue: 5200 },
            { name: '14:00', patients: 98, admitted: 60, discharged: 38, revenue: 4600 },
            { name: '16:00', patients: 84, admitted: 50, discharged: 34, revenue: 4100 },
            { name: '18:00', patients: 62, admitted: 40, discharged: 22, revenue: 3200 },
        ],
        week: [
            { name: 'Mon', patients: 120, admitted: 80, discharged: 40, revenue: 6200 },
            { name: 'Tue', patients: 150, admitted: 100, discharged: 50, revenue: 8400 },
            { name: 'Wed', patients: 130, admitted: 85, discharged: 45, revenue: 7100 },
            { name: 'Thu', patients: 180, admitted: 120, discharged: 60, revenue: 9500 },
            { name: 'Fri', patients: 210, admitted: 140, discharged: 70, revenue: 12300 },
            { name: 'Sat', patients: 95, admitted: 60, discharged: 35, revenue: 5400 },
            { name: 'Sun', patients: 60, admitted: 40, discharged: 20, revenue: 3200 },
        ],
        month: [
            { name: 'Week 1', patients: 450, admitted: 300, discharged: 150, revenue: 24000 },
            { name: 'Week 2', patients: 520, admitted: 350, discharged: 170, revenue: 28500 },
            { name: 'Week 3', patients: 610, admitted: 400, discharged: 210, revenue: 32000 },
            { name: 'Week 4', patients: 480, admitted: 320, discharged: 160, revenue: 25700 },
        ],
        year: [
            { name: 'Jan', patients: 2100, admitted: 1400, discharged: 700, revenue: 110000 },
            { name: 'Feb', patients: 2300, admitted: 1500, discharged: 800, revenue: 125000 },
            { name: 'Mar', patients: 2800, admitted: 1900, discharged: 900, revenue: 145000 },
            { name: 'Apr', patients: 2500, admitted: 1700, discharged: 800, revenue: 130000 },
            { name: 'May', patients: 3100, admitted: 2100, discharged: 1000, revenue: 165000 },
            { name: 'Jun', patients: 2900, admitted: 2000, discharged: 900, revenue: 155000 },
        ]
    };

    const handleExport = () => {
        window.print();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '0.5rem' }}>Core Analytics</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Deep telemetry and performance metrics for vArogra Network.</p>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                        {['day', 'week', 'month', 'year'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    background: timeRange === range ? 'var(--primary)' : 'transparent',
                                    color: timeRange === range ? 'white' : 'var(--text-muted)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleExport} className="btn-premium">Export Report</button>
                </div>
            </div>

            {/* Print Only Report Section */}
            <div className="print-report" style={{ display: 'none' }}>
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        .print-report, .print-report * { visibility: visible; }
                        .print-report { 
                            display: block !important; 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 100%; 
                            padding: 40px;
                            color: black !important;
                            background: white !important;
                        }
                        .report-header { border-bottom: 2px solid #333; margin-bottom: 30px; padding-bottom: 20px; }
                        .report-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        .report-table th, .report-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        .report-table th { background-color: #f8f9fa; }
                        .financial-summary { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
                    }
                `}</style>
                <div className="report-header">
                    <h1 style={{ margin: 0 }}>vArogra Network - Hospital Performance Report</h1>
                    <p style={{ fontSize: '1.2rem', margin: '10px 0' }}>Facility: <strong>Central Command</strong></p>
                    <p>Report Period: {timeRange.toUpperCase()} | Generated: {new Date().toLocaleString()}</p>
                </div>

                <h3>Patient Intake & Financial Metrics</h3>
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th>Total Patients</th>
                            <th>Admitted</th>
                            <th>Discharged</th>
                            <th>Revenue Collected</th>
                        </tr>
                    </thead>
                    <tbody>
                        {periodData[timeRange].map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.name}</td>
                                <td>{item.patients}</td>
                                <td>{item.admitted}</td>
                                <td>{item.discharged}</td>
                                <td>${item.revenue.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="financial-summary">
                    <h3>Executive Summary</h3>
                    <p>Total Revenue: <strong>${periodData[timeRange].reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}</strong></p>
                    <p>Total Patient Volume: <strong>{periodData[timeRange].reduce((sum, item) => sum + item.patients, 0).toLocaleString()}</strong></p>
                    <p>Admission Rate: <strong>{((periodData[timeRange].reduce((sum, item) => sum + item.admitted, 0) / periodData[timeRange].reduce((sum, item) => sum + item.patients, 0)) * 100).toFixed(1)}%</strong></p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                {[
                    { title: 'Total Revenue', value: '$84,200', trend: '+12.5%', icon: <Activity />, color: 'var(--brand-primary)' },
                    { title: 'Patient Growth', value: '2,400', trend: '+5.2%', icon: <Users />, color: 'var(--brand-secondary)' },
                    { title: 'Avg Consultation', value: '18 min', trend: '-2.1%', icon: <TrendingUp />, color: 'var(--brand-tertiary)' },
                ].map((stat, i) => (
                    <motion.div key={i} whileHover={{ y: -5 }} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ padding: '15px', borderRadius: '16px', background: `${stat.color}15`, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{stat.title}</p>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stat.value}</h3>
                            <p style={{ fontSize: '0.8rem', color: stat.trend.startsWith('+') ? 'var(--available)' : 'var(--critical)', fontWeight: '700' }}>
                                {stat.trend} from last month
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="card" style={{ padding: '2.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '2rem' }}>Revenue vs Patient Intake</h3>
                <div style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={periodData[timeRange]}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ background: 'white', border: '1px solid var(--border-glass)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                itemStyle={{ fontWeight: 'bold', color: 'var(--brand-primary)' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            <Area type="monotone" dataKey="patients" stroke="var(--brand-secondary)" strokeWidth={3} fill="transparent" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
