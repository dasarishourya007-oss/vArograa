console.log("TOP: AuthContext.jsx loading...");
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { hospitals as mockHospitals } from '../utils/mockData';
import { subscribeToAuthChanges, getUserProfile, loginUser, registerUser, signInWithGoogle, signInWithApple, signInWithX } from '../firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const normalizeRole = (role) => {
    if (!role) return null;
    const lower = String(role).toLowerCase();
    if (lower.includes('hospital')) return 'hospital';
    if (lower.includes('doctor')) return 'doctor';
    if (lower.includes('patient')) return 'patient';
    return lower;
};

const userFromProfile = (firebaseUser, profile = {}) => {
    const normalizedRole = normalizeRole(profile.role || firebaseUser?.role || 'patient') || 'patient';
    return {
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        displayName: profile?.displayName || profile?.name || firebaseUser?.displayName,
        photoURL: profile?.photoURL || firebaseUser?.photoURL,
        ...profile,
        role: normalizedRole
    };
};

const fetchHospitalByAdminId = async (adminId) => {
    if (!db || !adminId) return null;
    try {
        const hospitalQuery = query(
            collection(db, 'hospitals'),
            where('adminId', '==', adminId)
        );
        const hospitalSnapshot = await getDocs(hospitalQuery);
        if (hospitalSnapshot.empty) return null;
        const docSnap = hospitalSnapshot.docs[0];
        const data = docSnap.data() || {};
        return {
            id: docSnap.id,
            hospitalId: docSnap.id,
            hospitalName: data.hospitalName || data.name || '',
            address: data.address || data.location || '',
            district: data.district || '',
            state: data.state || '',
            ...data
        };
    } catch (error) {
        console.error('Error fetching hospital by adminId:', error);
        return null;
    }
};

