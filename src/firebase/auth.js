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
    browserLocalPersistence,
    deleteUser
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
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
            ...extraData
        };
    }

    // 1. Doctor Validation: Check Hospital Code
    if (role === 'doctor') {
        const hCode = extraData.hospitalCode;
        if (!hCode) throw new Error("Hospital Code is required for doctor registration.");

        const hospitalsRef = collection(db, "hospitals");
        const q = query(hospitalsRef, where("hospitalCode", "==", hCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Invalid Hospital Code. Please contact your hospital administrator.");
        }

        // Link to the first matching hospital
        extraData.hospitalId = querySnapshot.docs[0].id;
    }

    let user = null;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;

        // Update display name
        await updateProfile(user, { displayName: name });

        // Initial status based on role
        const status = (role === 'doctor' || role === 'pharmacist') ? 'pending' : 'active';

        // 2. Create entry in 'users' collection (Identity Table)
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name,
            email,
            phone: extraData.phone || '',
            role,
            status,
            createdAt: serverTimestamp()
        });

        // 3. Create role-specific profiles
        if (role === 'patient') {
            await setDoc(doc(db, "patients", user.uid), {
                patientId: user.uid,
                name,
                age: extraData.age || 0,
                gender: extraData.gender || '',
                bloodGroup: extraData.bloodGroup || '',
                phone: extraData.phone || '',
                address: extraData.address || '',
                emergencyContact: extraData.emergencyContact || { name: '', phone: '', relation: '' },
                createdAt: serverTimestamp()
            });
        } else if (role === 'doctor') {
            await setDoc(doc(db, "doctors", user.uid), {
                doctorId: user.uid,
                name,
                specialization: extraData.specialization || extraData.specialty || '',
                hospitalId: extraData.hospitalId,
                licenseNumber: extraData.licenseNumber || '',
                experience: extraData.experience || 0,
                phone: extraData.phone || '',
                email: email,
                availability: extraData.availability || {},
                status: 'pending',
                createdAt: serverTimestamp()
            });
        } else if (role === 'pharmacist' || role === 'medical_store') {
            await setDoc(doc(db, "pharmacies", user.uid), {
                pharmacyId: user.uid,
                name: extraData.pharmacyName || name,
                licenseNumber: extraData.licenseNumber || '',
                location: extraData.location || '',
                phone: extraData.phone || '',
                ownerId: user.uid,
                createdAt: serverTimestamp(),
                status: 'pending'
            });
            // Legacy alias for medical_stores if needed by existing components
            await setDoc(doc(db, "medical_stores", user.uid), {
                id: user.uid,
                name: extraData.pharmacyName || name,
                status: 'pending'
            });
        }

        return user;
    } catch (error) {
        if (user) await deleteUser(user);
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
