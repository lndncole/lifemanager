//src/pages/SignIn.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SignInButton from '../components/SignInButton';
import { gaEvents } from '../middleware/ga.js';

const SignIn = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/get-auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
        if (!response.ok) {
          console.warn('Not Authenticated. Please Sign In.');
        } else {
          gaEvents.gaOauthLogin();
          window.location.href = "/home";
        }
    
      } catch (error) {
        console.error('Authentication error:', error);
      }
    };

    checkAuthStatus();
  }, [navigate]);
  
  return (
    <div class="f-col full-screen">
      <h1>lifeMNGR</h1>
      <SignInButton />
    </div>
  );
};

export default SignIn;