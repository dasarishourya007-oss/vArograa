import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';
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
import UnifiedLogin from './pages/auth/UnifiedLogin';
import UnifiedAuth from './pages/auth/UnifiedAuth';
import HospitalLogin from './pages/auth/HospitalLogin';
import MedicineSearch from './pages/MedicineSearch';
import SafeErrorBoundary from './components/SafeErrorBoundary';




// Hospital Dashboard Imports (Lazy)
const HospitalLayout = lazy(() => import('./pages/hospital/components/Layout'));
const HospitalDashboard = lazy(() => import('./pages/hospital/pages/Dashboard'));
const HospitalAvailability = lazy(() => import('./pages/hospital/pages/Availability'));
const HospitalAppointments = lazy(() => import('./pages/hospital/pages/Appointments'));
const HospitalLive = lazy(() => import('./pages/hospital/pages/LiveConsultations'));
const HospitalBloodBank = lazy(() => import('./pages/hospital/pages/BloodBank'));
const HospitalAnalytics = lazy(() => import('./pages/hospital/pages/Analytics'));
const HospitalRecords = lazy(() => import('./pages/hospital/pages/PatientRecords'));
const HospitalBeds = lazy(() => import('./pages/hospital/pages/BedManagement'));
const HospitalSettings = lazy(() => import('./pages/hospital/pages/Settings'));
const HospitalDoctors = lazy(() => import('./pages/hospital/pages/DoctorManagement'));


