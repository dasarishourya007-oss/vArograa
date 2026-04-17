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
    setDoc,
    increment
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

export const updateDoctorOnlineStatus = async (doctorId, isOnline) => {
    if (!db || !doctorId) return;
    try {
        const doctorRef = doc(db, "doctors", doctorId);
        await updateDoc(doctorRef, {
            isOnline,
            updatedAt: serverTimestamp()
        });
        
        // Also update in users collection if applicable
        const userRef = doc(db, "users", doctorId);
        await setDoc(userRef, {
            isOnline,
            updatedAt: serverTimestamp()
        }, { merge: true });


        // BUG FIX: Also update the hospital subcollection so patient portal reflects the change.
        // The doctor document stores hospitalId (Firebase UID) and hospitalRefId (Firestore doc ID).
        const doctorSnap = await getDoc(doctorRef);
        if (doctorSnap.exists()) {
            const doctorData = doctorSnap.data();
            const hIds = Array.from(new Set([
                doctorData?.hospitalId,
                doctorData?.hospitalRefId
            ].filter(Boolean)));
            for (const hId of hIds) {
                try {
                    const subRef = doc(db, "hospitals", hId, "doctors", doctorId);
                    const subSnap = await getDoc(subRef);
                    if (subSnap.exists()) {
                        await updateDoc(subRef, { isOnline, updatedAt: serverTimestamp() });
                    }
                } catch (e) {
                    console.warn(`[DoctorStatus] Could not update subcollection for hospital ${hId}:`, e.message);
                }
            }
        }
    } catch (error) {
        console.error("Error updating doctor online status:", error);
        throw error;
    }
};

// --- Hospital Status Mode ---

/**
 * Updates the hospital's operational mode in Firestore.
 * Modes: 'auto' | 'manual' | 'busy' | 'full'
 */
export const updateHospitalStatus = async (hospitalId, mode) => {
    if (!db || !hospitalId) return;
    try {
        const hospitalRef = doc(db, "hospitals", hospitalId);
        await updateDoc(hospitalRef, {
            hospitalMode: mode,
            hospitalModeUpdatedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Also update in users collection to trigger AuthContext listeners
        const userRef = doc(db, "users", hospitalId);
        await setDoc(userRef, {
            hospitalMode: mode,
            updatedAt: serverTimestamp()
        }, { merge: true });

    } catch (error) {
        console.error("Error updating hospital status:", error);
        throw error;
    }
};

/**
 * Real-time listener for a single hospital document (for status mode sync).
 */
export const subscribeToHospitalDoc = (hospitalId, callback) => {
    if (!db || !hospitalId) return () => {};
    const hospitalRef = doc(db, "hospitals", hospitalId);
    return onSnapshot(hospitalRef, (snap) => {
        if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() });
        }
    }, (err) => {
        console.warn('[HospitalDoc] Listener error:', err.message);
    });
};

// --- Appointment Services ---
const normalizeAppointmentType = (value) => {
    const v = String(value || '').toLowerCase();
    if (v === 'online') return 'online';
    if (v === 'home' || v === 'homevisit') return 'homevisit';
    return 'offline';
};

