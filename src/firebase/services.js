import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    query,
    where,
    onSnapshot,
    getDocs,
    serverTimestamp,
    orderBy,
    collectionGroup,
    setDoc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "./config";

// --- Profile Services ---

export const getPatientProfile = async (patientId) => {
    if (!db) return null;
    const docSnap = await getDoc(doc(db, "patients", patientId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const getDoctorProfile = async (doctorId) => {
    if (!db) return null;
    const docSnap = await getDoc(doc(db, "doctors", doctorId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

// --- Appointment Services ---

export const createAppointment = async (appointmentData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "appointments"), {
            ...appointmentData,
            status: appointmentData.status || 'pending',
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating appointment:", error);
        throw error;
    }
};

export const updateAppointmentStatus = async (appointmentId, status) => {
    if (!db) return;
    try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        await updateDoc(appointmentRef, {
            status,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating appointment status:", error);
        throw error;
    }
};

export const subscribeToAppointments = (filters, callback) => {
    if (!db) return () => { };
    let q = collection(db, "appointments");
    if (filters.hospitalId) q = query(q, where("hospitalId", "==", filters.hospitalId));
    if (filters.patientId) q = query(q, where("patientId", "==", filters.patientId));
    if (filters.doctorId) q = query(q, where("doctorId", "==", filters.doctorId));
    q = query(q, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};

// --- Medical Records & Vitals ---

export const createMedicalRecord = async (recordData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "medical_records"), {
            ...recordData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating medical record:", error);
        throw error;
    }
};

export const updatePatientVitals = async (patientId, vitalData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "vitals"), {
            patientId,
            ...vitalData,
            recordedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error updating vitals:", error);
        throw error;
    }
};

export const subscribeToVitals = (patientId, callback) => {
    if (!db) return () => { };
    const q = query(collection(db, "vitals"), where("patientId", "==", patientId), orderBy("recordedAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};

// --- SOS Emergency System ---

export const createSOSRequest = async (sosData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "sos_requests"), {
            ...sosData,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating SOS request:", error);
        throw error;
    }
};

export const listenToSOSRequests = (callback) => {
    if (!db) return () => { };
    const q = query(collection(db, "sos_requests"), where("status", "==", "pending"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};

// --- Pharmacy & Orders ---

export const createMedicineOrder = async (orderData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "medicine_orders"), {
            ...orderData,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        // Alias for legacy support
        await setDoc(doc(db, "orders", docRef.id), { ...orderData, status: 'pending', createdAt: serverTimestamp() });
        return docRef.id;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

// --- Discovery Services (Refined) ---

export const getHospitals = async () => {
    if (!db) return [];
    const snap = await getDocs(collection(db, "hospitals"));
    return snap.docs.map(doc => ({ id: doc.id, hospitalId: doc.id, ...doc.data() }));
};

export const getDoctors = async (hospitalId = null) => {
    if (!db) return [];
    let q = collection(db, "doctors");
    if (hospitalId) q = query(q, where("hospitalId", "==", hospitalId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, doctorId: doc.id, ...doc.data() }));
};

export const getPharmacies = async () => {
    if (!db) return [];
    const snap = await getDocs(collection(db, "pharmacies"));
    return snap.docs.map(doc => ({ id: doc.id, pharmacyId: doc.id, ...doc.data() }));
};

// --- AI Triage ---

export const logAITriageSession = async (triageData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "ai_triage_logs"), {
            ...triageData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error logging AI triage:", error);
        throw error;
    }
};

// --- Chat System ---

export const createChatSession = async (patientId, doctorId) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "chat_sessions"), {
            patientId,
            doctorId,
            startedAt: serverTimestamp(),
            status: 'active'
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating chat session:", error);
        throw error;
    }
};

export const sendChatMessage = async (sessionId, senderId, message) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "chat_sessions", sessionId, "messages"), {
            senderId,
            message,
            timestamp: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

// --- Notifications ---

export const createNotification = async (notifData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "notifications"), {
            ...notifData,
            read: false,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};

export const subscribeToNotifications = (userId, callback) => {
    if (!db) return () => { };
    const q = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};

// --- Legacy Aliases ---
export const getNearbyHospitals = getHospitals;
export const getDoctorsByHospital = (hId) => getDoctors(hId);
export const listenToHospitals = (cb) => {
    if (!db) { cb([]); return () => { }; }
    return onSnapshot(collection(db, "hospitals"), (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))));
};
export const listenToDoctors = (cb) => {
    if (!db) { cb([]); return () => { }; }
    return onSnapshot(collection(db, "doctors"), (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))));
};
export const listenToMedicalStores = (cb) => {
    if (!db) { cb([]); return () => { }; }
    return onSnapshot(collection(db, "medical_stores"), (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))));
};
export const getNearbyHospitalsAndDoctors = async (location) => {
    // Returns nearby hospitals; location-based filtering can be added later
    return getHospitals();
};
export const subscribeToPrescriptions = (patientId, callback) => {
    if (!db) return () => { };
    const q = query(collection(db, "prescriptions"), where("patientId", "==", patientId), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};
export const createOrder = createMedicineOrder;

// --- Orders Subscription ---
export const subscribeToOrders = (pharmacyId, callback) => {
    if (!db) return () => { };
    const q = query(
        collection(db, "medicine_orders"),
        where("pharmacyId", "==", pharmacyId),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};

export const updateOrderStatus = async (orderId, status) => {
    if (!db) return;
    const orderRef = doc(db, "medicine_orders", orderId);
    await updateDoc(orderRef, { status, updatedAt: serverTimestamp() });
    // Also update legacy orders collection
    try {
        const legacyRef = doc(db, "orders", orderId);
        await updateDoc(legacyRef, { status, updatedAt: serverTimestamp() });
    } catch (_) { }
};

// --- Prescriptions ---
export const createPrescription = async (prescriptionData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "prescriptions"), {
            ...prescriptionData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating prescription:", error);
        throw error;
    }
};

// --- Voice Assistant / Appointment Booking Helpers ---
export const searchDoctorByName = async (name) => {
    if (!db) return null;
    const snap = await getDocs(collection(db, "doctors"));
    const lower = name.toLowerCase();
    const found = snap.docs.find(d => (d.data().name || '').toLowerCase().includes(lower));
    return found ? { id: found.id, ...found.data() } : null;
};

export const findAlternativeDoctors = async (specialty, hospitalId, date, time) => {
    if (!db) return [];
    let q = collection(db, "doctors");
    if (specialty) q = query(q, where("specialization", "==", specialty));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const checkSlotAvailability = async (doctorId, date, time) => {
    // Returns true if slot is available (simplified - check appointments collection)
    if (!db) return true;
    const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctorId),
        where("date", "==", date),
        where("time", "==", time),
        where("status", "in", ["pending", "confirmed"])
    );
    const snap = await getDocs(q);
    return snap.empty;
};

export const getNextAvailableSlot = async (doctorId, date, preferredTime) => {
    // Simplified: return next hour slot
    const times = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];
    for (const t of times) {
        const available = await checkSlotAvailability(doctorId, date, t);
        if (available) return t;
    }
    return "10:00 AM tomorrow";
};

export const bookAppointment = async (appointmentData) => {
    return createAppointment(appointmentData);
};

export const generateToken = async (hospitalId, doctorId, patientId) => {
    // Generate a sequential token for the day
    if (!db) return { tokenNumber: Math.floor(Math.random() * 50) + 1 };
    const today = new Date().toISOString().split('T')[0];
    const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctorId),
        where("date", "==", today)
    );
    const snap = await getDocs(q);
    return { tokenNumber: snap.size + 1 };
};


// --- Storage ---
export const uploadProfilePhoto = async (uid, file, onProgress) => {
    if (!storage) return null;
    const storageRef = ref(storage, `profiles/${uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (s) => onProgress && onProgress((s.bytesTransferred / s.totalBytes) * 100),
            (e) => reject(e),
            async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
        );
    });
};
