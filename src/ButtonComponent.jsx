import React from 'react';

const ButtonComponent = () => {
  const handleClick = () => {
    window.location.href = 'http://localhost:8080/calendar';
  };

  return (
    <div>
      <button onClick={handleClick}>Go to Calendar</button>
    </div>
  );
};

export default ButtonComponent;
