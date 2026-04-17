import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import VArograOnboarding from './components/vArograOnboarding';
import { Droplets } from 'lucide-react';
import Layout from './components/Layout';
import SkeletonDashboard from './components/patient/SkeletonDashboard';

import { AuthProvider } from './context/AuthContext';
import LoginSelection from './pages/auth/LoginSelection';
import DoctorLogin from './pages/auth/DoctorLogin';
import DoctorRegister from './pages/auth/DoctorRegister';
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
import AccessMonitor from './pages/AdminUserTracking';
import UnifiedAuth from './pages/auth/UnifiedAuth';
import HospitalLogin from './pages/auth/HospitalLogin';
import MedicineSearch from './pages/MedicineSearch';
import MedicalRecords from './pages/MedicalRecords';
import SafeErrorBoundary from './components/SafeErrorBoundary';
import { AuthProvider as HospitalAuthProvider } from './pages/hospital/context/AuthContext';
import { AppointmentProvider as HospitalAppointmentProvider } from './pages/hospital/context/AppointmentContext';
import { useAuth } from './context/AuthContext';

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
const HospitalMedicalStores = lazy(() => import('./pages/hospital/pages/MedicalStoreManagement'));

// Doctor Dashboard Imports (Lazy)
const DoctorPortalLayout = lazy(() => import('./pages/doctor/components/Layout'));
const DoctorNewDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const DoctorSchedule = lazy(() => import('./pages/doctor/MySchedule'));
const DoctorLive = lazy(() => import('./pages/doctor/LiveConsultation'));
const DoctorHistory = lazy(() => import('./pages/doctor/PatientHistory'));
const DoctorPrescriptions = lazy(() => import('./pages/doctor/PrescriptionManager'));
const DoctorSmartScript = lazy(() => import('./pages/doctor/SmartScript'));
const DoctorSmartPrescription = lazy(() => import('./pages/doctor/SmartPrescriptionSystem'));
const DoctorNotifications = lazy(() => import('./pages/doctor/Notifications'));
const DoctorProfileDashboard = lazy(() => import('./pages/doctor/DoctorProfileDashboard'));

const normalizeRole = (roleValue = '') => {
  const role = String(roleValue || '').toLowerCase();
  if (role === 'admin' || role === 'hospital_admin') return 'hospital';
  if (role === 'medicalstore') return 'medical_store';
  return role;
};

const getPrimaryRole = (user) => {
  const directRole = normalizeRole(user?.role);
  if (directRole) return directRole;
  const roleFromArray = Array.isArray(user?.roles) ? normalizeRole(user.roles[0]) : '';
  return roleFromArray || '';
};

const getRoleHomePath = (role) => {
  if (role === 'hospital') return '/hospital';
  if (role === 'doctor') return '/dashboard/doctor';
  if (role === 'medical_store') return '/dashboard/pharmacy';
  if (role === 'patient') return '/dashboard/patient';
  return '/login'; // Prevent infinite loop by returning to login if role is unknown
};

const LoadingScreen = ({ message = 'Verifying Session' }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{message}</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles = [], requireApproval = false }) => {
  const { user, loading, profileLoaded } = useAuth();

  // Wait for both Auth initialization and Firestore profile sync
  if (loading || (user && !profileLoaded)) return <LoadingScreen message="Establishing Secure Session..." />;

  if (!user) return <Navigate to="/login" replace />;

  const role = getPrimaryRole(user);
  
  // If the user's role is not yet determined but they ARE authenticated, 
  // show the premium Skeleton Dashboard instead of redirecting or showing a blank screen.
  if (!role && allowedRoles.length > 0) {
    return <SkeletonDashboard />;
  }

  const hasAccess = allowedRoles.length === 0 || allowedRoles.map(normalizeRole).includes(role);

  if (!hasAccess) {
    return <Navigate to={getRoleHomePath(role)} replace />;
  }

  if (requireApproval && user.doctorStatus !== 'APPROVED') {
    if (allowedRoles.includes('doctor')) return children;
    // Stay sticky to the doctor dashboard even if unapproved
    return <Navigate to="/dashboard/doctor" replace state={{ from: 'doctor-dashboard-locked' }} />;
  }

  return children;
};

