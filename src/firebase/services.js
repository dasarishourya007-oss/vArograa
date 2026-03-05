import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    onSnapshot,
    getDocs,
    serverTimestamp,
    orderBy
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "./config";

// --- Appointment Services ---

export const createAppointment = async (appointmentData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "appointments"), {
            ...appointmentData,
            status: 'pending', // pending, approved, in-consultation, completed, cancelled
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating appointment:", error);
        throw error;
    }
};

export const updateAppointmentStatus = async (appointmentId, status, extraData = {}) => {
    if (!db) return;
    try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        await updateDoc(appointmentRef, {
            status,
            ...extraData,
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

    if (filters.hospitalId) {
        q = query(q, where("hospitalId", "==", filters.hospitalId));
    }
    if (filters.patientId) {
        q = query(q, where("patientId", "==", filters.patientId));
    }
    if (filters.doctorId) {
        q = query(q, where("doctorId", "==", filters.doctorId));
    }
    if (filters.status) {
        q = query(q, where("status", "==", filters.status));
    }

    q = query(q, orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const appointments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(appointments);
    }, (error) => {
        console.error("Error subscribing to appointments:", error);
    });
};

// --- Prescription Services ---

export const createPrescription = async (prescriptionData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "prescriptions"), {
            ...prescriptionData,
            createdAt: serverTimestamp()
        });

        // Update appointment status to completed and link prescription
        if (prescriptionData.appointmentId) {
            await updateAppointmentStatus(prescriptionData.appointmentId, 'completed', {
                prescriptionId: docRef.id
            });
        }

        return docRef.id;
    } catch (error) {
        console.error("Error creating prescription:", error);
        throw error;
    }
};

export const subscribeToPrescriptions = (patientId, callback) => {
    if (!db) return () => { };
    const q = query(
        collection(db, "prescriptions"),
        where("patientId", "==", patientId),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
        const prescriptions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(prescriptions);
    });
};

// --- Order Services (Medical Store) ---

export const createOrder = async (orderData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "orders"), {
            ...orderData,
            status: 'pending', // pending, accepted, preparing, out-for-delivery, delivered
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

export const updateOrderStatus = async (orderId, status) => {
    if (!db) return;
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            status,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        throw error;
    }
};

export const subscribeToOrders = (storeId, callback) => {
    if (!db) return () => { };
    const q = query(
        collection(db, "orders"),
        where("storeId", "==", storeId),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(orders);
    });
};

// --- Discovery Services ---

export const listenToHospitals = (callback) => {
    if (!db) return () => { };
    const q = collection(db, "hospitals");
    return onSnapshot(q, (snapshot) => {
        const h = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(h);
    });
};

export const listenToDoctors = (callback) => {
    if (!db) return () => { };
    const q = collection(db, "doctors");
    return onSnapshot(q, (snapshot) => {
        const d = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(d);
    });
};