export const createAppointment = async (appointmentData) => {
    if (!db) return null;
    try {
        const rawPayload = {
            ...appointmentData,
            appointmentType: normalizeAppointmentType(appointmentData.appointmentType || appointmentData.visitType),
            status: appointmentData.status || 'pending',
            hospitalRefId: appointmentData.hospitalRefId || appointmentData.hospitalId || '',
            doctorRefId: appointmentData.doctorRefId || appointmentData.doctorId || '',
            hospitalName: appointmentData.hospitalName || appointmentData.hospital || 'Hospital',
            doctorName: appointmentData.doctorName || appointmentData.doctor || 'Doctor',
            patientName: appointmentData.patientName || 'Patient',
            date: appointmentData.date || appointmentData.appointmentDateKey || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        // Firestore rejects undefined values; strip them defensively.
        const payload = Object.fromEntries(
            Object.entries(rawPayload).filter(([, value]) => value !== undefined)
        );

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

        if (payload?.hospitalRefId && payload.hospitalRefId !== payload.hospitalId) {
            await createNotification({
                userId: payload.hospitalRefId,
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
                message: `Your appointment request for ${payload.time || 'selected slot'} has been sent to ${payload.hospitalName || 'the hospital'} for analysis and assignment. Wait for your scheduled time slot.`,
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

/**
 * Searches and automatically reassigns an appointment if the original doctor declines.
 */
export const autoReassignAppointment = async (appointmentId) => {
    if (!db) return;
    try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        const appointmentSnap = await getDoc(appointmentRef);
        if (!appointmentSnap.exists()) return;
        const data = appointmentSnap.data();

        // 1. Find the specialization/department context
        const doctorRef = doc(db, "doctors", data.doctorId || data.doctorRefId);
        const doctorSnap = await getDoc(doctorRef);
        const spec = doctorSnap.exists() 
            ? (doctorSnap.data().specialization || doctorSnap.data().specialty) 
            : 'General';

        // 2. Search for next best available doctor in the SAME hospital
        const { findAvailableDoctors } = await import('./DoctorAvailability');
        const candidates = await findAvailableDoctors(spec, data.date, data.time, data.hospitalId);
        
        // Filter out the one who just declined
        const replacement = candidates.find(c => c.id !== data.doctorId && c.id !== data.doctorRefId);

        if (replacement) {
            await updateAppointmentStatus(appointmentId, 'assigned', {
                doctorId: replacement.uid || replacement.id,
                doctorRefId: replacement.id,
                doctorName: replacement.name,
                previousDoctorName: data.doctorName,
                isAutoReassigned: true,
                reassignedAt: serverTimestamp()
            });
            console.log(`[AutoReassign] Appointment ${appointmentId} reassigned to ${replacement.name}`);
        } else {
            // No doctors available, escalate to PENDING for admin review
            await updateAppointmentStatus(appointmentId, 'pending', {
                reassignmentFailed: true,
                failedAt: serverTimestamp(),
                reason: 'No alternative doctors available in the department.'
            });
            console.warn(`[AutoReassign] No replacement found for ${appointmentId}. Escalating to admin.`);
        }
    } catch (err) {
        console.error("[AutoReassign] Failed:", err);
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
        const isAssigned = normalizedStatus === 'assigned';
        const isAccepted = normalizedStatus === 'accepted' || normalizedStatus === 'confirmed';
        const isDeclined = normalizedStatus === 'declined' || normalizedStatus === 'rejected';

        const doctorId = extraUpdates?.doctorId || appointmentData?.doctorId || null;
        const doctorName = extraUpdates?.doctorName || appointmentData?.doctorName || 'Doctor';
        const patientName = appointmentData?.patientName || 'A patient';
        const slotTime = appointmentData?.time || 'selected slot';
        const slotDate = appointmentData?.date || '';
        const slotLabel = slotDate ? `${slotDate} at ${slotTime}` : slotTime;

        if (isAssigned) {
            // Notify Patient: Doctor found, validating with them
            if (appointmentData?.patientId) {
                await createNotification({
                    userId: appointmentData.patientId,
                    type: 'appointment_assigned',
                    appointmentId,
                    title: 'Doctor Assigned',
                    message: `Hospital has assigned Dr. ${doctorName} to your request. Waiting for final validation.`,
                    hospitalId: appointmentData?.hospitalId || null,
                    doctorId
                });
            }

            // [WHATSAPP-STYLE AUTOMATION] 
            // Send system message to private chat
            if (appointmentData?.patientId && doctorId) {
                const sId = [appointmentData.patientId, doctorId].sort().join('_');
                await sendSystemMessage(sId, `🏥 MISSION ALLOTED: vArogra Hospital has assigned Dr. ${doctorName} to your request for ${slotLabel}. Waiting for final validation.`);
            }

            // Notify Doctor: Mission assignment
            if (doctorId) {
                await createNotification({
                    userId: doctorId,
                    type: 'doctor_appointment_assigned',
                    appointmentId,
                    title: 'Mission Assigned: Patient Validation Required',
                    message: `You have been assigned to ${patientName} for ${slotLabel}. Priority: ${appointmentData?.priority || 'Normal'}. Please Accept or Decline.`,
                    hospitalId: appointmentData?.hospitalId || null,
                    patientId: appointmentData?.patientId || null,
                    doctorId
                });
            }
        }

        if (isAccepted) {
            if (appointmentData?.patientId) {
                await createNotification({
                    userId: appointmentData.patientId,
                    type: 'appointment',
                    appointmentId,
                    title: 'Appointment Confirmed',
                    message: `Your appointment with Dr. ${doctorName} is now CONFIRMED for ${slotLabel}. Arrive 10 mins early.`,
                    hospitalId: appointmentData?.hospitalId || null,
                    doctorId
                });
            }

            // [WHATSAPP-STYLE AUTOMATION] 
            // Send system message to private chat
            if (appointmentData?.patientId && doctorId) {
                const sId = [appointmentData.patientId, doctorId].sort().join('_');
                await sendSystemMessage(sId, `✅ MISSION SECURED: Dr. ${doctorName} has confirmed your appointment for ${slotLabel}. Please be ready 10 mins early.`);
            }

            if (doctorId) {
                await createNotification({
                    userId: doctorId,
                    type: 'doctor_appointment_confirmed',
                    appointmentId,
                    title: 'Appointment Secure',
                    message: `You have confirmed the session with ${patientName} at ${slotLabel}.`,
                    hospitalId: appointmentData?.hospitalId || null,
                    patientId: appointmentData?.patientId || null,
                    doctorId
                });
            }
        }

        if (isDeclined) {
            // Trigger Adaptive Reassignment Logic
            if (normalizedStatus === 'declined') {
                await autoReassignAppointment(appointmentId);
            } else if (appointmentData?.patientId) {
                await createNotification({
                    userId: appointmentData.patientId,
                    type: 'appointment_rejected',
                    appointmentId,
                    title: 'Appointment Unavailable',
                    message: extraUpdates?.reason || `Your request for ${slotLabel} was declined due to workload. Processing alternatives.`,
                    hospitalId: appointmentData?.hospitalId || null,
                    doctorId
                });
            }
        }
    } catch (error) {
        console.error("Error updating appointment status:", error);
        throw error;
    }
};

export const subscribeToAppointments = (filters, callback) => {
    if (!db) return () => { };
    let qRef = collection(db, "appointments");
    const constraints = [];
    if (filters.hospitalId) constraints.push(where("hospitalId", "==", filters.hospitalId));
    if (filters.hospitalRefId) constraints.push(where("hospitalRefId", "==", filters.hospitalRefId));
    if (filters.patientId) constraints.push(where("patientId", "==", filters.patientId));
    if (filters.doctorId) constraints.push(where("doctorId", "==", filters.doctorId));
    if (filters.doctorRefId) constraints.push(where("doctorRefId", "==", filters.doctorRefId));
    if (filters.status) constraints.push(where("status", "==", filters.status));
    const q = constraints.length > 0 ? query(qRef, ...constraints) : qRef;
    return onSnapshot(q, (snapshot) => {
        const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        rows.sort((a, b) => {
            const at = a?.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
            const bt = b?.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
            return bt - at;
        });
        callback(rows);
    });
};

export const subscribeToAppointment = (appointmentId, callback) => {
    if (!db || !appointmentId) return () => { };
    const appointmentRef = doc(db, "appointments", appointmentId);
    return onSnapshot(appointmentRef, (snapshot) => {
        if (!snapshot.exists()) {
            callback && callback(null);
            return;
        }
        callback({
            id: snapshot.id,
            ...snapshot.data()
        });
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
    // Use simple query without orderBy to avoid composite index requirement
    const q = query(collection(db, "vitals"), where("patientId", "==", patientId));
    return onSnapshot(q, (snapshot) => {
        const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const at = a?.recordedAt?.seconds ?? a?.createdAt?.seconds ?? 0;
                const bt = b?.recordedAt?.seconds ?? b?.createdAt?.seconds ?? 0;
                return bt - at;
            });
        callback(rows);
    }, (err) => {
        console.warn('[Vitals] Firestore error (index may be missing):', err.message);
        callback([]);
    });
};

// --- SOS Emergency System ---
// ... (omitting SOS for now as I'm adding AFTER it)
// I'll add after line 479

// --- Consultation Session Lifecycle ---

export const startConsultation = async (patientId, doctorId, appointmentId = null) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "consultations"), {
            patientId,
            doctorId,
            appointmentId,
            status: 'active',
            startTime: serverTimestamp(),
            createdAt: serverTimestamp()
        });
        
        if (appointmentId) {
            await updateDoc(doc(db, "appointments", appointmentId), {
                consultationId: docRef.id,
                consultationStatus: 'active',
                updatedAt: serverTimestamp()
            });
        }
        
        return docRef.id;
    } catch (error) {
        console.error("Error starting consultation:", error);
        throw error;
    }
};

export const completeConsultation = async (consultationId, appointmentId = null) => {
    if (!db || !consultationId) return;
    try {
        const consultRef = doc(db, "consultations", consultationId);
        await updateDoc(consultRef, {
            status: 'completed',
            endTime: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        if (appointmentId) {
            await updateDoc(doc(db, "appointments", appointmentId), {
                consultationStatus: 'completed',
                status: 'completed', // Final status
                updatedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error completing consultation:", error);
        throw error;
    }
};

export const subscribeToActiveConsultation = (doctorId, callback) => {
    if (!db || !doctorId) return () => {};
    const q = query(
        collection(db, "consultations"),
        where("doctorId", "==", doctorId),
        where("status", "==", "active")
    );
    return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            callback({ id: doc.id, ...doc.data() });
        } else {
            callback(null);
        }
    });
};

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
        const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        rows.sort((a, b) => {
            const at = a?.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
            const bt = b?.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
            return bt - at;
        });
        callback(rows);
    });
};

