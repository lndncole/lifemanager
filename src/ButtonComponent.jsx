import React from 'react';
import axios from 'axios';
const domain = process.env.NODE_ENV == 'production' ? 'https://lifemanager-c8d019eb99cb.herokuapp.com' : 'http://localhost:8080';

const ButtonComponent = () => {
    const handleClick = async () => {
        console.log("domain: ", domain);
        try {
          // Make an Axios call to your backend when the button is clicked
          const response = await axios.get(`${domain}/calendar`);
          window.open(response.data);
        } catch (error) {
          console.error('Error fetching data from the backend:', error);
        }
      };

  return (
    <div>
      <button onClick={handleClick}>Go to Calendar</button>
    </div>
  );
};

export default ButtonComponent;
