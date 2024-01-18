const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const url = require('url');
const opn = require('open');
const destroyer = require('server-destroy');
const process = require('process');
const oauth2ClientExport = require('./oauth2Client');
const {google} = require('googleapis');
const people = google.people('v1');

// const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = process.env.NODE_ENV == 'production' ? process.env.GOOGLE_APPLICATION_CREDENTIALS : path.join(process.cwd(), 'credentials.json');
const CREDENTIALS = process.env.NODE_ENV == 'production' ? process.env.GOOGLE_CREDENTIALS : process.env.GOOGLE_CREDENTIALS;
/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {

  const authorizeUrl2 = oauth2ClientExport.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/calendar.readonly'
  });

  return authorizeUrl2;
}

function createOAuthClient() {
  // Load your credentials
  const credentials = JSON.parse(CREDENTIALS);
  const { client_id, client_secret, redirect_uris } = credentials.web;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  return oauth2Client;
}

async function authenticate(scopes, oauth2Client) {
  console.log("authentication");
  return new Promise((resolve, reject) => {
    // grab the url that will be used for authorization
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/calendar.readonly'
    });
    const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url.indexOf('/oauth2callback') > -1) {
            const qs = new url.URL(req.url, keys.javascript_origins).searchParams;
            server.destroy();
            const {tokens} = await oauth2Client.getToken(qs.get('code'));
            oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
            resolve(oauth2Client);
            res.end('Authentication successful! Please return to the console.');
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(3000, (req, res) => {
        console.log("listening on port 3000");
        // open the browser to the authorize url to start the workflow
        opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
      });
    destroyer(server);
  });
}

  // authenticate(scopesTest, oauth2Client)
  // .then(client => runSample(client))
  // .catch(console.error); 

  // getCalendar(await authenticate(['https://www.googleapis.com/auth/calendar.readonly'], oauth2Client));


async function runSample() {
  // retrieve user profile
  const res = await people.people.get({
    resourceName: 'people/me',
    personFields: 'emailAddresses',
  });
  console.log(res.data);

  return res.data;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});

  console.log("calendar: ", calendar);

  return calendar;
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
}


async function getCalendar(auth) {
  try {
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

    console.log('Last 10 events:');
    events.forEach((event, i) => {
      const start = event.start.dateTime || event.start.date;
      console.log(`${start} - ${event.summary}`);
    });

    return events;
  } catch (error) {
    console.error('Error retrieving calendar events:', error);
    throw error;
  }
}





module.exports = {authorize, listEvents, getCalendar, createOAuthClient};