export const getHospitals = async () => {
    if (!db) return [];
    const q = collection(db, "hospitals");
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDoctors = async () => {
    if (!db) return [];
    const q = collection(db, "doctors");
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetches hospitals in a specific location.
 * @param {string} location - The location to filter by.
 */
export const getNearbyHospitals = async (location) => {
    if (!db || !location) return [];
    try {
        const hospitalsQuery = query(
            collection(db, "hospitals"),
            where("location", "==", location)
        );
        const snap = await getDocs(hospitalsQuery);
        return snap.docs.map(doc => ({
            id: doc.id,
            hospitalId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("[Discovery] Error fetching nearby hospitals:", error);
        return [];
    }
};

/**
 * Fetches doctors belonging to a specific hospital.
 * @param {string} hospitalId - The ID of the hospital.
 */
export const getDoctorsByHospital = async (hospitalId) => {
    if (!db || !hospitalId) return [];
    try {
        const doctorsQuery = query(
            collection(db, "doctors"),
            where("hospitalId", "==", hospitalId)
        );
        const snap = await getDocs(doctorsQuery);
        return snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error(`[Discovery] Error fetching doctors for hospital ${hospitalId}:`, error);
        return [];
    }
};

/**
 * Fetches hospitals in a specific location and their associated doctors.
 * Performance: Uses indexed queries and parallel fetching.
 */
export const getNearbyHospitalsAndDoctors = async (location) => {
    if (!db || !location) return [];

    try {
        console.log(`[Discovery] Querying hospitals in location: ${location}`);

        // 1. Fetch hospitals in the location
        const hospitals = await getNearbyHospitals(location);

        if (hospitals.length === 0) {
            console.log("[Discovery] No hospitals found in this location.");
            return [];
        }

        // 2. Fetch doctors for all matched hospitals in parallel
        const hospitalsWithDoctors = await Promise.all(hospitals.map(async (hospital) => {
            const doctors = await getDoctorsByHospital(hospital.id);
            return {
                ...hospital,
                doctors
            };
        }));

        return hospitalsWithDoctors;
    } catch (error) {
        console.error("[Discovery] Error fetching nearby hospitals and doctors:", error);
        throw error;
    }
};

/**
 * Helper to fetch doctors by hospitalId specifically.
 */
export const getDoctorsByHospitalId = async (hospitalId) => {
    if (!db || !hospitalId) return [];
    try {
        const q = query(collection(db, "doctors"), where("hospitalId", "==", hospitalId));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("[Discovery] Error fetching doctors for hospital:", hospitalId, error);
        return [];
    }
};

// --- Voice Assistant & AI Services ---

export const searchDoctorByName = async (name) => {
    if (!db) return null;
    try {
        const q = query(collection(db, "doctors"), where("name", "==", name));
        const snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };

        // Partial match search
        const all = await getDoctors();
        return all.find(d => d.name.toLowerCase().includes(name.toLowerCase())) || null;
    } catch (error) {
        console.error("Error searching doctor:", error);
        return null;
    }
};

export const findAlternativeDoctors = async (specialty, hospitalId = null) => {
    if (!db) return [];
    try {
        let q = query(collection(db, "doctors"), where("specialty", "==", specialty));
        if (hospitalId) q = query(q, where("hospitalId", "==", hospitalId));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error finding alternatives:", error);
        return [];
    }
};

export const checkSlotAvailability = async (doctorId, date, time) => {
    if (!db) return true;
    try {
        const q = query(
            collection(db, "appointments"),
            where("doctorId", "==", doctorId),
            where("date", "==", date),
            where("time", "==", time),
            where("status", "!=", "cancelled")
        );
        const snap = await getDocs(q);
        return snap.empty;
    } catch (error) {
        console.error("Error checking availability:", error);
        return true;
    }
};

export const getNextAvailableSlot = async (doctorId, date) => {
    // Simple mock for now: returns a slot later today or tomorrow
    return "11:30 AM";
};

export const bookAppointment = async (bookingData) => {
    return createAppointment({
        ...bookingData,
        source: 'voice_assistant'
    });
};

export const generateToken = async (hospitalId, doctorId, patientId) => {
    if (!db) return { tokenNumber: Math.floor(Math.random() * 50) + 1 };
    try {
        const q = query(
            collection(db, "appointments"),
            where("hospitalId", "==", hospitalId),
            where("doctorId", "==", doctorId),
            where("status", "!=", "cancelled")
        );
        const snap = await getDocs(q);
        const tokenNumber = snap.size + 1;
        return { tokenNumber };
    } catch (error) {
        return { tokenNumber: Math.floor(Math.random() * 50) + 1 };
    }
};

// --- Storage Services ---

export const uploadProfilePhoto = async (uid, file, onProgress) => {
    if (!storage) {
        // Mock for offline mode
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
        });
    }

    try {
        const storageRef = ref(storage, `profiles/${uid}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) onProgress(progress);
                },
                (error) => reject(error),
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
    } catch (error) {
        console.error("Error uploading photo:", error);
        throw error;
    }
};