// Doctor Dashboard Imports (Lazy)
const DoctorPortalLayout = lazy(() => import('./pages/doctor/components/Layout'));
const DoctorNewDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const DoctorSchedule = lazy(() => import('./pages/doctor/MySchedule'));
const DoctorLive = lazy(() => import('./pages/doctor/LiveConsultation'));
const DoctorHistory = lazy(() => import('./pages/doctor/PatientHistory'));
const DoctorPrescriptions = lazy(() => import('./pages/doctor/PrescriptionManager'));
const DoctorSmartScript = lazy(() => import('./pages/doctor/SmartScript'));
const DoctorNotifications = lazy(() => import('./pages/doctor/Notifications'));
const DoctorNotepad = lazy(() => import('./pages/doctor/SharedNotepad'));
import { AuthProvider as HospitalAuthProvider } from './pages/hospital/context/AuthContext';
import { AppointmentProvider as HospitalAppointmentProvider } from './pages/hospital/context/AppointmentContext';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Verifying Session</p>
      </div>
    </div>
  );

  if (user) {
    if (user.role === 'patient') return <Navigate to="/dashboard/patient" replace />;
    if (user.role === 'doctor') return <Navigate to="/dashboard/doctor" replace />;
    if (user.role === 'medical_store') return <Navigate to="/dashboard/pharmacy" replace />;
    if (user.role === 'hospital') return <Navigate to="/hospital" replace />;
    // If user exists but no recognized role, don't redirect to root (to avoid infinite loop)
    // Instead render children (LoginSelection) which might allow them to select a role or log out
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AuthRoute><LoginSelection /></AuthRoute>} />
          <Route path="login" element={<AuthRoute><LoginSelection /></AuthRoute>} />
          <Route path="login/selection" element={<AuthRoute><LoginSelection /></AuthRoute>} />
          <Route path="login/patient" element={<AuthRoute><UnifiedAuth /></AuthRoute>} />
          <Route path="login/doctor" element={<AuthRoute><DoctorLogin /></AuthRoute>} />
          <Route path="login/hospital" element={<AuthRoute><HospitalLogin /></AuthRoute>} />
          <Route path="login/medical-store" element={<AuthRoute><MedicalStoreLogin /></AuthRoute>} />
          <Route path="register/medical-store" element={<AuthRoute><MedicalStoreRegister /></AuthRoute>} />

          <Route path="register/doctor" element={<AuthRoute><DoctorRegister /></AuthRoute>} />
          <Route path="status/doctor" element={<DoctorStatus />} />
          <Route path="recovery/doctor" element={<DoctorRecovery />} />
          <Route path="call/:id" element={<VideoCall />} />

          {/* Phase 2 Routes */}
          <Route path="hospital/:id" element={<HospitalDetail />} />
          <Route path="doctor/:id" element={<DoctorProfile />} />

          {/* Phase 3 Routes */}
          <Route path="book-appointment/:id" element={<BookAppointment />} />
          <Route path="appointment-success" element={<AppointmentSuccess />} />

          {/* Phase 5 Routes */}
          <Route path="prescribe/:id" element={<PrescriptionForm />} />

          {/* Phase 10 Routes */}
          <Route path="dashboard/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
          <Route path="admin/tracking" element={<AdminUserTracking />} />
          <Route path="medicine-search" element={<MedicineSearch />} />
        </Route>

        {/* Hospital Dashboard Routes (Scoped) */}
        <Route path="/hospital" element={
          <ProtectedRoute allowedRoles={['hospital']}>
            <SafeErrorBoundary>
              <HospitalAuthProvider>
                <HospitalAppointmentProvider>
                  <Suspense fallback={
                    <div style={{
                      minHeight: '100vh',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 40%, #eff6ff 100%)',
                      color: 'var(--text-primary)',
                      fontFamily: 'Outfit, sans-serif'
                    }}>
                      <div className="animate-pulse" style={{ marginBottom: '20px', color: '#3B82F6' }}>
                        <Droplets size={48} />
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '1px' }}>INITIALIZING COMMAND CENTER</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textTransform: 'uppercase' }}>Synchronizing Medical Grid...</div>
                    </div>
                  }>
                    <HospitalLayout />
                  </Suspense>
                </HospitalAppointmentProvider>
              </HospitalAuthProvider>
            </SafeErrorBoundary>
          </ProtectedRoute>
        }>
          <Route index element={<HospitalDashboard />} />
          <Route path="availability" element={<HospitalAvailability />} />
          <Route path="appointments" element={<HospitalAppointments />} />
          <Route path="live" element={<HospitalLive />} />
          <Route path="blood-bank" element={<HospitalBloodBank />} />
          <Route path="reports" element={<HospitalAnalytics />} />
          <Route path="records" element={<HospitalRecords />} />
          <Route path="beds" element={<HospitalBeds />} />
          <Route path="settings" element={<HospitalSettings />} />
          <Route path="doctors" element={<HospitalDoctors />} />
        </Route>


        {/* New Doctor Dashboard Routes (Scoped) */}
        <Route path="/dashboard/doctor" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <SafeErrorBoundary>
              <Suspense fallback={
                <div style={{
                  minHeight: '100vh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 40%, #eff6ff 100%)',
                  color: 'var(--text-primary)',
                  fontFamily: 'Outfit, sans-serif'
                }}>
                  <div className="animate-pulse" style={{ marginBottom: '20px', color: '#3B82F6' }}>
                    <Droplets size={48} />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '1px' }}>INITIALIZING DOCTOR PORTAL</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textTransform: 'uppercase' }}>Synchronizing Clinical Data...</div>
                </div>
              }>
                <DoctorPortalLayout />
              </Suspense>
            </SafeErrorBoundary>
          </ProtectedRoute>
        }>
          <Route index element={<DoctorNewDashboard />} />
          <Route path="schedule" element={<DoctorSchedule />} />
          <Route path="live" element={<DoctorLive />} />
          <Route path="history" element={<DoctorHistory />} />
          <Route path="prescriptions" element={<DoctorPrescriptions />} />
          <Route path="smart-script" element={<DoctorSmartScript />} />
          <Route path="notifications" element={<DoctorNotifications />} />
          <Route path="notepad" element={<DoctorNotepad />} />
        </Route>

        {/* Full-width Desktop Routes (Bypassing mobile container) */}
        <Route path="dashboard/pharmacy" element={<ProtectedRoute allowedRoles={['medical_store']}><MedicalStoreDashboard /></ProtectedRoute>} />

        {/* Catch-all route to prevent blank screens on invalid URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
