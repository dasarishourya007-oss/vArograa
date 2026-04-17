import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from './config';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_DIMENSION = 1024;
const MIN_QUALITY = 0.35;

const throwIfNoStorage = () => {
    if (!storage) throw new Error('Firebase Storage is not initialized.');
};

const readImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const canvasToBlob = (img, quality) => new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ratio = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height, 1));
    canvas.width = Math.max(1, Math.round(img.width * ratio));
    canvas.height = Math.max(1, Math.round(img.height * ratio));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
});

const buildJPEGFile = async (file) => {
    if (!file) throw new Error('No file provided');
    if (!file.type?.startsWith('image/')) {
        throw new Error('Only image files are supported.');
    }

    const img = await readImage(file);
    let quality = 0.9;
    let blob = await canvasToBlob(img, quality);

    while (blob && blob.size > MAX_BYTES && quality > MIN_QUALITY) {
        quality -= 0.15;
        blob = await canvasToBlob(img, quality);
    }

    if (!blob) throw new Error('Unable to process the image.');

    const baseName = (file.name || 'photo').split('.').slice(0, -1).join('.') || 'photo';
    return new File([blob], `${baseName}-${Date.now()}.jpg`, { type: 'image/jpeg' });
};

const safeSetDoc = async (collection, id, data) => {
    if (!db) return;
    try {
        const refDoc = doc(db, collection, id);
        await setDoc(refDoc, data, { merge: true });
    } catch (error) {
        console.error(`Failed to update ${collection}/${id}:`, error);
    }
};

const uploadFile = async (path, file) => {
    throwIfNoStorage();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};

const ensureUsersDoc = async (id, photoURL) => {
    await safeSetDoc('users', id, { photoURL });
};

export const uploadDoctorPhoto = async (doctorId, file) => {
    if (!doctorId) throw new Error('Doctor ID is required to upload photo.');
    const preparedFile = await buildJPEGFile(file);
    const path = `doctors/${doctorId}/profile.jpg`;
    const downloadURL = await uploadFile(path, preparedFile);
    await Promise.all([
        safeSetDoc('doctors', doctorId, { photoURL: downloadURL }),
        ensureUsersDoc(doctorId, downloadURL)
    ]);
    return downloadURL;
};

export const uploadHospitalPhoto = async (hospitalId, file) => {
    if (!hospitalId) throw new Error('Hospital ID is required to upload photo.');
    const preparedFile = await buildJPEGFile(file);
    const path = `hospitals/${hospitalId}/profile.jpg`;
    const downloadURL = await uploadFile(path, preparedFile);
    await Promise.all([
        safeSetDoc('hospitals', hospitalId, { photoURL: downloadURL }),
        ensureUsersDoc(hospitalId, downloadURL)
    ]);
    return downloadURL;
};
