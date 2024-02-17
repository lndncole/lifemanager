//server/routes/routes.js
//Dependencies
const express = require('express');
const router = express.Router();

//Middleware
const { isAuthenticated } = require('../middleware/middlewares');

//APIs
const googleApi = require('../../api/google/index.js');
const chatGPTApi = require("../../api/chatGPT/index.js");

//Functions
const chatGPT = require('./chatGPT/index.js');
const google = require('./google.js');

//Test authentication
router.get('/test', isAuthenticated, async (req, res) => {
  res.send("Authenticated");
});

//Send initial request to Google for authenitcation 
router.get('/authenticate', async (req, res) => {
  await google.authenticate(req, res, googleApi);
});

//oAuth callback that get's hit when Google responds to user authentication request
router.get('/oauth2callback', async (req, res) => {
  await google.handleAuthenticationCallback(req, res, googleApi);
});

//Get authorization status
router.get('/get-auth', isAuthenticated, (req, res) => {
    res.status(200).send(req.session.user);
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

//All chats to GPT
router.get('/api/chatGPT', isAuthenticated, async (req, res) => {
  await chatGPT.chat(req, res, chatGPTApi, googleApi);
});

//Fetch user's calendar
router.post('/api/google/fetch-calendar', isAuthenticated, async (req, res) => {
  await google.fetchCalendar(req, res, googleApi);
});

//Add event to calendar
router.post('/api/google/add-calendar-events', isAuthenticated, async (req, res) => {
  await google.addCalendarEvents(req, res, googleApi);
});

module.exports = router;