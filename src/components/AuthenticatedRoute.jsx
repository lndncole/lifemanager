//src/components/AuthenticatedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const AuthenticatedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    
    useEffect(() => {
        const verifyAuth = async () => {
          try {
            const response = await fetch('/get-auth');
            if (response.ok) {
              setIsAuthenticated(true);
            }
          } catch (error) {
            console.error('Auth verification failed', error);
          }
          setIsChecking(false);
        };
    
        verifyAuth();
    }, []);

    const loader = <div class="full-screen">Loading...</div>;

  return isChecking ? 
    loader : isAuthenticated ? 
        children : <Navigate to="/" replace />;
};

export default AuthenticatedRoute;