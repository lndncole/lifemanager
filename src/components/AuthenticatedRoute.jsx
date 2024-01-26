import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthenticatedRoute = ({ children }) => {
  const isAuthenticated = true;

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default AuthenticatedRoute;