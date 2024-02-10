// src/pages/Home.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatGPT from '../components/ChatGPT';
import '../styles/home.css';

const Home = () => {
  const [isOpen, setIsOpen] = useState(false); // State to manage Chat visibility
  const navigate = useNavigate();

  const handleChatClick = () => {
    setIsOpen(!isOpen); // Toggle chat visibility
  };

  const handleCalendarClick = () => {
    navigate('/calendar');const moment = require('moment');
  }

  return (
    <>
      <div className='home'>
        <ChatGPT isOpen={isOpen} setIsOpen={setIsOpen} />
        <button onClick={handleChatClick}>
          Chat
        </button>
        <button onClick={handleCalendarClick}>
          Calendar
        </button>
      </div>
    </>
  );
};

export default Home;
