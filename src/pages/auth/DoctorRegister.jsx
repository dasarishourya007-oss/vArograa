import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';

import AuthLayout from '../../components/AuthLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import ImageUpload from '../../components/ImageUpload';
import { registerUser, updateUserProfilePhoto } from '../../firebase/auth';
import { uploadProfilePhoto } from '../../firebase/services';

const DoctorRegister = () => {
    const navigate = useNavigate();
    const { registerDoctor } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [doctorType, setDoctorType] = useState('specialist'); // 'specialist' | 'rmp'

    const [hospitalId, setHospitalId] = useState('');
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [age, setAge] = useState('');
    const [error, setError] = useState('');
    const [image, setImage] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    // Auto-calculate age from birthDate
    React.useEffect(() => {
        if (birthDate) {
            const bDate = new Date(birthDate);
            const today = new Date();
            let calculatedAge = today.getFullYear() - bDate.getFullYear();
            const monthDiff = today.getMonth() - bDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bDate.getDate())) {
                calculatedAge--;
            }
            if (calculatedAge >= 0) {
                setAge(calculatedAge.toString());
            }
        }
    }, [birthDate]);

    // ... inside handleRegister

    const handleRegister = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setStatus('Initializing registration...');
        setLoading(true);

        if (!image) {
            setError("Please upload a profile photo.");
            setLoading(false);
            setStatus('');
            return;
        }

        try {
            // 0. Verify Hospital Base ID in Firestore
            setStatus('Verifying Hospital ID...');
            let targetId = hospitalId.trim();
            let hospitalData = { name: 'Registered Hospital' };
            let actualHospitalId = targetId;

            const DEMO_IDS = ['demo-user', 'demo-hospital-id', 'jPz6UEHW2NVRtMo49belygDhbRo1'];

            if (DEMO_IDS.includes(targetId)) {
                // Bypass for known demo/test IDs
                console.log("Using demo hospital bypass");
                hospitalData = { name: 'vArogra Demo Hospital', hospital_code: 'HSP-DEMO' };
                actualHospitalId = 'jPz6UEHW2NVRtMo49belygDhbRo1'; // Standardize on one ID for demo
            } else {
                try {
                    // Search for hospital by hospital_code
                    let normalizedCode = targetId.replace(/\s+/g, '').toUpperCase();
                    const q = query(collection(db, 'hospitals'), where('hospital_code', '==', normalizedCode), limit(1));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const hospitalDoc = querySnapshot.docs[0];
                        hospitalData = hospitalDoc.data();
                        actualHospitalId = hospitalDoc.id;
                    } else {
                        setError("No hospital found with this Code (e.g. HSP-12345). Please check with your administrator for the correct code.");
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.error("Verification failed, possibly offline:", err);
                    if (err.message.toLocaleLowerCase().includes('offline')) {
                        console.warn("Offline: Proceeding with unverified hospital code");
                    } else {
                        throw err;
                    }
                }
            }

            // 1. Prepare Data
            const extraData = {
                specialty: doctorType === 'specialist' ? specialty : 'RMP General',
                doctorType,
                hospitalName: hospitalData.name,
                hospitalId: actualHospitalId,
                hospital_code: hospitalData.hospital_code || targetId.replace(/\s+/g, '').toUpperCase(),
                phone,
                birthDate,
                age,
                status: 'PENDING_APPROVAL'
            };

            let firebaseUser;
            setStatus('Creating secure account...');
            try {
                firebaseUser = await registerUser(email, password, name, 'doctor', extraData);
            } catch (authErr) {
                // AUTO-HEALING: If email exists but profile is missing, try to heal by signing in
                if (authErr.code === 'auth/email-already-in-use') {
                    setStatus('Existing account detected. Completing profile...');
                    console.log("Email in use, attempting to heal profile...");
                    try {
                        const { loginUser, getUserProfile } = await import('../../firebase/auth');
                        const signedInUser = await loginUser(email, password);
                        const profile = await getUserProfile(signedInUser.uid);

                        if (!profile) {
                            console.log("Ghost account detected. Re-triggering profile creation...");
                            // Re-run registration but skip Auth creation (use manual Firestore writes)
                            const { doc, setDoc } = await import('firebase/firestore');
                            await setDoc(doc(db, "users", signedInUser.uid), {
                                uid: signedInUser.uid, name, email, role: 'doctor', status: 'PENDING_APPROVAL', ...extraData, createdAt: new Date().toISOString()
                            });
                            await setDoc(doc(db, "hospitals", actualHospitalId, "doctors", signedInUser.uid), {
                                doctor_id: signedInUser.uid, name, email, specialization: extraData.specialty, hospitalId: actualHospitalId, status: 'PENDING_APPROVAL', createdAt: new Date().toISOString()
                            });
                            firebaseUser = signedInUser;
                        } else {
                            throw new Error("This email is already fully registered. Please login instead.");
                        }
                    } catch (healErr) {
                        throw new Error(healErr.message === "This email is already fully registered. Please login instead."
                            ? healErr.message
                            : "This email is registered with a different password. Please check your credentials.");
                    }
                } else {
                    throw authErr;
                }
            }

            // 2. Upload Photo (if user was created or healed)
            if (image) {
                setStatus('Uploading profile photo...');
                const downloadURL = await uploadProfilePhoto(firebaseUser.uid, image, (progress) => {
                    setUploadProgress(progress);
                });
                await updateUserProfilePhoto(firebaseUser.uid, downloadURL);
            }

            alert('Registration Successful! Please wait for Admin approval.');
            setStatus('Registration complete.');
            setLoading(false);
            navigate('/login/doctor');
        } catch (err) {
            console.error("Registration Error:", err);
            setError(err.message || "A network error occurred. Please try again.");
            setUploadProgress(0);
            setStatus('');
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <AuthLayout title="Doctor Registration" subtitle="Join a Hospital" showBack={true}>
                    <form onSubmit={handleRegister} className="flex-col" style={{ gap: 'var(--spacing-md)' }}>

                        {/* Image Upload */}
                        <ImageUpload
                            label="Profile Photo"
                            image={image}
                            onImageChange={setImage}
                            progress={uploadProgress}
                            className="mb-2"
                        />

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                            <label style={{
                                flex: 1, padding: '10px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                                backgroundColor: doctorType === 'specialist' ? '#eef2ff' : 'white',
                                border: `2px solid ${doctorType === 'specialist' ? 'var(--primary-color)' : '#f3f4f6'}`,
                                transition: 'all 0.2s'
                            }}>
                                <input type="radio" style={{ display: 'none' }} checked={doctorType === 'specialist'} onChange={() => setDoctorType('specialist')} />
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: doctorType === 'specialist' ? 'var(--primary-color)' : '#666' }}>Specialist</span>
                            </label>
                            <label style={{
                                flex: 1, padding: '10px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                                backgroundColor: doctorType === 'rmp' ? '#eef2ff' : 'white',
                                border: `2px solid ${doctorType === 'rmp' ? 'var(--primary-color)' : '#f3f4f6'}`,
                                transition: 'all 0.2s'
                            }}>
                                <input type="radio" style={{ display: 'none' }} checked={doctorType === 'rmp'} onChange={() => setDoctorType('rmp')} />
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: doctorType === 'rmp' ? 'var(--primary-color)' : '#666' }}>RMP Doctor</span>
                            </label>
                        </div>

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="doctor@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Input
                            label="Full Name"
                            placeholder="Dr. John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        {doctorType === 'specialist' && (
                            <Input
                                label="Specialty"
                                placeholder="Cardiologist, General Physician..."
                                value={specialty}
                                onChange={(e) => setSpecialty(e.target.value)}
                                required
                            />
                        )}
                        <Input
                            label="Phone Number (Used as Login PIN)"
                            placeholder="1234567890"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                        <Input
                            label="Hospital Base ID"
                            type="text"
                            placeholder="Enter the ID provided by your hospital"
                            value={hospitalId}
                            onChange={(e) => setHospitalId(e.target.value)}
                            required
                        />

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 2 }}>
                                <Input
                                    label="Birthdate"
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Input
                                    label="Age"
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && <p style={{ color: 'var(--danger-color)', fontSize: '14px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</p>}
                        {loading && status && <p style={{ color: 'var(--brand-primary)', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}>{status}</p>}

                        <div style={{ marginTop: 'var(--spacing-md)' }}>
                            <Button type="submit" size="block" loading={loading} disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </div>

                        <p style={{ textAlign: 'center', fontSize: '15px', color: 'var(--text-secondary)', marginTop: '24px', fontWeight: '500' }}>
                            Already have an account? <span onClick={() => navigate('/login/doctor')} style={{ color: 'var(--brand-primary)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}>Login here</span>
                        </p>
                    </form>
                </AuthLayout>
            </div>
        </div>
    );
};

export default DoctorRegister;
