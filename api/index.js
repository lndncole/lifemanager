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

async function getCalendar(auth) {
  //Get the last 10 events in the user's calendar
  try {
    //Connect to Google Calendar API using oAuth client
    const calendar = google.calendar({ version: 'v3', auth });
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMax: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items;
    if (!events || events.length === 0) {
      console.log('No upcoming events found.');
      return [];
    }

    let eventList = [];
    console.log('Last 10 events:');
    events.forEach((event, i) => {
      const start = event.start.dateTime || event.start.date;
      console.log(`${start} - ${event.summary}`);
      eventList.push(`${start} - ${event.summary}`);
    });

    return eventList;
  } catch (error) {
    console.error('Error retrieving calendar events:', error);
    throw error;
  }
}

module.exports = { getCalendar, createOAuthClient };