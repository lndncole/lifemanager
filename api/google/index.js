//api/index.js
const {google} = require('googleapis');
const moment = require('moment-timezone');


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

async function search(req) {
  try {
    const search = google.customsearch('v1');
    const searchRes = await search.cse.list({
      cx: process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
      q: req.q,
      auth: process.env.GOOGLE_CLOUD_API_KEY,
    });
    return searchRes.data;
  } catch(e) {
    console.error('Google search failed: ', e);
    return `Google search failed: ${e}`;
  }
}

async function addCalendarEvent(auth, eventDetails) {
  const calendar = google.calendar({ version: 'v3', auth });
  try {

  const event = {
    calendarId: 'primary',
    summary: eventDetails.summary,
    start: eventDetails.start,
    end: eventDetails.end,
    description: eventDetails.description
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

    return response;
  } catch (e) {
    console.error('Failed to add calendar event: ', e);
    return `Failed to add calendar event: ${e}`;
  }
}

async function deleteCalendarEvent(auth, eventDetails) {
  const calendar = google.calendar({ version: 'v3', auth });
  try {

  const event = {
    calendarId: eventDetails.calendarId ? eventDetails.calendarId : 'primary',
    eventId: eventDetails.eventId
  };

  const response = await calendar.events.delete({
    calendarId: event.calendarId,
    eventId: event.eventId,
  });

    return response;
  } catch (e) {
    console.error('Failed to delete calendar event: ', e);
    return `Failed to delete calendar event: ${e}`; // Rethrow or handle as needed
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

async function getCalendar(oauth2Client, timeMin, timeMax, days, userTimeZone) {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // If timeMin and timeMax are not provided, calculate a default range
    if(!timeMin || !timeMax) {
      const now = moment.tz(userTimeZone);
      timeMin = now.startOf('day').toISOString();
      timeMax = now.add(days, 'days').toISOString();
    }
    
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
        allEvents.push({ 
          start: start, 
          end: event.end?.date || event.end?.dateTime, 
          summary: event.summary, 
          description: event.description,
          eventId: event.id,
          eventLink: event.htmlLink,
          eventStatus: event.status
        });
      });
    }

    return allEvents;
  } catch (e) {
    console.error('Failed to get calendar: ', e);
    return `Failed to get calendar: ${e}`;
  }
}

module.exports = { getCalendar, getUserInfo, createOAuthClient, addCalendarEvent, deleteCalendarEvent, search };