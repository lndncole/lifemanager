const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const url = require('url');
const opn = require('open');
const destroyer = require('server-destroy');
const process = require('process');
// const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const people = google.people('v1');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = process.env.NODE_ENV ? process.env.GOOGLE_APPLICATION_CREDENTIALS : path.join(process.cwd(), 'credentials.json');

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  const unparsedKeys = await fs.readFile(CREDENTIALS_PATH);

  keys = JSON.parse(unparsedKeys)['web'];

  const oauth2Client = new google.auth.OAuth2(
    keys.client_id,
    keys.client_secret,
    keys.redirect_uris[0]
  );


  google.options({auth: oauth2Client});

  
  const scopesTest = [
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/user.emails.read',
    'https://www.googleapis.com/auth/calendar.readonly',
    'profile',
  ];


  // authenticate(scopesTest, oauth2Client)
  // .then(client => runSample(client))
  // .catch(console.error);


  getCalendar(await authenticate(['https://www.googleapis.com/auth/calendar.readonly'], oauth2Client));

}

async function authenticate(scopes, oauth2Client) {
  return new Promise((resolve, reject) => {
    // grab the url that will be used for authorization
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
    });
    const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url.indexOf('/oauth2callback') > -1) {
            const qs = new url.URL(req.url, keys.javascript_origins)
              .searchParams;
            res.end('Authentication successful! Please return to the console.');
            server.destroy();
            const {tokens} = await oauth2Client.getToken(qs.get('code'));
            oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
            resolve(oauth2Client);
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(3000, () => {
        // open the browser to the authorize url to start the workflow
        opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
      });
    destroyer(server);
  });
}

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





module.exports = {authorize, listEvents};