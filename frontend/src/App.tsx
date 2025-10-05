import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Global Context Providers ---
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';

// --- Global Components ---
import { SettingsModal } from './components/SettingsModal'; 
import Navbar from './components/NavBar';

// --- Page Components ---
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyPage from './pages/VerifyPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TakeAttendancePage from './pages/TakeAttendancePage';
import ProfilePage from './pages/Profilepage'; 
import PreviewPage from './pages/PreviewPage';

const ProtectedLayout = () => (
  <div className="min-h-screen bg-background text-text-primary">
    <Navbar />
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Outlet />
    </main>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-primary text-xl animate-pulse">Loading Application...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/preview" />;
};

// --- 1. A new component to contain all routes ---
// This component is INSIDE AuthProvider, so it can safely use useAuth() and useNavigate()
const AppRoutes = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleNavigateToLogin = () => navigate('/login');
  const handleNavigateToRegister = () => navigate('/register');

  return (
    <Routes>
      <Route 
        path="/preview" 
        element={<PreviewPage onNavigateToLogin={handleNavigateToLogin} onNavigateToRegister={handleNavigateToRegister} />} 
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      
      <Route 
        path="/" 
        element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="take-attendance" element={<TakeAttendancePage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/preview"} />} />
    </Routes>
  );
};

// --- 2. The main App component is now simpler ---
// Its only job is to set up the providers.
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SettingsProvider>
          <AuthProvider>
            <ToastContainer position="top-right" autoClose={4000} theme="light" />
            <SettingsModal />
            <AppRoutes /> {/* Render the routes component */}
          </AuthProvider>
        </SettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;