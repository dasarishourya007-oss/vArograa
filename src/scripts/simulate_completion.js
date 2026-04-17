import { db } from '../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

async function simulateCompletion() {
    try {
        // Find a pending or approved appointment
        const q = query(collection(db, "appointments"), where("status", "in", ["pending", "accepted", "approved", "Confirmed"]));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            console.log("No active appointments found to complete.");
            return;
        }

        const apptDoc = snap.docs[0];
        const apptId = apptDoc.id;
        const data = apptDoc.data();

        console.log(`Simulating completion for appointment ${apptId} (Patient: ${data.patientName}, Doctor: ${data.doctorName})`);

        await updateDoc(doc(db, "appointments", apptId), {
            status: "completed",
            updatedAt: serverTimestamp(),
            feedbackSubmitted: false // Ensure it's not already submitted
        });

        console.log("Appointment marked as completed. Please check the Patient Dashboard.");
    } catch (err) {
        console.error("Error simulating completion:", err);
    }
}

simulateCompletion();
