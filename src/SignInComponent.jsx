import React from 'react';
import SignInButton from './SignInButton';
import './styles/home.css'

const Home = () => {
  return (
    <div class="f-col home">
      <h1>lifeMNGR</h1>
      <p>Sign in with your Google Account.</p>
      <SignInButton />
    </div>
  );
};

export default Home;