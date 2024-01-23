const process = require('process');
const {google} = require('googleapis');

const env = process.env.NODE_ENV == 'production' ? 'production' : 'development';
const CREDENTIALS = env == 'production' ? process.env.GOOGLE_CREDENTIALS_PRODUCTION : process.env.GOOGLE_CREDENTIALS;

function createOAuthClient() {
  //Get the credentials from the environment 
  const credentials = JSON.parse(CREDENTIALS);
  const { client_id, client_secret, redirect_uris } = credentials.web;

  //Instantiate new oAuth client
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  //Return the client
  return oauth2Client;
}

async function addCalendarEvent(auth, req) {
  try {
    const calendar = google.calendar({ version: 'v3', auth: auth });
    const event = {
      summary: req.body.summary,
      start: req.body.start,
      end: req.body.end,
      description: req.body.description,
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response;
  } catch (error) {
    console.error('Error adding and event to the calendar:', error);
    throw error;
  }
}

async function getCalendar(auth) {
  try {
    const calendar = google.calendar({ version: 'v3', auth });

    // Fetch all calendar IDs
    const calendarListRes = await calendar.calendarList.list();
    const calendarIds = calendarListRes.data.items.map(item => item.id);

    // Calculate the time range for the next 30 days
    const timeMin = new Date().toISOString();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);
    
    let allEvents = [];

    // Fetch events from each calendar
    for (const calendarId of calendarIds) {
      const eventsRes = await calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin,
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = eventsRes.data.items;
      if (events && events.length > 0) {
        events.forEach(event => {
          const start = event.start.dateTime || event.start.date;
          console.log(`${start} - ${event.summary}`);
          allEvents.push({ start: start, summary: event.summary });
        });
      }
    }

    return allEvents;
  } catch (error) {
    console.error('Error retrieving calendar events:', error);
    throw error;
  }
}

module.exports = { getCalendar, createOAuthClient, addCalendarEvent };