// --- Pharmacy & Orders ---

// createMedicineOrder consolidated into createOrder

// --- Discovery Services (Refined) ---

export const getHospitals = async () => {
    if (!db) return [];
    const snap = await getDocs(collection(db, "hospitals"));
    return snap.docs.map(doc => ({ id: doc.id, hospitalId: doc.id, ...doc.data() }));
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
        const approvedQuery = query(
            collection(db, "hospitals"),
            where("approved", "==", true),
            where(field, "==", variant)
        );
        const approvedSnap = await getDocs(approvedQuery);
        if (!approvedSnap.empty) {
            return approvedSnap.docs.map(d => ({ id: d.id, hospitalId: d.id, ...d.data() }));
        }

        // Backward compatibility for existing records that do not yet have `approved`.
        const legacyQuery = query(
            collection(db, "hospitals"),
            where(field, "==", variant)
        );
        const legacySnap = await getDocs(legacyQuery);
        if (!legacySnap.empty) {
            return legacySnap.docs.map(d => ({ id: d.id, hospitalId: d.id, ...d.data() }));
        }
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
    // Very close approximation for small distances.
    const latDelta = radiusKm / 111; // ~111km per degree latitude
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
    limit = 100,
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

            // Bounding-box filter
            if (coords.lat < bounds.latMin || coords.lat > bounds.latMax) continue;
            if (coords.lng < bounds.lngMin || coords.lng > bounds.lngMax) continue;

            const km = haversineKm(lat, lng, coords.lat, coords.lng);
            if (!Number.isFinite(km) || km > r) continue;

            const hospitalState = normalize(h?.state);
            const hospitalDistrict = normalize(h?.district);
            const hospitalMandal = normalize(h?.mandal);

            // Scoring for sorting
            const scopeScore = 
                targetMandal && hospitalMandal === targetMandal ? 0 :
                targetDistrict && hospitalDistrict === targetDistrict ? 1 :
                targetState && hospitalState === targetState ? 2 : 3;

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
            return (a.distanceKm || 0) - (b.distanceKm || 0);
        });

        return out.slice(0, limit);
    };

    // Optimization: Try to use a faster query if possible, but keep fallback safe.
    // Instead of full getHospitals(), use cached data if available.
    try {
        const q = query(
            collection(db, 'hospitals'),
            where('latitude', '>=', bounds.latMin),
            where('latitude', '<=', bounds.latMax)
        );
        const snap = await getDocs(q);
        return enrich(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
        console.warn('[Discovery] Latitude query failed, using fallback.');
        // If we have a district, query by district first to narrow down instead of full scan
        if (targetDistrict) {
            const qD = query(collection(db, 'hospitals'), where('district', '==', state || district)); 
            const snapD = await getDocs(qD);
            if (!snapD.empty) return enrich(snapD.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        
        // Final fallback: use already loaded hospitals from state if possible (passed from AuthContext)
        // But for now, we'll keep the direct getHospitals() but with a limit if possible.
        const allSnap = await getDocs(collection(db, "hospitals"));
        return enrich(allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
};

export const getDoctors = async (hospitalId = null) => {
    if (!db) return [];
    let q = collection(db, "doctors");
    if (hospitalId) q = query(q, where("hospitalId", "==", hospitalId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, doctorId: doc.id, ...doc.data() }));
};

export const getMedicalStores = async () => {
    if (!db) return [];
    const snap = await getDocs(collection(db, "medical_stores"));
    return snap.docs.map(doc => ({ id: doc.id, storeId: doc.id, ...doc.data() }));
};
export const getPharmacies = getMedicalStores;

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
            message: message, // for legacy if needed
            text: message,    // standard for new chat
            timestamp: serverTimestamp(),
            type: 'text'
        });
        return docRef.id;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

export const sendSystemMessage = async (sessionId, message) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "chat_sessions", sessionId, "messages"), {
            senderId: 'system',
            senderName: 'vArogra System',
            text: message,
            type: 'system',
            timestamp: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error sending system message:", error);
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
    // Use simple query without orderBy to avoid composite index requirement
    const q = query(collection(db, "notifications"), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
        const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const at = a?.createdAt?.seconds ?? 0;
                const bt = b?.createdAt?.seconds ?? 0;
                return bt - at;
            });
        callback(rows);
    }, (err) => {
        console.warn('[Notifications] Firestore error (index may be missing):', err.message);
        callback([]);
    });
};

