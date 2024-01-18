import React from 'react';

const ButtonComponent = () => {
  const handleClick = () => {
    window.location.href = '/calendar';
  };

  return (
    <div>
      <button onClick={handleClick}>Go to Calendar</button>
    </div>
  );
};

export default ButtonComponent;
