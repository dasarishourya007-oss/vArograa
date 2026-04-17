import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, FileText, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendPrescriptionToPatient } from '../firebase/services';
import Whiteboard from '../components/Whiteboard';

const VideoCall = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { appointments, user } = useAuth();
    const whiteboardRef = useRef(null);

    // In real app, we would fetch call token here
    const appointment = appointments.find(a => a.id === id);

    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);
    const [status, setStatus] = useState('Connecting...');
    const [showRxPanel, setShowRxPanel] = useState(false);
    const [diagnosis, setDiagnosis] = useState('');
    const [medicine, setMedicine] = useState('');
    const [dosage, setDosage] = useState('');
    const [advice, setAdvice] = useState('');
    const [sendingRx, setSendingRx] = useState(false);
    const [rxNotice, setRxNotice] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setStatus('Connected'), 1500);
        return () => clearTimeout(timer);
    }, []);

    if (!appointment) return <div className="p-4">Call not found</div>;

    const isDoctor = user.role === 'doctor';
    const otherPersonName = isDoctor ? 'Patient' : `Dr. ${appointment.doctorName}`;

    const handleSendPrescription = async () => {
        if (!appointment?.id || !isDoctor) return;
        setSendingRx(true);
        try {
            const whiteboardDataUrl = whiteboardRef.current?.getDataUrl();

            await sendPrescriptionToPatient({
                appointmentId: appointment.id,
                appointment,
                doctor: user,
                diagnosis,
                medicines: [
                    {
                        name: medicine,
                        dose: dosage,
                        frequency: '',
                        duration: '',
                        instructions: advice
                    }
                ],
                advice,
                notes: 'Issued during online consultation',
                whiteboardDataUrl
            });
            setRxNotice('Prescription sent instantly to patient Medical Records/Receipts.');
            setTimeout(() => setRxNotice(''), 3500);
            setShowRxPanel(false);
        } catch (error) {
            setRxNotice('Failed to send prescription. Please retry.');
            setTimeout(() => setRxNotice(''), 3500);
        } finally {
            setSendingRx(false);
        }
    };

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
                    width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ef4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239,68,68,0.4)'
                }} onClick={() => navigate(-1)}>
                    <PhoneOff color="white" fill="white" />
                </div>
                <ControlButton icon={<MessageSquare />} onClick={() => alert('Chat Overlay')} />
                {isDoctor && <ControlButton icon={<FileText />} onClick={() => setShowRxPanel((v) => !v)} />}
            </div>

            {rxNotice && (
                <div style={{ position: 'absolute', bottom: '120px', left: '50%', transform: 'translateX(-50%)', zIndex: 30, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#d1fae5', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                    {rxNotice}
                </div>
            )}

            {isDoctor && showRxPanel && (
                <div style={{ 
                    position: 'absolute', 
                    right: '20px', 
                    top: '80px', 
                    bottom: '120px',
                    width: '380px', 
                    background: 'rgba(15, 23, 42, 0.95)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.15)', 
                    borderRadius: '20px', 
                    zIndex: 40, 
                    padding: '20px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    overflowY: 'auto',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#fff' }}>Live Digital Prescription</h4>
                        <button onClick={() => setShowRxPanel(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Diagnosis</label>
                        <input placeholder="Enter diagnosis..." value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', padding: '10px', fontSize: '14px', outline: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Digital Writing Board</label>
                            <button 
                                onClick={() => whiteboardRef.current?.clear()} 
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', cursor: 'pointer' }}
                            >
                                <Trash2 size={10} style={{ marginRight: '4px' }} /> Clear
                            </button>
                        </div>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Whiteboard ref={whiteboardRef} height={180} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Medicine & Dosage</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input placeholder="Medicine" value={medicine} onChange={(e) => setMedicine(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '8px', fontSize: '13px' }} />
                                <input placeholder="Dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '8px', fontSize: '13px' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Advice / Instructions</label>
                            <textarea rows={2} placeholder="Drink water, take after food..." value={advice} onChange={(e) => setAdvice(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '8px', fontSize: '13px', resize: 'none' }} />
                        </div>
                    </div>

                    <button onClick={handleSendPrescription} disabled={sendingRx || (!medicine && !diagnosis)} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', color: 'white', borderRadius: '12px', padding: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: (sendingRx || (!medicine && !diagnosis)) ? 0.6 : 1, cursor: 'pointer', marginTop: '4px', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)' }}>
                        <Send size={16} /> {sendingRx ? 'Sending...' : 'Issue Prescription'}
                    </button>
                    <p style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', margin: 0 }}>Patient will receive this instantly in their vArogra account.</p>
                </div>
            )}
        </div>
    );
};

const ControlButton = ({ icon, active, onClick }) => (
    <button onClick={onClick} style={{
        width: '48px', height: '48px', borderRadius: '50%',
        backgroundColor: active ? 'white' : 'rgba(255,255,255,0.2)',
        color: active ? 'black' : 'white',
        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
    }}>
        {icon}
    </button>
);

export default VideoCall;
