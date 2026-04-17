import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import './vArograOnboarding.css';

// Importing assets from the new onboarding folder
import img1 from '../assets/onboarding/healthcare_1.png';
import img2 from '../assets/onboarding/healthcare_2.png';
import img3 from '../assets/onboarding/healthcare_3.png';
import img4 from '../assets/onboarding/healthcare_4.png';
const logoImg = '/pwa-192x192.png';

const onboardingData = [
    {
        id: 1,
        role: "Patients",
        shortRole: "Patient",
        heroTitle: "RELIABLE & FAST",
        heroDesc: "Get your medical results quickly and securely. Instant access to trustworthy, accurate digital health reports.",
        roleTitle: "For Patients",
        contentDesc: "Take control of your health journey today.",
        problems: [
            "Struggling with fragmented medical records?",
            "Long waiting times for specialist consultations?",
            "Difficulties tracking history across providers?"
        ],
        image: img2
    },
    {
        id: 2,
        role: "Doctors",
        shortRole: "Doctor",
        heroTitle: "SMART & EFFICIENT",
        heroDesc: "Focus on care, not paperwork. Streamline your practice with AI-assisted history and e-prescriptions.",
        roleTitle: "For Doctors",
        contentDesc: "Elevating the medical practice experience.",
        problems: [
            "Overwhelmed by administrative patient paperwork?",
            "Difficulty accessing complete patient history?",
            "Inefficient prescription management systems?"
        ],
        image: img1
    },
    {
        id: 3,
        role: "Hospitals",
        shortRole: "Hospital",
        heroTitle: "UNIFIED & SECURE",
        heroDesc: "Integrated precision infrastructure to maximize facility efficiency and enhance connectivity.",
        roleTitle: "For Hospitals",
        contentDesc: "Connect your departments efficiently.",
        problems: [
            "Inefficient bed and resource management?",
            "Complex and manual billing processes?",
            "Disconnected communication between labs and clinics?"
        ],
        image: img3
    },
    {
        id: 4,
        role: "Medical Stores",
        shortRole: "Medical Store",
        heroTitle: "PRECISE & RELIABLE",
        heroDesc: "Modern pharmaceutical solutions to optimize your inventory and prescription validation.",
        roleTitle: "For Medical Stores",
        contentDesc: "Optimize your pharmacy ecosystem.",
        problems: [
            "Hard to track inventory and stock expiry?",
            "Manual verification of digital prescriptions?",
            "Inconsistent patient satisfaction in delivery?"
        ],
        image: img4
    }
];

const HeartbeatLogo = () => (
    <div className="heartbeat-logo-container">
        <img src={logoImg} className="logo-base-img" alt="vArogra Logo" />
        <svg viewBox="0 0 300 300" className="heartbeat-overlay" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 142h45l10-25 10 70 15-115 15 110 10-40h70" className="pulse-overlay-line" />
        </svg>
    </div>
);

const LoadingScreen = ({ onComplete }) => {
    const [showName, setShowName] = useState(false);

    useEffect(() => {
        const showTimer = setTimeout(() => setShowName(true), 1200);
        const hideTimer = setTimeout(() => setShowName(false), 3200);
        const completeTimer = setTimeout(onComplete, 4500);
        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div className="loading-screen">
            <HeartbeatLogo />
            <AnimatePresence>
                {showName && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.8 }}
                        className="logo-name-fade"
                    >
                        vArogra
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const VArograOnboarding = ({ onFinish }) => {
    const [view, setView] = useState('onboarding'); // 'onboarding', 'loading'
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(0);

    // Auto-play logic for onboarding
    useEffect(() => {
        if (view !== 'onboarding') return;
        const timer = setInterval(() => {
            setDirection(1);
            setStep((prev) => (prev + 1) % onboardingData.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [view]);

    const handleContinue = () => {
        setView('loading');
    };

    if (view === 'loading') {
        return <LoadingScreen onComplete={onFinish} />;
    }

    const currentData = onboardingData[step];

    const variants = {
        enter: (direction) => ({
            opacity: 0,
            x: direction > 0 ? 100 : -100
        }),
        center: {
            opacity: 1,
            x: 0
        },
        exit: (direction) => ({
            opacity: 0,
            x: direction < 0 ? 100 : -100
        })
    };

    return (
        <div className="varogra-onboarding-container">
            <div className="onboarding-card">
                <div className="header-brand">
                    <span className="logo-text">vArogra</span>
                </div>

                <div className="onboarding-grid">
                    <div className="left-panel">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={`hero-${currentData.id}`}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.5 }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
                            >
                                <div className="hero-img-container">
                                    <img src={currentData.image} className="hero-img" alt="Onboarding" />
                                </div>
                                <h2 className="hero-title">{currentData.heroTitle}</h2>
                                <p className="hero-subtitle">{currentData.heroDesc}</p>
                                <button className="btn-continue" onClick={handleContinue}>Continue</button>
                            </motion.div>
                        </AnimatePresence>

                        <div className="pagination-dots">
                            {onboardingData.map((_, i) => (
                                <div key={i} className={`dot ${i === step ? 'active' : ''}`} />
                            ))}
                        </div>
                    </div>

                    <div className="right-panel">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={`content-${currentData.id}`}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.5 }}
                                style={{ display: 'flex', flexDirection: 'column' }}
                            >
                                <div className="role-indicator">Role: {currentData.shortRole}</div>
                                <h1 className="role-title">{currentData.roleTitle}</h1>
                                <p className="content-subtitle">{currentData.contentDesc}</p>

                                <div className="problem-list">
                                    {currentData.problems.map((prob, i) => (
                                        <div key={i} className={`problem-card ${i === 0 ? 'active' : ''}`}>
                                            <div className="problem-icon">ⓘ</div>
                                            <span className="problem-text">{prob}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VArograOnboarding;
