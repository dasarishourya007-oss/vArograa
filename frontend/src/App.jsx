import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { AuthProvider } from './context/AuthContext';
import LoginSelection from './pages/auth/LoginSelection';
import PatientLogin from './pages/auth/PatientLogin';
import DoctorLogin from './pages/auth/DoctorLogin';
import DoctorRegister from './pages/auth/DoctorRegister';
import DoctorStatus from './pages/auth/DoctorStatus';
import DoctorRecovery from './pages/auth/DoctorRecovery';
import HospitalDetail from './pages/HospitalDetail';
import HospitalHome from './pages/HospitalHome';
import BookAppointment from './pages/BookAppointment';
import AppointmentSuccess from './pages/AppointmentSuccess';
import PrescriptionForm from './pages/PrescriptionForm';
import VideoCall from './pages/VideoCall';
import MedicalStoreDashboard from './pages/MedicalStoreDashboard';
import MedicalStoreLogin from './pages/auth/MedicalStoreLogin';
import MedicalStoreRegister from './pages/auth/MedicalStoreRegister';
import PatientDashboard from './pages/PatientDashboard';
import DoctorProfile from './pages/DoctorProfile';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminUserTracking from './pages/AdminUserTracking';
import { DashboardGate, RoleGuard, RoleRedirect } from './components/RoleRouter';

function App() {
  console.log("App: Component rendering starting...");
  return (
    <AuthProvider>
      <div style={{ padding: '20px', background: '#f0f0f0', border: '2px solid blue' }}>
        App Component Loaded (with AuthProvider)
      </div>
    </AuthProvider>
  );
}

export default App;
