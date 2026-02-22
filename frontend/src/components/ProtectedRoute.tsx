import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { token } = useAuth();

  // If there's no token, redirect the user to the login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If there is a token, render the child routes (e.g., Dashboard, Students)
  return <Outlet />;
};

export default ProtectedRoute;