// Note: This script is intended to be run in a Node environment or as a temporary component for verification.
// For this environment, I'll create a comprehensive validation logic that can be pasted into the console or run via a test runner.

import { db } from "../src/firebase/config";
import { collection, addDoc, getDoc, doc, deleteDoc, query, where, getDocs } from "firebase/firestore";

async function runTests() {
    console.log("🚀 Starting vArogra Architecture Validation...");
    const results = [];

    const testCollection = async (name, data) => {
        try {
            console.log(`Testing [${name}]...`);
            const docRef = await addDoc(collection(db, name), { ...data, test: true });
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                console.log(`✅ ${name} CRUD passed.`);
                await deleteDoc(docRef);
                results.push({ name, status: 'pass' });
            } else {
                throw new Error("Doc not found after write");
            }
        } catch (error) {
            console.error(`❌ ${name} failed:`, error.message);
            results.push({ name, status: 'fail', error: error.message });
        }
    };

    // 1. Users
    await testCollection('users', { name: 'Test User', role: 'patient', status: 'active' });

    // 2. Patients
    await testCollection('patients', { name: 'Test Patient', age: 30, phone: '123' });

    // 3. Doctors
    await testCollection('doctors', { name: 'Test Doctor', specialization: 'Heart', hospitalId: 'h1' });

    // 4. Hospitals
    await testCollection('hospitals', { name: 'Test Hospital', hospitalCode: 'TEST1' });

    // 5. Pharmacies
    await testCollection('pharmacies', { name: 'Test Pharmacy', licenseNumber: 'L123' });

    // 6. Appointments
    await testCollection('appointments', { patientId: 'p1', doctorId: 'd1', status: 'pending' });

    // 7. Medical Records
    await testCollection('medical_records', { patientId: 'p1', doctorId: 'd1', diagnosis: 'Healthy' });

    // 8. Vitals
    await testCollection('vitals', { patientId: 'p1', heartRate: 72, recordedAt: new Date() });

    // 9. SOS Requests
    await testCollection('sos_requests', { patientId: 'p1', status: 'pending' });

    // 10. Medicine Orders
    await testCollection('medicine_orders', { patientId: 'p1', pharmacyId: 'ph1', totalPrice: 100 });

    // 11. Chat Sessions
    await testCollection('chat_sessions', { patientId: 'p1', doctorId: 'd1', status: 'active' });

    // 12. AI Triage Logs
    await testCollection('ai_triage_logs', { patientId: 'p1', riskLevel: 'low' });

    // 13. Notifications
    await testCollection('notifications', { userId: 'u1', title: 'Test', read: false });

    console.log("\n📊 TEST SUMMARY:");
    console.table(results);

    const failed = results.filter(r => r.status === 'fail');
    if (failed.length === 0) {
        console.log("🌟 ALL SYSTEMS NOMINAL. vArogra Architecture is validated.");
    } else {
        console.warn(`⚠️ ${failed.length} systems failed validation. Check rules and config.`);
    }
}

// In a real environment, we'd export this or run it via a CLI wrapper.
// export default runTests;
