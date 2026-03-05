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
            hospitalId: hospitalId,
            name: "City General Hospital",
            hospitalCode: "CITY123", // Refined schema requirement
            location: "123 Health Ave, Medical District",
            phone: "9876543210",
            email: "hospital@demo.com",
            adminId: "demo-admin-id",
            createdAt: serverTimestamp(),
            status: "active"
        });

        // 2. Doctor (Single Source of Truth)
        const doctorProfile = {
            doctorId: doctorId,
            name: "Dr. Sarah Smith",
            email: "sarah.smith@demo.com",
            specialization: "Cardiology",
            experience: 15,
            hospitalId: hospitalId,
            licenseNumber: "DOC-8899",
            phone: "9123456789",
            status: 'approved',
            availability: {
                available: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'],
                busy: []
            },
            createdAt: new Date().toISOString()
        };

        // Top-level doctors collection ONLY
        await setDoc(doc(db, "doctors", doctorId), doctorProfile);

        // 3. User Identity Profiles
        await setDoc(doc(db, "users", doctorId), {
            uid: doctorId,
            name: "Dr. Sarah Smith",
            email: "sarah.smith@demo.com",
            role: 'doctor',
            status: 'active',
            createdAt: new Date().toISOString()
        });

        await setDoc(doc(db, "users", patientId), {
            uid: patientId,
            name: "Alice Cooper",
            email: "alice@demo.com",
            role: 'patient',
            status: 'active',
            createdAt: new Date().toISOString()
        });

        // 4. Patient Profile
        await setDoc(doc(db, "patients", patientId), {
            patientId: patientId,
            name: "Alice Cooper",
            age: 28,
            gender: "Female",
            bloodGroup: "O+",
            phone: "9876544321",
            address: "456 Patient lane, Riverside",
            emergencyContact: { name: "Bob Cooper", phone: "9999988888", relation: "Brother" },
            createdAt: new Date().toISOString()
        });

        // 5. Pharmacies
        await setDoc(doc(db, "pharmacies", storeId), {
            pharmacyId: storeId,
            name: "Main Street Pharmacy",
            licenseNumber: "RX88220",
            location: "789 Main St, Downtown",
            phone: "7777777777",
            ownerId: "demo-owner-id",
            createdAt: new Date().toISOString(),
            status: 'active'
        });

        await setDoc(doc(db, "users", storeId), {
            uid: storeId,
            name: "Main Street Pharmacy",
            email: "pharmacy@demo.com",
            role: 'pharmacist',
            status: 'active',
            createdAt: serverTimestamp()
        });

        // 6. Appointments
        await setDoc(doc(db, "appointments", appointmentId), {
            appointmentId,
            patientId,
            doctorId,
            hospitalId,
            appointmentTime: serverTimestamp(),
            status: 'confirmed',
            createdAt: serverTimestamp()
        });

        // Vitals
        await setDoc(doc(db, "vitals", "demo-vital-id"), {
            vitalId: "demo-vital-id",
            patientId,
            heartRate: 72,
            bloodPressure: "120/80",
            temperature: 98.6,
            oxygenLevel: 98,
            recordedAt: serverTimestamp()
        });

        // SOS Request
        await setDoc(doc(db, "sos_requests", "demo-sos-id"), {
            requestId: "demo-sos-id",
            patientId,
            location: { lat: 12.9716, lng: 77.5946, address: "MG Road, Bangalore" },
            hospitalId: hospitalId,
            status: "pending",
            createdAt: serverTimestamp()
        });

        // AI Triage Log
        await setDoc(doc(db, "ai_triage_logs", "demo-triage-id"), {
            logId: "demo-triage-id",
            patientId,
            symptoms: ["Chest Pain", "Dizziness"],
            aiResponse: "High risk detected. Recommending immediate consultation with a cardiologist.",
            riskLevel: "high",
            createdAt: serverTimestamp()
        });

        // Medicine Order
        await setDoc(doc(db, "medicine_orders", "demo-order-id"), {
            orderId: "demo-order-id",
            patientId,
            pharmacyId: storeId,
            medicines: [{ name: "Paracetamol", quantity: 2, price: 25 }],
            totalPrice: 50.0,
            status: "pending",
            createdAt: serverTimestamp()
        });

        // 7. Notifications
        await setDoc(doc(db, "notifications", "demo-notif-id"), {
            notificationId: "demo-notif-id",
            userId: doctorId,
            title: "Emergency SOS",
            message: "Urgent SOS request from Alice Cooper",
            type: "sos",
            read: false,
            createdAt: serverTimestamp()
        });

        console.log("Master Migration & Seeding complete!");
        return true;
    } catch (error) {
        console.error("Migration failed:", error);
        return false;
    }
};

