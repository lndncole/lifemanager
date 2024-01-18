import React from 'react';
import axios from 'axios';

const ButtonComponent = () => {
    const handleClick = async () => {
        try {
          // Make an Axios call to your backend when the button is clicked
          const response = await axios.get(`${domain}/calendar`);
          console.log(response.data); // Log the data received from the backend
          // You can handle the data here as needed
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
