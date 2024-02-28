//routes/apiRoutes.js
const express = require('express');
const apiRouter = express.Router();

const googleApi = require('../../api/google/index.js');
const chatGPTApi = require("../../api/chatGPT/index.js");

//Route function
const google = require('./google.js');

//Routes related to ChatGPT
apiRouter.post('/chatGPT', async (req, res) => {
  await chatGPTApi.startChat(req, res, googleApi);
});

//Routes related to Google Calendar fetching
apiRouter.post('/google/fetch-calendar', async (req, res) => {
  await google.fetchCalendar(req, res, googleApi);
});

//Routes for adding events to Google Calendar
apiRouter.post('/google/add-calendar-events', async (req, res) => {
  await google.addCalendarEvents(req, res, googleApi);
});

module.exports = apiRouter;