// --- Legacy Aliases ---
export const getNearbyHospitals = getHospitals;
export const getDoctorsByHospital = (hId) => getDoctors(hId);
export const listenToHospitals = (cb) => {
    if (!db) { cb([]); return () => { }; }
    return onSnapshot(
        collection(db, "hospitals"),
        (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => { console.warn('[listenToHospitals] Firestore error:', err.message); cb([]); }
    );
};
export const listenToDoctors = (cb) => {
    if (!db) { cb([]); return () => { }; }
    return onSnapshot(
        collection(db, "doctors"),
        (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => { console.warn('[listenToDoctors] Firestore error:', err.message); cb([]); }
    );
};
export const listenToMedicalStores = (cb) => {
    if (!db) { cb([]); return () => { }; }
    return onSnapshot(
        collection(db, "medical_stores"),
        (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => { console.warn('[listenToMedicalStores] Firestore error:', err.message); cb([]); }
    );
};
export const getNearbyHospitalsAndDoctors = async (locationInput, options = {}) => {
    const parsed = typeof locationInput === "string"
        ? parseLocationInput(locationInput)
        : (locationInput || {});

    return getHospitalsByLocation({
        district: options.district || parsed.district,
        state: options.state || parsed.state,
        country: options.country || parsed.country,
        search: options.search || ""
    });
};
export const subscribeToPrescriptions = (patientId, callback) => {
    if (!db) return () => { };
    // Use simple query without orderBy to avoid composite index requirement
    const q = query(collection(db, "prescriptions"), where("patientId", "==", patientId));
    return onSnapshot(q, (snapshot) => {
        const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const at = a?.createdAt?.seconds ?? 0;
                const bt = b?.createdAt?.seconds ?? 0;
                return bt - at;
            });
        callback(rows);
    }, (err) => {
        console.warn('[Prescriptions] Firestore error (index may be missing):', err.message);
        callback([]);
    });
};
// Removed duplicate createOrder alias

// --- Orders Subscription ---
export const subscribeToOrders = (pharmacyId, callback) => {
    if (!db) return () => { };
    const q = query(
        collection(db, "medicine_orders"),
        where("pharmacyId", "==", pharmacyId),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
        const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        rows.sort((a, b) => {
            const at = a?.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
            const bt = b?.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
            return bt - at;
        });
        callback(rows);
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
    } catch { }
};

// --- Patient-scoped pharmacy orders subscription ---
export const subscribeToPatientOrders = (patientId, callback) => {
    if (!db || !patientId) return () => { };
    const q = query(
        collection(db, "pharmacy_orders"),
        where("patientId", "==", patientId)
    );
    return onSnapshot(q, (snapshot) => {
        const rows = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const at = a?.createdAt?.seconds ?? 0;
                const bt = b?.createdAt?.seconds ?? 0;
                return bt - at;
            });
        callback(rows);
    }, (err) => {
        console.warn('[PatientOrders] Firestore error:', err.message);
        callback([]);
    });
};

