import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithRedirect,
    signInWithPopup,
    getRedirectResult,
    OAuthProvider,
    FacebookAuthProvider,
    setPersistence,
    browserLocalPersistence,
    deleteUser
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, onSnapshot } from "firebase/firestore";
import { auth, db } from "./config";
import { logLoginEvent } from "./logging";

if (auth) {
    setPersistence(auth, browserLocalPersistence)
        .catch((error) => {
            console.error("Auth persistence error:", error);
        });
}

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');
const xProvider = new OAuthProvider('twitter.com');
const facebookProvider = new FacebookAuthProvider();

const buildHospitalLinkRetryError = (message, payload) => {
    const error = new Error(message);
    error.code = 'doctor/hospital-link-failed';
    error.retryPayload = payload;
    return error;
};

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

    if (role === 'doctor') {
        const hId = extraData.hospitalId;
        const hCode = extraData.hospitalCode;

        if (hId) {
            const hospitalDoc = await getDoc(doc(db, "hospitals", hId));
            if (!hospitalDoc.exists()) {
                throw new Error("The selected hospital is not registered.");
            }
            extraData.hospitalId = hId;
            extraData.hospitalName = hospitalDoc.data().name || 'Registered Hospital';
        } else if (hCode) {
            const hospitalsRef = collection(db, "hospitals");
            const q = query(hospitalsRef, where("hospitalCode", "==", hCode.trim().toUpperCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("Invalid hospital code");
            }

            const hospitalDoc = querySnapshot.docs[0];
            extraData.hospitalId = hospitalDoc.id;
            extraData.hospitalName = hospitalDoc.data().name || 'Registered Hospital';
        } else {
            throw new Error("Hospital selection or code is required for doctor registration.");
        }
    }

    let user = null;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;

        await updateProfile(user, { displayName: name });

        const status = (role === 'doctor' || role === 'pharmacist') ? 'PENDING_APPROVAL' : 'active';

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name,
            email,
            phone: extraData.phone || '',
            role: role === 'doctor' ? 'doctor' : role,
            roles: role === 'doctor' ? ['patient', 'doctor'] : [role],
            doctorStatus: role === 'doctor' ? 'PENDING_APPROVAL' : null,
            hospitalId: extraData.hospitalId || null,
            status,
            createdAt: serverTimestamp()
        });

        if (extraData.image instanceof File) {
            try {
                const { uploadProfilePhoto } = await import('./services');
                const imageUrl = await uploadProfilePhoto(user.uid, extraData.image);
                if (imageUrl) {
                    extraData.image = imageUrl;
                    // Also update users collection if we want the photoURL there
                    await setDoc(doc(db, "users", user.uid), { photoURL: imageUrl }, { merge: true });
                }
            } catch (uploadError) {
                console.warn("Image upload failed during registration:", uploadError);
                // Continue registration even if upload fails, just without the image
                delete extraData.image;
            }
        }

        if (role === 'doctor') {
            const doctorData = {
                uid: user.uid,
                name,
                email,
                phone: extraData.phone || '',
                specialization: extraData.specialization || extraData.specialty || '',
                experience: extraData.experience || 0,
                hospitalId: extraData.hospitalId,
                hospitalName: extraData.hospitalName,
                hospitalCode: extraData.hospitalCode,
                role: 'doctor',
                status: 'PENDING_APPROVAL',
                createdAt: serverTimestamp(),
                image: extraData.image || null
            };

            await setDoc(doc(db, "doctors", user.uid), doctorData);

            try {
                await setDoc(doc(db, "hospitals", extraData.hospitalId, "doctors", user.uid), doctorData);
            } catch (linkError) {
                throw buildHospitalLinkRetryError(
                    "Doctor account created, but hospital linking failed. Please retry linking.",
                    {
                        doctorId: user.uid,
                        hospitalId: extraData.hospitalId,
                        doctorData
                    }
                );
            }
        } else if (role === 'patient') {
            await setDoc(doc(db, "patients", user.uid), {
                patientId: user.uid,
                name,
                age: extraData.age || 0,
                gender: extraData.gender || '',
                bloodGroup: extraData.bloodGroup || '',
                phone: extraData.phone || '',
                address: extraData.address || '',
                emergencyContact: extraData.emergencyContact || { name: '', phone: '', relation: '' },
                createdAt: serverTimestamp(),
                photoURL: extraData.image || null
            });
        } else if (role === 'pharmacist' || role === 'medical_store') {
            await setDoc(doc(db, "medical_stores", user.uid), {
                storeId: user.uid,
                name: extraData.medicalStoreName || extraData.pharmacyName || name,
                licenseNumber: extraData.licenseNumber || '',
                location: extraData.location || '',
                address: extraData.address || '',
                latitude: extraData.latitude || null,
                longitude: extraData.longitude || null,
                phone: extraData.phone || '',
                ownerId: user.uid,
                createdAt: serverTimestamp(),
                status: 'PENDING_APPROVAL',
                ...extraData
            });
        }

        return { ...user, ...extraData, doctorStatus: role === 'doctor' ? 'PENDING_APPROVAL' : null };
    } catch (error) {
        if (user && error?.code !== 'doctor/hospital-link-failed') await deleteUser(user);
        throw error;
    }
};

