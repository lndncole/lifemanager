import React, { useEffect } from 'react';
import axios from 'axios';
const domain = process.env.NODE_ENV ? 'https://lifemanager-c8d019eb99cb.herokuapp.com' : 'http://localhost:8080';

const Calendar = () => {
  useEffect(() => {
    const fetchAuthURL = async () => {
      try {
        const response = await axios.get(`${domain}/calendar`);
        console.log(response); // Adjust the URL based on your server configuration
        // window.location.href = response.data.authURL;
      } catch (error) {
        console.error('Error fetching auth URL:', error);
      }
    };

    fetchAuthURL();
  }, []);

  return <div>Loading...</div>;
};

export default Calendar;
