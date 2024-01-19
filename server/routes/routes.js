const express = require('express');
const router = express.Router();
const api = require('../../api/index.js');
const url = require('url');

const javascriptOrigins = process.env.NODE_ENV == 'production' ? 'https://lifemanager-c8d019eb99cb.herokuapp.com' : 'http://localhost:8080';

const privacyPolicyVerbiage = `Privacy Policy 
Introduction
This Privacy Policy outlines our commitment to protecting the privacy and personal information of our users. It details our practices regarding data collection, usage, user consent, and compliance with privacy laws.

Data Collection and Usage
We firmly state that we do not collect any personal data from our users. Our services utilize APIs, including OpenAI's GPT for natural language processing and Google Calendar for event management, but these do not involve collecting personal information from our users.

Third-Party Data Sharing
We assure our users that there is no sharing of personal data with third parties, in line with our commitment to privacy and data protection.

User Consent and Rights
Users of our services are provided with clear information about our privacy practices, ensuring informed consent. Users retain full rights over their personal information, including the right to access, correct, or delete any personal information, if such were ever to be collected.

Compliance with Laws
We are committed to complying with all applicable privacy laws, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). Our policy includes a strict adherence to these regulations, ensuring the protection of user data. We also confirm that we do not use cookies for tracking or any other purpose.

Contact Information
For any questions or concerns regarding our Privacy Policy or practices, users can contact us at landon.metcalfweb@gmail.com.`;

const termsOfSericeVerbiage = `Terms of Service
Introduction
Welcome to lifeManager. By accessing our website, you agree to these Terms of Service. These terms govern your use of our website and services.

Use of Service
Our service includes [brief description of services]. Users are expected to use our services responsibly and must not use them for any unlawful activities.

Intellectual Property Rights
All content on this website, including text, graphics, logos, and software, is the property of lifeManager or its content suppliers and protected by intellectual property laws. Users may not use any content without permission.

Account Information
Users may be required to create an account and are responsible for maintaining the confidentiality of their account information. The user is responsible for all activities that occur under their account.

Termination of Use
We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any breach of these Terms.

Disclaimer of Warranties and Liability
The service is provided on an "as is" and "as available" basis. lifeManager makes no warranties, expressed or implied. We do not warrant that the service will be uninterrupted or error-free.

Indemnification
Users agree to indemnify and hold harmless lifeManager from any claims, damages, or expenses arising from their use of the site.

Amendment of Terms
We reserve the right to amend these terms at any time. Continued use of the website after such changes will constitute acknowledgment and agreement of the modified terms.

Contact Information
For any questions regarding these Terms of Service, please contact us at landon.metcalfweb@gmail.com.`

// Sign Up Route
router.get('/signup', (req, res) => {
  res.send('Sign Up Page');
});

// Sign In Route
router.get('/signin', (req, res) => {
  res.send('Sign In Page');
});

// Home Route - After Successful Sign In
router.get('/home', (req, res) => {
  res.send('Welcome to the Home Page');
});

router.get('/privacy-policy', (req, res) => {
  res.send(privacyPolicyVerbiage);
});

router.get('/terms-of-service', (req, res) => {
  res.send(termsOfSericeVerbiage);
});

//oAuth callback that get's hit when Google responds to user authentication request
router.get('/oauth2callback', async (req, res) => {
  try {
    //Get the authorization code that's passed back to us from Google 
    const qs = new url.URL(req.url, javascriptOrigins).searchParams;
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


    oauth2Client.setCredentials(req.session.tokens); //Set credentials using session tokens

    // Use oauth2Client to make a call to the Google Calendar API
    const events = await api.getCalendar(oauth2Client);
    
    res.json(events); // Send the events back to the client

  } catch (error) {
    console.error('Error during OAuth callback:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/calendar', async (req, res) => {
  try {
    // Create a new OAuth2 client
    const oauth2Client = api.createOAuthClient();

    // Generate the authorization URL using Calendar scope specifically
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/calendar.readonly'
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