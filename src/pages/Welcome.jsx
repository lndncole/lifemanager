import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
// import SignInButton from '../components/SignInButton.js';
import { gaEvents } from '../analytics/ga.js';

const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
          const userData = await response.json();
          if (userData && userData.email) {
            gaEvents.gaOauthLogin();
            login(userData.email);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
      }
    };

    checkAuthStatus();
  }, []);  // Empty dependency array to run only on component mount

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="f-col">
      <div class="chat-spacer"></div>
      <div className="title">lifeMNGR</div>
      <div className="container">
        <h1>Welcome to LifeMNGR</h1>
        <br></br>
        <br></br>
        <button><Link to="/sign-in">Sign Up</Link></button>
        <br></br>
        <br></br>
        <p>Built on OpenAI's Assistants API, lifeMNGR is your personal assistant for managing life's complexities with ease and a friendly touch.</p>
        <p>With LifeMNGR, you're not just using a tool; you're engaging with a service that understands you. Confirmations before actions, personalized memory handling, and adaptive interactions - all designed to make your life easier and more organized.</p>
        <p>Here are just a few things lifeMNGR can do:</p>
        <ul>
          <li>Add multiple events to your Google Calendar all within one conversational exchange.</li>
          <li>Fetch your Google Calendar for any given range.</li>
          <li>Remember facts and details for later.</li>
          <li>Delete entries from your Google Calendar.</li>
          <li>Perform live Google searches and return the results along with links and other information.</li>
        </ul>
        <p>lifeMNGR comes built in with some predefined, fun and interesting personas that can be toggled and updated on the fly and at anytime.</p>
        <br></br>
        <br></br>
        <br></br>
        <br></br>
      </div>
    </div>
  );
};

export default SignIn;