// --- Write a pharmacy order to Firestore ---
export const createPharmacyOrder = async (orderData) => {
    if (!db) return null;
    try {
        const payload = {
            ...orderData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: orderData.status || 'REQUESTED',
            recordType: 'pharmacy_order'
        };
        const docRef = await addDoc(collection(db, "pharmacy_orders"), payload);
        return docRef.id;
    } catch (error) {
        console.error("Error creating pharmacy order:", error);
        throw error;
    }
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

export const createSmartPrescription = async (prescriptionData) => {
    if (!db) return null;
    try {
        const payload = {
            ...prescriptionData,
            status: 'sent',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, "prescriptions"), payload);

        // Notify patient
        if (prescriptionData.patientId) {
            await createNotification({
                userId: prescriptionData.patientId,
                type: 'prescription_received',
                appointmentId: prescriptionData.appointmentId || null,
                title: 'New Prescription Received',
                message: `Dr. ${prescriptionData.doctorName || 'your doctor'} has shared a new prescription.`,
                patientId: prescriptionData.patientId,
                doctorId: prescriptionData.doctorId,
                prescriptionId: docRef.id
            });
        }

        return docRef.id;
    } catch (error) {
        console.error("Error creating smart prescription:", error);
        throw error;
    }
};

export const updatePrescriptionStatus = async (prescriptionId, status) => {
    if (!db || !prescriptionId) return;
    try {
        const rxRef = doc(db, "prescriptions", prescriptionId);
        await updateDoc(rxRef, {
            status,
            viewedAt: status === 'viewed' ? serverTimestamp() : null,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating prescription status:", error);
    }
};

// --- Prescriptions & Patient Management ---

/**
 * Uploads a canvas DataURL to Firebase Storage.
 * Path: prescriptions/{patientId}/{timestamp}.png
 */
export const uploadPrescriptionImage = async (patientId, dataUrl) => {
    if (!storage || !db) return null;
    try {
        // Convert DataURL to Blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        const timestamp = Date.now();
        const storageRef = ref(storage, `prescriptions/${patientId}/${timestamp}.png`);
        
        const uploadTask = uploadBytesResumable(storageRef, blob, {
            contentType: 'image/png'
        });

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                null,
                (error) => {
                    console.error("Storage upload error:", error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
    } catch (error) {
        console.error("Error in uploadPrescriptionImage:", error);
        throw error;
    }
};

/**
 * Fetches a unique list of patients treated by or who have booked with a doctor.
 */
export const fetchDoctorPatients = async (doctorId) => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, "appointments"),
            where("doctorId", "==", doctorId)
        );
        const snap = await getDocs(q);
        
        const patientMap = new Map();
        
        // Process in one pass to find unique patients and their latest visit
        snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            const pId = data.patientId;
            if (!pId) return;

            const existing = patientMap.get(pId);
            const currentVisitDate = data.date || data.appointmentDateKey || '';
            
            if (!existing || (currentVisitDate && currentVisitDate > existing.lastVisitDate)) {
                patientMap.set(pId, {
                    patientId: pId,
                    patientName: data.patientName || 'Unknown Patient',
                    photoURL: data.patientPhotoURL || data.patientPhoto || '',
                    lastVisitDate: currentVisitDate || 'N/A',
                    lastAppointmentId: docSnap.id
                });
            }
        });

        return Array.from(patientMap.values()).sort((a, b) => 
            b.lastVisitDate.localeCompare(a.lastVisitDate)
        );
    } catch (error) {
        console.error("Error fetching doctor patients:", error);
        return [];
    }
};

