import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

// Note: Using the config directly to avoid relative import issues in node
const firebaseConfig = {
    apiKey: "AIzaSyAz...", // I'll search for this in the codebase
    authDomain: "nivaan-2.firebaseapp.com",
    projectId: "nivaan-2",
    storageBucket: "nivaan-2.appspot.com",
    messagingSenderId: "...",
    appId: "..."
};

// ... Wait, I can just grep the config from the project
