const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyBB2m8e_mqah6lF8-693f7YuundPxuJIGU",
    authDomain: "vibe-coder-1e4c8.firebaseapp.com",
    projectId: "vibe-coder-1e4c8",
    storageBucket: "vibe-coder-1e4c8.firebasestorage.app",
    messagingSenderId: "124101167420",
    appId: "1:124101167420:web:d120259e05a42370e2f639"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    try {
        const q = query(collection(db, "appointments"), where("status", "!=", "completed"));
        const snap = await getDocs(q);
        if (snap.empty) {
            console.log("No non-completed appointments found.");
            return;
        }
        
        const candidate = snap.docs[0];
        console.log(`Updating appointment ${candidate.id} to completed...`);
        
        await updateDoc(doc(db, "appointments", candidate.id), {
            status: "completed",
            feedbackSubmitted: false,
            updatedAt: serverTimestamp()
        });
        
        console.log("DONE. Appointment is now completed. Feedback modal should trigger in PatientDashboard.");
        process.exit(0);
    } catch (err) {
        console.error("ERROR:", err);
        process.exit(1);
    }
}

run();
