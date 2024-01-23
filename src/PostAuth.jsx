// src/PostAuth.jsx
import React, { useState } from 'react';

const PostAuth = () => {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDetails, setEventDetails] = useState('');

  const handleFetchCalendar = () => {
    window.location.href = '/fetch-calendar';
  };

  const handleAddEvent = async () => {
    const eventDateTime = new Date(eventDate + ' ' + eventTime).toISOString();
    const eventData = {
      summary: eventName,
      start: {
        dateTime: eventDateTime,
      },
      end: {
        dateTime: eventDateTime, // Adjust the end time as needed
      },
      description: eventDetails,
    };

    const response = await fetch('/add-calendar-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    const result = await response.json();
    console.log(result);
  };

  return (
    
    <div class="post-auth-container container">
        <div class="post-auth-hero-container container">
            <h1>You've been authenticated!</h1>
            <p>What would you like to do next?</p>
        </div>
        <div class="get-events-container container">
            <button onClick={handleFetchCalendar}>Get Calendar</button>
        </div>
        <div class="add-event-container container">
            <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Event Name"
            />
            <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            />
            <input
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            />
            <textarea
            value={eventDetails}
            onChange={(e) => setEventDetails(e.target.value)}
            placeholder="Event Details"
            />
            <button onClick={handleAddEvent}>Add Calendar Event</button>
        </div>
    </div>
  );
};

export default PostAuth;
