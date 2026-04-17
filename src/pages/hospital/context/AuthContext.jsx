import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getStoredUser = () => {
    try {
        const raw = localStorage.getItem('varogra_user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => getStoredUser() || { uid: 'demo-user', email: 'partner@varogra.com' });
    const [role, setRole] = useState(() => getStoredUser()?.role || 'Partner');
    const [loading, setLoading] = useState(false); // Start with loading false for instant render

    useEffect(() => {
        console.log('vArogra: Initializing Auth Listener...');
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            try {
                if (authUser) {
                    console.log('vArogra: User detected:', authUser.email);

                    const [userSnap, hospitalSnap] = await Promise.all([
                        getDoc(doc(db, 'users', authUser.uid)),
                        getDoc(doc(db, 'hospitals', authUser.uid))
                    ]);

                    const userData = userSnap.exists() ? userSnap.data() : {};
                    const hospitalData = hospitalSnap.exists() ? hospitalSnap.data() : {};
                    const cached = getStoredUser() || {};
                    const hospitalIdForLogo = authUser.uid || cached?.hospitalId || localStorage.getItem('varogra_hospital_id');
                    const localPersistedPhoto = hospitalIdForLogo ? (localStorage.getItem(`varogra_hospital_logo_${hospitalIdForLogo}`) || '') : '';

                    const mergedUser = {
                        ...cached,
                        ...authUser,
                        ...userData,
                        ...hospitalData,
                        uid: authUser.uid,
                        hospitalId: hospitalData?.id || localStorage.getItem('varogra_hospital_id') || authUser.uid,
                        email: authUser.email || userData?.email || cached?.email || '',
                        photoURL:
                            userData?.photoURL ||
                            hospitalData?.photoURL ||
                            authUser.photoURL ||
                            cached?.photoURL ||
                            localPersistedPhoto ||
                            null
                    };

                    setUser(mergedUser);
                    localStorage.setItem('varogra_user', JSON.stringify(mergedUser));

                    const nextRole = userData?.role || hospitalData?.role || cached?.role || 'Partner';
                    setRole(nextRole);
                    localStorage.setItem('userRole', nextRole);
                } else {
                    const cached = getStoredUser();
                    if (cached) {
                        setUser(cached);
                        } else {
                        console.log('vArogra: No user detected, staying in demo mode.');
                        setUser({ uid: 'demo-user', email: 'partner@varogra.com' });
                        setRole('Partner');
                    }
                }
            } catch (error) {
                console.error('vArogra: Firebase Sync Error:', error);
            }
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        role,
        loading,
        updateUserProfilePhoto: (photoURL) => {
            if (!photoURL) return;
            setUser((prev) => {
                if (!prev) return prev;
                const updated = { ...prev, photoURL };
                localStorage.setItem('varogra_user', JSON.stringify(updated));
                return updated;
            });
        },
        login: () => Promise.resolve(), // Mock for demo
        logout: () => {
            // 1. Instantly trigger soft navigation away from protected routes
            setUser(null);

            // 2. Clear persistent UI state synchronously
            localStorage.removeItem('varogra_user');
            localStorage.removeItem('userRole');

            // 3. Fire-and-forget Firebase signout
            // Do not await, to prevent local network hangs from trapping the user
            signOut(auth).catch(error => {
                console.error('vArogra: Firebase Logout Error (ignored for UI):', error);
            });
            window.location.href = '/login';
        },
        isAdmin: role === 'Partner' || role === 'Admin',
        isDoctor: role === 'Doctor',
        isReceptionist: role === 'Receptionist'
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Always render children to avoid blank screen during dev/config issues */}
            {children}
        </AuthContext.Provider>
    );
};




