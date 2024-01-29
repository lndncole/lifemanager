//api/index.js
const process = require('process');
const {google} = require('googleapis');
const moment = require('moment-timezone');
const userTimeZone = "America/Los_Angeles";


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

    //log for debugging
    console.log("event added: ", event);

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

async function getUserInfo(auth) {
  try {
    const oauth2 = google.oauth2({ auth: auth, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();
    return userInfo.data; // Make sure to return the data property
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
}

async function getCalendar(auth, days) {
  try {
    const calendar = google.calendar({ version: 'v3', auth });

    // Calculate the time range for the next 30 days
    // Use moment-timezone to handle PST time zone
    const timeMin = moment.tz(userTimeZone).startOf('day').toISOString();
    const timeMax = moment.tz(userTimeZone).add(days, 'days').toISOString();
    
    let allEvents = [];

    const eventsRes = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin,
      timeMax: timeMax,
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

    console.log("calendar: ", allEvents);
    return allEvents;
  } catch (error) {
    console.error('Error retrieving calendar events:', error);
    throw error;
  }
}

module.exports = { getCalendar, getUserInfo, createOAuthClient, addCalendarEvent };