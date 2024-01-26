import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import '../styles/home.css';

const Home = () => {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [eventLink, setEventLink] = useState('');
  const [fetchedCalendar, setFetchCalendar] = useState('');

  const EventCard = ({ event }) => {
    const formattedDate = format(new Date(event.start), 'PPPppp');
    return (
      <div class="event-card">
        <h4>{event.summary}</h4>
        <span>Start: {formattedDate}</span>
      </div>
    );
  };

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        const response = await fetch('/fetch-calendar', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
    
        const data = await response.json();
        setFetchCalendar(data);
      } catch (error) {
        console.error('Fetch error:', error);
        setFetchCalendar('Error fetching calendar');
      }
    };

    fetchCalendarData();
  }, []);

  //Might add this to a button
  const handleFetchCalendar = async () => {
    try {
      const response = await fetch('/fetch-calendar', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      // Check if the response is ok (status in the range 200-299)
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      // Parse the JSON from the response
      const data = await response.json();
  
      // Set the parsed data to state
      setFetchCalendar(data);
    } catch (error) {
      console.error('Fetch error:', error);
      setFetchCalendar('Error fetching calendar');
    }
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
    <div class="f-col">
        <div class="f-col">
            <h1>lifeMNGR</h1>
        </div>
        <div class="home-content-container">
          <div class="f-col fetched-calendar">
            <h2>Upcoming events:</h2>
            {fetchedCalendar && fetchedCalendar.length > 0 ? (
              <>
                <div class="event-card-container">
                  {fetchedCalendar.map((event, i) => (
                    i < 50 ? (<EventCard key={event.start} event={event} />) : ("")
                  ))}
                </div>
              </>
            ) : (
              <p>No events found.</p>
            )}
            {/* <button onClick={handleFetchCalendar}>Get Calendar</button> */}
          </div>
          {!confirmationMessage &&
              <div class="f-col">
                  <h2>Add an event to your calendar.</h2>
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
                      class="form-input"
                  />
                  <span>Time</span>
                  <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      class="form-input"
                  />
                  <textarea
                      value={eventDetails}
                      onChange={(e) => setEventDetails(e.target.value)}
                      placeholder="Event Details"
                      class="form-input"
                  />
                  <button onClick={handleAddEvent}>Add Calendar Event</button>
              </div>
          }
          {confirmationMessage && 
            <div class="f-col">
                <p>{confirmationMessage}</p>
                {eventLink && (
                    <button onClick={() => window.open(eventLink, "_blank")}>
                        View Event
                    </button>
                )}
            </div>
        }
        </div>
    </div>
  );
};

export default Home;