const safeJsonParse = (key, fallback) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.error(`Error parsing localStorage key "${key}":`, e);
        return fallback;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentHospital, setCurrentHospital] = useState(null);
    const hospitalFetchRef = useRef(null);

    const normalizeAndSetUser = (payload) => {
        if (!payload) {
            setUser(null);
            return null;
        }
        const normalized = { ...payload, role: normalizeRole(payload.role) || 'patient' };
        setUser(normalized);
        return normalized;
    };

    // Dynamic Data States
    const [allHospitals, setAllHospitals] = useState([]);
    const [allDoctors, setAllDoctors] = useState([]);
    const [allMedicalStores, setAllMedicalStores] = useState([]);

    const [appointments, setAppointments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [bloodRequests, setBloodRequests] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [medicalCamps, setMedicalCamps] = useState([]);
    const [campRegistrations, setCampRegistrations] = useState([]);

    // Doctor Specific
    const [doctorStatus, setDoctorStatus] = useState('Available');
    const [doctorSchedule, setDoctorSchedule] = useState({});
    const [autoApprove, setAutoApprove] = useState(true);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Firebase Auth Listener
        const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const profile = await getUserProfile(firebaseUser.uid);
                    const preparedUser = userFromProfile(firebaseUser, profile);
                    normalizeAndSetUser(preparedUser);
                } catch (error) {
                    console.error("Error fetching profile:", error);
                    normalizeAndSetUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        role: 'patient'
                    });
                }
            } else {
                const storedMockUser = localStorage.getItem('varogra_user');
                if (!storedMockUser) {
                    setUser(null);
                } else if (!user) {
                    normalizeAndSetUser(JSON.parse(storedMockUser));
                }
            }
            setLoading(false);
        });

        // Load other data from localStorage (Legacy/Mock)
        const initData = () => {
            try {
                // Appointments
                const storedAppts = localStorage.getItem('varogra_appointments');
                if (storedAppts) {
                    setAppointments(JSON.parse(storedAppts));
                } else {
                    const demoAppt = [{ id: 'APT-1', doctorName: 'Sarah Smith', time: '10:00 AM', hospitalName: 'City Care Hospital', status: 'Accepted', visitType: 'offline', timestamp: new Date().toISOString() }];
                    setAppointments(demoAppt);
                    localStorage.setItem('varogra_appointments', JSON.stringify(demoAppt));
                }

                // Orders
                const storedOrders = localStorage.getItem('varogra_orders');
                if (storedOrders) {
                    setOrders(JSON.parse(storedOrders));
                } else {
                    const demoOrder = [{ id: 'ORD-1', storeName: 'Apollo Pharmacy', status: 'Out for delivery', timestamp: new Date().toISOString() }];
                    setOrders(demoOrder);
                    localStorage.setItem('varogra_orders', JSON.stringify(demoOrder));
                }

                // Blood Requests
                const storedBlood = localStorage.getItem('varogra_blood_requests');
                if (storedBlood) {
                    setBloodRequests(JSON.parse(storedBlood));
                } else {
                    const demoBlood = [{ id: 'BLD-1', patientName: 'Abhinav', bloodType: 'O+', status: 'Urgent', hospitalName: 'Apollo Spectra', timestamp: new Date().toISOString() }];
                    setBloodRequests(demoBlood);
                    localStorage.setItem('varogra_blood_requests', JSON.stringify(demoBlood));
                }

                // Others
                setAnnouncements(safeJsonParse('varogra_announcements', []));
                setMedicalCamps(safeJsonParse('varogra_medical_camps', []));
                setCampRegistrations(safeJsonParse('varogra_camp_registrations', []));

                // Dynamic Data
                const storedHospitals = localStorage.getItem('varogra_hospitals');
                if (storedHospitals) {
                    setAllHospitals(JSON.parse(storedHospitals));
                } else {
                    setAllHospitals(mockHospitals);
                    localStorage.setItem('varogra_hospitals', JSON.stringify(mockHospitals));
                }

                const storedDoctors = localStorage.getItem('varogra_doctors');
                if (storedDoctors) {
                    setAllDoctors(JSON.parse(storedDoctors));
                } else {
                    const initialDocs = mockHospitals.flatMap(h => (h.doctors || []).map(d => ({ ...d, hospitalId: h.id, hospitalName: h.name })));
                    setAllDoctors(initialDocs);
                    localStorage.setItem('varogra_doctors', JSON.stringify(initialDocs));
                }

                setAllMedicalStores(safeJsonParse('varogra_medical_stores', []));

            } catch (error) {
                console.error("Critical AuthContext Init Failure:", error);
            }
        };

        initData();
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user || user.role !== 'hospital') {
            hospitalFetchRef.current = null;
            return;
        }
        const adminId = user.uid;
        if (!adminId) return;
        if (hospitalFetchRef.current === adminId) return;
        hospitalFetchRef.current = adminId;
        let active = true;

        (async () => {
            const hospitalDoc = await fetchHospitalByAdminId(adminId);
            if (!active || !hospitalDoc) return;
            setCurrentHospital(hospitalDoc);
            setUser(prev => prev ? {
                ...prev,
                hospitalId: hospitalDoc.id,
                hospitalName: hospitalDoc.hospitalName || hospitalDoc.name || prev.hospitalName,
                address: hospitalDoc.address || prev.address,
                district: hospitalDoc.district || prev.district,
                state: hospitalDoc.state || prev.state
            } : prev);
        })();

        return () => {
            active = false;
        };
    }, [user?.uid, user?.role]);

    useEffect(() => {
        if (user?.role !== 'doctor') return;
        const hospitalIdCandidate = user.hospitalId || user?.hospital?.hospitalId || user?.hospital?.id;
        const hospitalNameCandidate = user.hospitalName || user?.hospital?.name;
        if (!hospitalIdCandidate && !hospitalNameCandidate) return;

        const matchedHospital = (allHospitals || []).find((h) => {
            const normalizedHospitalName = (h.hospitalName || h.name || '').toLowerCase();
            const targetName = hospitalNameCandidate?.toLowerCase();
            const targetId = hospitalIdCandidate;
            return (targetId && (h.id === targetId || h.hospitalId === targetId)) ||
                (targetName && normalizedHospitalName === targetName);
        });

        if (matchedHospital) {
            setCurrentHospital(matchedHospital);
        }
    }, [user?.role, user?.hospitalId, user?.hospitalName, allHospitals]);

    useEffect(() => {
        if (!user || (user.role !== 'hospital' && user.role !== 'doctor')) {
            setCurrentHospital(null);
            hospitalFetchRef.current = null;
        }
    }, [user]);

    const loginPatient = async (email, password) => {
        // Master Login Bypass for Patients
        if (email === '123' || email === '123@123.com' || password === '123') {
            const mockUser = {
                uid: 'demo-patient-123',
                email: 'patient@varogra.com',
                displayName: 'Demo Patient',
                role: 'patient',
                city: 'Mancherial',
                state: 'Telangana',
                latitude: 18.8752,
                longitude: 79.4591,
                address: 'Mancherial, Telangana',
                defaultAddress: {
                    city: 'Mancherial',
                    state: 'Telangana',
                    mandal: 'Mancherial',
                    district: 'Mancherial',
                    fullAddress: 'Mancherial, Telangana'
                }
            };
            const normalized = normalizeAndSetUser(mockUser);
            localStorage.setItem('varogra_user', JSON.stringify(normalized));
            return { success: true };
        }

        try {
            const userData = await loginUser(email, password);
            const normalizedUser = normalizeAndSetUser(userData);
            localStorage.setItem('varogra_user', JSON.stringify(normalizedUser));
            return { success: true };
        } catch (error) {
            console.error("Patient login error:", error);
            return { success: false, message: error.message };
        }
    };

    const registerPatient = async (signupData) => {
        try {
            const { name, email, password, ...extraData } = signupData;
            const userData = await registerUser(email, password, name, 'patient', extraData);
            const userObj = {
                uid: userData.uid,
                email: userData.email || email,
                displayName: userData.displayName || name,
                role: 'patient',
                ...extraData
            };
            const normalizedPatient = normalizeAndSetUser(userObj);
            localStorage.setItem('varogra_user', JSON.stringify(normalizedPatient));
            return { success: true };
        } catch (error) {
            console.error("Patient registration error:", error);
            return { success: false, message: error.message };
        }
    };

    const loginSocial = async (provider) => {
        try {
            let userData;
            if (provider === 'google') userData = await signInWithGoogle();
            else if (provider === 'apple') userData = await signInWithApple();
            else if (provider === 'x') userData = await signInWithX();

            if (userData) {
                const normalizedSocial = normalizeAndSetUser(userData);
                localStorage.setItem('varogra_user', JSON.stringify(normalizedSocial));
                return { success: true };
            }
        } catch (error) {
            console.error(`${provider} login error:`, error);
            return { success: false, message: error.message };
        }
    };


    const registerMedicalStore = async (storeData) => {
        try {
            const code = 'MSTR-' + Math.random().toString(36).substring(2, 6).toUpperCase();
            const email = storeData.email || `${code.toLowerCase()}@varogra.com`;
            const password = storeData.password || '123456';

            const user = await import('../firebase/auth').then(m => m.registerMedicalStore(
                email,
                password,
                storeData.name,
                { ...storeData, code }
            ));

            if (!user.uid && !user.id) throw new Error("Registration failed");
            return code;
        } catch (error) {
            console.error("Store registration error:", error);
            return { success: false, message: error.message };
        }
    };

    const registerDoctor = async (docData) => {
        try {
            const email = docData.email || `doc-${Date.now()}@varogra.com`;
            const password = docData.password || '123456';

            const user = await import('../firebase/auth').then(m => m.registerDoctor(
                email,
                password,
                docData.name,
                { ...docData, status: 'pending' }
            ));

            if (!user.uid && !user.id) throw new Error("Registration failed");
            return { success: true };
        } catch (error) {
            console.error("Doctor registration error:", error);
            return { success: false, message: error.message };
        }
    };


    const loginDoctor = async (code, password) => {
        // Master Login Bypass
        if (code === '123' && password === 'dsa') {
            return { success: true, doctor: { name: 'Admin Doctor', code: 'MASTER-D', role: 'doctor', id: 'master-doc', status: 'approved' } };
        }

        const doc = allDoctors.find(d => d.code === code && d.password === password);
        if (doc) return { success: true, doctor: doc };
        if (code.startsWith('DOC')) {
            return { success: true, doctor: { name: 'Dr. Sample', code, role: 'doctor', id: 'd1', status: 'approved' } };
        }
        return { success: false, message: 'Invalid ID or Passkey' };
    };

    const loginMedicalStore = async (code, pin) => {
        // Master Login Bypass
        if (code === '123' && pin === 'dsa') {
            return { success: true, store: { name: 'Admin Store', code: 'MASTER-S', role: 'medical_store', id: 'master-store' } };
        }

        const store = allMedicalStores.find(s => s.code === code);
        if (store) return { success: true, store: { ...store, role: 'medical_store' } };
        if (code.startsWith('MSTR')) {
            return { success: true, store: { name: 'Demo Store', code, role: 'medical_store', id: 'demo-store' } };
        }
        return { success: false, message: 'Invalid Store Code' };
    };


    // Use effect to listen to hospitals
    useEffect(() => {
        let unsubscribe = () => { };

        const setupListener = async () => {
            try {
                const { listenToHospitals } = await import('../firebase/services');
                unsubscribe = listenToHospitals((hospitals) => {
                    if (hospitals && hospitals.length > 0) {
                        setAllHospitals(hospitals);
                        localStorage.setItem('varogra_hospitals', JSON.stringify(hospitals));
                    }
                });
            } catch (error) {
                console.error("Error setting up hospital listener:", error);
            }
        };

        setupListener();
        return () => unsubscribe();
    }, []);

    // Use effect to listen to doctors
    useEffect(() => {
        let unsubscribe = () => { };

        const setupListener = async () => {
            try {
                const { listenToDoctors } = await import('../firebase/services');
                unsubscribe = listenToDoctors((doctors) => {
                    if (doctors && doctors.length > 0) {
                        setAllDoctors(doctors);
                        localStorage.setItem('varogra_doctors', JSON.stringify(doctors));
                    }
                });
            } catch (error) {
                console.error("Error setting up doctor listener:", error);
            }
        };

        setupListener();
        return () => unsubscribe();
    }, []);

    const bookAppointment = (appointmentData) => {
        const isBusy = doctorSchedule[appointmentData.doctorId]?.busyTimes?.includes(appointmentData.time);
        if (isBusy) return { success: false, message: 'Doctor is already booked at this time.' };

        const newAppt = {
            id: 'APT-' + Math.floor(1000 + Math.random() * 9000),
            userId: user?.uid || user?.id,
            userName: user?.displayName || user?.name,
            status: autoApprove ? 'Accepted' : 'Confirmed',
            timestamp: new Date().toISOString(),
            ...appointmentData
        };

        const updatedAppts = [...appointments, newAppt];
        setAppointments(updatedAppts);
        localStorage.setItem('varogra_appointments', JSON.stringify(updatedAppts));

        const newSchedule = { ...doctorSchedule };
        if (!newSchedule[appointmentData.doctorId]) newSchedule[appointmentData.doctorId] = { busyTimes: [] };
        newSchedule[appointmentData.doctorId].busyTimes.push(appointmentData.time);
        setDoctorSchedule(newSchedule);

        return { success: true, appointment: newAppt };
    };

    const checkDuplicateAddress = (address, type) => {
        const facilities = type === 'hospital' ? allHospitals : allMedicalStores;
        return facilities.some(f => f.address.toLowerCase().trim() === address.toLowerCase().trim());
    };

    const updateAppointmentStatus = (apptId, newStatus) => {
        const updatedAppts = appointments.map(appt => {
            if (appt.id === apptId) {
                let updates = { status: newStatus };
                if (newStatus === 'Accepted' && appt.visitType === 'online' && !appt.meetingLink) {
                    updates.meetingLink = `/call/${appt.id}`;
                }
                return { ...appt, ...updates };
            }
            return appt;
        });
        setAppointments(updatedAppts);
        localStorage.setItem('varogra_appointments', JSON.stringify(updatedAppts));
    };

    const addPrescription = (pxData) => {
        const newRx = { id: 'RX-' + Date.now(), ...pxData, timestamp: new Date().toISOString() };
        const updatedAppts = appointments.map(a => a.id === pxData.appointmentId ? { ...a, status: 'Prescribed', prescription: newRx } : a);
        setAppointments(updatedAppts);
        localStorage.setItem('varogra_appointments', JSON.stringify(updatedAppts));
        return newRx;
    };

    const placeOrder = (oData) => {
        const newOrder = { id: 'ORD-' + Date.now(), userId: user?.uid || user?.id, userName: user?.displayName || user?.name, status: 'Confirmed', timestamp: new Date().toISOString(), ...oData };
        const updatedOrders = [...orders, newOrder];
        setOrders(updatedOrders);
        localStorage.setItem('varogra_orders', JSON.stringify(updatedOrders));
        return newOrder;
    };

    const addAnnouncement = (aData) => {
        const newAnnouncement = {
            id: 'ANN-' + Date.now(),
            hospitalId: user?.uid || user?.id,
            hospitalName: user?.displayName || user?.name,
            timestamp: new Date().toISOString(),
            ...aData
        };
        const updated = [newAnnouncement, ...announcements];
        setAnnouncements(updated);
        localStorage.setItem('varogra_announcements', JSON.stringify(updated));
        return newAnnouncement;
    };

    const addMedicalCamp = (cData) => {
        const newCamp = {
            id: 'CMP-' + Date.now(),
            hospitalId: user?.uid || user?.id,
            hospitalName: user?.displayName || user?.name,
            registeredCount: 0,
            timestamp: new Date().toISOString(),
            ...cData
        };
        const updated = [newCamp, ...medicalCamps];
        setMedicalCamps(updated);
        localStorage.setItem('varogra_medical_camps', JSON.stringify(updated));
        return newCamp;
    };

    const registerForCamp = (campId) => {
        if (campRegistrations.some(r => r.campId === campId && (r.userId === user?.uid || r.userId === user?.id))) {
            return { success: false, message: 'Already registered for this camp.' };
        }

        const newReg = {
            id: 'REG-' + Date.now(),
            campId,
            userId: user?.uid || user?.id,
            timestamp: new Date().toISOString()
        };

        const updatedRegs = [...campRegistrations, newReg];
        setCampRegistrations(updatedRegs);
        localStorage.setItem('varogra_camp_registrations', JSON.stringify(updatedRegs));

        const updatedCamps = medicalCamps.map(c =>
            c.id === campId ? { ...c, registeredCount: (c.registeredCount || 0) + 1 } : c
        );
        setMedicalCamps(updatedCamps);
        localStorage.setItem('varogra_medical_camps', JSON.stringify(updatedCamps));

        return { success: true };
    };

    const updateOrderStatus = (oid, status) => {
        const updated = orders.map(o => o.id === oid ? { ...o, status } : o);
        setOrders(updated);
        localStorage.setItem('varogra_orders', JSON.stringify(updated));
    };

    const updateProfile = (data) => {
        const updatedUser = { ...user, ...data };
        const normalized = normalizeAndSetUser(updatedUser);
        localStorage.setItem('varogra_user', JSON.stringify(normalized)); // Keeping for legacy
        return { success: true };
    };


    const logout = () => { setCurrentHospital(null); hospitalFetchRef.current = null; setUser(null); localStorage.removeItem('varogra_user'); };

    const completeLogin = (u) => { const normalized = normalizeAndSetUser(u); localStorage.setItem('varogra_user', JSON.stringify(normalized)); return true; };

    const approveDoctor = (did) => { return { success: true } };
    const checkDoctorStatus = (ph) => { const d = allDoctors.find(doc => doc.phone === ph); return d ? { found: true, status: d.status, code: d.code } : { found: false }; };
    const setupDoctorPassword = (ph, pw) => {
        const updatedDocs = allDoctors.map(d => d.phone === ph ? { ...d, status: 'approved', password: pw } : d);
        setAllDoctors(updatedDocs);
        localStorage.setItem('varogra_doctors', JSON.stringify(updatedDocs));
        return { success: true };
    };
    const resetDoctorPasskey = (id, ph, pw) => setupDoctorPassword(ph, pw);

    return (
        <AuthContext.Provider value={{
            user, loading, currentHospital, appointments, orders, bloodRequests,
            announcements, medicalCamps, campRegistrations,
            allHospitals, allDoctors, allMedicalStores,
            doctorStatus, doctorSchedule, autoApprove, notifications,
            setUser, setCurrentHospital, completeLogin, setDoctorStatus, setDoctorSchedule, setAutoApprove,
            loginPatient, registerPatient, registerMedicalStore, loginDoctor, loginMedicalStore,
            registerDoctor, approveDoctor, checkDoctorStatus, setupDoctorPassword, resetDoctorPasskey,
            bookAppointment, updateAppointmentStatus, addPrescription, placeOrder, updateOrderStatus,
            addAnnouncement, addMedicalCamp, registerForCamp,
            checkDuplicateAddress, updateProfile, logout,
            loginSocial
        }}>
            {children}
        </AuthContext.Provider>
    );
};
