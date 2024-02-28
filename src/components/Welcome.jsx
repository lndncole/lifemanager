// src/components/Welcome.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Welcome = () => {
  return (
    <div className="container">
          <h1>Welcome to LifeMNGR</h1>
          <br></br>
          <br></br>
          <h2>Already have an account?</h2>
          <br></br>
          <button><Link to="/sign-in">Sign In</Link></button>
          <br></br>
          <br></br>
          <p>lifeMNGR is your personal assistant for managing life's complexities with ease and a friendly touch.</p>
          <p>With LifeMNGR, you're not just using a tool; you're engaging with a service that understands you. Confirmations before actions, personalized memory handling, and adaptive interactions - all designed to make your life easier and more organized.</p>
          <p>Ready to simplify your life with empathy and efficiency? Dive in and let LifeMNGR be your companion in navigating the daily hustle.</p>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
    </div>
  );
};

export default Welcome;
