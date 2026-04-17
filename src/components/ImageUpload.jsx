import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Camera, X, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageUpload = ({ label, image, onImageChange, className, progress, circular, cameraOnly = false }) => {
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState(null);

    // Remove auto-start to avoid permission issues without user interaction
    /*
    React.useEffect(() => {
        if (cameraOnly && !image && !showCamera) {
            startCamera();
        }
    }, [cameraOnly, image, showCamera]);
    */

    const handleFileSelect = (e) => {
        if (cameraOnly) return;
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Limit size for preview
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        // Pass the raw file back for actual upload
        onImageChange(file);
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            setShowCamera(true);
            // Wait for video element to be ready
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            }, 100);
        } catch (err) {
            console.error("Camera Error:", err);
            alert("Unable to access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: "image/jpeg" });
                    processFile(file);
                    stopCamera();
                }
            }, 'image/jpeg', 0.8);
        }
    };

    // Helper to get preview URL since we are passing raw file now
    const [preview, setPreview] = useState(null);
    React.useEffect(() => {
        if (!image) {
            setPreview(null);
            return;
        }
        if (typeof image === 'string') {
            setPreview(image);
            return;
        }
        const objectUrl = URL.createObjectURL(image);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [image]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        if (cameraOnly) return;
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    };

    const clearImage = (e) => {
        e.stopPropagation();
        onImageChange(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Cleanup camera on unmount
    React.useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    return (
        <div className={`w-full ${className}`}>
            {label && <label className="text-sm font-bold text-slate-500 ml-1 mb-2 block">{label}</label>}

            {showCamera ? (
                <div className={`relative w-full h-[300px] bg-black ${circular ? 'rounded-full aspect-square' : 'rounded-[32px]'} overflow-hidden flex items-center justify-center`}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-8">
                        <button
                            type="button"
                            onClick={stopCamera}
                            className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <button
                            type="button"
                            onClick={capturePhoto}
                            className="p-1 rounded-full border-4 border-white transition-transform active:scale-90"
                        >
                            <div className="w-16 h-16 bg-white rounded-full" />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                    />

                    <div
                        onClick={cameraOnly && !preview ? startCamera : undefined}
                        className={`
                            relative w-full ${circular ? 'aspect-square rounded-full' : 'min-h-[220px] rounded-[32px]'} border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center p-6
                            ${isDragging ? 'border-p-500 bg-p-50/50' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'}
                            ${cameraOnly && !preview ? 'cursor-pointer' : ''}
                        `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <AnimatePresence mode="wait">
                            {preview ? (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute inset-0 w-full h-full"
                                >
                                    <img
                                        src={preview}
                                        alt="Profile preview"
                                        className="w-full h-full object-cover"
                                    />

                                    {progress > 0 && progress < 100 && (
                                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-white">
                                            <div className="w-full max-w-[200px] bg-white/20 h-2 rounded-full overflow-hidden mb-3">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                                />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{Math.round(progress)}% Uploading</span>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        {!cameraOnly && (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="bg-white/90 p-4 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all text-slate-800 flex flex-col items-center gap-1"
                                            >
                                                <UploadCloud size={20} />
                                                <span className="text-[10px] font-bold">Gallery</span>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="bg-white/90 p-4 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all text-slate-800 flex flex-col items-center gap-1"
                                        >
                                            <Camera size={20} />
                                            <span className="text-[10px] font-bold">Camera</span>
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 active:scale-90 transition-transform z-10"
                                    >
                                        <X size={18} />
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="selection"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-col items-center gap-6 w-full"
                                >
                                    <div className="flex gap-4 w-full px-4 justify-center">
                                        {!cameraOnly && (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-1 max-w-[160px] aspect-square rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:shadow-md hover:border-p-200 transition-all group active:scale-95"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center flex text-slate-400 group-hover:bg-p-50 group-hover:text-p-600 transition-colors">
                                                    <UploadCloud size={24} />
                                                </div>
                                                <span className="text-sm font-bold text-main">File Manager</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className={`${cameraOnly ? 'w-40 h-40' : 'flex-1 max-w-[160px] aspect-square'} rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:shadow-md hover:border-p-200 transition-all group active:scale-95`}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center flex text-slate-400 group-hover:bg-p-50 group-hover:text-p-600 transition-colors">
                                                <Camera size={24} />
                                            </div>
                                            <span className="text-sm font-bold text-main">Camera</span>
                                        </button>
                                    </div>

                                    {!cameraOnly && (
                                        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest text-center">
                                            or drag image here
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}
        </div>
    );
};

export default ImageUpload;
