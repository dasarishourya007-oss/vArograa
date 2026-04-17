import React, { useState } from 'react';
import {
    Search,
    User,
    ChevronRight,
    Activity,
    Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Patient Dataset (20 patients) ───────────────────────────────────────────
const ALL_PATIENTS = [
    {
        id: 1, name: 'John Doe', age: 34, gender: 'Male', bloodGroup: 'O+',
        patientId: 'PT-8892', condition: 'Hypertension',
        diagnosis: 'Essential Hypertension', medications: 'Amlodipine 5mg', allergies: 'None Reported',
        timeline: [
            { date: 'Feb 20, 2026', type: 'Clinical Consultation', notes: 'BP elevated (150/95). Prescribed Amlodipine.', doctor: 'Dr. Sarah Wilson' },
            { date: 'Jan 12, 2026', type: 'Lab Test Review', notes: 'CBC and Metabolic panel within normal range.', doctor: 'Dr. Mike Chen' },
            { date: 'Dec 05, 2025', type: 'Initial Screening', notes: 'Patient reported occasional dizziness.', doctor: 'Dr. Sarah Wilson' },
        ],
    },
    {
        id: 2, name: 'Jane Smith', age: 28, gender: 'Female', bloodGroup: 'A+',
        patientId: 'PT-4421', condition: 'Type 2 Diabetes',
        diagnosis: 'Type 2 Diabetes Mellitus', medications: 'Metformin 500mg', allergies: 'Penicillin',
        timeline: [
            { date: 'Feb 18, 2026', type: 'Endocrinology Review', notes: 'HbA1c at 7.2%. Continue Metformin, add diet management.', doctor: 'Dr. Priya Shah' },
            { date: 'Jan 05, 2026', type: 'Lab Test Review', notes: 'Fasting glucose slightly elevated at 130 mg/dL.', doctor: 'Dr. Priya Shah' },
            { date: 'Nov 10, 2025', type: 'Initial Diagnosis', notes: 'Patient presented with polyuria and fatigue.', doctor: 'Dr. Priya Shah' },
        ],
    },
    {
        id: 3, name: 'Robert Brown', age: 45, gender: 'Male', bloodGroup: 'B+',
        patientId: 'PT-6673', condition: 'Acute Bronchitis',
        diagnosis: 'Acute Bronchitis', medications: 'Azithromycin 500mg, Salbutamol inhaler', allergies: 'Sulfa drugs',
        timeline: [
            { date: 'Feb 10, 2026', type: 'Pulmonology Review', notes: 'Wheezing reduced. Inhaler use as needed.', doctor: 'Dr. James Reed' },
            { date: 'Jan 28, 2026', type: 'Clinical Consultation', notes: 'Persistent cough for 3 weeks. Chest X-ray clear.', doctor: 'Dr. James Reed' },
            { date: 'Jan 15, 2026', type: 'Initial Visit', notes: 'Patient presented with cough and low-grade fever (99.2°F).', doctor: 'Dr. Mike Chen' },
        ],
    },
    {
        id: 4, name: 'Alice Williams', age: 25, gender: 'Female', bloodGroup: 'AB+',
        patientId: 'PT-3310', condition: 'Seasonal Allergies',
        diagnosis: 'Allergic Rhinitis', medications: 'Cetirizine 10mg', allergies: 'Pollen, Dust Mites',
        timeline: [
            { date: 'Feb 05, 2026', type: 'Follow-up', notes: 'Symptoms well-controlled with antihistamines.', doctor: 'Dr. Sarah Wilson' },
            { date: 'Oct 20, 2025', type: 'Allergy Test', notes: 'Positive for pollen and dust mites. Initiated Cetirizine.', doctor: 'Dr. Sarah Wilson' },
            { date: 'Sep 02, 2025', type: 'Initial Screening', notes: 'Sneezing, runny nose, and itchy eyes reported.', doctor: 'Dr. Sarah Wilson' },
        ],
    },
    {
        id: 5, name: 'Michael Davis', age: 52, gender: 'Male', bloodGroup: 'O-',
        patientId: 'PT-2208', condition: 'Coronary Artery Disease',
        diagnosis: 'Stable Coronary Artery Disease', medications: 'Aspirin 75mg, Atorvastatin 40mg', allergies: 'None Reported',
        timeline: [
            { date: 'Feb 22, 2026', type: 'Cardiology Review', notes: 'ECG stable. Advised lifestyle modification.', doctor: 'Dr. Anjali Kumar' },
            { date: 'Jan 08, 2026', type: 'Stress Test', notes: 'Mild ST changes on exertion. Managed conservatively.', doctor: 'Dr. Anjali Kumar' },
            { date: 'Nov 15, 2025', type: 'Initial Consultation', notes: 'Chest tightness on exertion. Risk factors: smoking history.', doctor: 'Dr. Anjali Kumar' },
        ],
    },
    {
        id: 6, name: 'Sara Connor', age: 31, gender: 'Female', bloodGroup: 'A-',
        patientId: 'PT-5509', condition: 'Migraine',
        diagnosis: 'Chronic Migraine', medications: 'Sumatriptan 50mg, Propranolol 20mg', allergies: 'Aspirin',
        timeline: [
            { date: 'Feb 25, 2026', type: 'Neurology Review', notes: 'Migraine frequency reduced to 2 per month. Continue current regimen.', doctor: 'Dr. Nina Mehta' },
            { date: 'Dec 18, 2025', type: 'Follow-up', notes: 'Severe episode reported. Dosage of Sumatriptan adjusted.', doctor: 'Dr. Nina Mehta' },
            { date: 'Oct 01, 2025', type: 'Initial Diagnosis', notes: 'Patient reports bilateral throbbing headaches 2-3x/week.', doctor: 'Dr. Nina Mehta' },
        ],
    },
    {
        id: 7, name: 'Tom Hardy', age: 39, gender: 'Male', bloodGroup: 'B-',
        patientId: 'PT-7741', condition: 'Kidney Stones',
        diagnosis: 'Nephrolithiasis (Calcium Oxalate)', medications: 'Tamsulosin 0.4mg', allergies: 'None Reported',
        timeline: [
            { date: 'Feb 25, 2026', type: 'Urology Follow-up', notes: 'Stone passed naturally. No further intervention needed.', doctor: 'Dr. Ravi Nair' },
            { date: 'Feb 12, 2026', type: 'CT Scan Review', notes: '4mm stone in left ureter. Conservative management.', doctor: 'Dr. Ravi Nair' },
            { date: 'Feb 08, 2026', type: 'Emergency Visit', notes: 'Severe flank pain and hematuria. CT ordered.', doctor: 'Dr. Mike Chen' },
        ],
    },
    {
        id: 8, name: 'Nina Patel', age: 22, gender: 'Female', bloodGroup: 'O+',
        patientId: 'PT-9902', condition: 'Iron Deficiency Anemia',
        diagnosis: 'Iron Deficiency Anemia', medications: 'Ferrous Sulfate 325mg', allergies: 'None Reported',
        timeline: [
            { date: 'Feb 25, 2026', type: 'Follow-up', notes: 'Hemoglobin improved to 11.5 g/dL. Continue iron supplements.', doctor: 'Dr. Sarah Wilson' },
            { date: 'Jan 20, 2026', type: 'Lab Review', notes: 'Hb 9.8 g/dL. Ferritin low. Started oral iron therapy.', doctor: 'Dr. Sarah Wilson' },
            { date: 'Jan 05, 2026', type: 'Initial Visit', notes: 'Patient complaints of fatigue and pallor. Labs ordered.', doctor: 'Dr. Sarah Wilson' },
        ],
    },
    {
        id: 9, name: 'Chris Evans', age: 41, gender: 'Male', bloodGroup: 'A+',
        patientId: 'PT-1135', condition: 'Lumbar Disc Herniation',
        diagnosis: 'L4-L5 Lumbar Disc Herniation', medications: 'Ibuprofen 400mg, Muscle relaxants', allergies: 'None Reported',
        timeline: [
            { date: 'Feb 24, 2026', type: 'Orthopaedics Review', notes: 'Pain reduced. MRI shows partial resorption of disc material.', doctor: 'Dr. Arjun Sharma' },
            { date: 'Jan 17, 2026', type: 'Physiotherapy', notes: '6 sessions completed. Range of motion improving.', doctor: 'Dr. Arjun Sharma' },
            { date: 'Jan 02, 2026', type: 'Initial Consultation', 'notes': 'Severe back pain radiating to left leg. MRI ordered.', doctor: 'Dr. Arjun Sharma' },
        ],
    },
    {
        id: 10, name: 'Diana Prince', age: 36, gender: 'Female', bloodGroup: 'AB-',
        patientId: 'PT-6648', condition: 'PCOS',
        diagnosis: 'Polycystic Ovary Syndrome', medications: 'Metformin 500mg, OCP', allergies: 'Latex',
        timeline: [
            { date: 'Feb 24, 2026', type: 'Gynaecology Review', notes: 'Cycle regularizing. Ultrasound shows reduction in cyst count.', doctor: 'Dr. Priya Shah' },
            { date: 'Dec 10, 2025', type: 'Hormonal Panel', notes: 'LH:FSH ratio elevated. Testosterone mildly raised.', doctor: 'Dr. Priya Shah' },
            { date: 'Nov 05, 2025', type: 'Initial Diagnosis', notes: 'Irregular periods, acne, and weight gain reported.', doctor: 'Dr. Priya Shah' },
        ],
    },
    {
        id: 11, name: 'Bruce Wayne', age: 48, gender: 'Male', bloodGroup: 'B+',
        patientId: 'PT-3388', condition: 'Insomnia',
        diagnosis: 'Chronic Insomnia Disorder', medications: 'Melatonin 3mg, Cognitive Behavioural Therapy', allergies: 'None Reported',
        timeline: [
            { date: 'Feb 24, 2026', type: 'Psychiatry Review', notes: 'Sleep quality improved. Reducing Melatonin dosage.', doctor: 'Dr. Nina Mehta' },
            { date: 'Jan 22, 2026', type: 'Follow-up', notes: 'Sleep diary reviewed. 4-5 hrs/night. CBT session 3 completed.', doctor: 'Dr. Nina Mehta' },
            { date: 'Dec 20, 2025', type: 'Initial Assessment', notes: 'Patient reports difficulty initiating and maintaining sleep.', doctor: 'Dr. Nina Mehta' },
        ],
    },
    {
        id: 12, name: 'Clark Kent', age: 30, gender: 'Male', bloodGroup: 'O+',
        patientId: 'PT-2271', condition: 'Hyperthyroidism',
        diagnosis: 'Graves Disease (Hyperthyroidism)', medications: 'Carbimazole 10mg', allergies: 'None Reported',
        timeline: [
            { date: 'Feb 24, 2026', type: 'Endocrinology Review', notes: 'TSH normalizing at 1.8 mIU/L. Continue current dose.', doctor: 'Dr. Priya Shah' },
            { date: 'Jan 30, 2026', type: 'Thyroid Function Test', 'notes': 'TSH suppressed. Free T4 elevated. Started Carbimazole.', doctor: 'Dr. Priya Shah' },
            { date: 'Jan 18, 2026', type: 'Initial Visit', notes: 'Palpitations, weight loss, tremors, and heat intolerance.', doctor: 'Dr. Priya Shah' },
        ],
    },
    {
        id: 13, name: 'Lena Rao', age: 27, gender: 'Female', bloodGroup: 'A+',
        patientId: 'PT-4459', condition: 'Eczema',
        diagnosis: 'Atopic Dermatitis (Moderate)', medications: 'Tacrolimus ointment 0.1%, Loratadine 10mg', allergies: 'Nickel, Fragrance',
        timeline: [
            { date: 'Feb 27, 2026', type: 'Dermatology Review', notes: 'Skin significantly cleared. Taper Tacrolimus to alternate days.', doctor: 'Dr. Ravi Nair' },
            { date: 'Feb 01, 2026', type: 'Follow-up', notes: 'Flare-up on hands. Added topical therapy.', doctor: 'Dr. Ravi Nair' },
            { date: 'Jan 10, 2026', type: 'Initial Consultation', 'notes': 'Chronic itchy rash on hands and inner elbows since childhood.', doctor: 'Dr. Ravi Nair' },
        ],
    },
    {
        id: 14, name: 'James Watt', age: 55, gender: 'Male', bloodGroup: 'B+',
        patientId: 'PT-8814', condition: 'Type 2 Diabetes',
        diagnosis: 'Type 2 Diabetes with Neuropathy', medications: 'Glipizide 5mg, Pregabalin 75mg', allergies: 'Morphine',
        timeline: [
            { date: 'Feb 27, 2026', type: 'Blood Test Review', notes: 'HbA1c 8.1%. Tingling in feet improving on Pregabalin.', doctor: 'Dr. Anjali Kumar' },
            { date: 'Jan 15, 2026', type: 'Neurology Consult', notes: 'Peripheral neuropathy confirmed. Pregabalin initiated.', doctor: 'Dr. Nina Mehta' },
            { date: 'Dec 01, 2025', type: 'Initial Consultation', 'notes': 'Known diabetic for 10 years. Numbness in feet for 3 months.', doctor: 'Dr. Anjali Kumar' },
        ],
    },
    {
        id: 15, name: 'Meera Kapoor', age: 33, gender: 'Female', bloodGroup: 'O+',
        patientId: 'PT-5532', condition: 'Sinusitis',
        diagnosis: 'Chronic Sinusitis', medications: 'Amoxicillin-Clavulanate 875mg, Fluticasone nasal spray', allergies: 'None Reported',
        timeline: [
            { date: 'Feb 27, 2026', type: 'ENT Consultation', notes: 'Nasal endoscopy normal. Continue nasal spray for 3 months.', doctor: 'Dr. James Reed' },
            { date: 'Jan 28, 2026', type: 'Follow-up', notes: 'Pressure headache and post-nasal drip persisting.', doctor: 'Dr. James Reed' },
            { date: 'Jan 12, 2026', type: 'Initial Visit', notes: 'Thick nasal discharge, facial pain for 6 weeks.', doctor: 'Dr. Mike Chen' },
        ],
    },
    {
        id: 16, name: 'Alan Grant', age: 60, gender: 'Male', bloodGroup: 'AB+',
        patientId: 'PT-7763', condition: 'Osteoarthritis',
        diagnosis: 'Knee Osteoarthritis (Bilateral)', medications: 'Diclofenac Gel, Glucosamine 1500mg', allergies: 'Aspirin',
        timeline: [
            { date: 'Feb 27, 2026', type: 'Orthopaedics Review', notes: 'Pain VAS score 4/10. Walking aids helping. Defer surgery.', doctor: 'Dr. Arjun Sharma' },
            { date: 'Feb 03, 2026', type: 'Physiotherapy', notes: 'Strength exercises started. 10 sessions recommended.', doctor: 'Dr. Arjun Sharma' },
            { date: 'Jan 20, 2026', type: 'X-Ray Review', notes: 'Grade III OA bilateral knees. Joint space narrowing.', doctor: 'Dr. Arjun Sharma' },
        ],
    },
    {
        id: 17, name: 'Elena Mir', age: 29, gender: 'Female', bloodGroup: 'A-',
        patientId: 'PT-6621', condition: 'Anxiety Disorder',
        diagnosis: 'Generalized Anxiety Disorder', medications: 'Sertraline 25mg, Clonazepam 0.5mg PRN', allergies: 'None Reported',
        timeline: [
            { date: 'Mar 03, 2026', type: 'Psychiatry Check-in', notes: 'Mood improving. Sleep better. Reducing Clonazepam.', doctor: 'Dr. Nina Mehta' },
            { date: 'Feb 10, 2026', type: 'Follow-up', notes: 'Panic attacks less frequent. Social functioning improved.', doctor: 'Dr. Nina Mehta' },
            { date: 'Jan 20, 2026', type: 'Initial Assessment', notes: 'Persistent worry, restlessness, poor sleep for 8 months.', doctor: 'Dr. Nina Mehta' },
        ],
    },
    {
        id: 18, name: 'Sam Wilson', age: 44, gender: 'Male', bloodGroup: 'O-',
        patientId: 'PT-1198', condition: 'Hypertension + Dyslipidemia',
        diagnosis: 'Stage 2 Hypertension with Dyslipidemia', medications: 'Losartan 50mg, Rosuvastatin 20mg', allergies: 'ACE Inhibitors',
        timeline: [
            { date: 'Mar 03, 2026', type: 'Cardiology Review', notes: 'BP 132/84 – improved. LDL trending down.', doctor: 'Dr. Anjali Kumar' },
            { date: 'Feb 05, 2026', type: 'Lipid Panel Review', notes: 'LDL 160 mg/dL. Switched from Atorvastatin to Rosuvastatin.', doctor: 'Dr. Anjali Kumar' },
            { date: 'Jan 10, 2026', type: 'Initial Consultation', notes: 'BP 155/98 at rest. History of mild chest pain.', doctor: 'Dr. Anjali Kumar' },
        ],
    },
    {
        id: 19, name: 'Wanda Maximoff', age: 32, gender: 'Female', bloodGroup: 'B+',
        patientId: 'PT-4487', condition: 'Rheumatoid Arthritis',
        diagnosis: 'Seropositive Rheumatoid Arthritis', medications: 'Methotrexate 15mg weekly, Folic Acid', allergies: 'None Reported',
        timeline: [
            { date: 'Mar 03, 2026', type: 'Rheumatology Review', notes: 'DAS28 score improved from 5.2 to 3.8. Continue current therapy.', doctor: 'Dr. Priya Shah' },
            { date: 'Feb 07, 2026', type: 'Lab Review', notes: 'RF and anti-CCP elevated. Liver enzymes normal on MTX.', doctor: 'Dr. Priya Shah' },
            { date: 'Jan 14, 2026', type: 'Initial Diagnosis', notes: 'Symmetric joint swelling in hands and wrists for 4 months.', doctor: 'Dr. Priya Shah' },
        ],
    },
    {
        id: 20, name: 'Peter Parker', age: 19, gender: 'Male', bloodGroup: 'A+',
        patientId: 'PT-3396', condition: 'Sports Injury (ACL Tear)',
        diagnosis: 'Complete ACL Tear – Right Knee', medications: 'Naproxen 500mg, Physiotherapy', allergies: 'Latex',
        timeline: [
            { date: 'Mar 10, 2026', type: 'Orthopaedics Review', notes: 'Pre-operative assessment done. Surgery scheduled for Mar 20.', doctor: 'Dr. Arjun Sharma' },
            { date: 'Feb 28, 2026', type: 'MRI Review', notes: 'Complete ACL tear confirmed. PCL intact. Surgery recommended.', doctor: 'Dr. Arjun Sharma' },
            { date: 'Feb 22, 2026', type: 'Emergency Visit', notes: 'Right knee gave way during soccer. Immediate swelling.', doctor: 'Dr. Mike Chen' },
        ],
    },
];

// Avatar colour palette cycling
const AVATAR_COLORS = [
    'var(--brand-primary)', '#0d9488', '#7c3aed', '#db2777', '#d97706',
    '#059669', '#2563eb', '#9333ea', '#16a34a', '#dc2626',
];

const PatientHistory = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState(1);
    const [filterGender, setFilterGender] = useState('All');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const filtered = ALL_PATIENTS.filter(p => {
        const q = searchTerm.toLowerCase();
        const matchSearch = p.name.toLowerCase().includes(q)
            || p.condition.toLowerCase().includes(q)
            || p.patientId.toLowerCase().includes(q);
        const matchGender = filterGender === 'All' || p.gender === filterGender;
        return matchSearch && matchGender;
    });

    const selected = ALL_PATIENTS.find(p => p.id === selectedId) || ALL_PATIENTS[0];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                    Patient Database
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Access complete medical records and consultation history.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '320px 1fr',
                gap: '1.5rem'
            }}>

                {/* ── Patient List ── */}
                <div
                    className="glass"
                    style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-xl)',
                        background: 'var(--bg-surface)',
                        height: isMobile ? '400px' : 'calc(100vh - 240px)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                    }}
                >
                    {/* Search */}
                    <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '10px 14px', border: '1px solid var(--border-glass)', gap: '10px', alignItems: 'center' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            style={{ background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Gender filter pills */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['All', 'Male', 'Female'].map(g => (
                            <button
                                key={g}
                                onClick={() => setFilterGender(g)}
                                style={{
                                    flex: 1,
                                    padding: '6px 0',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '0.78rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    background: filterGender === g ? 'var(--brand-primary)' : 'rgba(255,255,255,0.05)',
                                    color: filterGender === g ? 'white' : 'var(--text-muted)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {g}
                            </button>
                        ))}
                    </div>

                    {/* Count */}
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-4px' }}>
                        {filtered.length} patient{filtered.length !== 1 ? 's' : ''} found
                    </p>

                    {/* Scrollable patient list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                        {filtered.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem', fontSize: '0.85rem' }}>
                                No patients match your search.
                            </p>
                        ) : (
                            filtered.map((p, idx) => {
                                const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                                const isActive = p.id === selectedId;
                                return (
                                    <motion.div
                                        key={p.id}
                                        onClick={() => setSelectedId(p.id)}
                                        whileHover={{ scale: 1.01 }}
                                        style={{
                                            padding: '0.9rem 1rem',
                                            borderRadius: '14px',
                                            background: isActive ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                                            border: isActive ? '1px solid var(--brand-primary)' : '1px solid var(--border-glass)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ minWidth: '38px', height: '38px', borderRadius: '10px', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1rem' }}>
                                            {p.name[0]}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {p.name}
                                            </h4>
                                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {p.age}y • {p.gender} • {p.condition}
                                            </p>
                                        </div>
                                        <ChevronRight size={15} color={isActive ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Patient Record Panel ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selected.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="glass"
                        style={{
                            padding: '2rem',
                            borderRadius: 'var(--radius-xl)',
                            background: 'var(--bg-surface)',
                            height: isMobile ? 'auto' : 'calc(100vh - 240px)',
                            overflowY: isMobile ? 'visible' : 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2rem',
                        }}
                    >
                        {/* Patient Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-teal))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <User color="white" size={30} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{selected.name}</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        ID: #{selected.patientId} &nbsp;•&nbsp; {selected.bloodGroup} Blood &nbsp;•&nbsp; {selected.age}y {selected.gender}
                                    </p>
                                </div>
                            </div>
                            <button className="glass" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                <Download size={17} /> Export Record
                            </button>
                        </div>

                        {/* Medical Summary */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                            gap: '1rem'
                        }}>
                            {[
                                { label: 'Last Diagnosis', value: selected.diagnosis, color: 'inherit' },
                                { label: 'Medications', value: selected.medications, color: 'inherit' },
                                { label: 'Allergies', value: selected.allergies, color: selected.allergies === 'None Reported' ? 'var(--critical)' : 'var(--warning, #f59e0b)' },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                                    <p style={{ fontWeight: '700', fontSize: '0.9rem', color }}>{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Consultation Timeline */}
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                                Consultation Timeline
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border-glass)' }} />

                                {selected.timeline.map((visit, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                                        <div style={{ minWidth: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-surface)', border: '2px solid var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-primary)' }} />
                                        </div>
                                        <div style={{ flex: 1, padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                                                <span style={{ fontWeight: '700', color: 'var(--brand-teal)' }}>{visit.date}</span>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: '20px' }}>{visit.type}</span>
                                            </div>
                                            <p style={{ fontSize: '0.9rem', marginBottom: '10px', lineHeight: '1.5' }}>{visit.notes}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                <Activity size={13} /> Attended by {visit.doctor}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PatientHistory;
