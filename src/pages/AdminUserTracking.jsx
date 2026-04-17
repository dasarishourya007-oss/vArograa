import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { User, Clock, Monitor, Globe, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const AccessMonitor = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;

        const q = query(
            collection(db, "login_history"),
            orderBy("timestamp", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const history = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLogs(history);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching login logs:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatTime = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] p-6 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1A2B3C] flex items-center gap-3">
                            <ShieldCheck className="text-[#0052D4]" size={32} />
                            Access Insight Monitor
                        </h1>
                        <p className="text-gray-500 mt-1">Monitor real-time user login activity across the platform</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 text-sm font-medium text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Live Session Tracking
                    </div>
                </header>

                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#F1F5F9]">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User / Email</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Login Time</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Device / Info</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Platform</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 border-4 border-[#0052D4] border-t-transparent rounded-full animate-spin"></div>
                                                Loading tracking data...
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                            No login events recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            key={log.id}
                                            className="hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0052D4]">
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{log.email}</div>
                                                        <div className="text-xs text-gray-500 font-mono">ID: {log.uid.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${log.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                        log.role === 'doctor' ? 'bg-indigo-100 text-indigo-700' :
                                                            log.role === 'hospital' ? 'bg-teal-100 text-teal-700' :
                                                                'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {log.role === 'admin' ? 'SYSTEM' : log.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-gray-400" />
                                                    {formatTime(log.timestamp)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs overflow-hidden text-ellipsis">
                                                <div className="flex items-center gap-2">
                                                    <Monitor size={14} className="text-gray-400 flex-shrink-0" />
                                                    <span className="truncate text-xs opacity-75">{log.userAgent?.split(')')[0] + ')'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                                    <Globe size={14} className="text-blue-400" />
                                                    {log.platform || 'Web'}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                        Showing last 50 login events. Data is updated in real-time.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessMonitor;
