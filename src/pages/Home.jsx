//src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import '../styles/home.css';

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

  //Setting global event information dates and times
  const currentDate = new Date();
  const todaysDate = currentDate.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysLeftInMonth = lastDayOfMonth.getDate() - currentDate.getDate() + 1;

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
    const calculatePercentageOfTimeThatIsScheduled = (calendar) => {
      if (calendar && Array.isArray(calendar)) {
        const daysOfMonthWithEvents = new Set();
        const hoursWithEventsToday = new Set();
        const eventsToday = [];

        calendar.forEach(event => {
          const startDate = new Date(event.start);
          const eventDay = startDate.getDate();
          const eventMonth = startDate.getMonth();
          const eventYear = startDate.getFullYear();
          const eventHour = startDate.getHours();
          if (eventMonth === currentMonth) {
            daysOfMonthWithEvents.add(startDate.getDate());
          }
          if (eventDay === currentDay && eventMonth === currentMonth && eventYear === currentYear) {
            hoursWithEventsToday.add(eventHour);
            eventsToday.push(event);
          }

          //For debugging in production
          console.log("event day: ", eventDay);
          console.log("current day: ", currentDay);
          console.log("event month: ", eventMonth);
          console.log("current month: ", currentMonth);
          console.log("event year: ", eventYear);
          console.log("current year: ", currentYear);

        });

        setEventsToday(eventsToday);

        const countOfHoursWithEventsToday = hoursWithEventsToday.size;
        setEventHoursFilledToday(countOfHoursWithEventsToday);

        const sevenDaysFromNow = new Date().setDate(currentDate.getDate() + 7);
        const eventsInNextSevenDaysFromCalendarCount = calendar.filter(event => {
          const startDate = new Date(event.start);
          return startDate >= currentDate && startDate < sevenDaysFromNow;
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

  const handleAddAnotherEvent = () => {
    setConfirmationMessage('');
  };
  
  return (
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
            <h2>upcoming events:</h2>
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
                  <span>date</span>
                  <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      class="form-input"
                  />
                  <span>time</span>
                  <input
                      type="time"
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
  );
};

const EventCard = ({ event }) => {
  const formattedDate = format(new Date(event.start), 'PPPppp');
  return (
    <div class="event-card">
      <h4>{event.summary}</h4>
      <span>Start: {formattedDate}</span>
    </div>
  );
};

export default Home;