const parseAppointmentDateTime = (dateValue, timeValue) => {
    if (!dateValue) return null;
    try {
        const dateStr = String(dateValue).slice(0, 10);
        if (!timeValue) {
            const parsed = new Date(`${dateStr}T00:00:00`);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        const timeParts = String(timeValue).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!timeParts) {
            const parsed = new Date(`${dateStr}T${String(timeValue)}`);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        let hour = Number(timeParts[1]);
        const minute = Number(timeParts[2]);
        const meridian = timeParts[3].toUpperCase();
        if (meridian === 'PM' && hour < 12) hour += 12;
        if (meridian === 'AM' && hour === 12) hour = 0;
        const parsed = new Date(`${dateStr}T00:00:00`);
        parsed.setHours(hour, minute, 0, 0);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    } catch {
        return null;
    }
};

export const sendPrescriptionToPatient = async ({
    appointmentId,
    appointment = {},
    doctor = {},
    diagnosis = '',
    medicines = [],
    advice = '',
    notes = '',
    imageUrl = '',
    whiteboardDataUrl = '' // Deprecated, but keeping for backward compatibility
}) => {
    if (!db) return null;

    const cleanMeds = (Array.isArray(medicines) ? medicines : [])
        .map((med) => ({
            name: String(med?.name || '').trim(),
            dose: String(med?.dose || '').trim(),
            frequency: String(med?.frequency || '').trim(),
            duration: String(med?.duration || '').trim(),
            instructions: String(med?.instructions || '').trim()
        }))
        .filter((med) => med.name);

    const doctorName = doctor?.name || doctor?.displayName || appointment?.doctorName || 'Doctor';
    const patientId = appointment?.patientId || null;
    const patientName = appointment?.patientName || '';
    const apptDate = appointment?.date || appointment?.appointmentDateKey || '';
    const apptTime = appointment?.time || '';
    const followUpAt = parseAppointmentDateTime(apptDate, apptTime);

    const basePrescription = {
        appointmentId: appointmentId || appointment?.id || null,
        patientId,
        patientName,
        doctorId: doctor?.uid || doctor?.id || appointment?.doctorId || null,
        doctorName,
        hospitalId: appointment?.hospitalId || appointment?.hospitalRefId || null,
        hospitalName: appointment?.hospitalName || '',
        diagnosis: String(diagnosis || '').trim(),
        advice: String(advice || '').trim(),
        notes: String(notes || '').trim(),
        imageUrl: String(imageUrl || '').trim(),
        whiteboardDataUrl: String(whiteboardDataUrl || imageUrl || '').trim(),
        medicines: cleanMeds,
        medicine: cleanMeds.map((m) => m.name).join(', '),
        dosage: cleanMeds.map((m) => [m.dose, m.frequency].filter(Boolean).join(' ')).filter(Boolean).join('; '),
        appointmentDate: apptDate,
        appointmentTime: apptTime,
        followUpAt: followUpAt || null
    };

    const prescriptionId = await createPrescription(basePrescription);

    await createMedicalRecord({
        type: 'prescription_receipt',
        title: `Prescription - ${doctorName}`,
        patientId,
        patientName,
        doctorId: basePrescription.doctorId,
        doctorName,
        appointmentId: basePrescription.appointmentId,
        hospitalId: basePrescription.hospitalId,
        hospitalName: basePrescription.hospitalName,
        recordDate: apptDate || new Date().toISOString().slice(0, 10),
        receiptKind: 'digital-prescription',
        prescriptionId,
        summary: basePrescription.diagnosis || 'Consultation prescription',
        payload: {
            medicines: cleanMeds,
            advice: basePrescription.advice,
            notes: basePrescription.notes,
            appointmentTime: apptTime,
            whiteboardDataUrl: basePrescription.whiteboardDataUrl || ''
        }
    });

    if (appointmentId) {
        try {
            await updateDoc(doc(db, "appointments", appointmentId), {
                status: 'prescribed',
                prescriptionId,
                prescriptionSummary: basePrescription.diagnosis || '',
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.warn('Failed to update appointment prescription status:', error);
        }
    }

    if (patientId) {
        await createNotification({
            userId: patientId,
            type: 'prescription_received',
            appointmentId: appointmentId || null,
            title: 'New Prescription Received',
            message: `${doctorName} shared your consultation prescription in Medical Records/Receipts.`,
            patientId,
            doctorId: basePrescription.doctorId,
            hospitalId: basePrescription.hospitalId || null,
            prescriptionId
        });
    }

    return prescriptionId;
};

// --- Voice Assistant / Appointment Booking Helpers ---
export const searchDoctorByName = async (name) => {
    if (!db) return null;
    const snap = await getDocs(collection(db, "doctors"));
    const lower = name.toLowerCase();
    const found = snap.docs.find(d => (d.data().name || '').toLowerCase().includes(lower));
    return found ? { id: found.id, ...found.data() } : null;
};

export const findAlternativeDoctors = async (specialty, _hospitalId, _date, _time) => {
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
        where("status", "in", ["pending", "accepted"])
    );
    const snap = await getDocs(q);
    return snap.empty;
};

export const getNextAvailableSlot = async (doctorId, date, _preferredTime) => {
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

export const generateToken = async (_hospitalId, doctorId, _patientId) => {
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



// --- Medical Store Inventory & Patients ---

export const subscribeToInventory = (storeId, callback) => {
    if (!db || !storeId) return () => { };
    const q = query(collection(db, "inventory"), where("storeId", "==", storeId));
    return onSnapshot(q, (snapshot) => {
        const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(rows);
    });
};

export const addInventoryItem = async (itemData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "inventory"), {
            ...itemData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding inventory item:", error);
        throw error;
    }
};

export const updateInventoryItem = async (itemId, updates) => {
    if (!db) return;
    const itemRef = doc(db, "inventory", itemId);
    await updateDoc(itemRef, {
        ...updates,
        updatedAt: serverTimestamp()
    });
};

export const subscribeToStorePatients = (storeId, callback) => {
    if (!db || !storeId) return () => { };
    // Usually these are patients who ordered from this store
    const q = query(collection(db, "medicine_orders"), where("pharmacyId", "==", storeId));
    return onSnapshot(q, (snapshot) => {
        const patientMap = new Map();
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.patientId && !patientMap.has(data.patientId)) {
                patientMap.set(data.patientId, {
                    id: data.patientId,
                    name: data.patientName,
                    email: data.patientEmail,
                    lastOrder: data.createdAt
                });
            }
        });
        callback(Array.from(patientMap.values()));
    });
};

