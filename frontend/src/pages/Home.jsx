import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginSelection from './auth/LoginSelection';
import PatientDashboard from './PatientDashboard';
import MedicalStoreDashboard from './MedicalStoreDashboard';
import DoctorDashboard from './DoctorDashboard';
import HospitalHome from './HospitalHome';

const Home = () => {
    const { user } = useAuth();

    try {
        if (!user) {
            return <LoginSelection />;
        }

        if (user.role === 'hospital') {
            return <HospitalHome />;
        }

        if (user.role === 'doctor') {
            return <DoctorDashboard />;
        }

        if (user.role === 'medical_store') {
            return <MedicalStoreDashboard />;
        }

        return <PatientDashboard />;
    } catch (error) {
        console.error('Home Component Crash:', error);
        return (
            <div style={{ padding: '20px', color: 'red', backgroundColor: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '16px' }}>Dashboard Load Error</h1>
                <p style={{ marginBottom: '24px' }}>{error.message}</p>
                <button
                    onClick={() => { localStorage.clear(); window.location.reload(); }}
                    style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Clear Data & Reset
                </button>
            </div>
        );
    }
};

export default Home;
