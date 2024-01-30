// routes/gptAuthRoutes.js
const express = require('express');
const router = express.Router();
const api = require('../../api/index.js'); // Adjust the path as per your project structure

// Middleware to check if the request is from GPT
function isGptRequest(req, res, next) {
    if (req.query.source === 'gpt') {
        next();
    } else {
        res.status(403).send('Forbidden: This endpoint is only accessible with source="gpt".');
    }    
}

// Route to handle GPT authentication requests
router.get('/authenticate-gpt', isGptRequest, async (req, res) => {
    try {
        const oauth2Client = api.createOAuthClient();
        const authorizeUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ],
            prompt: 'consent', // Ensure that we always get a refresh token
        });

        console.log("getting /authenticate-gpt request to authenticate: ", req);

        // The response includes the URL to which the GPT instance should navigate to authenticate
        res.json({ status: 'success', authUrl: authorizeUrl });
    } catch (error) {
        console.error('Error during GPT authentication:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Callback route for handling the response after GPT authentication
router.get('/gpt-oauth2callback', isGptRequest, async (req, res) => {
    try {
        const qs = new URL(req.url, 'http://localhost').searchParams; // Replace with your server URL
        const code = qs.get('code');

        if (!code) {
            return res.status(401).send('Failed to authenticate with Google');
        }

        const oauth2Client = api.createOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);

        console.log("getting /gpt-oauth2callback request: ", req);

        // You might want to store these tokens in a secure way for future GPT requests
        // For now, sending the tokens back in the response for simplicity
        res.json({ status: 'success', tokens });
    } catch (error) {
        console.error('Error during GPT OAuth callback:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
