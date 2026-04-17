import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Save,
    Share2,
    Lock,
    History,
    ChevronDown,
    User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';

const SharedNotepad = () => {
    const { user } = useAuth();
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [noteContent, setNoteContent] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [isShared, setIsShared] = useState(false);
    const [notesHistory, setNotesHistory] = useState([]);
    const [patients, setPatients] = useState([]);
    const [showPatientList, setShowPatientList] = useState(false);

    useEffect(() => {
        if (!user) return;
        // In a real app, this would be a filtered list of doctor's patients
        const mockPatients = [
            { id: 'pt-001', name: 'John Doe', age: 34 },
            { id: 'pt-002', name: 'Jane Smith', age: 28 },
            { id: 'pt-003', name: 'Robert Brown', age: 45 },
        ];
        setPatients(mockPatients);
    }, [user]);

    useEffect(() => {
        if (!user || !selectedPatient) {
            setNotesHistory([]);
            return;
        }

        const unsubscribe = doctorService.subscribeToNotes(user.uid, selectedPatient.id, (notes) => {
            setNotesHistory(notes);
        });

        return () => unsubscribe();
    }, [user, selectedPatient]);

    const handleSave = async () => {
        if (!selectedPatient || !noteContent.trim()) return;

        const noteData = {
            doctorId: user.uid,
            doctorName: user.displayName || 'Dr. Alpha',
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            title: noteTitle || 'Follow-up Advice',
            content: noteContent,
            visibility: isShared ? 'shared' : 'private'
        };

        await doctorService.saveNote(noteData);
        setNoteContent('');
        setNoteTitle('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Shared Doctor Notepad</h1>
                <p style={{ color: 'var(--text-muted)' }}>Write notes that sync in real-time with the patient portal.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', height: 'calc(100vh - 250px)' }}>
                {/* Editor Area */}
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Patient Selector */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowPatientList(!showPatientList)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border-glass)',
                                borderRadius: '12px',
                                color: 'white',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <User size={18} color="var(--brand-primary)" />
                                <span>{selectedPatient ? selectedPatient.name : 'Select Patient'}</span>
                            </div>
                            <ChevronDown size={18} />
                        </button>

                        <AnimatePresence>
                            {showPatientList && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        marginTop: '8px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-glass)',
                                        borderRadius: '12px',
                                        zIndex: 10,
                                        boxShadow: 'var(--shadow-lg)',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {patients.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedPatient(p);
                                                setShowPatientList(false);
                                            }}
                                            style={{ padding: '12px 16px', cursor: 'pointer', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.1)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            {p.name}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Title Area */}
                    <input
                        type="text"
                        placeholder="Title: e.g., Follow-up Advice"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', fontWeight: '700', color: 'white', outline: 'none', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}
                    />

                    {/* Editor Area */}
                    <textarea
                        placeholder="Type medication advice, follow-up instructions, or diet plans here..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        style={{ flex: 1, background: 'none', border: 'none', fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', resize: 'none', outline: 'none', lineHeight: '1.6' }}
                    />

                    {/* Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setIsShared(false)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    background: !isShared ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    border: !isShared ? '1px solid var(--brand-primary)' : '1px solid transparent',
                                    color: !isShared ? 'var(--brand-primary)' : 'var(--text-muted)',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Lock size={14} /> Private
                            </button>
                            <button
                                onClick={() => setIsShared(true)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    background: isShared ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                    border: isShared ? '1px solid var(--brand-teal)' : '1px solid transparent',
                                    color: isShared ? 'var(--brand-teal)' : 'var(--text-muted)',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Share2 size={14} /> Shared
                            </button>
                        </div>

                        <button
                            className="btn-premium"
                            style={{ padding: '12px 32px' }}
                            onClick={handleSave}
                            disabled={!selectedPatient || !noteContent.trim()}
                        >
                            Save & {isShared ? 'Share' : 'Archive'}
                        </button>
                    </div>
                </div>

                {/* History Timeline */}
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', overflowY: 'auto' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <History size={18} /> Notes History
                    </h3>

                    {notesHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                            <FileText size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                            <p>No notes found for this patient.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {notesHistory.map((note) => (
                                <div key={note.id} style={{ position: 'relative', paddingLeft: '24px' }}>
                                    <div style={{ position: 'absolute', left: 0, top: '8px', width: '8px', height: '8px', borderRadius: '50%', background: note.visibility === 'shared' ? 'var(--brand-teal)' : 'var(--brand-primary)' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{note.title}</h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {note.createdAt?.toDate().toLocaleDateString() || 'Today'}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {note.content}
                                    </p>
                                    <div style={{ marginTop: '8px', fontSize: '0.7rem', color: note.visibility === 'shared' ? 'var(--brand-teal)' : 'var(--brand-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {note.visibility}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SharedNotepad;
