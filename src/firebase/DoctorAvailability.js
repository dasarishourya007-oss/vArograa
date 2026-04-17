import { 
    collection, 
    query, 
    where, 
    getDocs
} from "firebase/firestore";
import { db } from "./config";

/**
 * Checks if a specific doctor is available for a given date and time.
 * An available slot is one that has no 'pending' or 'accepted' appointments.
 */
export const checkSlotAvailability = async (doctorId, date, time) => {
    if (!db || !doctorId || !date || !time) return true;
    try {
        const q = query(
            collection(db, "appointments"),
            where("doctorId", "==", doctorId),
            where("date", "==", date),
            where("time", "==", time),
            where("status", "in", ["pending", "accepted"])
        );
        const snap = await getDocs(q);
        return snap.empty;
    } catch (error) {
        console.error("Error checking slot availability:", error);
        return true; // Fallback to available if query fails
    }
};

/**
 * Finds alternative doctors with the same specialization who are available at the requested time.
 */
export const findAvailableDoctors = async (specialization, date, time, hospitalId = null) => {
    if (!db || !specialization) return [];
    try {
        // 1. Get all doctors with the same specialization
        let doctorQuery = query(
            collection(db, "doctors"),
            where("status", "==", "APPROVED")
        );
        
        const doctorSnap = await getDocs(doctorQuery);
        const rawCandidates = doctorSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const candidates = rawCandidates.filter(doc => {
            const spec = (doc.specialization || doc.specialty || '').toLowerCase();
            const target = specialization.toLowerCase();
            const matchSpec = spec === target || spec.includes(target);
            const matchHospital = hospitalId ? (doc.hospitalId === hospitalId || doc.hospitalRefId === hospitalId) : true;
            return matchSpec && matchHospital;
        });

        // 2. Filter for availability
        const availableDoctors = [];
        for (const doctor of candidates) {
            // Check if online and has an open slot
            if (doctor.isOnline !== false) {
                const isAvailable = await checkSlotAvailability(doctor.uid || doctor.id, date, time);
                if (isAvailable) {
                    availableDoctors.push(doctor);
                }
            }
        }

        // 3. Sort by rating if available
        return availableDoctors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } catch (error) {
        console.error("Error finding available doctors:", error);
        return [];
    }
};
