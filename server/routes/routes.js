//server/routes/routes.js
//Dependencies
const express = require('express');
const router = express.Router();

//Middleware
const { isAuthenticated } = require('../middleware/middlewares');

//DB
const db = require('../db/db.js');

//APIs
const googleApi = require('../../api/google/index.js');

//Google router functions
const google = require('./google.js');

//Api router functions for use at '/api' route 
const apiRoutes = require('./apiRoutes.js');

//Create api route, pass in router functions
router.use('/api', isAuthenticated, apiRoutes);

//Send initial request to Google for authenitcation 
router.get('/authenticate', async (req, res) => {
  await google.authenticate(req, res, googleApi);
});

//oAuth callback that get's hit when Google responds to user authentication request
router.get('/oauth2callback', async (req, res) => {
  await google.handleAuthenticationCallback(req, res, googleApi, db);
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

module.exports = router;