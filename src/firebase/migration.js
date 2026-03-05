import { db } from "./config";
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";

export const migrateDataToFirestore = async () => {
    try {
        console.log("Starting master migration...");

        const hospitalId = "demo-hospital-id";
        const doctorId = "demo-doctor-id";
        const patientId = "demo-patient-id";
        const storeId = "demo-store-id";
        const appointmentId = "demo-appointment-id";

        // 1. Hospital
        await setDoc(doc(db, "hospitals", hospitalId), {
            id: hospitalId,
            name: "City General Hospital",
            address: "123 Health Ave, Medical District",
            adminName: "Hospital Admin",
            phone: "9876543210",
            email: "hospital@demo.com",
            licenseNo: "LIC-12345",
            role: 'hospital',
            isVerified: true,
            rating: 4.8,
            doctors: [doctorId],
            facilities: ["Emergency", "ICU", "Pharmacy", "Laboratory"],
            isOpen: true,
            hasEmergency: true,
            createdAt: serverTimestamp()
        });

        // 2. Doctor
        await setDoc(doc(db, "doctors", doctorId), {
            id: doctorId,
            name: "Dr. Sarah Smith",
            email: "sarah.smith@demo.com",
            specialty: "Cardiology",
            doctorType: 'specialist',
            hospitalName: "City General Hospital",
            hospitalId: hospitalId,
            phone: "8888888888",
            birthDate: "1985-05-15",
            age: "40",
            status: 'approved',
            createdAt: serverTimestamp()
        });

        // 3. Admin-Approved User Profiles (Linked to bypass credentials)
        await setDoc(doc(db, "users", doctorId), {
            uid: doctorId,
            name: "Dr. Sarah Smith",
            email: "sarah.smith@demo.com",
            role: 'doctor',
            hospitalId: hospitalId,
            status: 'approved',
            createdAt: serverTimestamp()
        });

        await setDoc(doc(db, "users", patientId), {
            uid: patientId,
            name: "Alice Cooper",
            email: "alice@demo.com",
            role: 'patient',
            address: "456 Oak Street, City View",
            age: "28",
            birthDate: "1997-08-20",
            gender: "Female",
            createdAt: serverTimestamp()
        });

        await setDoc(doc(db, "medical_stores", storeId), {
            id: storeId,
            name: "Main Street Pharmacy",
            email: "pharmacy@demo.com",
            phone: "7777777777",
            address: "789 Main St, Downtown",
            code: "MSTR-1234",
            isOpen: true,
            role: 'medical_store',
            createdAt: serverTimestamp()
        });

        await setDoc(doc(db, "users", storeId), {
            uid: storeId,
            name: "Main Street Pharmacy",
            email: "pharmacy@demo.com",
            role: 'medical_store',
            createdAt: serverTimestamp()
        });

        // 4. Linked Activity
        await setDoc(doc(db, "appointments", appointmentId), {
            id: appointmentId,
            hospitalId: hospitalId,
            doctorId: doctorId,
            patientId: patientId,
            patientName: "Alice Cooper",
            doctorName: "Dr. Sarah Smith",
            hospitalName: "City General Hospital",
            date: "2026-03-01",
            time: "10:30 AM",
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        await setDoc(doc(db, "prescriptions", "demo-prescription-id"), {
            id: "demo-prescription-id",
            patientId: patientId,
            doctorId: doctorId,
            doctorName: "Dr. Sarah Smith",
            hospitalName: "City General Hospital",
            appointmentId: appointmentId,
            diagnosis: "Regular Checkup",
            medications: [
                { name: "Vitamine C", dosage: "1 tab daily", duration: "30 days" },
                { name: "Paracetamol", dosage: "If fever", duration: "5 days" }
            ],
            createdAt: serverTimestamp()
        });

        console.log("Master Migration complete!");
        return true;
    } catch (error) {
        console.error("Migration failed:", error);
        return false;
    }
};

