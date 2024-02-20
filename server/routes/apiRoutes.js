//routes/apiRoutes.js
const express = require('express');
const apiRouter = express.Router();

const googleApi = require('../../api/google/index.js');
const chatGPTApi = require("../../api/chatGPT/index.js");
const chatGPT = require('./chatGPT/index.js');
const google = require('./google.js');

//Routes related to ChatGPT
apiRouter.post('/chatGPT', async (req, res) => {
  await chatGPT.chat(req, res, chatGPTApi, googleApi);
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
