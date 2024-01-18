import React from 'react';
import axios from 'axios';
const domain = process.env.NODE_ENV == 'production' ? 'https://lifemanager-c8d019eb99cb.herokuapp.com' : 'http://localhost:8080';

const ButtonComponent = () => {
    const handleClick = () => {
        window.location.href = `${domain}/calendar`;
    };

  return (
    <div>
      <button onClick={handleClick}>Go to Calendar</button>
    </div>
  );
};

export default ButtonComponent;
