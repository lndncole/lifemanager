// src/PostAuth.jsx
import React, { useState } from 'react';

const PostAuth = () => {
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventDetails, setEventDetails] = useState('');
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [eventLink, setEventLink] = useState('');

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
    if (result.data.htmlLink) {
        setConfirmationMessage('An event was added to your calendar successfully!');
        setEventLink(result.data.htmlLink);
    } else {
        setConfirmationMessage('Event added, but no link was returned.');
    }
  };

  return (
    
    <div class="container post-auth-container f-col">
        <div class="container post-auth-hero-container f-col">
            <h1>You've been authenticated!</h1>
            <p>What would you like to do next?</p>
        </div>
        <div class="container get-events-container f-col">
            <button onClick={handleFetchCalendar}>Get Calendar</button>
        </div>
        <div class="container add-event-container f-col">
            {!confirmationMessage &&
                <div class="container f-col">
                    <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Event Name"
                    class="form-input"
                    />
                    <span>Date</span>
                    <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    />
                    <span>Time</span>
                    <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    />
                    <textarea
                    value={eventDetails}
                    onChange={(e) => setEventDetails(e.target.value)}
                    placeholder="Event Details"
                    class="form-input"
                    />
                </div>
            }

            {confirmationMessage && <p>{confirmationMessage}</p>}
            {eventLink && (
            <button onClick={() => window.open(eventLink, "_blank")}>
                View Event
            </button>
            )}

            {!confirmationMessage &&
                <button onClick={handleAddEvent}>Add Calendar Event</button>
            }
        </div>
    </div>
  );
};

export default PostAuth;
