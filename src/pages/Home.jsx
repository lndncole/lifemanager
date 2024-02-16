// src/pages/Home.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/home.css';

const Home = () => {
  const navigate = useNavigate();

  const handleCalendarClick = () => {
    navigate('/calendar');const moment = require('moment');
  }

  return (
    <>
      <div className='home'>
        <button onClick={handleCalendarClick}>
          Calendar
        </button>
      </div>
    </>
  );
};

export default Home;
