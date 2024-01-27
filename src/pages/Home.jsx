//src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import '../styles/home.css';
import { castToError } from 'openai/core';

const Home = () => {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [eventLink, setEventLink] = useState('');
  const [fetchedCalendar, setFetchCalendar] = useState('');
  const [eventsInMonthCount, setEventsInMonthCount] = useState(0);
  const [eventsInNextSevenDays, setEventsInNextSevenDays] = useState(0);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();

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
          console.error('Network response was not ok');
          setFetchCalendar('error');
        } else {
          const data = await response.json();
          setFetchCalendar(data);
        }
    
      } catch (error) {
        console.error('Fetch error:', error);
        setFetchCalendar('Error fetching calendar');

      }

    };

    fetchCalendarData();
  }, []);

  useEffect(() => {
    calculatePercentageOfTimeThatIsScheduled(fetchedCalendar);
  }, [fetchedCalendar]);

  const calculatePercentageOfTimeThatIsScheduled = (calendar) => {
    if (calendar && Array.isArray(calendar)) {
      const count = calendar.filter(event => {
        const startDate = new Date(event.start);
        return startDate.getMonth() === currentMonth;
      }).length;
  
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(currentDate.getDate() + 7);
  
      const eventsInNextSevenDaysFromCalendarCount = calendar.filter(event => {
        const startDate = new Date(event.start);
        return startDate >= currentDate && startDate < sevenDaysFromNow;
      }).length;
  
      setEventsInMonthCount(count);
      setEventsInNextSevenDays(eventsInNextSevenDaysFromCalendarCount);
    }
  };

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
        console.error('Network response was not ok');
      } else {
        const data = await response.json();
        setFetchCalendar(data);
      }
      
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
        dateTime: eventDateTime,
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
    <div class="f-col home-container">
        <div class="f-col">
            {eventsInMonthCount && eventsInMonthCount}
            {eventsInNextSevenDays && eventsInNextSevenDays}
            {/* Take a look at the user's:
            Day (today - of a 16 hour day, how much of it is accounted for on your Google Calendar?),
            Week (Next 7 days - of the 7 days, how many days have something scheduled?),
            Month (Rest of current month - For the rest of the month, what percentage of days have something scheduled?) */}
        </div>
        <div class="home-calendar-content-container">
          <div class="f-col fetched-calendar">
            <h2>Upcoming events:</h2>
            {fetchedCalendar && Array.isArray(fetchedCalendar) && 
              <div class="event-card-container">
                {fetchedCalendar.map((event, i) => (
                  i <= 50 ? (<EventCard key={event.start} event={event} />) : ("")
                ))}
              </div>
            }
            {fetchedCalendar && fetchedCalendar == 'error' &&
              <div class="event-card-container">
                <p>There was an error fetching your calendar.</p>
                <p>Please reauthenticate by signing out and signing back in again.</p>
              </div>
            }
            {!fetchedCalendar && <p>Loading...</p>}
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
                  <>
                    <button onClick={() => window.open(eventLink, "_blank")}>
                        View Event
                    </button>
                    <button onClick={handleFetchCalendar}>Refresh Calendar</button>
                  </>
                )}
            </div>
        }
        </div>
    </div>
  );
};

export default Home;
