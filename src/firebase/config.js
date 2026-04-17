import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBB2m8e_mqah6lF8-693f7YuundPxuJIGU",
    authDomain: "vibe-coder-1e4c8.firebaseapp.com",
    projectId: "vibe-coder-1e4c8",
    storageBucket: "vibe-coder-1e4c8.firebasestorage.app",
    messagingSenderId: "124101167420",
    appId: "1:124101167420:web:d120259e05a42370e2f639"
};

// Validate config
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

let app, auth, db, storage;

if (missingKeys.length > 0) {
    console.warn(`Firebase keys missing: ${missingKeys.join(', ')}. Switching to Offline Demo Mode.`);
    // Do NOT alert the user, just log it.
    app = null;
    auth = null;
    db = null;
    storage = null;
} else {
    // Initialize Firebase only if keys exist
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Enable persistent local cache for offline support
    // Force long-polling to fix "Failed to get document because the client is offline" errors
    db = initializeFirestore(app, {
        localCache: persistentLocalCache(),
        experimentalForceLongPolling: true, // Keeping this as per previous fix for "client is offline" errors
    });

    storage = getStorage(app);
}

export { auth, db, storage };
export default app;
