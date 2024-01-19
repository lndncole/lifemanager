import React from 'react';

// Access the environment variable and set the domain
const domain = process.env.REACT_APP_API_DOMAIN || 'http://localhost:8080';

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