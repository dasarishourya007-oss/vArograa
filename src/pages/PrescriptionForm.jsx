import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { ArrowLeft, Pill, Clock, FileText, Save, Trash2 } from 'lucide-react';
import Whiteboard from '../components/Whiteboard';
import { sendPrescriptionToPatient } from '../firebase/services';

const PrescriptionForm = () => {
    const { id } = useParams(); // Appointment ID
    const navigate = useNavigate();
    const { appointments, user } = useAuth();
    const whiteboardRef = useRef(null);

    const appointment = appointments.find(a => a.id === id);

    const [medicine, setMedicine] = useState('');
    const [dosage, setDosage] = useState('1-0-1'); // Morning-Afternoon-Night
    const [duration, setDuration] = useState('3 Days');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!appointment) return <div>Appointment not found</div>;

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const whiteboardDataUrl = whiteboardRef.current?.getDataUrl();
            
            await sendPrescriptionToPatient({
                appointmentId: id,
                appointment: appointment,
                doctor: user,
                diagnosis: '', // Could add a diagnosis field if needed
                medicines: [{
                    name: medicine,
                    dose: dosage,
                    duration: duration,
                    instructions: notes
                }],
                advice: notes,
                whiteboardDataUrl
            });

            alert('Prescription Sent Successfully!');
            navigate(-1);
        } catch (error) {
            console.error('Error sending prescription:', error);
            alert('Failed to send prescription. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>
            <header style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', padding: '8px', marginRight: '8px', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft size={24} color="#333" />
                </button>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Write Prescription</h1>
            </header>

            <div style={{ backgroundColor: '#f0f4f8', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #d1d9e6' }}>
                <p style={{ fontSize: '12px', color: '#666', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PATIENT</p>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a202c' }}>{appointment.patientName || appointment.userId}</h2>
                <p style={{ fontSize: '14px', color: '#4a5568', marginTop: '4px' }}>
                    Visit: {appointment.appointmentType || 'General Consultation'}
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontWeight: 'bold', display: 'flex', gap: '8px', fontSize: '14px', color: '#2d3748' }}>
                            <FileText size={18} color="var(--primary)" /> Digital Writing Board
                        </label>
                        <button 
                            type="button"
                            onClick={() => whiteboardRef.current?.clear()}
                            style={{ background: '#edf2f7', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <Trash2 size={12} /> Clear Board
                        </button>
                    </div>
                    <div style={{ border: '2px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <Whiteboard 
                            ref={whiteboardRef} 
                            height={250} 
                            background="#ffffff"
                            strokeStyle="#000000"
                            lineWidth={2}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2d3748', borderBottom: '1px solid #edf2f7', paddingBottom: '10px', marginBottom: '5px' }}>Medicine Details</h3>
                    
                    <div className="flex-col" style={{ gap: '6px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#4a5568' }}>Medicine Name</label>
                        <input
                            required
                            placeholder="e.g., Paracetamol 500mg"
                            value={medicine}
                            onChange={e => setMedicine(e.target.value)}
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="flex-col" style={{ gap: '6px' }}>
                            <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#4a5568' }}>Dosage (M-A-N)</label>
                            <select
                                value={dosage}
                                onChange={e => setDosage(e.target.value)}
                                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', background: 'white', outline: 'none' }}
                            >
                                <option value="1-0-1">1-0-1</option>
                                <option value="1-1-1">1-1-1</option>
                                <option value="1-0-0">1-0-0</option>
                                <option value="0-0-1">0-0-1</option>
                                <option value="SOS">SOS</option>
                            </select>
                        </div>

                        <div className="flex-col" style={{ gap: '6px' }}>
                            <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#4a5568' }}>Duration</label>
                            <input
                                placeholder="e.g., 5 Days"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div className="flex-col" style={{ gap: '6px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#4a5568' }}>Advice / Instructions</label>
                        <textarea
                            placeholder="Take after food. Avoid cold drinks..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', minHeight: '80px', outline: 'none', resize: 'vertical' }}
                        />
                    </div>
                </div>

                <div style={{ position: 'fixed', bottom: '0', left: '0', right: '0', padding: '16px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', zIndex: 100 }}>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{ 
                            width: '100%', 
                            maxWidth: '560px', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            background: 'var(--primary)', 
                            color: 'white', 
                            fontWeight: 'bold', 
                            fontSize: '16px', 
                            border: 'none', 
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)'
                        }}
                    >
                        {isSubmitting ? 'Sending...' : <><Save size={20} /> Send Prescription to Patient</>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PrescriptionForm;
