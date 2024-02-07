//server/routes/routes.js
//Dependencies
const express = require('express');
const router = express.Router();
const url = require('url');

//APIs
const googleApi = require('../../api/google/index.js');
const chatGPTApi = require("../../api/chatGPT/index.js");

const domain = 
  process.env.NODE_ENV == 'production' ? 'https://www.lifemngr.co' 
    : 'http://localhost:8080';

router.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;

  try {

    // Ensure messages array is not empty
    if (!conversation || !conversation.length) {
      throw new Error("The 'messages' array is empty.");
    }

    const completion = await chatGPTApi.startChat(conversation);


    if (completion && completion.choices && completion.choices.length > 0) {
      const choice = completion.choices[0].message;
      if (choice.function_call) {
          // Parse the JSON string to an object
          const functionArgs = JSON.parse(choice.function_call.arguments);
          // Ensure oauth2Client is correctly authenticated
          const oauth2Client = googleApi.createOAuthClient();
          oauth2Client.setCredentials(req.session.tokens);
        if (choice.function_call.name === "fetch-calendar") {
          try {
            // Format dates to RFC3339 if necessary
            const timeMin = new Date(functionArgs.timeMin).toISOString();
            const timeMax = new Date(functionArgs.timeMax).toISOString();

            const events = await googleApi.getCalendar(oauth2Client, timeMin, timeMax);
            res.json({
              gptFunction: 'fetch-calendar',
              calendarEvents: events
            });
          } catch (e) {
            console.error("Error getting calendar data:", e);
            res.status(500).send("Error fetching calendar data");
          }
        } else if(choice.function_call && choice.function_call.name === "add-calendar-events") {
          const events = JSON.parse(choice.function_call.arguments).events;
          try {
            // Iterate through each event object and add it to the calendar
            const googleCalendarResponses = [];
            for (const event of events) {
              try {
                // Format dates to RFC3339 if necessary
                const startTime = new Date(event.start).toISOString();
                const endTime = new Date(event.end).toISOString();
                
                // Create a request object for each event
                const req = {
                  body: {
                    summary: event.summary,
                    start: { dateTime: startTime },
                    end: { dateTime: endTime },
                    description: event.description
                  }
                };
                // Pass the oauth2Client and the constructed req object to the addCalendarEvent function
                const googleCalendarAddEventResponse = await googleApi.addCalendarEvent(oauth2Client, req);
                // Check if googleCalendarAddEventResponse.items exists and has length
                if (googleCalendarAddEventResponse && googleCalendarAddEventResponse.data) {
                  googleCalendarResponses.push(googleCalendarAddEventResponse.data); // Add response to array
                } else {
                  throw new Error('No data received from addCalendarEvent');
                }
              } catch (e) {
                console.error(`Error adding event: ${event.summary}`, e);
                googleCalendarResponses.push({ error: `Error adding event: ${event.summary}`, details: e.toString() });
              }
            }
            
            // Pass the extracted information to the chat GPT function
            const gptResponse = await chatGPTApi.startChat([...conversation, {
              role: 'function',
              content: JSON.stringify(googleCalendarResponses),
              name: 'add-calendar-events'
            }]);
      
            if (gptResponse && gptResponse.choices && gptResponse.choices.length > 0) {
              const gptChoice = gptResponse.choices[0].message;
              // Process and return GPT's response to the Calendar's response
              res.json({
                gptFunction: 'add-calendar-events',
                response: gptChoice.content
              });
            } else {
              res.status(500).send("Error adding Google calendar event with lifeMNGR.");
            }
          } catch (e) {
            // console.error("Error getting calendar data:", e);
            res.status(500).send("Error adding calendar data");
          }
        } else if(choice.function_call && choice.function_call.name === "google-search") {
          try {
            // Assuming functionArgs.query is already defined and contains the query string
            const req = {
              q: functionArgs.query
            };
        
            // Simulate calling the Google search API function
            const googleSearchResponse = await googleApi.search(req);
        
            // Check if googleSearchResponse.items exists and has length
            if (googleSearchResponse && googleSearchResponse.items && googleSearchResponse.items.length > 0) {
              // Map through the items array to extract 'link' and 'snippet'
              const searchResults = googleSearchResponse.items.map(item => ({
                link: item.link,
                snippet: item.snippet
              }));
        
              // Pass the extracted information to the chat GPT function
              const gptResponse = await chatGPTApi.startChat([...conversation, {
                role: 'function',
                content: JSON.stringify(searchResults),
                name: 'google-search'
              }]);
        
              if (gptResponse && gptResponse.choices && gptResponse.choices.length > 0) {
                const gptChoice = gptResponse.choices[0].message;
                // Process and return GPT's response with the search results
                res.json({
                  gptFunction: 'google-search',
                  result: gptChoice.content // Assuming this is how you access the response content
                });
              } else {
                res.status(500).send("Error processing Google search results with lifeMNGR.");
              }
            } else {
              res.status(500).send("No results found for the Google search.");
            }
          } catch (e) {
            console.error(e);
            res.status(500).send("Error performing Google search.");
          }
        } 
      } else {
        res.json({ response: choice });
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

  const oauth2Client = googleApi.createOAuthClient();
  oauth2Client.setCredentials(req.session.tokens);

  try {
    const events = await googleApi.getCalendar(oauth2Client, null, null, days);
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
    const oauth2Client = googleApi.createOAuthClient();
    oauth2Client.setCredentials({ access_token: process.env.TOKENS.access_token });
    
    try {
      response = await googleApi.addCalendarEvent(oauth2Client, req);
      res.json(response);
    } catch (error) {
      console.error('Error adding calendar event:', error);
      res.status(500).send('Error adding event to calendar');
    }
  } else if (!req.session.tokens) {
    return res.status(401).send('User not authenticated');
  }

  const oauth2Client = googleApi.createOAuthClient();
  oauth2Client.setCredentials(req.session.tokens);

  try {
    response = await googleApi.addCalendarEvent(oauth2Client, req);
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
});

//Send initial request to Google for authenitcation 
router.get('/authenticate', async (req, res) => {
  try {
    // Create a new OAuth2 client
    const oauth2Client = googleApi.createOAuthClient();
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

      // Redirect to the authorization URL
      res.redirect(authorizeUrl);
    }
  } catch (error) {
    console.error('Error during calendar API call:', error);
    res.status(500).send('Error retrieving calendar data');
  }
});

module.exports = router;