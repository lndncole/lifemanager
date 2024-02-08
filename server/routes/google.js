const url = require('url');
const domain = 
  process.env.NODE_ENV == 'production' ? 'https://www.lifemngr.co' 
    : 'http://localhost:8080';

async function fetchCalendar(req, res, googleApi) {

    //If a default set of days isn't given then default to ten days
    const days = req.body.days ? req.body.days : 10;

    const oauth2Client = googleApi.createOAuthClient();
    oauth2Client.setCredentials(req.session.tokens);

    try {
        const events = await googleApi.getCalendar(oauth2Client, null, null, days);
        res.json(events);
    } catch (error) {
        console.error('Error fetching calendar:', error);
        res.status(500).send('Error fetching calendar data');
    }
}

async function addCalendarEvents(req, res, googleApi) {
  const oauth2Client = googleApi.createOAuthClient();
  oauth2Client.setCredentials(req.session.tokens);

  try {
    response = await googleApi.addCalendarEvent(oauth2Client, req);
    res.json(response);
  } catch (error) {
    console.error('Error adding calendar event:', error);
    res.status(500).send('Error adding event to calendar');
  }
}

async function handleAuthenticationCallback(req, res, googleApi) {
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
        const oauth2Client = googleApi.createOAuthClient(req.session.oauth2ClientConfig);
        //Get the tokens for the specific user's session and store them in the session
        const { tokens } = await oauth2Client.getToken(code);
        req.session.tokens = tokens;

        // Retrieve user's profile information with error handling
        try {
            oauth2Client.setCredentials(req.session.tokens);

            const userInfo = await googleApi.getUserInfo(oauth2Client);
            
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
            // For GPT-initiated requests, send a JSON response
            res.json({ status: 'success', message: 'Authentication successful' });
        } else {
            // For app-initiated requests, redirect to home
            res.redirect(`${domain}/home`);
        }
    } catch (error) {
        console.error('Error during OAuth callback:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function authenticate(req, res, googleApi) {
    try {
        // Create a new OAuth2 client
        const oauth2Client = googleApi.createOAuthClient();
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

        // Redirect to the authorization URL
        res.redirect(authorizeUrl);
        
    } catch (error) {
        console.error('Error during calendar API call:', error);
        res.status(500).send('Error retrieving calendar data');
    }
}

module.exports = { fetchCalendar, addCalendarEvents, handleAuthenticationCallback, authenticate };