import React, { createContext, useContext, useState, useEffect } from 'react';
import { hospitals as mockHospitals } from '../utils/mockData';
import { subscribeToAuthChanges, getUserProfile, loginUser, registerUser, signInWithGoogle, signInWithApple, signInWithX, signInWithFacebook, logoutUser } from '../firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

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
    const [user, setUser] = useState(() => {
        // Synchronous initial recovery for immediate session persistence
        return safeJsonParse('varogra_user', null);
    });
    const [loading, setLoading] = useState(() => {
        // If we have a cached user, we can assume authenticated until proven otherwise
        // This prevents the blank screen flicker while waiting for Firebase
        const cachedUser = localStorage.getItem('varogra_user');
        return !cachedUser;
    });

    // Dynamic Data States
    const [allHospitals, setAllHospitals] = useState([]);
    const [allDoctors, setAllDoctors] = useState([]);
    const [allMedicalStores, setAllMedicalStores] = useState([]);
    const [nearbyHospitals, setNearbyHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(false);

    const [appointments, setAppointments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [bloodRequests, setBloodRequests] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [medicalCamps, setMedicalCamps] = useState([]);
    const [campRegistrations, setCampRegistrations] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);

    // Doctor Specific
    const [doctorStatus, setDoctorStatus] = useState('Available');
    const [doctorSchedule, setDoctorSchedule] = useState({});
    const [autoApprove, setAutoApprove] = useState(true);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        let isCancelled = false;
        let unsubAppointments = () => { };
        let unsubPrescriptions = () => { };

        const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
            if (isCancelled) return;

            unsubAppointments();
            unsubPrescriptions();

            if (firebaseUser) {
                // 1. SET BASIC AUTH DATA IMMEDIATELY
                // This allows instant navigation to the dashboard
                const cachedUser = safeJsonParse('varogra_user', {});
                const storedRole = localStorage.getItem('userRole');

                // Active role discovery: Priority: storedRole > cachedUser.role > default 'patient'
                const activeRole = storedRole || cachedUser.role || 'patient';

                const basicAuthUser = {
                    ...cachedUser, // Start with cached data
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    role: activeRole // Ensure role is not overwritten by old cache
                };

                console.log(`[Auth] Session identified. UID: ${basicAuthUser.uid}, Role: ${basicAuthUser.role}`);
                setUser(basicAuthUser);
                setLoading(false);

                // 2. FETCH CLOUD DATA IN BACKGROUND
                try {
                    // Fetch profile and data in parallel
                    const profilePromise = getUserProfile(firebaseUser.uid);

                    profilePromise.then(profile => {
                        if (isCancelled || !profile) return;
                        console.log(`[Auth] Profile loaded for ${firebaseUser.uid}. Role: ${profile.role}`);
                        const fullProfile = { ...basicAuthUser, ...profile };
                        setUser(fullProfile);
                        localStorage.setItem('varogra_user', JSON.stringify(fullProfile));
                        if (profile.role) {
                            localStorage.setItem('userRole', profile.role);
                        }
                    });

                    // Subscriptions (also in parallel-ish)
                    import('../firebase/services').then(m => {
                        if (isCancelled) return;
                        unsubAppointments = m.subscribeToAppointments({ patientId: firebaseUser.uid }, setAppointments);
                        unsubPrescriptions = m.subscribeToPrescriptions(firebaseUser.uid, setPrescriptions);

                        // 3. FETCH NEARBY HOSPITALS IF PATIENT
                        if (activeRole === 'patient') {
                            setLoadingHospitals(true);
                            // We wait for the profile to get the location, but we can also check basicAuthUser/cachedUser
                            const location = profile?.location || basicAuthUser?.location;
                            if (location) {
                                m.getNearbyHospitalsAndDoctors(location).then(data => {
                                    if (isCancelled) return;
                                    setNearbyHospitals(data);
                                    setLoadingHospitals(false);
                                }).catch(err => {
                                    console.error("[Auth] Failed to fetch nearby hospitals:", err);
                                    setLoadingHospitals(false);
                                });
                            } else {
                                setLoadingHospitals(false);
                            }
                        }
                    });

                } catch (error) {
                    console.error("Background data fetch failed:", error);
                }
            } else {
                const storedMockUser = localStorage.getItem('varogra_user');
                if (!storedMockUser) {
                    setUser(null);
                } else {
                    const parsed = JSON.parse(storedMockUser);
                    setUser(parsed);
                }
                setLoading(false);
            }
        });

        // Load other data from localStorage (Legacy/Mock)
        const initData = () => {
            try {
                // Appointments
                const storedAppts = localStorage.getItem('varogra_appointments');
                if (storedAppts) {
                    setAppointments(JSON.parse(storedAppts));
                } else {
                    setAppointments([]);
                }

                // Orders
                const storedOrders = localStorage.getItem('varogra_orders');
                if (storedOrders) {
                    setOrders(JSON.parse(storedOrders));
                } else {
                    setOrders([]);
                }

                // Blood Requests
                const storedBlood = localStorage.getItem('varogra_blood_requests');
                if (storedBlood) {
                    setBloodRequests(JSON.parse(storedBlood));
                } else {
                    setBloodRequests([]);
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
        return () => {
            isCancelled = true;
            unsubscribe();
            unsubAppointments();
            unsubPrescriptions();
        };
    }, []);

    const loginPatient = async (email, password) => {
        // Master Login Bypass
        if (email === '123' && password === 'dsa') {
            const adminUser = {
                uid: 'demo-patient-id',
                email: 'alice@demo.com',
                displayName: 'Alice Cooper',
                name: 'Alice Cooper',
                role: 'patient',
                location: 'Vizag', // Added for testing discovery
                isAdmin: true
            };
            setUser(adminUser);
            localStorage.setItem('varogra_user', JSON.stringify(adminUser));
            return { success: true };
        }

        try {
            const userData = await loginUser(email, password);
            setUser(userData);
            localStorage.setItem('varogra_user', JSON.stringify(userData));
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
                name: userData.displayName || name,
                role: 'patient',
                ...extraData
            };
            setUser(userObj);
            localStorage.setItem('varogra_user', JSON.stringify(userObj));
            return { success: true };
        } catch (error) {
            console.error("Patient registration error:", error);
            return { success: false, message: error.message };
        }
    };

    const loginSocial = async (provider, role = 'patient') => {
        try {
            let userData;
            if (provider === 'google') userData = await signInWithGoogle(role);
            else if (provider === 'apple') userData = await signInWithApple(role);
            else if (provider === 'x') userData = await signInWithX(role);
            else if (provider === 'facebook') userData = await signInWithFacebook(role);

            if (userData) {
                const fullUserData = {
                    uid: userData.uid,
                    email: userData.email,
                    displayName: userData.displayName,
                    photoURL: userData.photoURL,
                    role: role
                };
                setUser(fullUserData);
                localStorage.setItem('varogra_user', JSON.stringify(fullUserData));
                localStorage.setItem('userRole', role);
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


    const loginDoctor = async (email, password) => {
        // Master Login Bypass
        if (email === '123' && password === 'dsa') {
            return { success: true, doctor: { name: 'Dr. Sarah Smith', code: 'MASTER-D', role: 'doctor', uid: 'demo-doctor-id', id: 'demo-doctor-id', status: 'approved', hospitalId: 'demo-hospital-id', hospitalName: 'City General Hospital' } };
        }

        try {
            const { loginUser, getUserProfile } = await import('../firebase/auth');
            const userData = await loginUser(email, password);

            // Check status in Firestore profile
            const profile = await getUserProfile(userData.uid);

            if (profile && profile.status === 'pending') {
                await logoutUser(); // Immediately log them back out
                return { success: false, message: 'Your account is pending approval by the Hospital Admin.' };
            }

            const fullUserData = { ...userData, ...profile, role: 'doctor' };
            setUser(fullUserData);
            localStorage.setItem('varogra_user', JSON.stringify(fullUserData));
            return { success: true, doctor: fullUserData, user: fullUserData };

        } catch (error) {
            console.error("Doctor login error:", error);
            return { success: false, message: error.code === 'auth/invalid-credential' ? 'Invalid email or password.' : 'Login failed.' };
        }
    };

    const loginMedicalStore = async (code, pin) => {
        // Master Login Bypass
        if (code === '123' && pin === 'dsa') {
            return { success: true, store: { name: 'Main Street Pharmacy', code: 'MSTR-1234', role: 'medical_store', id: 'demo-store-id', uid: 'demo-store-id' } };
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
        setUser(updatedUser);
        localStorage.setItem('varogra_user', JSON.stringify(updatedUser)); // Keeping for legacy
        return { success: true };
    };

    const logout = () => {
        // 1. Instantly destroy local session state
        // This instantly triggers React Router to kick the user out to /login
        setUser(null);

        // 2. Clear all persistent UI storage synchronously
        localStorage.removeItem('varogra_user');
        localStorage.removeItem('userRole');

        // 3. Fire-and-forget Firebase signout. 
        // We DO NOT await this, because if Firebase hangs on a flaky mobile network,
        // it would block the UI from navigating away.
        logoutUser().catch((error) => {
            console.error("Firebase logout failed (possibly offline), but local session wiped:", error);
        });
    };
    const completeLogin = (u) => { setUser(u); localStorage.setItem('varogra_user', JSON.stringify(u)); return true; };
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
            user, loading, appointments, orders, bloodRequests,
            announcements, medicalCamps, campRegistrations, prescriptions,
            allHospitals, allDoctors, allMedicalStores,
            nearbyHospitals, loadingHospitals,
            doctorStatus, doctorSchedule, autoApprove, notifications,
            setUser, completeLogin, setDoctorStatus, setDoctorSchedule, setAutoApprove,
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
