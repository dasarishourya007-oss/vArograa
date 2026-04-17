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
    Eraser
} from 'lucide-react';
import { analyzePrescription } from '../../services/aiService';

import { useAuth } from '../../context/AuthContext';

const SmartScript = () => {
    const { user } = useAuth();
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [ctx, setCtx] = useState(null);

    // SaaS State Model
    const [state, setState] = useState({
        status: "idle", // idle, analyzing, review, confirmed
        aiConfidence: 0,
        medicines: [],
        warnings: [],
        rawText: "",
        handwrittenImageURL: null
    });



    const [isEraser, setIsEraser] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        context.strokeStyle = "#ffffff";
        context.lineWidth = 3;
        context.lineCap = "round";
        setCtx(context);

        // Save initial blank stat
        setTimeout(() => {
            const initialState = canvas.toDataURL();
            setHistory([initialState]);
            setHistoryStep(0);
        }, 100);
    }, []);

    const startDrawing = (e) => {
        setIsDrawing(true);
        const { offsetX, offsetY } = e.nativeEvent;
        // eslint-disable-next-line react-hooks/immutability
        ctx.strokeStyle = isEraser ? "#111" : "#ffffff";
        // eslint-disable-next-line react-hooks/immutability
        ctx.lineWidth = isEraser ? 20 : 3;
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = e.nativeEvent;
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        ctx.closePath();

        // Save history
        const newState = canvasRef.current.toDataURL();
        const newHistory = history.slice(0, historyStep + 1);
        setHistory([...newHistory, newState]);
        setHistoryStep(newHistory.length);
    };

    const clearCanvas = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        const newState = canvasRef.current.toDataURL();
        const newHistory = history.slice(0, historyStep + 1);
        setHistory([...newHistory, newState]);
        setHistoryStep(newHistory.length);
    };

    const undo = () => {
        if (historyStep > 0) {
            const newStep = historyStep - 1;
            setHistoryStep(newStep);
            restoreCanvas(history[newStep]);
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            const newStep = historyStep + 1;
            setHistoryStep(newStep);
            restoreCanvas(history[newStep]);
        }
    };

    const restoreCanvas = (dataUrl) => {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(img, 0, 0);
        };
    };

    const handleAnalyze = async () => {
        // Check if canvas is basically blank
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let isBlank = true;
        // Check a random sample of pixels to see if any are not black/transparent
        for (let i = 0; i < pixelData.length; i += 400) {
            if (pixelData[i] !== 0 || pixelData[i + 1] !== 0 || pixelData[i + 2] !== 0) {
                isBlank = false;
                break;
            }
        }

        if (isBlank) {
            alert("Canvas is empty! Please write a prescription first.");
            return;
        }

        setState(prev => ({ ...prev, status: "analyzing" }));

        const simulatedURL = "handwritten_mock_url_" + Date.now();

        try {
            const results = await analyzePrescription(simulatedURL);
            setState(prev => ({
                ...prev,
                status: "review",
                aiConfidence: results.aiConfidence,
                medicines: results.medicines,
                warnings: results.medicines.flatMap(m => m.warnings),
                rawText: results.rawText,
                handwrittenImageURL: simulatedURL
            }));
        } catch (error) {
            console.error("AI Analysis failed", error);
            setState(prev => ({ ...prev, status: "idle" }));
        }
    };

    const handleConfirm = async () => {
        if (!user || state.status !== "review") return;



        // await doctorService.savePrescription(prescriptionData);
        setState(prev => ({ ...prev, status: "confirmed" }));
    };

    const getConfidenceColor = (score) => {
        if (score >= 85) return "var(--available)";
        if (score >= 60) return "var(--busy)";
        return "var(--critical)";
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', background: 'linear-gradient(135deg, white 0%, var(--brand-teal) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Varogra SmartScript™ <span style={{ fontSize: '0.8rem', verticalAlign: 'middle', WebkitTextFillColor: 'var(--brand-teal)', padding: '4px 8px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '8px' }}>MedAI™ POWERED</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Advanced AI-Assisted Clinical Prescription Engine.</p>
                </div>
                {state.status === "review" && (
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>AI Confidence Score</p>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: getConfidenceColor(state.aiConfidence) }}>{state.aiConfidence}%</h2>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flex: 1, minHeight: 0 }}>
                {/* 🧾 Left: Handwritten Board */}
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <PenTool size={18} color="var(--brand-primary)" /> Handwritten Canvas
                        </h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                                <button onClick={undo} disabled={historyStep <= 0} style={{ background: 'none', border: 'none', color: historyStep <= 0 ? 'var(--text-muted)' : 'white', cursor: historyStep <= 0 ? 'not-allowed' : 'pointer', padding: '6px', borderRadius: '6px', opacity: historyStep <= 0 ? 0.5 : 1 }}>
                                    <Undo2 size={16} />
                                </button>
                                <button onClick={redo} disabled={historyStep >= history.length - 1} style={{ background: 'none', border: 'none', color: historyStep >= history.length - 1 ? 'var(--text-muted)' : 'white', cursor: historyStep >= history.length - 1 ? 'not-allowed' : 'pointer', padding: '6px', borderRadius: '6px', opacity: historyStep >= history.length - 1 ? 0.5 : 1 }}>
                                    <Redo2 size={16} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                                <button onClick={() => setIsEraser(false)} style={{ background: !isEraser ? 'rgba(99,102,241,0.2)' : 'transparent', border: !isEraser ? '1px solid var(--brand-primary)' : '1px solid transparent', color: !isEraser ? 'var(--brand-primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'all 0.2s' }}>
                                    <PenTool size={16} />
                                </button>
                                <button onClick={() => setIsEraser(true)} style={{ background: isEraser ? 'rgba(99,102,241,0.2)' : 'transparent', border: isEraser ? '1px solid var(--brand-primary)' : '1px solid transparent', color: isEraser ? 'var(--brand-primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'all 0.2s' }}>
                                    <Eraser size={16} />
                                </button>
                            </div>
                            <div style={{ width: '1px', background: 'var(--border-glass)', margin: '0 4px' }} />
                            <button onClick={clearCanvas} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--critical)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0 12px', fontWeight: '600', transition: 'all 0.2s' }}>
                                <Trash2 size={14} /> Clear
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: 1, background: '#111', borderRadius: '16px', border: '1px solid var(--border-glass)', position: 'relative', overflow: 'hidden' }}>
                        <canvas
                            ref={canvasRef}
                            width={600}
                            height={500}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseOut={stopDrawing}
                            style={{ cursor: 'crosshair', width: '100%', height: '100%' }}
                        />
                        <AnimatePresence>
                            {state.status === "analyzing" && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', backdropFilter: 'blur(4px)' }}
                                >
                                    <Loader2 size={48} className="spin" color="var(--brand-primary)" />
                                    <p style={{ fontWeight: '700', letterSpacing: '2px' }}>MEDAI™ ANALYZING...</p>
                                    <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <motion.div
                                            animate={{ x: [-200, 200] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            style={{ width: '100%', height: '100%', background: 'var(--brand-primary)' }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        className="btn-premium"
                        style={{ padding: '1.25rem', fontSize: '1.1rem', gap: '12px' }}
                        disabled={state.status === "analyzing" || state.status === "confirmed"}
                        onClick={handleAnalyze}
                    >
                        <Zap size={22} /> {state.status === "idle" ? "Analyze with MedAI™" : "Re-Analyze"}
                    </button>
                </div>

                {/* 📋 Right: AI Structured Panel */}
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <History size={18} color="var(--brand-teal)" /> AI Structured Prescription
                        </h3>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {state.status === "idle" ? (
                            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                                <PenTool size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                                <p>Write on the board and click Analyze to generate a digital prescription.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {state.medicines.map((med, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                            <div>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '4px' }}>
                                                    {med.name}
                                                    {!med.validated && <span style={{ color: 'var(--busy)', fontSize: '0.7rem', marginLeft: '8px' }}>? Uncertainty Detected</span>}
                                                </h4>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Detected as: "{med.originalName}" • {med.confidence}% confidence</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {med.warnings.map((w, j) => (
                                                    <div key={j} title={w.message}>
                                                        <AlertTriangle size={16} color={w.severity === "critical" ? "var(--critical)" : "var(--busy)"} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Dosage</label>
                                                <input
                                                    type="text"
                                                    value={med.dosage}
                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '8px', color: 'white' }}
                                                    onChange={() => { }} // Placeholder
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Strength</label>
                                                <input
                                                    type="text"
                                                    value={med.strength}
                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '8px', color: 'white' }}
                                                    onChange={() => { }} // Placeholder
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {state.warnings.length > 0 && (
                            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <AlertTriangle color="var(--critical)" size={20} />
                                <div>
                                    <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--critical)' }}>Safety Alert</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{state.warnings[0].message}</p>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="glass"
                                style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => setState(prev => ({ ...prev, status: "idle", medicines: [] }))}
                            >
                                <RefreshCcw size={16} /> Reset
                            </button>
                            <button
                                className="btn-premium"
                                style={{ flex: 2, padding: '12px', gap: '8px' }}
                                disabled={state.status !== "review" || state.warnings.some(w => w.severity === "critical")}
                                onClick={handleConfirm}
                            >
                                {state.status === "confirmed" ? (
                                    <><ShieldCheck size={20} /> Confirmed</>
                                ) : (
                                    <><CheckCircle size={20} /> Confirm & Save</>
                                )}
                            </button>
                        </div>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            By confirming, you verify the accuracy of this digital prescription. MedAI™ results are advisory and must be reviewed by the clinical specialist.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartScript;