export const registerDoctor = (email, password, name, extraData) =>
    registerUser(email, password, name, 'doctor', extraData);

export const retryDoctorHospitalLink = async ({ doctorId, hospitalId, doctorData }) => {
    if (!db) throw new Error("Firestore not initialized.");
    if (!doctorId || !hospitalId) {
        throw new Error("Doctor ID and Hospital ID are required to retry hospital linking.");
    }

    const payload = {
        ...(doctorData || {}),
        uid: doctorId,
        hospitalId
    };

    await setDoc(doc(db, "hospitals", hospitalId, "doctors", doctorId), payload, { merge: true });
    return true;
};

let secondaryApp = null;

export const createDoctorAccount = async (hospitalId, doctorData) => {
    const { name, email, department, phone } = doctorData;
    const tempPassword = `Doctor@${Math.floor(10000 + Math.random() * 90000)}`;

    if (!secondaryApp) {
        const { initializeApp, getApps } = await import('firebase/app');
        const existingApps = getApps().map(a => a.name);
        if (!existingApps.includes('secondary')) {
            const { default: primaryApp } = await import('./config');
            secondaryApp = initializeApp(primaryApp.options, 'secondary');
        } else {
            const { getApp } = await import('firebase/app');
            secondaryApp = getApp('secondary');
        }
    }

    const { getAuth, createUserWithEmailAndPassword: createDoc, signOut: signOutSecondary } = await import('firebase/auth');
    const secondaryAuth = getAuth(secondaryApp);

    const cred = await createDoc(secondaryAuth, email, tempPassword);
    const uid = cred.user.uid;
    await signOutSecondary(secondaryAuth);

    const now = serverTimestamp();
    const doctorRecord = {
        uid,
        name,
        email,
        department: department || '',
        phone: phone || '',
        hospitalId,
        role: 'doctor',
        status: 'ACTIVE',
        createdAt: now,
    };

    await Promise.all([
        setDoc(doc(db, 'doctors', uid), doctorRecord),
        setDoc(doc(db, 'hospitals', hospitalId, 'doctors', uid), {
            uid, name, email, department: department || '', phone: phone || '',
            status: 'ACTIVE', createdAt: now,
        }),
        setDoc(doc(db, 'users', uid), {
            uid, name, email, role: 'doctor', hospitalId, status: 'ACTIVE', createdAt: now,
        }),
    ]);

    return { uid, tempPassword };
};

export const registerMedicalStore = (email, password, name, extraData) =>
    registerUser(email, password, name, 'medical_store', extraData);