const AuthRoute = ({ children }) => {
  const { user, loading, profileLoaded } = useAuth();
  const { pathname } = useLocation();

  if (loading || (user && !profileLoaded)) return <LoadingScreen message="Synchronizing Medical Grid..." />;


  if (user) {
    const isGenericLogin = ['/', '/login', '/login/selection', '/login/'].includes(pathname);
    if (isGenericLogin) {
      const role = getPrimaryRole(user);
      if (role) return <Navigate to={getRoleHomePath(role)} replace />;
    }
  }

  return children;
};

const RoleHomeRedirect = () => {
  const { user, loading, profileLoaded } = useAuth();
  const location = useLocation();
  if (loading || (user && !profileLoaded)) return <LoadingScreen message="Re-Authorizing Varogra Session..." />;

  if (!user) return <Navigate to="/login" replace />;
  const role = getPrimaryRole(user);
  
  // Strictly enforce role home
  return <Navigate to={getRoleHomePath(role)} replace />;
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
          <Route path="register/doctor" element={<AuthRoute><DoctorRegister /></AuthRoute>} />
          <Route path="register/medical-store" element={<AuthRoute><MedicalStoreRegister /></AuthRoute>} />

          <Route path="call/:id" element={<VideoCall />} />
          <Route path="hospital/:id" element={<HospitalDetail />} />
          <Route path="doctor/:id" element={<DoctorProfile />} />
          <Route path="book-appointment/:id" element={<BookAppointment />} />
          <Route path="appointment-success" element={<AppointmentSuccess />} />
          <Route path="prescribe/:id" element={<PrescriptionForm />} />

          <Route path="dashboard" element={<RoleHomeRedirect />} />
          <Route path="dashboard/patient" element={<ProtectedRoute allowedRoles={['patient']}><SafeErrorBoundary><PatientDashboard /></SafeErrorBoundary></ProtectedRoute>} />
          <Route path="dashboard/patient/records" element={<ProtectedRoute allowedRoles={['patient']}><SafeErrorBoundary><MedicalRecords /></SafeErrorBoundary></ProtectedRoute>} />
          <Route path="system/monitor" element={<AccessMonitor />} />
          <Route path="medicine-search" element={<MedicineSearch />} />
        </Route>

        <Route
          path="/hospital"
          element={
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
                        color: '#0f172a',
                        fontFamily: 'Outfit, sans-serif'
                      }}>
                        <div style={{ marginBottom: '20px', color: '#3B82F6', animation: 'spin 1s linear infinite' }}>
                          <Droplets size={48} />
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '1px' }}>INITIALIZING COMMAND CENTER</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', textTransform: 'uppercase' }}>Synchronizing Medical Grid...</div>
                      </div>
                    }>
                      <HospitalLayout />
                    </Suspense>
                  </HospitalAppointmentProvider>
                </HospitalAuthProvider>
              </SafeErrorBoundary>
            </ProtectedRoute>
          }
        >
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
          <Route path="pharmacy" element={<HospitalMedicalStores />} />
        </Route>

        <Route
          path="/dashboard/doctor"
          element={
            <ProtectedRoute allowedRoles={['doctor']} requireApproval={true}>
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
          }
        >
          <Route index element={<DoctorNewDashboard />} />
          <Route path="schedule" element={<DoctorSchedule />} />
          <Route path="live" element={<DoctorLive />} />
          <Route path="history" element={<DoctorHistory />} />
          <Route path="smart-prescription" element={<DoctorSmartPrescription />} />
          <Route path="notifications" element={<DoctorNotifications />} />
          <Route path="profile" element={<DoctorProfileDashboard />} />
        </Route>

        <Route path="dashboard/pharmacy" element={<ProtectedRoute allowedRoles={['medical_store']}><MedicalStoreDashboard /></ProtectedRoute>} />
        <Route path="patient" element={<RoleHomeRedirect />} />
        <Route path="doctor" element={<RoleHomeRedirect />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
