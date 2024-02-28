import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SignInButton from '../components/SignInButton';
import { gaEvents } from '../analytics/ga.js';

const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // useEffect(() => {
  //   const checkAuthStatus = async () => {
  //     try {
  //       const response = await fetch('/get-auth', {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       });

  //       if (!response.ok) {
  //         console.warn('Not Authenticated. Please Sign In.');
  //       } else {
  //         const userData = await response.json();
  //         if (userData && userData.email) {
  //           gaEvents.gaOauthLogin();
  //           login(userData.email);
  //           setIsAuthenticated(true);
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Authentication error:', error);
  //     }
  //   };

  //   checkAuthStatus();
  // }, []);  // Empty dependency array to run only on component mount

  // useEffect(() => {
  //   if (isAuthenticated) {
  //     navigate('/home');
  //   }
  // }, [isAuthenticated, navigate]);

  return (
    <div className="f-col full-screen">
      <h1>lifeMNGR</h1>
      <SignInButton />
    </div>
  );
};

export default SignIn;