import React, { useState } from 'react';
import { 
    Settings, Globe, Moon, Bell, Shield, 
    Lock, Share2, ArrowLeft, ChevronRight,
    Smartphone, Database, Layout
} from 'lucide-react';
import { motion } from 'framer-motion';

const SettingsView = ({ onBack }) => {
    const [settings, setSettings] = useState({
        darkMode: false,
        pushNotifications: true,
        medicineReminders: true,
        dataSharing: true,
        biometricLogin: false,
        appLock: false
    });

    const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] });

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-6 flex items-center gap-4">
                <button onClick={onBack} className="p-2 rounded-xl bg-slate-50 text-slate-600 active:scale-90">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Settings</h1>
            </header>

            <div className="p-6 space-y-8">
                {/* App Settings */}
                <section className="space-y-4">
                    <SectionLabel icon={Layout} label="App Interface" />
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <SettingToggle 
                            icon={Moon} 
                            label="Dark Mode" 
                            active={settings.darkMode} 
                            onToggle={() => toggle('darkMode')} 
                        />
                        <div className="h-[1px] bg-slate-50 mx-4" />
                        <div className="p-4 flex items-center justify-between active:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Globe size={20} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">Display Language</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-blue-600 uppercase">English</span>
                                <ChevronRight size={16} className="text-slate-300" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Notifications */}
                <section className="space-y-4">
                    <SectionLabel icon={Bell} label="Notifications" />
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <SettingToggle 
                            icon={Bell} 
                            label="Push Notifications" 
                            active={settings.pushNotifications} 
                            onToggle={() => toggle('pushNotifications')} 
                        />
                        <div className="h-[1px] bg-slate-50 mx-4" />
                        <SettingToggle 
                            icon={Smartphone} 
                            label="Appointment Alerts" 
                            active={settings.pushNotifications} 
                            onToggle={() => {}} 
                        />
                        <div className="h-[1px] bg-slate-50 mx-4" />
                        <SettingToggle 
                            icon={Database} 
                            label="Medicine Reminders" 
                            active={settings.medicineReminders} 
                            onToggle={() => toggle('medicineReminders')} 
                        />
                    </div>
                </section>

                {/* Security */}
                <section className="space-y-4">
                    <SectionLabel icon={Shield} label="Privacy & Security" />
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <SettingToggle 
                            icon={Share2} 
                            label="Health Data Sharing" 
                            active={settings.dataSharing} 
                            onToggle={() => toggle('dataSharing')} 
                            desc="Share vitals with hospital"
                        />
                        <div className="h-[1px] bg-slate-50 mx-4" />
                        <SettingToggle 
                            icon={Smartphone} 
                            label="Biometric Login" 
                            active={settings.biometricLogin} 
                            onToggle={() => toggle('biometricLogin')} 
                        />
                        <div className="h-[1px] bg-slate-50 mx-4" />
                        <SettingToggle 
                            icon={Lock} 
                            label="App PIN Lock" 
                            active={settings.appLock} 
                            onToggle={() => toggle('appLock')} 
                        />
                    </div>
                </section>

                {/* Account Actions */}
                <div className="pt-4">
                    <button className="w-full p-5 rounded-2xl bg-slate-50 text-slate-400 text-[11px] font-black uppercase tracking-widest border border-slate-100 active:bg-slate-100 transition-colors">
                        Download My Personal Data
                    </button>
                    <p className="text-center text-[10px] font-bold text-slate-400 mt-6 px-10 leading-relaxed uppercase tracking-tighter opacity-30">
                        Changes to privacy settings may take up to 24 hours to reflect across all connected medical hubs.
                    </p>
                </div>
            </div>
        </div>
    );
};

const SectionLabel = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-2 mb-2 ml-1">
        <Icon size={14} className="text-slate-400" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
);

const SettingToggle = ({ icon: Icon, label, active, onToggle, desc }) => (
    <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                <Icon size={20} />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-700">{label}</p>
                {desc && <p className="text-[10px] font-bold text-slate-400">{desc}</p>}
            </div>
        </div>
        <button 
            onClick={onToggle}
            className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${active ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'}`}
        >
            <motion.div 
                layout
                className="w-5 h-5 rounded-full bg-white shadow-sm"
            />
        </button>
    </div>
);

export default SettingsView;
