//src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import '../styles/home.css';

//Components
import ChatGPT from '../components/ChatGPT';

const Home = () => {
  //For adding events
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDetails, setEventDetails] = useState('');

  //Getting response back after adding event
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [eventLink, setEventLink] = useState('');

  //Getting response from fetching calendar
  const [fetchedCalendar, setFetchCalendar] = useState('');

  //Parsing calendar
  const [eventsToday, setEventsToday] = useState();
  const [eventsInMonthCount, setEventsInMonthCount] = useState();
  const [eventsInNextSevenDays, setEventsInNextSevenDays] = useState();
  const [eventHoursFilledToday, setEventHoursFilledToday] = useState();

  const moment = require('moment');
  const momentTz = require('moment-timezone');
  
  // Assuming you want to use a specific time zone, e.g., 'America/Los_Angeles'
  const userTimeZone = 'America/Los_Angeles';
  
  // Getting the current date and time in the user's time zone
  const currentDate = momentTz.tz(userTimeZone);
  
  // Formatting the date for display
  const todaysDate = currentDate.format('dddd, MMMM Do YYYY'); // e.g., "Monday, January 1st 2023"
  
  // Extracting date components
  const currentDay = currentDate.date();
  const currentMonth = currentDate.month(); // Note: Months are 0-indexed (0 = January, 11 = December)
  const currentYear = currentDate.year();
  
  // Calculating the last day of the month
  const lastDayOfMonth = currentDate.clone().endOf('month').date();
  
  // Calculating the days left in the month
  const daysLeftInMonth = lastDayOfMonth - currentDay + 1;

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        const response = await fetch('/api/google/fetch-calendar', {
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
    const calculatePercentageOfTimeThatIsScheduled = (calendar) => {
      if (calendar && Array.isArray(calendar)) {
        const daysOfMonthWithEvents = new Set();
        const hoursWithEventsToday = new Set();
        const eventsToday = [];

        calendar.forEach(event => {
          const startDate = momentTz.tz(event.start, userTimeZone);
          const eventDay = startDate.date();
          const eventMonth = startDate.month();
          const eventYear = startDate.year();
          const eventHour = startDate.hour();
        
          if (eventMonth === currentMonth) {
            daysOfMonthWithEvents.add(eventDay);
          }
        
          if (eventDay === currentDay && eventMonth === currentMonth && eventYear === currentYear) {
            hoursWithEventsToday.add(eventHour);
            eventsToday.push(event);
          }
        });

        setEventsToday(eventsToday);

        const countOfHoursWithEventsToday = hoursWithEventsToday.size;
        setEventHoursFilledToday(countOfHoursWithEventsToday);

        // Calculating seven days from now in the user's time zone
        const sevenDaysFromNow = currentDate.clone().add(7, 'days');

        // Filtering events occurring in the next seven days
        const eventsInNextSevenDaysFromCalendarCount = calendar.filter(event => {
          const startDate = momentTz.tz(event.start, userTimeZone);
          return startDate.isSameOrAfter(currentDate) && startDate.isBefore(sevenDaysFromNow);
        }).length;
        setEventsInNextSevenDays(eventsInNextSevenDaysFromCalendarCount);
    
        const countOfDaysOfMonthWithEvents = daysOfMonthWithEvents.size;
        setEventsInMonthCount(countOfDaysOfMonthWithEvents);
      }
    };

    calculatePercentageOfTimeThatIsScheduled(fetchedCalendar);
  }, [fetchedCalendar]);

  const handleFetchCalendar = async () => {
    try {
      const response = await fetch('/api/google/fetch-calendar', {
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

    const response = await fetch('/api/google/add-calendar-events', {
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

  const handleAddAnotherEvent = () => {
    setConfirmationMessage('');
  };
  
  return (
    <>
    <div class="f-col home-container">
        <div class="home-calendar-content-container">
            <div class="w-100 section">
              <h3>day: </h3>
              <div style={{ textDecoration: 'underline' }}>{todaysDate}</div>
              {eventHoursFilledToday > 0 &&
                <>
                  <div># events today: {(eventsToday.length)}</div>
                  <div>
                    % filled: {((eventHoursFilledToday/24) * 100).toFixed(1)}%
                  </div>
                </>
              }
            </div>
          {eventsInNextSevenDays > 0 && 
            <div class="w-100 section">
              <h3>week: </h3>
              <div># events this week: {(eventsInNextSevenDays)}</div>
              <div>
                % filled: {((eventsInNextSevenDays/7) * 100).toFixed(1)}%
              </div>
            </div>
          }
          {eventsInMonthCount > 0 && 
            <div class="w-100 section">
              <h3>month: </h3>
              <div># of days left in month: {(daysLeftInMonth)}</div>
              <div># of events in month: {(eventsInMonthCount)}</div>
              <div>
                % filled: {((eventsInMonthCount/daysLeftInMonth) * 100).toFixed(1)}%
              </div>
            </div>
          }
        </div>
        <div class="home-calendar-content-container">
          <div class="f-col fetched-calendar section">
            <h2>scheduled events:</h2>
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
              <div class="f-col section">
                  <h2>add an event:</h2>
                  <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="event name"
                      class="form-input"
                  />
                  <input
                      type="date"
                      placeholder='11/03/1986'
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      class="form-input"
                  />
                  <input
                      type="time"
                      placeholder='03:15AM'
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      class="form-input"
                  />
                  <textarea
                      value={eventDetails}
                      onChange={(e) => setEventDetails(e.target.value)}
                      placeholder="event details"
                      class="form-input"
                  />
                  <button onClick={handleAddEvent}>add event</button>
              </div>
          }
          {confirmationMessage && 
            <div class="f-col section">
                <p>{confirmationMessage}</p>
                {eventLink && (
                  <>
                    <button onClick={() => window.open(eventLink, "_blank")}>
                        view event
                    </button>
                    <button onClick={handleFetchCalendar}>refresh calendar</button>
                    <button onClick={handleAddAnotherEvent}>add another event</button>
                  </>
                )}
            </div>
          }
        </div>
    </div>

    <ChatGPT />
    </>
  );
};

const EventCard = ({ event }) => {
  const utcStartDate = new Date(event.start);
  const formattedDate = format(utcStartDate, 'PPPppp', { timeZone: 'UTC' });
  // Convert to local time for display
  const localFormattedDate = new Date(utcStartDate).toLocaleString();
  return (
    <div className="event-card">
      <h4>{event.summary}</h4>
      <span>Start: {localFormattedDate}</span>
    </div>
  );
};

export default Home;