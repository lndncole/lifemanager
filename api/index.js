const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
// const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = process.env.NODE_ENV ? process.env.GOOGLE_APPLICATION_CREDENTIALS : path.join(process.cwd(), 'credentials.json');

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  const content = await fs.readFile(CREDENTIALS_PATH);
  console.log("credentials path: ", CREDENTIALS_PATH);
  console.log("content: ", JSON.parse(content));
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  console.log("client: ", client);
  return client;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime',
  });
  let eventList = [];

  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log('No upcoming events found.');
    return eventList;
  }
  console.log('Upcoming 10 events:');
  events.map((event, i) => {
    const start = event.start.dateTime || event.start.date;
    console.log(`${start} - ${event.summary}`);
    eventList.push(`${start} - ${event.summary}`);
  });

  return eventList;

}module.exports = {authorize, listEvents};