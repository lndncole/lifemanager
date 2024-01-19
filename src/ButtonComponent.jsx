import React from 'react';

// Set the domain
const domain = "https://lifemanager-c8d019eb99cb.herokuapp.com";
// const domain = "http://localhost:8080";
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