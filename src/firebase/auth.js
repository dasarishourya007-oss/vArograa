import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    OAuthProvider,
    FacebookAuthProvider,
    setPersistence,
    browserLocalPersistence
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";
import { logLoginEvent } from "./logging";

// Initialize persistence
if (auth) {
    setPersistence(auth, browserLocalPersistence)
        .catch((error) => {
            console.error("Auth persistence error:", error);
        });
}

// Social Providers
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');
const xProvider = new OAuthProvider('twitter.com');
const facebookProvider = new FacebookAuthProvider();

// Register user and create profile in Firestore
export const registerUser = async (email, password, name, role = 'patient', extraData = {}) => {
    if (!auth) {
        console.warn("Auth not initialized. Simulating registration.");
        return {
            uid: 'demo-uid-' + Date.now(),
            email,
            displayName: name,
            role,
            ...extraData,
            photoURL: null
        };
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update display name
        await updateProfile(user, { displayName: name });

        // Sanitize extraData to remove raw File objects (like images)
        const { image, ...firestoreData } = extraData;

        // Save extra info in Firestore
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name,
            email,
            role,
            ...firestoreData,
            createdAt: new Date().toISOString()
        });

        // If hospital/doctor/store, create entry in specific collection too
        if (role === 'doctor') {
            await setDoc(doc(db, "doctors", user.uid), {
                id: user.uid,
                name,
                email,
                ...firestoreData,
                createdAt: new Date().toISOString()
            });
        } else if (role === 'medical_store') {
            await setDoc(doc(db, "medical_stores", user.uid), {
                id: user.uid,
                name,
                email,
                isOpen: true,
                ...firestoreData,
                createdAt: new Date().toISOString()
            });
        }

        return user;
    } catch (error) {
        throw error;
    }
};

// Specialized registration helpers

export const registerDoctor = (email, password, name, extraData) =>
    registerUser(email, password, name, 'doctor', extraData);

export const registerMedicalStore = (email, password, name, extraData) =>
    registerUser(email, password, name, 'medical_store', extraData);

// Login user
export const loginUser = async (email, password) => {
    if (!auth) {
        console.warn("Auth not initialized. Simulating login.");
        return { uid: 'demo-user-123', email, displayName: 'Demo User', role: 'patient' };
    }
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

// Social Logins - All these resolve IMMEDIATELY after popup succeeds
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        throw error;
    }
};

export const signInWithApple = async () => {
    try {
        const result = await signInWithPopup(auth, appleProvider);
        return result.user;
    } catch (error) {
        throw error;
    }
};

export const signInWithX = async () => {
    try {
        const result = await signInWithPopup(auth, xProvider);
        return result.user;
    } catch (error) {
        throw error;
    }
};

export const signInWithFacebook = async () => {
    try {
        const result = await signInWithPopup(auth, facebookProvider);
        return result.user;
    } catch (error) {
        throw error;
    }
};

// Logout user
export const logoutUser = async () => {
    if (!auth) return;
    try {
        await signOut(auth);
    } catch (error) {
        throw error;
    }
};

// Get user profile from Firestore
export const getUserProfile = async (uid) => {
    if (!db) return null;
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (error) {
        // Handle offline/connectivity errors gracefully
        console.warn("getUserProfile failed (possibly offline):", error.message);
        return null;
    }
};

export const subscribeToAuthChanges = (callback) => {
    if (!auth) {
        callback(null);
        return () => { };
    }
    return onAuthStateChanged(auth, callback);
};

// Update user profile photo
export const updateUserProfilePhoto = async (uid, photoURL) => {
    if (!db) {
        console.warn("Firestore not initialized. Simulating profile update.");
        return true;
    }

    try {
        // Update Firebase Auth display profile
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { photoURL });
        }

        // Update Firestore user document
        const userDocRef = doc(db, "users", uid);
        await setDoc(userDocRef, { photoURL }, { merge: true });

        return true;
    } catch (error) {
        console.error("Error updating profile photo:", error);
        throw error;
    }
};