export const loginUser = async (email, password) => {
    if (!auth) {
        console.warn("Auth not initialized. Simulating login.");
        return { uid: 'demo-user-123', email, displayName: 'Demo User', role: 'patient' };
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const buildSocialUser = async (user) => {
    let userProfile = null;
    try {
        userProfile = await getUserProfile(user.uid);
    } catch (error) {
        console.warn("Could not fetch social profile:", error.message);
    }

    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'patient',
        ...(userProfile || {})
    };

    logLoginEvent(userData).catch(() => { });
    return userData;
};

export const signInWithGoogle = async () => {
    if (!auth) throw new Error("Firebase Auth not initialized.");
    return await signInWithPopup(auth, googleProvider);
};

export const signInWithApple = async () => {
    await signInWithRedirect(auth, appleProvider);
};

export const signInWithX = async () => {
    await signInWithRedirect(auth, xProvider);
};

export const signInWithFacebook = async () => {
    await signInWithRedirect(auth, facebookProvider);
};

// Call this on app startup to handle the result after redirect
export const handleRedirectResult = async () => {
    try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
            return buildSocialUser(result.user);
        }
        return null;
    } catch (error) {
        console.error("Redirect sign-in error:", error);
        throw error;
    }
};

export const logoutUser = async () => {
    if (!auth) return;
    await signOut(auth);
};

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

export const subscribeToUserProfile = (uid, callback) => {
    if (!db || !uid) return () => {};
    const docRef = doc(db, "users", uid);
    return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
            callback(snap.data());
        } else {
            callback(null);
        }
    }, (error) => {
        console.warn("subscribeToUserProfile failed:", error.message);
    });
};

export const subscribeToDoctorProfile = (uid, callback) => {
    if (!db || !uid) return () => {};
    const docRef = doc(db, "doctors", uid);
    return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
            callback(snap.data());
        } else {
            callback(null);
        }
    }, (error) => {
        console.warn("subscribeToDoctorProfile failed:", error.message);
    });
};

export const subscribeToHospitalProfile = (id, callback) => {
    if (!db || !id) return () => {};
    const docRef = doc(db, "hospitals", id);
    return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
            callback(snap.data());
        } else {
            callback(null);
        }
    }, (error) => {
        console.warn("subscribeToHospitalProfile failed:", error.message);
    });
};


export const updateUserProfilePhoto = async (uid, photoURL) => {
    if (!db) {
        console.warn("Firestore not initialized. Simulating profile update.");
        return true;
    }

    try {
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { photoURL });
        }

        const userDocRef = doc(db, "users", uid);
        await setDoc(userDocRef, { photoURL }, { merge: true });

        return true;
    } catch (error) {
        console.error("Error updating profile photo:", error);
        throw error;
    }
};
export const updateUserProfile = async (uid, data) => {
    if (!db) {
        console.warn("Firestore not initialized. Simulating profile update.");
        return true;
    }

    try {
        if (auth.currentUser && (data.displayName || data.photoURL)) {
            const authUpdates = {};
            if (data.displayName) authUpdates.displayName = data.displayName;
            if (data.photoURL) authUpdates.photoURL = data.photoURL;
            await updateProfile(auth.currentUser, authUpdates);
        }

        const userDocRef = doc(db, "users", uid);
        const userSnap = await getDoc(userDocRef);
        
        const batch = [];
        batch.push(setDoc(userDocRef, { ...data, updatedAt: serverTimestamp() }, { merge: true }));

        if (userSnap.exists()) {
            const role = userSnap.data().role;
            if (role === 'patient') {
                batch.push(setDoc(doc(db, "patients", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true }));
            } else if (role === 'doctor') {
                batch.push(setDoc(doc(db, "doctors", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true }));
            } else if (role === 'hospital') {
                // For hospitals, ensure we update the correct fields (name vs hospitalName)
                const hospitalData = { ...data };
                if (data.displayName && !data.hospitalName) hospitalData.hospitalName = data.displayName;
                if (data.hospitalName && !data.displayName) hospitalData.displayName = data.hospitalName;
                batch.push(setDoc(doc(db, "hospitals", uid), { ...hospitalData, updatedAt: serverTimestamp() }, { merge: true }));
            }
        }

        await Promise.all(batch);
        return true;
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
};
