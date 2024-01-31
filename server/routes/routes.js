//server/routes/routes.js
const express = require('express');
const router = express.Router();
const api = require('../../api/index.js');
const url = require('url');
const ai = require("../../ai/openai.js");

const domain = 
  process.env.NODE_ENV == 'production' ? 'https://www.lifemngr.co' 
    : 'http://localhost:8080';

router.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  try {
    const completion = await ai.startChat(message);
    if (completion.choices && completion.choices.length > 0 && completion.choices[0].message) {
      const choice = completion.choices[0].message;
      if(choice.function_call) {
        const days = req.body.days ? req.body.days : 10;

        const oauth2Client = api.createOAuthClient();
        oauth2Client.setCredentials(req.session.tokens);
        try {
          const events = await api.getCalendar(oauth2Client, days);
          res.json( {
            gptFunction: 'fetch-calendar', // Add a key to denote the GPT function
            calendarEvents: events // The actual events data
          } );
        } catch (e) {
          console.error("error getting calendar data through the chatbot: ", e);
        }
      } else {
        res.json({ response: completion.choices[0].message.content });
      }
    } else {
      throw new Error('Invalid response structure from OpenAI API');
    }
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    res.status(500).send('Error processing your request');
  }
});

//Get authorization status
router.get('/get-auth', (req, res) => {
  if (req.session.tokens && req.session.user) {
    res.status(200).send(req.session.user);
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
  if (!req.session.tokens) {
    return res.status(401).send('User not authenticated');
  }

  const days = req.body.days ? req.body.days : 10;

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
  // Check if the request is from GPT
  if (req.headers['x-gpt-request']) {
    const oauth2Client = api.createOAuthClient();
    oauth2Client.setCredentials({ access_token: process.env.TOKENS.access_token });
    
    try {
      response = await api.addCalendarEvent(oauth2Client, req);
      res.json(response);
    } catch (error) {
      console.error('Error adding calendar event:', error);
      res.status(500).send('Error adding event to calendar');
    }
  } else if (!req.session.tokens) {
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

    // Retrieve user's profile information with error handling
    try {
      oauth2Client.setCredentials(req.session.tokens);

      const userInfo = await api.getUserInfo(oauth2Client);
      
      if (userInfo) {
        req.session.user = {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        };
        
        //log user for debugging 
        console.log("user: ", req.session.user);
      } else {
        console.error('User info not found');
        // Handle the case where user info is not found
      }
    } catch (userInfoError) {
      console.error('Error retrieving user info:', userInfoError);
      // Handle the error, e.g., by sending a response or logging
    }

    // Check the source of the request
    if (req.session.authSource === 'gpt') {

      console.log("getting gpt source request in oauth2callback callback url: ", req);
      // For GPT-initiated requests, send a JSON response
      res.json({ status: 'success', message: 'Authentication successful' });
    } else {
      console.log("getting normal source request in oauth2callback callback url: ", req);

      // For app-initiated requests, redirect to home
      res.redirect(`${domain}/home`);
    }
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
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    });

    if (req.query.source === 'gpt') {
      console.log("gpt check: ", req.query);
      oauth2Client.setCredentials({ refresh_token: process.env.TOKENS.refresh_token });

      try {
        const { tokens } = await oauth2Client.refreshAccessToken();

        console.log("getting gpt source authentication request: ", req);
        // You can store these tokens or use them directly for GPT requests
        // Send a successful response back to GPT
        res.json({ status: 'success', tokens: tokens, authUrl: authorizeUrl });
      } catch (error) {
        console.error('Error refreshing access token:', error);
        res.status(500).send('Internal Server Error');
      }
    } else {
      // Generate the authorization URL with multiple scopes
      const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ]
      });

      // Store the client's config in session
      req.session.oauth2ClientConfig = {
        auth: oauth2Client,
        client_id: oauth2Client._clientId,
        client_secret: oauth2Client._clientSecret,
        redirect_uris: oauth2Client.redirectUri
      };

      //Get query parameter "source"if there is one
      req.session.authSource = req.query.source ? req.query.source : null;

      console.log("getting normal source authentication request: ", req);

      // Redirect to the authorization URL
      res.redirect(authorizeUrl);
    }
  } catch (error) {
    console.error('Error during calendar API call:', error);
    res.status(500).send('Error retrieving calendar data');
  }
});

module.exports = router;