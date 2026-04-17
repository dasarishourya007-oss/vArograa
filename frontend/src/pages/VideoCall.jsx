import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, PenTool, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import WritingBoard from '../components/WritingBoard';
import { uploadPrescriptionImage, addAppointmentPrescription } from '../firebase/services';
import { motion, AnimatePresence } from 'framer-motion';

const VideoCall = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { appointments, user } = useAuth();

    // In real app, we would fetch call token here
    const appointment = appointments.find(a => a.id === id);

    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);
    const [status, setStatus] = useState('Connecting...');
    const [showWritingBoard, setShowWritingBoard] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setStatus('Connected'), 1500);
        return () => clearTimeout(timer);
    }, []);

    if (!appointment) return <div className="p-4">Call not found</div>;

    const isDoctor = user.role === 'doctor';
    const otherPersonName = isDoctor ? 'Patient' : `Dr. ${appointment.doctorName}`;

    return (
        <div style={{
            height: '100vh',
            backgroundColor: '#202124',
            color: 'white',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header / Top Bar */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '20px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
                zIndex: 10
            }}>
                <h2 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>{otherPersonName}</h2>
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#e0e0e0' }}>{status} • 05:21</p>
            </div>

            {/* Main Video Area (The Other Person) */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {status === 'Connected' ? (
                    <div style={{
                        width: '100%', height: '100%',
                        backgroundColor: '#333',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundImage: 'url(https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}>
                        {/* Placeholder generic image for demo */}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#5f6368', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '32px' }}>{otherPersonName[0]}</span>
                        </div>
                        <p>{status}</p>
                    </div>
                )}
            </div>

            {/* Floating Self View */}
            <div style={{
                position: 'absolute',
                bottom: '100px',
                right: '20px',
                width: '100px',
                height: '150px',
                backgroundColor: '#303134',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.2)',
                overflow: 'hidden',
                zIndex: 20,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}>
                {videoOff ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                        <VideoOff size={20} />
                    </div>
                ) : (
                    <img
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
                        alt="Me"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                )}
            </div>

            {/* Bottom Controls Bar */}
            <div style={{
                padding: '30px 20px',
                backgroundColor: 'rgba(0,0,0,0.8)',
                display: 'flex',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px'
            }}>
                <ControlButton
                    icon={muted ? <MicOff /> : <Mic />}
                    active={muted}
                    onClick={() => setMuted(!muted)}
                />
                <ControlButton
                    icon={videoOff ? <VideoOff /> : <Video />}
                    active={videoOff}
                    onClick={() => setVideoOff(!videoOff)}
                />
                <div style={{
                    width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ef4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                    transition: 'all 0.2s ease'
                }} onClick={() => navigate(-1)}>
                    <PhoneOff color="white" fill="white" size={28} />
                </div>
                {isDoctor && (
                    <ControlButton
                        icon={<PenTool />}
                        active={showWritingBoard}
                        onClick={() => setShowWritingBoard(!showWritingBoard)}
                        label="Prescribe"
                    />
                )}
                <ControlButton icon={<MessageSquare />} onClick={() => alert('Chat Overlay')} />
            </div>

            {/* Writing Board Overlay for Doctor */}
            <AnimatePresence>
                {showWritingBoard && isDoctor && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '400px',
                            height: '100%',
                            backgroundColor: 'white',
                            zIndex: 100,
                            boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#333' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>DIGITAL PRESCRIPTION</h3>
                            <button onClick={() => setShowWritingBoard(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ flex: 1, padding: '10px' }}>
                            <WritingBoard onSave={async (dataUrl) => {
                                setIsSaving(true);
                                try {
                                    const imageUrl = await uploadPrescriptionImage(id, dataUrl);
                                    await addAppointmentPrescription({
                                        appointmentId: id,
                                        imageUrl,
                                        doctorName: user.name,
                                        patientId: appointment.userId
                                    });
                                    alert('Prescription sent to patient!');
                                    setShowWritingBoard(false);
                                } catch (e) {
                                    alert('Failed to send prescription');
                                } finally {
                                    setIsSaving(false);
                                }
                            }} />
                        </div>
                        {isSaving && (
                            <div style={{
                                position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', zIndex: 110
                            }}>
                                Sending...
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ControlButton = ({ icon, active, onClick, label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <button onClick={onClick} style={{
            width: '52px', height: '52px', borderRadius: '50%',
            backgroundColor: active ? '#14b8a6' : 'rgba(255,255,255,0.15)',
            color: 'white',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: active ? '0 0 15px rgba(20,184,166,0.4)' : 'none'
        }}>
            {icon}
        </button>
        {label && <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: active ? '#14b8a6' : '#999' }}>{label}</span>}
    </div>
);

export default VideoCall;
