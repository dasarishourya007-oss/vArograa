import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PenTool,
    Zap,
    CheckCircle,
    AlertTriangle,
    RefreshCcw,
    Trash2,
    ShieldCheck,
    Search,
    ChevronRight,
    Loader2,
    Save,
    History,
    Undo2,
    Redo2,
    Eraser,
    FileText,
    Plus,
    X,
    User,
    Calendar,
    Stethoscope
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { subscribeToAppointments, sendPrescriptionToPatient, uploadPrescriptionImage } from '../../firebase/services';
import { useAuth } from '../../context/AuthContext';

const SmartScript = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const appointmentIdParam = searchParams.get('appointmentId');
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [ctx, setCtx] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    // Clinical States
    const [diagnosis, setDiagnosis] = useState("");
    const [medicines, setMedicines] = useState([{ id: Date.now(), name: "", dose: "", frequency: "", duration: "" }]);
    const [advice, setAdvice] = useState("");
    const [notes, setNotes] = useState("");

    const [isEraser, setIsEraser] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // Subscribe to patient context
    useEffect(() => {
        if (!user) return;
        const doctorId = user.uid || user.id;
        const unsub = subscribeToAppointments({ doctorId }, (list) => {
            const active = list.filter(a => 
                ['pending', 'accepted', 'completed', 'prescribed'].includes(String(a.status).toLowerCase())
            );
            setAppointments(active);
            if (appointmentIdParam) {
                setSelectedId(appointmentIdParam);
            } else if (active.length > 0 && !selectedId) {
                setSelectedId(active[0].id);
            }
        });
        return () => unsub();
    }, [user, appointmentIdParam]);

    // Canvas Init
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        context.strokeStyle = "#0f172a"; // Professional blue-black for "ink"
        context.lineWidth = 2;
        context.lineCap = "round";
        setCtx(context);

        setTimeout(() => {
            const initialState = canvas.toDataURL();
            setHistory([initialState]);
            setHistoryStep(0);
        }, 100);
    }, []);

    const startDrawing = (e) => {
        setIsDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.strokeStyle = isEraser ? "#ffffff" : "#0f172a";
        ctx.lineWidth = isEraser ? 20 : 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        ctx.closePath();
        const newState = canvasRef.current.toDataURL();
        const newHistory = history.slice(0, historyStep + 1);
        setHistory([...newHistory, newState]);
        setHistoryStep(newHistory.length);
    };

    const addMedicine = () => {
        setMedicines([...medicines, { id: Date.now(), name: "", dose: "", frequency: "", duration: "" }]);
    };

    const removeMedicine = (id) => {
        if (medicines.length > 1) {
            setMedicines(medicines.filter(m => m.id !== id));
        }
    };

    const updateMedicine = (id, field, value) => {
        setMedicines(medicines.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    // Baking Logic: Combine text fields and canvas into one PNG
    const bakePrescription = async () => {
        const appointment = appointments.find(a => a.id === selectedId);
        
        // Create high-res offscreen canvas
        const bakeCanvas = document.createElement('canvas');
        bakeCanvas.width = 800; // Standard High-Res Width
        bakeCanvas.height = 1100; // Standard A4 Aspect
        const bCtx = bakeCanvas.getContext('2d');

        // 1. Draw Paper Background
        bCtx.fillStyle = '#ffffff';
        bCtx.fillRect(0, 0, bakeCanvas.width, bakeCanvas.height);

        // 2. Headings & Branding
        bCtx.fillStyle = '#0d9488'; // Brand Teal
        bCtx.font = 'bold 28px Inter, sans-serif';
        bCtx.fillText('vArogra clinical ecosystem', 40, 60);
        
        bCtx.fillStyle = '#64748b';
        bCtx.font = '14px Inter, sans-serif';
        bCtx.fillText(`HOSPITAL: ${user?.hospitalName || 'vArogra Partner Hub'}`, 40, 90);
        
        bCtx.fillStyle = '#0f172a';
        bCtx.font = 'bold 20px Inter, sans-serif';
        bCtx.fillText(`Dr. ${user?.displayName || 'Specialist'}`, 40, 130);
        bCtx.font = '14px Inter, sans-serif';
        bCtx.fillText('Clinical Specialist | ID: ' + (user?.uid?.slice(0,8) || 'VERIFIED'), 40, 155);

        bCtx.strokeStyle = '#e2e8f0';
        bCtx.lineWidth = 1;
        bCtx.beginPath();
        bCtx.moveTo(40, 180);
        bCtx.lineTo(760, 180);
        bCtx.stroke();

        // 3. Patient Details
        const patientName = appointment?.patientName || 'Clinical Patient';
        bCtx.font = 'bold 16px Inter, sans-serif';
        bCtx.fillText(`PATIENT: ${patientName}`, 40, 210);
        
        const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        bCtx.font = '14px Inter, sans-serif';
        bCtx.textAlign = 'right';
        bCtx.fillText(`DATE: ${dateStr}`, 760, 210);
        bCtx.textAlign = 'left';

        // 4. Clinical Content
        bCtx.fillStyle = '#0f172a';
        bCtx.font = 'bold 18px Inter, sans-serif';
        bCtx.fillText('DIAGNOSIS:', 40, 260);
        bCtx.font = '16px Inter, sans-serif';
        bCtx.fillText(diagnosis || 'Observation session conducted.', 40, 290);

        bCtx.font = 'bold 18px Inter, sans-serif';
        bCtx.fillText('MEDICATIONS (Rx):', 40, 350);
        
        let yPos = 380;
        medicines.forEach((med, i) => {
            if (med.name) {
                bCtx.font = 'bold 16px Inter, sans-serif';
                bCtx.fillText(`${i + 1}. ${med.name}`, 60, yPos);
                bCtx.font = '14px Inter, sans-serif';
                bCtx.fillText(`   ${med.dose} | ${med.frequency} | ${med.duration}`, 60, yPos + 22);
                yPos += 50;
            }
        });

        // 5. Notes Overlay
        if (notes) {
            yPos += 20;
            bCtx.font = 'bold 18px Inter, sans-serif';
            bCtx.fillText('ADDITIONAL NOTES:', 40, yPos);
            bCtx.font = '14px Inter, sans-serif';
            bCtx.fillText(notes, 40, yPos + 30);
        }

        // 6. Draw the Drawing Canvas on top (the scribbles)
        // We'll scale it to fit the bottom half or integrated position
        const drawImg = new Image();
        drawImg.src = canvasRef.current.toDataURL();
        await new Promise(r => drawImg.onload = r);
        
        // Draw the handwritten layer at the bottom-ish
        bCtx.drawImage(drawImg, 40, 600, 720, 450);

        return bakeCanvas.toDataURL('image/png');
    };

    const handleSend = async () => {
        if (!selectedId || isSaving) return;
        const appointment = appointments.find(a => a.id === selectedId);
        if (!appointment) return;

        setIsSaving(true);
        try {
            // 1. Bake
            const finalImage = await bakePrescription();
            
            // 2. Upload to Storage
            const patientId = appointment.patientId || appointment.uid;
            const imageUrl = await uploadPrescriptionImage(patientId, finalImage);

            // 3. Save Record to Firestore
            await sendPrescriptionToPatient({
                appointmentId: appointment.id,
                patientId: patientId,
                patientName: appointment.patientName,
                doctor: user,
                diagnosis,
                medicines: medicines.filter(m => m.name),
                notes,
                advice,
                imageUrl // New persistent URL from Storage
            });

            alert("Prescription has been professionally synthesized and sent to the patient.");
            navigate('/dashboard/doctor');
        } catch (err) {
            console.error("Prescription dispatch failed:", err);
            alert("Crisis: Failed to dispatch prescription. Check connection.");
        } finally {
            setIsSaving(false);
        }
    };

    const activePatient = appointments.find(a => a.id === selectedId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Stethoscope color="var(--brand-teal)" size={32} /> SmartScript™ <span style={{ fontSize: '0.8rem', fontWeight: '800', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--brand-teal)', padding: '4px 12px', borderRadius: '100px' }}>CLINICAL SYNTHESIS</span>
                    </h1>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>ACTIVE CLINICAL CASE</span>
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="glass"
                            style={{ padding: '10px 16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'white', fontWeight: 700, minWidth: '280px' }}
                        >
                            {appointments.map(a => (
                                <option key={a.id} value={a.id}>{a.patientName} (Token #{a.token || '?'})</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 450px) 1fr', gap: '2rem', flex: 1 }}>
                
                {/* 📝 Left Sidebar: Clinical Inputs */}
                <div className="glass" style={{ padding: '2rem', borderRadius: '32px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '2rem', height: 'fit-content' }}>
                    
                    <section>
                        <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={18} color="var(--brand-teal)" /> Clinical Findings
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px', display: 'block' }}>DIAGNOSIS</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter primary diagnosis..."
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontWeight: 600 }}
                                />
                            </div>
                            
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>MEDICATIONS (Rx)</label>
                                    <button onClick={addMedicine} style={{ background: 'none', border: 'none', color: 'var(--brand-teal)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                                        <Plus size={14} /> Add
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {medicines.map((med, idx) => (
                                        <div key={med.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border-glass)', position: 'relative' }}>
                                            <button onClick={() => removeMedicine(med.id)} style={{ position: 'absolute', right: '8px', top: '8px', background: 'none', border: 'none', color: 'var(--critical)', cursor: 'pointer', opacity: 0.5 }}>
                                                <X size={14} />
                                            </button>
                                            <input 
                                                placeholder="Medicine name" 
                                                value={med.name}
                                                onChange={(e) => updateMedicine(med.id, 'name', e.target.value)}
                                                style={{ width: '90%', background: 'none', border: 'none', borderBottom: '1px solid var(--border-glass)', color: 'white', fontWeight: 700, marginBottom: '8px', padding: '4px 0' }}
                                            />
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                <input placeholder="Dose" value={med.dose} onChange={(e) => updateMedicine(med.id, 'dose', e.target.value)} style={{ fontSize: '0.75rem', background: 'var(--bg-main)', border: 'none', padding: '6px', borderRadius: '6px', color: 'white' }} />
                                                <input placeholder="Freq" value={med.frequency} onChange={(e) => updateMedicine(med.id, 'frequency', e.target.value)} style={{ fontSize: '0.75rem', background: 'var(--bg-main)', border: 'none', padding: '6px', borderRadius: '6px', color: 'white' }} />
                                                <input placeholder="Dur" value={med.duration} onChange={(e) => updateMedicine(med.id, 'duration', e.target.value)} style={{ fontSize: '0.75rem', background: 'var(--bg-main)', border: 'none', padding: '6px', borderRadius: '6px', color: 'white' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px', display: 'block' }}>CLINICAL NOTES</label>
                                <textarea 
                                    placeholder="Any additional internal notes or advice..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontWeight: 600, minHeight: '100px', resize: 'none' }}
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* 📜 Center: White Prescription Paper */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setIsEraser(false)} className="glass" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: !isEraser ? 'var(--brand-teal)' : 'var(--bg-card)', color: !isEraser ? 'white' : 'var(--text-muted)', fontWeight: 700, transition: 'all 0.3s' }}>
                                <PenTool size={18} /> Pen
                            </button>
                            <button onClick={() => setIsEraser(true)} className="glass" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: isEraser ? 'var(--critical)' : 'var(--bg-card)', color: isEraser ? 'white' : 'var(--text-muted)', fontWeight: 700, transition: 'all 0.3s' }}>
                                <Eraser size={18} /> Eraser
                            </button>
                        </div>
                        <button onClick={() => {
                            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                            setHistory([canvasRef.current.toDataURL()]);
                            setHistoryStep(0);
                        }} style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.6)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Trash2 size={14} /> Clear Drawing
                        </button>
                    </div>

                    <div className="prescription-paper" style={{ 
                        flex: 1, 
                        background: 'white', 
                        borderRadius: '4px', // Hard paper look
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        color: '#0f172a',
                        overflow: 'hidden',
                        minHeight: '800px'
                    }}>
                        {/* Paper Overlay Logic: Preview of what will be baked */}
                        <div style={{ padding: '3rem', pointerEvents: 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0d9488', marginBottom: '5px' }}>vArogra Healthcare</h2>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.6 }}>{user?.hospitalName || 'HUB VERIFIED SPECIALIST'}</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '20px' }}>Dr. {user?.displayName}</p>
                                    <p style={{ fontSize: '0.7rem' }}>Clinical Specialist | ID: {user?.uid?.slice(0, 8)}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ background: '#f8fafc', padding: '10px 20px', borderRadius: '10px', display: 'inline-block' }}>
                                        <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Clinical Date</p>
                                        <p style={{ fontSize: '1rem', fontWeight: 800 }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Patient Details</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{activePatient?.patientName || 'Clinical Case'}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Token Reference</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>#{activePatient?.token || '?'}</p>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Primary Diagnosis</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{diagnosis || '---'}</p>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '15px' }}>Prescribed Medications (Rx)</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {medicines.map((m, i) => m.name && (
                                        <div key={m.id}>
                                            <p style={{ fontWeight: 800, fontSize: '1rem' }}>{i + 1}. {m.name}</p>
                                            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{m.dose} | {m.frequency} | {m.duration}</p>
                                        </div>
                                    ))}
                                    {!medicines.some(m => m.name) && <p style={{ opacity: 0.3 }}>No digital medications entries.</p>}
                                </div>
                            </div>
                        </div>

                        {/* Interactive Canvas Overlay (Handwritten Signature/Notes) */}
                        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                             <canvas
                                ref={canvasRef}
                                width={800}
                                height={1000}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseOut={stopDrawing}
                                style={{ cursor: 'crosshair', width: '100%', height: '100%' }}
                            />
                        </div>

                        <div style={{ position: 'absolute', bottom: '40px', left: '40px', opacity: 0.2, fontSize: '0.5rem', pointerEvents: 'none' }}>
                            Synthesized via vArogra SmartScript™ Verified Clinical Signature Required
                        </div>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={isSaving || !selectedId}
                        className="btn-premium"
                        style={{ padding: '1.5rem', fontSize: '1.25rem', gap: '15px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
                    >
                        {isSaving ? (
                            <><Loader2 className="spin" /> Dispatching Professional Prescription...</>
                        ) : (
                            <><CheckCircle size={24} /> Authenticate & Send to Patient</>
                        )}
                        <AnimatePresence>
                            {isSaving && (
                                <motion.div
                                    animate={{ x: ['0%', '100%'] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', width: '50%' }}
                                />
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SmartScript;
