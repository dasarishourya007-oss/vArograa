import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { hospitals as mockHospitals, medicalStores as mockMedicalStores } from '../utils/mockData';
import { haversineKm, formatDistanceKm, samePlace } from '../utils/geo';
import { subscribeToAuthChanges, subscribeToUserProfile, subscribeToDoctorProfile, subscribeToHospitalProfile, loginUser, registerUser, signInWithGoogle, signInWithApple, signInWithX, signInWithFacebook, handleRedirectResult, buildSocialUser, logoutUser, retryDoctorHospitalLink, updateUserProfile } from '../firebase/auth';


const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const safeJsonParse = (key, fallback) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.error(`Error parsing localStorage key "${key}":`, e);
        return fallback;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Synchronous initial recovery for immediate session persistence
        return safeJsonParse('varogra_user', null);
    });
    const [loading, setLoading] = useState(false);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [userLoc, setUserLoc] = useState(null); // { lat, lng } from geolocation
    const [isLocating, setIsLocating] = useState(false);
    const [locationDenied, setLocationDenied] = useState(false);




    // Dynamic Data States
    const [allHospitals, setAllHospitals] = useState([]);
    const [allDoctors, setAllDoctors] = useState([]);
    const [allMedicalStores, setAllMedicalStores] = useState([]);
    const [nearbyHospitals, setNearbyHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(false);

    const [appointments, setAppointments] = useState(null);
    const [orders, setOrders] = useState([]);
    const [bloodRequests, setBloodRequests] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [medicalCamps, setMedicalCamps] = useState([]);
    const [campRegistrations, setCampRegistrations] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);

    // Doctor Specific
    const [doctorStatus, setDoctorStatus] = useState('Available');
    const [doctorSchedule, setDoctorSchedule] = useState({});
    const [autoApprove, setAutoApprove] = useState(true);
    const [notifications, setNotifications] = useState([]);

    const parseLocationText = (locationText = '') => {
        const parts = String(locationText || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        return {
            district: parts[0] || '',
            state: parts[1] || '',
            country: parts[2] || ''
        };
    };

    const detectLocation = useCallback(() => {
        if (!('geolocation' in navigator)) return;
        
        setIsLocating(true);
        setLocationDenied(false);
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLoc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setUserLoc(newLoc);
                setIsLocating(false);
                console.log("[vArogra] User location detected:", newLoc);
            },
            (error) => {
                setIsLocating(false);
                if (error.code === 1) {
                    setLocationDenied(true);
                    console.warn("[vArogra] Location access denied.");
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []);

    const refreshNearbyHospitals = useCallback(async ({ search = '', profile = null, location = '' } = {}) => {

        const activeProfile = profile || user || {};
        const parsedFromLocation = parseLocationText(location || activeProfile.location || '');
        const district = activeProfile.district || parsedFromLocation.district || '';
        const state = activeProfile.state || parsedFromLocation.state || '';
        const country = activeProfile.country || parsedFromLocation.country || '';

        const normalize = (value) => String(value || '').trim().toLowerCase();
        const targetSearch = normalize(search);
        const targetDistrict = normalize(district);
        const targetState = normalize(state);
        const targetCountry = normalize(country);

        const matchesLocation = (hospital) => {
            const hospitalDistrict = normalize(hospital?.district || hospital?.city || hospital?.town || hospital?.village);
            const hospitalState = normalize(hospital?.state);
            const hospitalCountry = normalize(hospital?.country);
            const hospitalAddress = normalize(hospital?.address || hospital?.location);
            const hospitalName = normalize(hospital?.name || hospital?.hospitalName);
            const isApproved = hospital?.approved !== false;

            if (!isApproved) return false;

            // 1. Check if hospital satisfies location requirements (Strict Filtering)
            let isLocMatch = true;
            if (targetDistrict || targetState || targetCountry) {
                isLocMatch = 
                    (targetDistrict && (hospitalDistrict === targetDistrict || hospitalAddress.includes(targetDistrict))) ||
                    (targetState && (hospitalState === targetState || hospitalAddress.includes(targetState))) ||
                    (targetCountry && (hospitalCountry === targetCountry || hospitalAddress.includes(targetCountry)));
            }
            if (!isLocMatch) return false;

            // 2. Check if hospital satisfies search string (if any)
            if (targetSearch) {
                const searchParts = targetSearch.split(' ');
                return searchParts.every(part => 
                    hospitalName.includes(part) || 
                    hospitalAddress.includes(part) || 
                    hospitalDistrict.includes(part) ||
                    (hospital.specialties || []).some(s => normalize(s).includes(part))
                );
            }

            return true;
        };

        // Priority: 1. Detected Real-time Location, 2. Profile Latitude/Longitude
        const patientLat = userLoc?.lat ?? (typeof activeProfile?.latitude === 'number' ? activeProfile.latitude : Number(activeProfile?.latitude));
        const patientLng = userLoc?.lng ?? (typeof activeProfile?.longitude === 'number' ? activeProfile.longitude : Number(activeProfile?.longitude));
        const patientMandal = activeProfile?.mandal || '';


        try {
            setLoadingHospitals(true);
            const { getDoctors } = await import('../firebase/services');
            const [fetchedHospitals, fetchedDoctors] = await Promise.all([
                (async () => {
                    if (Number.isFinite(patientLat) && Number.isFinite(patientLng)) {
                        const { getHospitalsNear } = await import('../firebase/services');
                        return await getHospitalsNear({
                            latitude: patientLat,
                            longitude: patientLng,
                            radiusKm: 20,
                            limit: 250,
                            state,
                            district,
                            mandal: patientMandal
                        });
                    } else {
                        const { getNearbyHospitalsAndDoctors } = await import('../firebase/services');
                        return await getNearbyHospitalsAndDoctors(
                            { district, state, country },
                            { district, state, country, search }
                        );
                    }
                })(),
                getDoctors()
            ]);

            let hospitals = fetchedHospitals || [];

            // No geo results usually means hospitals are missing latitude/longitude in Firestore.
            // Fallback: search/filter from the general collection
            if (!hospitals || hospitals.length === 0) {
                const { getHospitals } = await import('../firebase/services');
                const all = await getHospitals();
                hospitals = (all || []).filter(matchesLocation);
            }
            
            // Enrich hospitals with doctors
            const doctorsByHospital = (fetchedDoctors || []).reduce((acc, d) => {
                const hId = d.hospitalId || d.hospitalRefId;
                if (hId) {
                    if (!acc[hId]) acc[hId] = [];
                    acc[hId].push(d);
                }
                return acc;
            }, {});

            const getCoords = (h) => {
                if (!h) return null;
                const getVal = (paths) => {
                    for (const p of paths) {
                        const chunks = p.split('.');
                        let val = h;
                        for (const chunk of chunks) { val = val?.[chunk]; }
                        if (typeof val === 'number' && Number.isFinite(val)) return val;
                        if (typeof val === 'string' && val.trim() !== '') {
                            const n = Number(val);
                            if (Number.isFinite(n)) return n;
                        }
                    }
                    return null;
                };

                let lat = getVal(['latitude', 'lat', 'hospital_lat', 'location.latitude', 'location.lat', 'coordinates.lat', 'geo.lat']);
                let lng = getVal(['longitude', 'lng', 'lon', 'hospital_lng', 'location.longitude', 'location.lng', 'coordinates.lng', 'geo.lng']);
                
                // DATA GAP RESOLUTION: Address-based Fallback with Unique Scattering
                if (lat === null || lng === null) {
                    const addr = String(h.address || h.hospitalName || h.name || '').toLowerCase();
                    
                    // Generate a unique jitter based on hospital properties to prevent overlap
                    const str = String(h.id || h.name || h.hospitalName || '');
                    let hash = 0;
                    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
                    const jitterLat = ((hash % 100) - 50) * 0.0006; // ~60m steps
                    const jitterLng = (((hash >> 8) % 100) - 50) * 0.0006;
                    
                    if (addr.includes('kandlakoya')) { lat = 17.5954 + jitterLat; lng = 78.4735 + jitterLng; }
                    else if (addr.includes('medchal')) { lat = 17.6297 + jitterLat; lng = 78.4814 + jitterLng; }
                    else if (addr.includes('kompally')) { lat = 17.5450 + jitterLat; lng = 78.4820 + jitterLng; }
                    else if (addr.includes('hyderabad')) { lat = 17.3850 + jitterLat; lng = 78.4867 + jitterLng; }
                    else if (addr.includes('telangana')) { lat = 17.3850 + jitterLat; lng = 78.4867 + jitterLng; }
                }

                return lat !== null && lng !== null ? { lat, lng } : null;
            };

            const pLat = Number(patientLat);
            const pLng = Number(patientLng);
            const patientCoords = Number.isFinite(pLat) && Number.isFinite(pLng)
                ? { lat: pLat, lng: pLng }
                : null;

            const enriched = (hospitals || []).map((h) => {
                const hospitalCoords = getCoords(h);
                const km = patientCoords && hospitalCoords ? haversineKm(patientCoords, hospitalCoords) : null;
                const distanceText = km != null ? formatDistanceKm(km) : (h?.distance || '');

                return {
                    ...h,
                    latitude: hospitalCoords?.lat,
                    longitude: hospitalCoords?.lng,
                    distanceKm: km,
                    distance: distanceText,
                    cost: Number(h.priceScore || h.cost || 5),
                    doctors: doctorsByHospital[h.id] || []
                };
            });

            const sorted = [...enriched].sort((a, b) => {
                const aMandalScore = samePlace(a?.mandal, patientMandal) ? 0 : samePlace(a?.district, district) ? 1 : 2;
                const bMandalScore = samePlace(b?.mandal, patientMandal) ? 0 : samePlace(b?.district, district) ? 1 : 2;
                if (aMandalScore !== bMandalScore) return aMandalScore - bMandalScore;

                const aKm = typeof a?.distanceKm === 'number' ? a.distanceKm : Number.POSITIVE_INFINITY;
                const bKm = typeof b?.distanceKm === 'number' ? b.distanceKm : Number.POSITIVE_INFINITY;
                if (aKm !== bKm) return aKm - bKm;

                return Number(b.rating || 0) - Number(a.rating || 0);
            });

            setNearbyHospitals(sorted);
            return sorted;
        } catch (err) {
            console.error('[Auth] Failed to fetch location-based hospitals:', err);
            const cachedHospitals = safeJsonParse('varogra_hospitals', []);
            const fallback = (cachedHospitals || []).filter(matchesLocation);
            setNearbyHospitals(fallback);
            return fallback;
        } finally {
            setLoadingHospitals(false);
        }
    }, [user?.latitude, user?.longitude, user?.location, userLoc]);


    // Handle redirect result from social sign-in on app startup
    useEffect(() => {
        handleRedirectResult()
            .then((userData) => {
                if (userData) {
                    const fullUserData = {
                        uid: userData.uid,
                        email: userData.email,
                        displayName: userData.displayName,
                        photoURL: userData.photoURL,
                        role: userData.role || 'patient',
                        isOnline: true
                    };
                    setUser(fullUserData);
                    localStorage.setItem('varogra_user', JSON.stringify(fullUserData));
                    localStorage.setItem('userRole', fullUserData.role);
                }
            })
            .catch((err) => {
                console.error('[Auth] Redirect result error:', err);
            });
    }, []);

    useEffect(() => {
        let isCancelled = false;
        let unsubAppointments = () => { };
        let unsubPrescriptions = () => { };
        let unsubPatientOrders = () => { };
        let unsubHospitals = () => { };
        let unsubNotifications = () => { };

        // Safety timeout: if Firebase auth never fires within 3s, unblock the UI
        const loadingTimeout = setTimeout(() => {
            if (isCancelled) return;
            console.warn("[Auth] Auth initialization timed out. Unblocking UI.");
            setLoading(false);
            setProfileLoaded(true);
        }, 5000);

        const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
            clearTimeout(loadingTimeout);

            if (isCancelled) return;

            unsubAppointments();
            unsubPrescriptions();
            unsubPatientOrders();
            unsubHospitals();
            unsubNotifications();

            if (firebaseUser) {
                // 1. SET BASIC AUTH DATA IMMEDIATELY
                const cachedUser = safeJsonParse('varogra_user', {});
                const storedRole = localStorage.getItem('userRole');
                const activeRole = storedRole || cachedUser.role || 'patient';

                const basicAuthUser = {
                    ...cachedUser,
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName || cachedUser.displayName,
                    photoURL: firebaseUser.photoURL || cachedUser.photoURL,
                    role: activeRole
                };

                setUser(basicAuthUser);
                setLoading(false);

                        // 2. FETCH CLOUD DATA AND SETUP SUBSCRIPTIONS IN PARALLEL
                        const setupData = async () => {
                            try {
                                const services = await import('../firebase/services');
                                const { subscribeToAppointments, subscribeToNotifications } = services;

                                
                                let combinedProfile = { ...basicAuthUser };
                                let userDocReady = false;
                                let domainDocReady = activeRole === 'patient'; // Patients only have one doc

                                 const updateMergedProfile = (newData) => {
                                    if (newData) {
                                        combinedProfile = { 
                                            ...combinedProfile, 
                                            ...newData,
                                            role: newData.role || combinedProfile.role // Ensure role stays consistent
                                        };
                                        setUser(combinedProfile);
                                        localStorage.setItem('varogra_user', JSON.stringify(combinedProfile));
                                    }
                                    
                                    if (userDocReady && domainDocReady) {
                                        setProfileLoaded(true);
                                        if ((combinedProfile.role === 'patient' || combinedProfile.role === 'doctor') && (combinedProfile.latitude || combinedProfile.location)) {
                                            refreshNearbyHospitals({ profile: combinedProfile });
                                        }
                                    }
                                };

                                // Listener 1: Generic User Document
                                const unsubUser = subscribeToUserProfile(firebaseUser.uid, (data) => {
                                    userDocReady = true;
                                    updateMergedProfile(data);
                                });

                                // Listener 2: Domain-Specific Document (Doctor/Hospital)
                                let unsubDomain = () => {};
                                if (activeRole === 'doctor') {
                                    unsubDomain = subscribeToDoctorProfile(firebaseUser.uid, (data) => {
                                        domainDocReady = true;
                                        updateMergedProfile(data);
                                    });
                                } else if (activeRole === 'hospital') {
                                    const hId = basicAuthUser?.hospitalId || localStorage.getItem('varogra_hospital_id');
                                    if (hId) {
                                        unsubDomain = subscribeToHospitalProfile(hId, (data) => {
                                            domainDocReady = true;
                                            updateMergedProfile(data);
                                        });
                                    } else {
                                        domainDocReady = true; // No hospital ID yet
                                    }
                                }

                                const masterUnsubProfile = () => {
                                    unsubUser();
                                    unsubDomain();
                                };

                                unsubHospitals = masterUnsubProfile;

                        const filters = [];
                        if (activeRole === 'patient') {
                            filters.push({ patientId: firebaseUser.uid });
                        } else if (activeRole === 'hospital') {
                            const hId = basicAuthUser?.hospitalId || localStorage.getItem('varogra_hospital_id');
                            if (hId) filters.push({ hospitalId: hId }, { hospitalRefId: hId });
                        } else if (activeRole === 'doctor') {
                            const dId = basicAuthUser?.doctorId || firebaseUser.uid;
                            filters.push({ doctorId: dId }, { doctorRefId: dId });
                        }

                        const sourceRows = new Map();
                        const recomputeAppointments = () => {
                            const merged = Array.from(sourceRows.values()).flat();
                            const seen = new Set();
                            const unique = merged.filter(item => item?.id && !seen.has(item.id) && seen.add(item.id));
                            setAppointments(unique);
                        };

                        const subs = (filters.length > 0 ? filters : [{}]).map((f, i) => 
                            services.subscribeToAppointments(f, (rows) => {
                                sourceRows.set(i, rows || []);
                                recomputeAppointments();
                            })
                        );

                        unsubAppointments = () => subs.forEach(u => u?.());
                        unsubNotifications = services.subscribeToNotifications(firebaseUser.uid, setNotifications);
                        
                        // Role-specific prescriptions and pharmacy orders
                        if (activeRole === 'patient') {
                            unsubPrescriptions = services.subscribeToPrescriptions(firebaseUser.uid, setPrescriptions);
                            if (services.subscribeToPatientOrders) {
                                unsubPatientOrders = services.subscribeToPatientOrders(firebaseUser.uid, setOrders);
                            }
                        }

                        // Consolidated global data listener is handled in a separate useEffect

                    } catch (err) {
                        console.error("[Auth] Setup failed:", err);
                    }
                };

                setupData();
            } else {
                setUser(null);
                setProfileLoaded(true);
                setLoading(false);
            }
        });

        // Load other data from localStorage (Legacy/Mock)
        const initData = () => {
            try {
                // Appointments
                const storedAppts = localStorage.getItem('varogra_appointments');
                if (storedAppts) {
                    setAppointments(JSON.parse(storedAppts));
                } else {
                    setAppointments([]);
                }

                // Orders
                const storedOrders = localStorage.getItem('varogra_orders');
                if (storedOrders) {
                    setOrders(JSON.parse(storedOrders));
                } else {
                    setOrders([]);
                }

                // Blood Requests
                const storedBlood = localStorage.getItem('varogra_blood_requests');
                if (storedBlood) {
                    setBloodRequests(JSON.parse(storedBlood));
                } else {
                    setBloodRequests([]);
                }

                // Others
                setAnnouncements(safeJsonParse('varogra_announcements', []));
                setMedicalCamps(safeJsonParse('varogra_medical_camps', []));
                setCampRegistrations(safeJsonParse('varogra_camp_registrations', []));

                // Dynamic Data
                const storedHospitals = localStorage.getItem('varogra_hospitals');
                if (storedHospitals) {
                    setAllHospitals(JSON.parse(storedHospitals));
                } else {
                    setAllHospitals([]);
                }

                const storedDoctors = localStorage.getItem('varogra_doctors');
                if (storedDoctors) {
                    setAllDoctors(JSON.parse(storedDoctors));
                } else {
                    setAllDoctors([]);
                }

                setAllMedicalStores(safeJsonParse('varogra_medical_stores', mockMedicalStores));

            } catch (error) {
                console.error("Critical AuthContext Init Failure:", error);
            }
        };

        initData();
        return () => {
            isCancelled = true;
            unsubscribe();
            unsubAppointments();
            unsubPrescriptions();
            unsubPatientOrders();
            unsubHospitals();
        };
    }, []);

    const loginPatient = async (email, password) => {
        // --- MASTER BYPASS ---
        if ((email === 'alice@demo.com' || email === 'demo@patient.com') && (password === '1234' || password === '123456')) {
            const demoUser = {
                uid: 'demo-patient-id',
                id: 'demo-patient-id',
                name: 'Alice Cooper',
                email: 'alice@demo.com',
                role: 'patient',
                status: 'active'
            };
            setUser(demoUser);
            localStorage.setItem('varogra_user', JSON.stringify(demoUser));
            localStorage.setItem('userRole', 'patient');
            return { success: true, user: demoUser };
        }

        try {
            // Set intended role before Firebase auth state listener fires
            localStorage.setItem('userRole', 'patient');
            const userData = await loginUser(email, password);
            const profile = await getUserProfile(userData.uid);
            const fullUserData = {
                ...userData,
                ...(profile || {}),
                role: 'patient'
            };
            setUser(fullUserData);
            localStorage.setItem('varogra_user', JSON.stringify(fullUserData));
            localStorage.setItem('userRole', 'patient');
            return { success: true };
        } catch (error) {
            console.error("Patient login error:", error);
            return { success: false, message: describeAuthError(error, "email/password") };
        }
    };

    const registerPatient = async (signupData) => {
        try {
            const { name, email, password, ...extraData } = signupData;
            const userData = await registerUser(email, password, name, 'patient', extraData);
            const userObj = {
                uid: userData.uid,
                email: userData.email || email,
                displayName: userData.displayName || name,
                name: userData.displayName || name,
                role: 'patient',
                ...extraData
            };
            setUser(userObj);
            localStorage.setItem('varogra_user', JSON.stringify(userObj));
            return { success: true };
        } catch (error) {
            console.error("Patient registration error:", error);
            return { success: false, message: describeAuthError(error, "email/password") };
        }
    };


    const describeAuthError = (error, provider) => {
        const code = error?.code || '';
        const message = String(error?.message || 'Authentication failed.');

        if (code === 'auth/unauthorized-domain' || message.includes('auth/unauthorized-domain')) {
            const host = typeof window !== 'undefined' ? window.location.hostname : '';
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const hostHint = host ? ` (${host})` : '';

            return `This domain is not authorized for Firebase ${provider} login${hostHint}. Add it in Firebase Console -> Authentication -> Settings -> Authorized domains. Current origin: ${origin || 'unknown'}. If you're using a LAN IP (like 192.168.x.x), use localhost or a proper domain (Firebase Hosting/custom domain).`;
        }

        if (code === 'auth/popup-blocked') {
            return 'Popup was blocked by the browser. Allow popups for this site and try again.';
        }

        if (code === 'auth/popup-closed-by-user') {
            return 'Popup was closed before completing sign-in. Please try again.';
        }

        return message;
    };
    const loginSocial = async (provider, role = 'patient') => {
        try {
            // Store the intended role
            localStorage.setItem('userRole', role);
            
            let result = null;
            if (provider === 'google') result = await signInWithGoogle();
            else if (provider === 'apple') await signInWithApple();
            else if (provider === 'x') await signInWithX();
            else if (provider === 'facebook') await signInWithFacebook();

            // Handle popup result (if any)
            if (result && result.user) {
                const fullUserData = await buildSocialUser(result.user);
                setUser(fullUserData);
                localStorage.setItem('varogra_user', JSON.stringify(fullUserData));
                localStorage.setItem('userRole', fullUserData.role || role);
                return { success: true };
            }

            // Fallback for redirect flow (though we switched to popup for Google)
            return { success: true };
        } catch (error) {
            console.error(`${provider} login error:`, error);
            return { success: false, message: describeAuthError(error, provider) };
        }
    };


    const registerMedicalStore = async (storeData) => {
        try {
            const code = 'MSTR-' + Math.random().toString(36).substring(2, 6).toUpperCase();
            const email = (storeData.email && storeData.email.includes('@')) 
                ? storeData.email 
                : `${code.toLowerCase()}@varogra.com`;
            const password = storeData.password || storeData.pin || '123456';
            
            console.log("[vArogra] Registering Store:", { email, code, name: storeData.name });

            const user = await import('../firebase/auth').then(m => m.registerMedicalStore(
                email,
                password,
                storeData.name,
                { ...storeData, code }
            ));

            if (!user.uid && !user.id) throw new Error("Registration failed");
            return code;
        } catch (error) {
            console.error("Store registration error:", error);
            return { success: false, message: describeAuthError(error, "medical_store") };
        }
    };

    const registerDoctor = async (docData) => {
        try {
            const email = docData.email || `doc-${Date.now()}@varogra.com`;
            const password = docData.password || '123456';

            const user = await import('../firebase/auth').then(m => m.registerDoctor(
                email,
                password,
                docData.name,
                { ...docData, status: 'pending' }
            ));

            if (!user.uid && !user.id) throw new Error("Registration failed");

            // Construct full user object for immediate state sync with the ENRICHED data from auth service
            const userObj = {
                uid: user.uid,
                email: docData.email,
                name: docData.name,
                displayName: docData.name,
                role: 'doctor',
                roles: ['patient', 'doctor'],
                doctorStatus: 'PENDING_APPROVAL',
                hospitalId: user.hospitalId, // Use the UID found by the backend
                hospitalName: user.hospitalName,
                hospitalEmail: docData.hospitalEmail,
                phone: docData.phone,
                specialization: docData.specialization,
                experience: docData.experience
            };

            setUser(userObj);
            localStorage.setItem('varogra_user', JSON.stringify(userObj));
            localStorage.setItem('userRole', 'doctor');

            return { success: true };
        } catch (error) {
            console.error("Doctor registration error:", error);
            if (error?.code === 'doctor/hospital-link-failed') {
                return {
                    success: false,
                    code: error.code,
                    requiresRetry: true,
                    message: error.message,
                    retryPayload: error.retryPayload
                };
            }
            return { success: false, code: error?.code, message: error.message };
        }
    };

    const retryDoctorLink = async (retryPayload) => {
        try {
            await retryDoctorHospitalLink(retryPayload);
            return { success: true };
        } catch (error) {
            console.error("Retry doctor link error:", error);
            return { success: false, message: describeAuthError(error, "doctor") };
        }
    };


    const loginDoctor = async (email, password) => {
        // --- MASTER BYPASS ---
        if ((email === 'sarah.smith@demo.com' || email === 'doctor@demo.com') && (password === '1234' || password === '123456')) {
            const demoUser = {
                uid: 'demo-doctor-id',
                id: 'demo-doctor-id',
                name: 'Dr. Sarah Smith',
                email: 'sarah.smith@demo.com',
                role: 'doctor',
                status: 'APPROVED',
                doctorStatus: 'APPROVED'
            };
            setUser(demoUser);
            localStorage.setItem('varogra_user', JSON.stringify(demoUser));
            localStorage.setItem('userRole', 'doctor');
            return { success: true, doctor: demoUser, user: demoUser };
        }

        try {
            const { loginUser, getUserProfile, logoutUser } = await import('../firebase/auth');
            const userData = await loginUser(email, password);

            // Check status in Firestore profile
            const profile = await getUserProfile(userData.uid);

            if (profile && profile.status === 'PENDING_APPROVAL') {
                await logoutUser(); // Immediately log them back out
                return { success: false, message: 'Your account is waiting for hospital approval.' };
            }
            if (profile && profile.status === 'REJECTED') {
                await logoutUser();
                return { success: false, message: 'Your request was rejected by the hospital.' };
            }
            if (!profile || profile.status !== 'APPROVED') {
                await logoutUser();
                return { success: false, message: 'Account not yet approved. Please contact your hospital administrator.' };
            }

            const fullUserData = { ...userData, ...profile, role: 'doctor' };
            setUser(fullUserData);
            localStorage.setItem('varogra_user', JSON.stringify(fullUserData));
            return { success: true, doctor: fullUserData, user: fullUserData };

        } catch (error) {
            console.error("Doctor login error:", error);
            return { success: false, message: error.code === 'auth/invalid-credential' ? 'Invalid email or password.' : 'Login failed.' };
        }
    };

    const loginMedicalStore = async (identifier, password) => {
        // --- MASTER BYPASS ---
        if (identifier === 'DEMO-STORE' && (password === '1234' || password === '123456')) {
            const demoUser = {
                uid: 'demo-ms-123',
                id: 'demo-ms-123',
                name: 'vArogra Demo Pharmacy',
                email: 'demo@pharmacy.com',
                role: 'medical_store',
                status: 'active',
                code: 'DEMO-STORE'
            };
            setUser(demoUser);
            localStorage.setItem('varogra_user', JSON.stringify(demoUser));
            localStorage.setItem('userRole', 'medical_store');
            return { success: true, store: demoUser, user: demoUser };
        }

        // Email/password login path
        if (String(identifier || '').includes('@')) {
            try {
                const { loginUser, getUserProfile, logoutUser } = await import('../firebase/auth');
                const userData = await loginUser(identifier, password);
                const profile = await getUserProfile(userData.uid);

                const role = profile?.role;
                if (role !== 'medical_store' && role !== 'pharmacist') {
                    await logoutUser();
                    return { success: false, message: 'This account is not a medical store account.' };
                }

                if (profile?.status === 'PENDING_APPROVAL') {
                    await logoutUser();
                    return { success: false, message: 'Medical store awaiting hospital approval.' };
                }
                if (profile?.status === 'REJECTED') {
                    await logoutUser();
                    return { success: false, message: 'Medical store account has been rejected.' };
                }

                const fullUserData = { ...userData, ...profile, role: 'medical_store' };
                setUser(fullUserData);
                localStorage.setItem('varogra_user', JSON.stringify(fullUserData));
                localStorage.setItem('userRole', 'medical_store');
                return { success: true, store: fullUserData, user: fullUserData };
            } catch (error) {
                console.error("Medical store email login error:", error);
                return { success: false, message: error.code === 'auth/invalid-credential' ? 'Invalid email or password.' : 'Login failed.' };
            }
        }

        // 1. Find the store in the already-listened allMedicalStores
        const storeCode = String(identifier || '').toUpperCase();
        const store = allMedicalStores.find(s => s.code === storeCode);

        if (store) {
            // 2. CHECK APPROVAL STATUS
            if (store.status === 'PENDING_APPROVAL') {
                return { success: false, message: 'Medical store awaiting hospital approval' };
            }
            if (store.status === 'REJECTED') {
                return { success: false, message: 'Medical store account has been rejected.' };
            }

            // 3. For medical stores using code/pin system (if applicable)
            // If they have full firebase auth, we should use that instead, 
            // but following the existing pattern:
            const fullUserData = { ...store, role: 'medical_store' };
            setUser(fullUserData);
            localStorage.setItem('varogra_user', JSON.stringify(fullUserData));
            localStorage.setItem('userRole', 'medical_store');

            return { success: true, store: fullUserData, user: fullUserData };
        }

        return { success: false, message: 'Invalid Store Code' };
    };

    const loginHospital = async (email, password) => {
        // --- MASTER BYPASS ---
        if ((email === 'hospital@demo.com' || email === '123') && (password === '1234' || password === '123456' || password === 'dsa')) {
            const demoUser = {
                uid: 'demo-hospital-id',
                id: 'demo-hospital-id',
                name: 'vArogra Demo Hospital',
                email: 'hospital@demo.com',
                role: 'hospital',
                status: 'active'
            };
            setUser(demoUser);
            localStorage.setItem('varogra_user', JSON.stringify(demoUser));
            localStorage.setItem('userRole', 'hospital');
            return { success: true, user: demoUser };
        }

        try {
            const { loginUser } = await import('../firebase/auth');
            localStorage.setItem('userRole', 'hospital');
            const userProfile = await loginUser(email, password);
            const fullProfile = { ...userProfile, role: 'hospital' };
            setUser(fullProfile);
            return { success: true, user: fullProfile };
        } catch (error) {
            console.error("Hospital login error:", error);
            return { success: false, message: error.code === 'auth/invalid-credential' ? 'Invalid email or password.' : 'Login failed.' };
        }
    };


    // Consolidated Master Data Listeners
    useEffect(() => {
        let isCancelled = false;
        const unsubs = [];

        const initMasterData = async () => {
            try {
                const services = await import('../firebase/services');
                if (isCancelled) return;

                // For patients, we only really need hospitals and doctors initially
                // For others, it depends. Let's make it more selective.
                const role = localStorage.getItem('userRole') || 'patient';

                unsubs.push(services.listenToHospitals((hospitals) => {
                    const realHospitals = hospitals || [];
                    setAllHospitals(realHospitals);
                    localStorage.setItem('varogra_hospitals', JSON.stringify(realHospitals));
                }));

                unsubs.push(services.listenToDoctors((doctors) => {
                    setAllDoctors(doctors || []);
                    localStorage.setItem('varogra_doctors', JSON.stringify(doctors || []));
                }));

                if (role === 'pharmacy' || role === 'medical_store' || role === 'patient') {
                    unsubs.push(services.listenToMedicalStores((stores) => {
                        setAllMedicalStores(stores || []);
                        localStorage.setItem('varogra_medical_stores', JSON.stringify(stores || []));
                    }));
                }
            } catch (error) {
                console.error("[Auth] Master data listener setup failed:", error);
            }
        };

        initMasterData();
        return () => {
            isCancelled = true;
            unsubs.forEach(u => u?.());
        };
    }, []);

    const bookAppointment = async (appointmentData) => {
        try {
            const { createAppointment } = await import('../firebase/services');
            
            const payload = {
                patientId: user?.uid || user?.id,
                patientName: user?.displayName || user?.name || 'Patient',
                hospitalId: appointmentData.hospitalId,
                hospitalName: appointmentData.hospitalName,
                doctorId: appointmentData.doctorId,
                doctorName: appointmentData.doctorName,
                date: appointmentData.date,
                time: appointmentData.time,
                status: 'pending',
                createdAt: new Date() // Will be replaced by serverTimestamp in service
            };

            const apptId = await createAppointment(payload);
            return { success: true, id: apptId };
        } catch (error) {
            console.error("Booking error:", error);
            return { success: false, message: error.message || 'Failed to book appointment' };
        }
    };

    const checkDuplicateAddress = (address, type) => {
        const facilities = type === 'hospital' ? allHospitals : allMedicalStores;
        return facilities.some(f => f.address.toLowerCase().trim() === address.toLowerCase().trim());
    };

    const updateAppointmentStatus = async (apptId, newStatus, extraUpdates = {}) => {
        try {
            const { updateAppointmentStatus: updateStatus } = await import('../firebase/services');
            await updateStatus(apptId, newStatus, extraUpdates);
            return { success: true };
        } catch (error) {
            console.error("Update status error:", error);
            return { success: false, message: error.message || 'Failed to update status' };
        }
    };

    const addPrescription = async (pxData) => {
        try {
            const { createPrescription } = await import('../firebase/services');
            const payload = {
                ...pxData,
                doctorId: user?.uid || user?.id,
                doctorName: user?.displayName || user?.name || 'Doctor',
                createdAt: new Date()
            };
            const rxId = await createPrescription(payload);
            return { success: true, id: rxId };
        } catch (error) {
            console.error("Prescription error:", error);
            return { success: false, message: error.message };
        }
    };

    const placeOrder = async (oData) => {
        try {
            const { createPharmacyOrder } = await import('../firebase/services');
            const patientId = user?.uid || user?.id;
            const payload = {
                patientName: oData.receiverName || user?.name || user?.displayName || 'Patient',
                patientPhone: oData.receiverPhone || user?.phone,
                status: 'Pending',
                ...oData,
                patientId: patientId || oData.patientId,
                timestamp: new Date().toISOString(),
                driver: {
                    name: 'Ram Singh',
                    phone: '+91 98765 43210',
                    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100',
                    location: { lat: 17.4435, lng: 78.3772 }
                }
            };
            const orderId = await createPharmacyOrder(payload);
            const newOrder = { id: orderId, ...payload };
            
            // Local state update for immediate feedback
            const updatedOrders = [newOrder, ...orders];
            setOrders(updatedOrders);
            localStorage.setItem('varogra_orders', JSON.stringify(updatedOrders));

            // Dummy lifecycle transitions
            setTimeout(() => updateOrderStatus(orderId, 'Preparing'), 10000);
            setTimeout(() => updateOrderStatus(orderId, 'Out for Delivery'), 30000);

            return { success: true, id: orderId };
        } catch (error) {
            console.error("Order error:", error);
            return { success: false, id: null, message: error.message };
        }
    };

    const addAnnouncement = async (aData) => {
        try {
            const { createAnnouncement: saveAnn } = await import('../firebase/services');
            const payload = {
                hospitalId: user?.uid || user?.id,
                hospitalName: user?.displayName || user?.name || 'Hospital',
                ...aData
            };
            const annId = await saveAnn(payload);
            return { success: true, id: annId };
        } catch (error) {
            console.error("Announcement error:", error);
            return { success: false, message: error.message };
        }
    };

    const addMedicalCamp = async (cData) => {
        try {
            const { createMedicalCamp: saveCamp } = await import('../firebase/services');
            const payload = {
                hospitalId: user?.uid || user?.id,
                hospitalName: user?.displayName || user?.name || 'Hospital',
                ...cData
            };
            const campId = await saveCamp(payload);
            return { success: true, id: campId };
        } catch (error) {
            console.error("Camp creation error:", error);
            return { success: false, message: error.message };
        }
    };

    const registerForCamp = async (campId) => {
        try {
            const { registerForMedicalCamp: regCamp } = await import('../firebase/services');
            const uid = user?.uid || user?.id;
            if (!uid) throw new Error("Must be logged in to register.");

            await regCamp(campId, uid);
            return { success: true };
        } catch (error) {
            console.error("Camp registration error:", error);
            return { success: false, message: error.message };
        }
    };

    const updateOrderStatus = async (oid, status) => {
        try {
            const { updateOrder: updateOStatus } = await import('../firebase/services');
            await updateOStatus(oid, { status });
            
            // Sync local state
            setOrders(prev => {
                const updated = prev.map(o => o.id === oid ? { ...o, status } : o);
                localStorage.setItem('varogra_orders', JSON.stringify(updated));
                return updated;
            });
            return { success: true };
        } catch (error) {
            console.error("Update order status error:", error);
            return { success: false, message: error.message };
        }
    };


    const updateProfile = async (data) => {
        const uid = user?.uid || user?.id;
        if (!uid) return { success: false, message: "No active user session" };

        try {
            await updateUserProfile(uid, data);
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem('varogra_user', JSON.stringify(updatedUser));
            return { success: true };
        } catch (error) {
            console.error("[AuthContext] Update profile failed:", error);
            return { success: false, message: error.message };
        }
    };

    const updateUserProfilePhoto = useCallback((photoURL) => {
        if (!user) return;
        const updatedUser = { ...user, photoURL };
        setUser(updatedUser);
        localStorage.setItem('varogra_user', JSON.stringify(updatedUser));
        console.log('[AuthContext] User profile photo updated successfully.');
    }, [user]);


    
    const saveDefaultAddress = useCallback(async (address) => {
        const uid = user?.uid || user?.id;
        if (!uid) throw new Error('No active user session');

        const { upsertPatientDefaultAddress } = await import('../firebase/services');
        await upsertPatientDefaultAddress(uid, address);

        const updatedUser = {
            ...user,
            address: address?.fullAddress || address?.address || user?.address || '',
            latitude: address?.latitude ?? user?.latitude,
            longitude: address?.longitude ?? user?.longitude,
            state: address?.state ?? user?.state,
            district: address?.district ?? user?.district,
            mandal: address?.mandal ?? user?.mandal,
            city: address?.city ?? user?.city,
            pincode: address?.pincode ?? user?.pincode,
            defaultAddress: address
        };

        setUser(updatedUser);
        localStorage.setItem('varogra_user', JSON.stringify(updatedUser));
        return updatedUser;
    }, [user]);
const logout = () => {
        // 1. Instantly destroy local session state
        // This instantly triggers React Router to kick the user out to /login
        setUser(null);

        // 2. Clear all persistent UI storage synchronously
        localStorage.removeItem('varogra_user');
        localStorage.removeItem('userRole');

        // 3. Fire-and-forget Firebase signout. 
        // We DO NOT await this, because if Firebase hangs on a flaky mobile network,
        // it would block the UI from navigating away.
        logoutUser().catch((error) => {
            console.error("Firebase logout failed (possibly offline), but local session wiped:", error);
        });
    };
    const completeLogin = (u) => {
        setUser(u);
        localStorage.setItem('varogra_user', JSON.stringify(u));
        if (u.role) localStorage.setItem('userRole', u.role);
        return true;
    };
    const approveDoctor = () => { return { success: true } };
    const checkDoctorStatus = (ph) => { const d = allDoctors.find(doc => doc.phone === ph); return d ? { found: true, status: d.status, code: d.code } : { found: false }; };
    const setupDoctorPassword = (ph, pw) => {
        const updatedDocs = allDoctors.map(d => d.phone === ph ? { ...d, status: 'approved', password: pw } : d);
        setAllDoctors(updatedDocs);
        localStorage.setItem('varogra_doctors', JSON.stringify(updatedDocs));
        return { success: true };
    };
    const resetDoctorPasskey = (id, ph, pw) => setupDoctorPassword(ph, pw);

    // ==========================================
    // INTELLIGENT APPOINTMENT MONITOR (REMAINDERS)
    // ==========================================
    useEffect(() => {
        if (!appointments || appointments.length === 0) return;

        const remindedIds = new Set();
        const interval = setInterval(() => {
            const now = new Date();
            
            appointments.forEach(appt => {
                if (!appt.date || !appt.time) return;
                const status = String(appt.status || '').toLowerCase();
                if (status !== 'confirmed' && status !== 'accepted') return;

                try {
                    // Simple parse: "2024-05-20" + "10:30 AM"
                    const apptTimeStr = `${appt.date} ${appt.time}`;
                    const apptDate = new Date(apptTimeStr);
                    if (isNaN(apptDate.getTime())) return;

                    const diffMs = apptDate - now;
                    const diffMins = Math.floor(diffMs / (1000 * 60));

                    // 1 Hour Reminder
                    if (diffMins > 55 && diffMins <= 60 && !remindedIds.has(`${appt.id}_60`)) {
                        remindedIds.add(`${appt.id}_60`);
                        const msg = `UPCOMING MISSION: ${appt.patientName} at ${appt.time}. Prepare clinical environment.`;
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('vArogra Reminder', { body: msg });
                        } else {
                            console.log(`[REMAINDER] ${msg}`);
                        }
                    }

                    // 10 Minute Reminder
                    if (diffMins > 5 && diffMins <= 10 && !remindedIds.has(`${appt.id}_10`)) {
                        remindedIds.add(`${appt.id}_10`);
                        const msg = `URGENT: ${appt.patientName} mission starts in 10 minutes. Please be ready.`;
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('vArogra Urgent', { body: msg });
                        } else {
                            console.log(`[URGENT] ${msg}`);
                        }
                    }
                } catch (e) {
                    // Ignore parse errors from malformed strings
                }
            });
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [appointments]);

    return (
        <AuthContext.Provider value={{
            user, loading, appointments, orders, bloodRequests,
            announcements, medicalCamps, campRegistrations, prescriptions,
            allHospitals, allDoctors, allMedicalStores,
            nearbyHospitals, loadingHospitals, profileLoaded,
            doctorStatus, doctorSchedule, autoApprove, notifications,

            setUser, completeLogin, setDoctorStatus, setDoctorSchedule, setAutoApprove,
            loginPatient, registerPatient, registerMedicalStore, loginDoctor, loginMedicalStore, loginHospital,
            registerDoctor, retryDoctorLink, approveDoctor, checkDoctorStatus, setupDoctorPassword, resetDoctorPasskey,
            bookAppointment, updateAppointmentStatus, addPrescription, placeOrder, updateOrderStatus,
            addAnnouncement, addMedicalCamp, registerForCamp,
            checkDuplicateAddress, updateProfile, updateUserProfilePhoto, saveDefaultAddress, logout,
            loginSocial, refreshNearbyHospitals, detectLocation,
            userLoc, isLocating, locationDenied

        }}>
            {children}
        </AuthContext.Provider>
    );
};

















