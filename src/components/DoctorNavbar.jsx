import React from 'react';
import { Bell, LogOut, ShieldCheck, User, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DoctorNavbar = ({ onLogoutClick }) => {
    const { user } = useAuth();

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between z-40">
            <div className="flex items-center gap-12">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-[var(--text-primary)] leading-tight tracking-tight">HealthLink</h1>
                        <p className="text-[10px] font-extrabold text-[var(--brand-primary)] uppercase tracking-[0.2em] -mt-1">Doctor Portal</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center bg-[var(--bg-main)] px-4 py-2 rounded-xl border border-[var(--border-glass)] focus-within:border-[var(--brand-primary)] focus-within:bg-white transition-all w-80">
                    <Search size={18} className="text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search patients, ID, or records..."
                        className="bg-transparent border-none outline-none px-3 text-sm w-full text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-xl transition-all group">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform"></span>
                </button>

                <div className="h-8 w-[1px] bg-[#E2E8F0] mx-2"></div>

                <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-[#F1F5F9] cursor-pointer transition-all group">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)]">Dr. {user?.name}</p>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{user?.code || 'DOC-4921'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-all overflow-hidden">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={20} />
                        )}
                    </div>
                </div>

                <button
                    onClick={onLogoutClick}
                    className="ml-2 p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="Logout"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
};

import { Activity } from 'lucide-react';
export default DoctorNavbar;
