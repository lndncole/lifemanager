//server/routes/routes.js
const express = require('express');
const router = express.Router();
const api = require('../../api/index.js');
const url = require('url');

const domain = process.env.NODE_ENV == 'production' ? 'https://www.lifemngr.co' : 'http://localhost:8080';

//Get authorization status
router.get('/get-auth', (req, res) => {
  if (req.session.oauth2ClientConfig) {
    res.status(200).send("Authenticated");
  } else {
    res.status(401).send("Not Authenticated");
  }
});

//Sign user out / end session
router.get('/sign-out', (req, res) => {
  // Clear the session
  req.session.destroy(err => {
    if (err) {
      console.error('Error clearing session:', err);
      return res.status(500).send('Internal Server Error');
    }

    // Optionally redirect to the sign-in page
    res.redirect('/');
  });
});

//Fetch user's calendar
router.get('/fetch-calendar', async (req, res) => {
  if (!req.session.oauth2ClientConfig) {
    return res.status(401).send('User not authenticated');
  }

  const days = req.body.days ? req.body.days : 50;

  const oauth2Client = api.createOAuthClient();
  oauth2Client.setCredentials(req.session.tokens);

  try {
    const events = await api.getCalendar(oauth2Client, days);
    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).send('Error fetching calendar data');
  }
});

//Add event to calendar
router.post('/add-calendar-event', async (req, res) => {
  if (!req.session.oauth2ClientConfig) {
    return res.status(401).send('User not authenticated');
  }

  const oauth2Client = api.createOAuthClient();
  oauth2Client.setCredentials(req.session.tokens);

  try {
    response = await api.addCalendarEvent(oauth2Client, req);
    res.json(response);
  } catch (error) {
    console.error('Error adding calendar event:', error);
    res.status(500).send('Error adding event to calendar');
  }
});

//oAuth callback that get's hit when Google responds to user authentication request
router.get('/oauth2callback', async (req, res) => {
  try {
    //Get the authorization code that's passed back to us from Google 
    const qs = new url.URL(req.url, domain).searchParams;
    const code = qs.get('code');

    //Check to see that the user is authorized
    if (!req.session.oauth2ClientConfig) {
      return res.status(400).send('App session expired or invalid state');
    }

    //Check to see that the user was Authenticated through Google
    if (!code) {
      return res.status(401).send('Failed to authenticate with Google');
    }

    // Create another OAuth2 client using the stored config
    const oauth2Client = api.createOAuthClient(req.session.oauth2ClientConfig);
    //Get the tokens for the specific user's session and store them in the session
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;

    //Redirect to "post-auth" screen upon successful authentication and setting of authentication token in to user session
    res.redirect(`${domain}/home`);
  } catch (error) {
    console.error('Error during OAuth callback:', error);
    res.status(500).send('Internal Server Error');
  }
});

//Send initial request to Google for authenitcation 
router.get('/authenticate', async (req, res) => {
  try {
    // Create a new OAuth2 client
    const oauth2Client = api.createOAuthClient();

    // Generate the authorization URL using Calendar scope specifically
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/calendar'
    });

    // Store the client's config in session
    req.session.oauth2ClientConfig = {
      client_id: oauth2Client._clientId,
      client_secret: oauth2Client._clientSecret,
      redirect_uris: oauth2Client.redirectUri
    };

    // Redirect to the authorization URL
    res.redirect(authorizeUrl);
  } catch (error) {
    console.error('Error during calendar API call:', error);
    res.status(500).send('Error retrieving calendar data');
  }
});

module.exports = router;