import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw, Trash2, Save, Download, LucideArrowLeft, FileText } from 'lucide-react';

const WritingBoard = ({ onSave, initialData }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;

        // Load initial data if any
        if (initialData) {
            const image = new Image();
            image.src = initialData;
            image.onload = () => ctx.drawImage(image, 0, 0);
        }

        // Set canvas size based on parent container
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight || 400;
                
                // Redraw last state after resize
                if (history.length > 0) {
                  const image = new Image();
                  image.src = history[history.length - 1];
                  image.onload = () => ctx.drawImage(image, 0, 0);
                }
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [initialData]);

    const startDrawing = (e) => {
        const { offsetX, offsetY } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
        saveState();
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches[0]) {
            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top
            };
        }
        return {
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY
        };
    };

    const saveState = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setHistory([...history, canvas.toDataURL()]);
        setRedoStack([]);
    };

    const undo = () => {
        if (history.length === 0) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        setRedoStack([...redoStack, canvas.toDataURL()]);
        const newHistory = history.slice(0, -1);
        setHistory(newHistory);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (newHistory.length > 0) {
            const image = new Image();
            image.src = newHistory[newHistory.length - 1];
            image.onload = () => ctx.drawImage(image, 0, 0);
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHistory([]);
        setRedoStack([]);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        if (onSave) onSave(dataUrl);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-inner min-h-[400px]">
            <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200">
                <div className="flex gap-2">
                    <button
                        onClick={undo}
                        type="button"
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
                        title="Undo"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button
                        onClick={clear}
                        type="button"
                        className="p-2 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                        title="Clear"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm"
                    >
                        <Save size={14} /> Send Prescription
                    </button>
                </div>
            </div>
            <div className="flex-1 relative cursor-crosshair touch-none overflow-hidden" style={{ minHeight: '350px' }}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="absolute inset-0 w-full h-full"
                    style={{ background: '#f8fafc', touchAction: 'none' }}
                />
            </div>
            <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <FileText size={10} /> Digital Prescription Pad
            </div>
        </div>
    );
};

export default WritingBoard;
