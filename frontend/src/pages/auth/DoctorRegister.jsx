import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Mail,
    Lock,
    Phone,
    Stethoscope,
    Briefcase,
    Building2,
    AlertCircle,
    ArrowLeft,
    CheckCircle2
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const AuthInput = ({ icon, label, ...props }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
            {label}
        </label>

        <div className="group relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all z-10">
                {icon}
            </div>

            <input
                {...props}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-14 pr-5 text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
            />
        </div>
    </div>
);

const mapFirebaseError = (errOrCode, fallback = "Registration failed.") => {
    const code = typeof errOrCode === "string" ? errOrCode : errOrCode?.code;
    if (code === "auth/email-already-in-use") return "This email is already registered.";
    if (code === "auth/invalid-email") return "Please enter a valid email address.";
    if (code === "auth/weak-password") return "Password is too weak. Use at least 6 characters.";
    if (code === "auth/network-request-failed") return "Network error. Check internet and try again.";
    if (code === "permission-denied") return "Permission denied. Firestore rules may not be deployed.";
    return typeof errOrCode === "object" && errOrCode?.message ? errOrCode.message : fallback;
};

const DoctorRegister = () => {
    const navigate = useNavigate();
    const { registerDoctor, retryDoctorLink, allHospitals } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        specialization: "",
        experience: "",
        hospitalCode: ""
    });

    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [retryPayload, setRetryPayload] = useState(null);

    const normalizedCode = formData.hospitalCode?.trim().toUpperCase();

    const matchedHospital = allHospitals?.find(
        (h) => h.hospitalCode?.toUpperCase() === normalizedCode
    );

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRetryLink = async () => {
        if (!retryPayload) return;
        setLoading(true);
        setStatus("Retrying hospital linking...");
        const retryResult = await retryDoctorLink(retryPayload);
        setLoading(false);

        if (retryResult.success) {
            setRetryPayload(null);
            setError("");
            setStatus("Hospital link fixed. You can now login and wait for approval.");
            return;
        }

        setStatus("");
        setError(retryResult.message || "Retry failed. Please contact hospital admin.");
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setRetryPayload(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (!normalizedCode) {
            setError("Hospital invite code is required.");
            return;
        }

        if (!matchedHospital) {
            setError("Invalid Hospital Invite Code.");
            return;
        }

        const hospitalId =
            matchedHospital.id ||
            matchedHospital.uid ||
            matchedHospital.docId ||
            matchedHospital.hospitalId ||
            matchedHospital._id;

        if (!hospitalId) {
            setError("Hospital selection or code is required for doctor registration.");
            return;
        }

        setLoading(true);
        setStatus("Creating doctor account...");

        try {
            const result = await registerDoctor({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                specialization: formData.specialization,
                experience: formData.experience,
                hospitalId,
                hospitalName: matchedHospital.name,
                hospitalCode: matchedHospital.hospitalCode
            });

            if (result.success) {
                alert("Doctor account created successfully. Waiting for hospital approval.");
                navigate("/dashboard/doctor");
                return;
            }

            if (result.requiresRetry && result.retryPayload) {
                setRetryPayload(result.retryPayload);
                setError(result.message || "Doctor created but hospital link failed.");
                setStatus("");
                return;
            }

            setError(mapFirebaseError(result.code, result.message || "Registration failed."));
        } catch (err) {
            console.error("Doctor Registration Error:", err);
            setError(mapFirebaseError(err, "Something went wrong."));
        } finally {
            setLoading(false);
            if (!retryPayload) setStatus("");
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 font-sans"
            style={{
                background:
                    "linear-gradient(160deg, #eff6ff 0%, #f8fafc 40%, #f0fdf4 100%)"
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl z-10 py-8"
            >
                <button
                    onClick={() => navigate("/login")}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl mb-5">
                        <Stethoscope className="text-white w-10 h-10" />
                    </div>

                    <h1 className="text-3xl font-black text-slate-900">
                        Doctor <span className="text-blue-600">Registration</span>
                    </h1>
                </div>

                <div className="bg-white border rounded-3xl p-8 shadow-xl">
                    <AnimatePresence>
                        {error && (
                            <motion.div className="bg-red-50 border border-red-200 text-red-700 text-sm py-3 px-4 rounded-2xl mb-6">
                                <div className="flex gap-3">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                                {retryPayload && (
                                    <button
                                        type="button"
                                        onClick={handleRetryLink}
                                        disabled={loading}
                                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 text-white px-3 py-2 text-xs font-bold"
                                    >
                                        Retry Hospital Link
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form
                        onSubmit={handleRegister}
                        className="grid grid-cols-1 md:grid-cols-2 gap-5"
                    >
                        <AuthInput
                            label="Full Name"
                            icon={<User size={18} />}
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                        <AuthInput
                            label="Email"
                            icon={<Mail size={18} />}
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />

                        <AuthInput
                            label="Password"
                            icon={<Lock size={18} />}
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />

                        <AuthInput
                            label="Confirm Password"
                            icon={<CheckCircle2 size={18} />}
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />

                        <AuthInput
                            label="Phone"
                            icon={<Phone size={18} />}
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />

                        <AuthInput
                            label="Specialization"
                            icon={<Stethoscope size={18} />}
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleChange}
                            required
                        />

                        <AuthInput
                            label="Experience"
                            icon={<Briefcase size={18} />}
                            name="experience"
                            type="number"
                            value={formData.experience}
                            onChange={handleChange}
                            required
                        />

                        <div className="md:col-span-2">
                            <AuthInput
                                label="Hospital Invite Code"
                                icon={<Building2 size={18} />}
                                name="hospitalCode"
                                value={formData.hospitalCode}
                                onChange={handleChange}
                                placeholder="HSP-XXXXXX"
                                required
                            />

                            {matchedHospital && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-2 text-sm">
                                    Hospital Found: <b>{matchedHospital.name}</b>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold"
                            >
                                {loading ? "Processing..." : "Register Account"}
                            </button>

                            {status && (
                                <p className="text-center text-xs text-blue-600 mt-2">
                                    {status}
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default DoctorRegister;