// --- Hospital Analytics ---

export const subscribeToHospitalAnalytics = (hospitalId, callback) => {
    if (!db || !hospitalId) return () => { };
    
    // We'll aggregate data from multiple collections for a comprehensive view
    const apptsQuery = query(collection(db, "appointments"), where("hospitalId", "==", hospitalId));
    
    return onSnapshot(apptsQuery, (snapshot) => {
        const appointments = snapshot.docs.map(d => d.data());
        
        // Calculate basic stats
        const stats = {
            totalAppointments: appointments.length,
            pending: appointments.filter(a => a.status === 'pending').length,
            accepted: appointments.filter(a => a.status === 'accepted' || a.status === 'prescribed').length,
            rejected: appointments.filter(a => a.status === 'rejected').length,
            // Add more complex aggregations as needed
        };
        
        callback(stats);
    });
};
// --- Orders, Announcements & Camps ---

// Single source of truth for creating orders
export const createOrder = async (orderData) => {
    if (!db) return null;
    try {
        const payload = {
            ...orderData,
            createdAt: serverTimestamp(),
            status: orderData.status || 'pending'
        };
        const docRef = await addDoc(collection(db, "medicine_orders"), payload);
        
        // Parallel sync for legacy collections if necessary
        try {
            await setDoc(doc(db, "orders", docRef.id), payload);
        } catch (e) {
            console.warn("[createOrder] Legacy sync failed:", e.message);
        }
        
        return docRef.id;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

export const createMedicineOrder = createOrder;

export const updateOrder = async (orderId, updates) => {
    if (!db) return;
    try {
        const orderRef = doc(db, "medicine_orders", orderId);
        await updateDoc(orderRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating order:", error);
        throw error;
    }
};

export const createAnnouncement = async (annData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "announcements"), {
            ...annData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating announcement:", error);
        throw error;
    }
};

export const createMedicalCamp = async (campData) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, "medical_camps"), {
            ...campData,
            registeredCount: 0,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating medical camp:", error);
        throw error;
    }
};

