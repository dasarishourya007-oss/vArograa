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
        const payload = {
            ...appointmentData,
            status: appointmentData.status || 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "appointments"), payload);

        if (payload?.hospitalId) {
            await createNotification({
                userId: payload.hospitalId,
                type: 'new_appointment_request',
                appointmentId: docRef.id,
                title: 'New Appointment Request',
                message: `${payload.patientName || 'A patient'} requested ${payload.time || 'a slot'} with ${payload.doctorName || 'a doctor'}.`,
                patientId: payload.patientId || null,
                doctorId: payload.doctorId || null,
                hospitalId: payload.hospitalId
            });
        }

        if (payload?.patientId) {
            await createNotification({
                userId: payload.patientId,
                type: 'appointment_booked',
                appointmentId: docRef.id,
                title: 'Appointment Request Submitted',
                message: `Your appointment request for ${payload.time || 'selected slot'} has been sent to ${payload.hospitalName || 'the hospital'} for approval.`,
                patientId: payload.patientId,
                doctorId: payload.doctorId || null,
                hospitalId: payload.hospitalId || null
            });
        }

        return docRef.id;
    } catch (error) {
        console.error("Error creating appointment:", error);
        throw error;
    }
};

export const updateAppointmentStatus = async (appointmentId, status, extraUpdates = {}) => {
    if (!db) return;
    try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        const appointmentSnap = await getDoc(appointmentRef);
        const appointmentData = appointmentSnap.exists() ? appointmentSnap.data() : {};

        await updateDoc(appointmentRef, {
            status,
            ...extraUpdates,
            updatedAt: serverTimestamp()
        });

        const normalizedStatus = String(status || '').toLowerCase();
        const isAccepted = normalizedStatus === 'approved' || normalizedStatus === 'accepted';
        const isRejected = normalizedStatus === 'rejected';

        const doctorId = extraUpdates?.doctorId || appointmentData?.doctorId || null;
        const doctorName = extraUpdates?.doctorName || appointmentData?.doctorName || 'Doctor';
        const slotTime = appointmentData?.time || 'selected slot';
        const slotDate = appointmentData?.date || '';
        const slotLabel = slotDate ? `${slotDate} at ${slotTime}` : slotTime;

        if (isAccepted) {
            if (appointmentData?.patientId) {
                await createNotification({
                    userId: appointmentData.patientId,
                    type: 'appointment_accepted',
                    appointmentId,
                    title: 'Appointment Confirmed',
                    message: `Your appointment with ${doctorName} is confirmed for ${slotLabel}.`,
                    hospitalId: appointmentData?.hospitalId || null,
                    doctorId
                });
            }

            if (doctorId) {
                await createNotification({
                    userId: doctorId,
                    type: 'doctor_appointment_assigned',
                    appointmentId,
                    title: 'New Appointment Assigned',
                    message: `${appointmentData?.patientName || 'A patient'} has been scheduled at ${slotLabel}.`,
                    hospitalId: appointmentData?.hospitalId || null,
                    patientId: appointmentData?.patientId || null,
                    doctorId
                });
            }
        }

        if (isRejected && appointmentData?.patientId) {
            await createNotification({
                userId: appointmentData.patientId,
                type: 'appointment_rejected',
                appointmentId,
                title: 'Appointment Rejected',
                message: `Your appointment request for ${slotLabel} was rejected due to doctor availability. Please choose another slot.`,
                hospitalId: appointmentData?.hospitalId || null,
                doctorId
            });
        }
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
    if (filters.doctorRefId) q = query(q, where("doctorRefId", "==", filters.doctorRefId));
    if (filters.status) {
        if (Array.isArray(filters.status) && filters.status.length > 0) {
            q = query(q, where("status", "in", filters.status));
        } else {
            q = query(q, where("status", "==", filters.status));
        }
    }
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
        try {
            await setDoc(doc(db, "orders", docRef.id), { ...orderData, status: 'pending', createdAt: serverTimestamp() });
        } catch (e) {}
        return docRef.id;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

// --- Discovery Services ---

export const getHospitals = async () => {
    if (!db) return [];
    try {
        const snap = await getDocs(collection(db, "hospitals"));
        return snap.docs.map(doc => ({ id: doc.id, hospitalId: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error getting hospitals:", e);
        return [];
    }
};

const normalizeLocationValue = (value) => {
    if (!value) return "";
    return String(value).trim().replace(/\s+/g, " ");
};

const toNumberOrNull = (value) => {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : null;
};

export const upsertPatientDefaultAddress = async (patientId, address) => {
    if (!db) return false;
    if (!patientId) throw new Error('patientId is required');

    const payload = address || {};
    const latitude = toNumberOrNull(payload.latitude ?? payload.lat);
    const longitude = toNumberOrNull(payload.longitude ?? payload.lng ?? payload.lon);

    const state = normalizeLocationValue(payload.state);
    const district = normalizeLocationValue(payload.district);
    const mandal = normalizeLocationValue(payload.mandal);
    const city = normalizeLocationValue(payload.city);
    const pincode = String(payload.pincode || '').trim();
    const fullAddress = String(payload.fullAddress || payload.address || payload.displayName || '').trim();

    const mergedPatient = {
        patientId,
        address: fullAddress,
        latitude,
        longitude,
        state,
        district,
        mandal,
        city,
        pincode,
        defaultAddress: {
            ...payload,
            fullAddress,
            latitude,
            longitude,
            updatedAt: serverTimestamp()
        },
        locationUpdatedAt: serverTimestamp()
    };

    try {
        await Promise.all([
            setDoc(doc(db, 'patients', patientId), mergedPatient, { merge: true }),
            setDoc(
                doc(db, 'users', patientId),
                {
                    address: fullAddress,
                    latitude,
                    longitude,
                    state,
                    district,
                    mandal,
                    city,
                    pincode,
                    locationUpdatedAt: serverTimestamp()
                },
                { merge: true }
            )
        ]);
        return true;
    } catch (e) {
        console.error("Error upserting address:", e);
        return false;
    }
};

const buildCaseVariants = (value) => {
    const normalized = normalizeLocationValue(value);
    if (!normalized) return [];

    const titleCase = normalized
        .toLowerCase()
        .split(" ")
        .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
        .join(" ");

    return Array.from(new Set([normalized, normalized.toLowerCase(), normalized.toUpperCase(), titleCase]));
};

const queryApprovedHospitalsByField = async (field, value) => {
    if (!db) return [];
    const variants = buildCaseVariants(value);
    if (variants.length === 0) return [];

    for (const variant of variants) {
        try {
            const approvedQuery = query(
                collection(db, "hospitals"),
                where("approved", "==", true),
                where(field, "==", variant)
            );
            const approvedSnap = await getDocs(approvedQuery);
            if (!approvedSnap.empty) {
                return approvedSnap.docs.map(d => ({ id: d.id, hospitalId: d.id, ...d.data() }));
            }

            const legacyQuery = query(
                collection(db, "hospitals"),
                where(field, "==", variant)
            );
            const legacySnap = await getDocs(legacyQuery);
            if (!legacySnap.empty) {
                return legacySnap.docs.map(d => ({ id: d.id, hospitalId: d.id, ...d.data() }));
            }
        } catch (e) {}
    }
    return [];
};

const parseLocationInput = (location) => {
    const raw = normalizeLocationValue(location);
    if (!raw) return { district: "", state: "", country: "" };

    const parts = raw
        .split(",")
        .map(part => normalizeLocationValue(part))
        .filter(Boolean);

    return {
        district: parts[0] || raw,
        state: parts[1] || "",
        country: parts[2] || ""
    };
};

export const getHospitalsByLocation = async ({
    district = "",
    state = "",
    country = "",
    search = ""
} = {}) => {
    const searchValue = normalizeLocationValue(search);

    if (searchValue) {
        let hospitals = await queryApprovedHospitalsByField("district", searchValue);
        if (hospitals.length > 0) return hospitals;

        hospitals = await queryApprovedHospitalsByField("state", searchValue);
        if (hospitals.length > 0) return hospitals;

        return queryApprovedHospitalsByField("country", searchValue);
    }

    const districtValue = normalizeLocationValue(district);
    if (districtValue) {
        return queryApprovedHospitalsByField("district", districtValue);
    }

    const stateValue = normalizeLocationValue(state);
    if (stateValue) {
        return queryApprovedHospitalsByField("state", stateValue);
    }

    const countryValue = normalizeLocationValue(country);
    if (countryValue) {
        return queryApprovedHospitalsByField("country", countryValue);
    }

    return [];
};

const toFiniteNumber = (value) => {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : null;
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const sLat1 = toRad(lat1);
    const sLat2 = toRad(lat2);
    const h =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(sLat1) * Math.cos(sLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const computeBoundingBox = (lat, lng, radiusKm) => {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180) || 1);
    return {
        latMin: lat - latDelta,
        latMax: lat + latDelta,
        lngMin: lng - lngDelta,
        lngMax: lng + lngDelta
    };
};

const readHospitalCoords = (h) => {
    const loc = h?.location;
    const lat = toFiniteNumber(h?.latitude ?? h?.lat ?? loc?.latitude ?? loc?.lat);
    const lng = toFiniteNumber(h?.longitude ?? h?.lng ?? h?.lon ?? loc?.longitude ?? loc?.lng ?? loc?.lon);
    return lat != null && lng != null ? { lat, lng } : null;
};

export const getHospitalsNear = async ({
    latitude,
    longitude,
    radiusKm = 8,
    limit = 250,
    state = '',
    district = '',
    mandal = ''
} = {}) => {
    if (!db) return [];

    const lat = toFiniteNumber(latitude);
    const lng = toFiniteNumber(longitude);
    const r = toFiniteNumber(radiusKm) ?? 8;

    if (lat == null || lng == null) return [];

    const bounds = computeBoundingBox(lat, lng, r);

    const normalize = (v) => normalizeLocationValue(v).toLowerCase();
    const targetState = normalize(state);
    const targetDistrict = normalize(district);
    const targetMandal = normalize(mandal);

    const enrich = (hospitals) => {
        const out = [];
        for (const h of hospitals || []) {
            if (h?.approved === false) continue;

            const coords = readHospitalCoords(h);
            if (!coords) continue;

            if (coords.lat < bounds.latMin || coords.lat > bounds.latMax) continue;
            if (coords.lng < bounds.lngMin || coords.lng > bounds.lngMax) continue;

            const km = haversineKm(lat, lng, coords.lat, coords.lng);
            if (!Number.isFinite(km) || km > r) continue;

            const hospitalState = normalize(h?.state);
            const hospitalDistrict = normalize(h?.district);
            const hospitalMandal = normalize(h?.mandal);

            const scopeScore =
                targetMandal && hospitalMandal === targetMandal
                    ? 0
                    : targetDistrict && hospitalDistrict === targetDistrict
                        ? 1
                        : targetState && hospitalState === targetState
                            ? 2
                            : 3;

            out.push({
                ...h,
                latitude: coords.lat,
                longitude: coords.lng,
                distanceKm: km,
                _scopeScore: scopeScore
            });
        }

        out.sort((a, b) => {
            if (a._scopeScore !== b._scopeScore) return a._scopeScore - b._scopeScore;
            const ak = a.distanceKm ?? Infinity;
            const bk = b.distanceKm ?? Infinity;
            if (ak !== bk) return ak - bk;
            return Number(b?.rating || 0) - Number(a?.rating || 0);
        });

        return out.slice(0, Math.max(10, Math.min(limit, 500)));
    };

    try {
        const q = query(
            collection(db, 'hospitals'),
            where('latitude', '>=', bounds.latMin),
            where('latitude', '<=', bounds.latMax)
        );
        const snap = await getDocs(q);
        const candidates = snap.docs.map(d => ({ id: d.id, hospitalId: d.id, ...d.data() }));
        if (!candidates || candidates.length === 0) {
            const all = await getHospitals();
            return enrich(all);
        }
        return enrich(candidates);
    } catch (e) {
        console.warn('[Discovery] Latitude-bounded query failed, falling back to full scan');
        const all = await getHospitals();
        return enrich(all);
    }
};

export const getDoctors = async (hospitalId = null) => {
    if (!db) return [];
    try {
        let q = collection(db, "doctors");
        if (hospitalId) q = query(q, where("hospitalId", "==", hospitalId));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, doctorId: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error getting doctors:", e);
        return [];
    }
};

export const getPharmacies = async () => {
    if (!db) return [];
    try {
        const snap = await getDocs(collection(db, "pharmacies"));
        return snap.docs.map(doc => ({ id: doc.id, pharmacyId: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error getting pharmacies:", e);
        return [];
    }
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

// --- Prescriptions ---

export const uploadPrescriptionImage = async (appointmentId, dataUrl) => {
    if (!storage || !appointmentId) return null;
    try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const storageRef = ref(storage, `prescriptions/${appointmentId}_${Date.now()}.png`);
        const uploadTask = await uploadBytesResumable(storageRef, blob);
        return await getDownloadURL(uploadTask.ref);
    } catch (error) {
        console.error("Error uploading prescription image:", error);
        throw error;
    }
};

export const addAppointmentPrescription = async ({ appointmentId, prescription, doctorName, patientId, imageUrl }) => {
    if (!db || !appointmentId) return null;
    try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        const prescriptionData = {
            appointmentId,
            patientId,
            doctorName,
            prescription: prescription || null,
            imageUrl: imageUrl || null,
            createdAt: serverTimestamp()
        };
        await addDoc(collection(db, "prescriptions"), prescriptionData);

        await updateDoc(appointmentRef, {
            prescription: prescription || null,
            prescriptionImageUrl: imageUrl || null,
            status: 'Completed',
            updatedAt: serverTimestamp()
        });

        if (patientId) {
            await createNotification({
                userId: patientId,
                message: `Dr. ${doctorName || 'your doctor'} added a prescription for you`,
                type: 'prescription',
                appointmentId,
                doctorName,
            });
        }
        return true;
    } catch (error) {
        console.error("Error adding appointment prescription:", error);
        throw error;
    }
};

export const getPrescriptions = async (patientId) => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, "prescriptions"),
            where("patientId", "==", patientId),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching prescriptions:", error);
        return [];
    }
};

export const subscribeToPrescriptions = (patientId, callback) => {
    if (!db) return () => { };
    const q = query(collection(db, "prescriptions"), where("patientId", "==", patientId), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};

// --- Legacy Aliases and Extras ---

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
export const getNearbyHospitalsAndDoctors = async (locationInput, options = {}) => {
    const parsed = typeof locationInput === "string" ? parseLocationInput(locationInput) : (locationInput || {});
    return getHospitalsByLocation({
        district: options.district || parsed.district,
        state: options.state || parsed.state,
        country: options.country || parsed.country,
        search: options.search || ""
    });
};

export const createOrder = createMedicineOrder;

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
    try {
        const orderRef = doc(db, "medicine_orders", orderId);
        await updateDoc(orderRef, { status, updatedAt: serverTimestamp() });
        const legacyRef = doc(db, "orders", orderId);
        await updateDoc(legacyRef, { status, updatedAt: serverTimestamp() }).catch(() => {});
    } catch (e) {}
};

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

export const searchDoctorByName = async (name) => {
    if (!db) return null;
    const snap = await getDocs(collection(db, "doctors"));
    const lower = name.toLowerCase();
    const found = snap.docs.find(d => (d.data().name || '').toLowerCase().includes(lower));
    return found ? { id: found.id, ...found.data() } : null;
};

export const findAlternativeDoctors = async (specialty, _hospitalId, _date, _time) => {
    if (!db) return [];
    try {
        let q = collection(db, "doctors");
        if (specialty) q = query(q, where("specialization", "==", specialty));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { return []; }
};

export const checkSlotAvailability = async (doctorId, date, time) => {
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

export const getNextAvailableSlot = async (doctorId, date, _preferredTime) => {
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

export const generateToken = async (_hospitalId, doctorId, _patientId) => {
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
