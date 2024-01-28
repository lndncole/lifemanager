//api/index.js
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

async function getCalendar(auth, days) {
  try {
    const calendar = google.calendar({ version: 'v3', auth });

    // Calculate the time range for the next 30 days
    // Set timeMin to the start of the current day
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight
    const timeMin = today.toISOString();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + days);
    const userTimeZone = "America/Los_Angeles";
    
    let allEvents = [];

    const eventsRes = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin,
      timeMax: timeMax.toISOString(),
      timeZone: userTimeZone,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = eventsRes.data.items;
    if (events && events.length > 0) {
      events.forEach(event => {
        const start = event.start.dateTime || event.start.date;
        allEvents.push({ start: start, end: event.end?.date || event.end?.dateTime, summary: event.summary, description: event.description });
      });
    }

    return allEvents;
  } catch (error) {
    console.error('Error retrieving calendar events:', error);
    throw error;
  }
}

module.exports = { getCalendar, createOAuthClient, addCalendarEvent };