export const registerForMedicalCamp = async (campId, userId) => {
    if (!db) return null;
    try {
        const regRef = await addDoc(collection(db, "camp_registrations"), {
            campId,
            userId,
            registeredAt: serverTimestamp()
        });
        
        // Increment count in camp doc
        const campRef = doc(db, "medical_camps", campId);
        await updateDoc(campRef, {
            registeredCount: increment(1)
        });
        
        return regRef.id;
    } catch (error) {
        console.error("Error registering for camp:", error);
        throw error;
    }
};





// --- Feedback Service ---

/**
 * Submits post-appointment feedback.
 * - Creates a document in the `feedback` collection
 * - Marks `feedbackSubmitted: true` on the appointment document
 * - Updates running-average rating on doctor and hospital documents
 */
export const submitFeedback = async ({
    appointmentId,
    patientId,
    doctorId,
    hospitalId,
    doctorName,
    hospitalName,
    doctorRating,
    hospitalRating,
    comment = '',
}) => {
    if (!db) throw new Error('Firestore not initialized');

    // 1. Create feedback document
    await addDoc(collection(db, 'feedback'), {
        appointmentId,
        patientId: patientId || null,
        doctorId: doctorId || null,
        hospitalId: hospitalId || null,
        doctorName: doctorName || '',
        hospitalName: hospitalName || '',
        doctorRating,
        hospitalRating,
        comment,
        submittedAt: serverTimestamp(),
    });

    // 2. Mark appointment as feedback-submitted to prevent re-prompting
    if (appointmentId) {
        const apptRef = doc(db, 'appointments', appointmentId);
        await updateDoc(apptRef, {
            feedbackSubmitted: true,
            updatedAt: serverTimestamp(),
        });
    }

    // Helper: compute & persist a new running-average rating
    const applyRating = async (collectionName, entityId, newRating) => {
        if (!entityId) return;
        const ref = doc(db, collectionName, entityId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;

        const data = snap.data();
        const prevTotal = Number(data.ratingTotal ?? (data.rating ?? 0) * (data.ratingCount ?? 0));
        const prevCount = Number(data.ratingCount ?? (data.rating ? 1 : 0));
        const newCount  = prevCount + 1;
        const newTotal  = prevTotal + newRating;
        const averaged  = Math.round((newTotal / newCount) * 10) / 10; // 1 decimal place

        await updateDoc(ref, {
            rating:      averaged,
            ratingTotal: newTotal,
            ratingCount: newCount,
            updatedAt:   serverTimestamp(),
        });
    };

    // 3. Update doctor rating
    await applyRating('doctors', doctorId, doctorRating);

    // 4. Update hospital rating
    await applyRating('hospitals', hospitalId, hospitalRating);
};

export const updateUserPhone = async (uid, phone) => {
    if (!db || !uid) return;
    try {
        const batch = [];
        const userRef = doc(db, 'users', uid);
        const patientRef = doc(db, 'patients', uid);
        
        // Update both if they exist (atomic update not required but batch/Promise.all is faster)
        await Promise.all([
            updateDoc(userRef, { phone, updatedAt: serverTimestamp() }),
            updateDoc(patientRef, { phone, updatedAt: serverTimestamp() })
        ]).catch(() => {
            // Fallback for cases where one might not exist (e.g. non-patient user)
            updateDoc(userRef, { phone, updatedAt: serverTimestamp() }).catch(() => {});
        });

        console.log(`[Services] Phone updated for user ${uid}`);
    } catch (err) {
        console.error("[Services] Failed to update phone:", err);
    }
};

export const updatePatientProfile = async (uid, data) => {
    if (!db || !uid) return;
    const patientRef = doc(db, 'patients', uid);
    const userRef = doc(db, 'users', uid);
    
    const updateData = {
        ...data,
        updatedAt: serverTimestamp()
    };

    await Promise.all([
        updateDoc(patientRef, updateData).catch(e => console.warn("Patient doc not found", e)),
        updateDoc(userRef, { 
            displayName: data.displayName || data.name,
            photoURL: data.photoURL,
            updatedAt: serverTimestamp() 
        }).catch(e => console.warn("User doc not found", e))
    ]);
};

export const recordConsultationFeedback = async (appointmentId, feedbackData) => {
    if (!db || !appointmentId) return;
    const apptRef = doc(db, 'appointments', appointmentId);
    
    // Add feedback to the appointment
    await updateDoc(apptRef, {
        feedback: feedbackData,
        feedbackRecorded: true,
        updatedAt: serverTimestamp()
    });

    console.log(`[Services] Feedback recorded for appt ${appointmentId}`);
};
