import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import PWAInstallBanner from './components/PWAInstallBanner';

import Login from './pages/Login';
import Register from './pages/Register';
import ReportAnimal from './pages/ReportAnimal';
import ReportsList from './pages/ReportsList';
import LiveCommunityFeed from './pages/LiveCommunityFeed';
import AdoptionPage from './pages/AdoptionPage';
import CommunityPage from './pages/CommunityPage';
import OfficerDashboard from './pages/OfficerDashboard';
import VideoVerificationCamera from './pages/VideoVerificationCamera';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import DonationsPage from './pages/DonationsPage';

import { Loader } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, userRole, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If user role is not explicitly authorized for this dashboard, redirect to home
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppContent() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-emerald-950">
      <Navbar />
      <PWAInstallBanner />
      
      <main className="flex-grow pb-12">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ReportAnimal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <ReportsList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/feed" 
            element={
              <ProtectedRoute>
                <LiveCommunityFeed />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/adoption" 
            element={
              <ProtectedRoute>
                <AdoptionPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/community" 
            element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/officer-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['officer', 'ngo_admin', 'super_admin']}>
                <OfficerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/verify-camera" 
            element={
              <ProtectedRoute allowedRoles={['officer', 'ngo_admin', 'super_admin']}>
                <VideoVerificationCamera />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/volunteer-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['volunteer', 'officer', 'ngo_admin', 'super_admin']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute allowedRoles={['ngo_admin', 'super_admin', 'officer']}>
                <AnalyticsDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/donations" 
            element={
              <ProtectedRoute>
                <DonationsPage />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      <footer className="py-6 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500">
        <p>© 2026 RescueNet Platform. Empowering stray animal rescue, welfare & community care.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
