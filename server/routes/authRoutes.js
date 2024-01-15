const express = require('express');
const router = express.Router();

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

// Home Route - After Successful Sign In
router.get('/jon', (req, res) => {
  res.send('Chick Fil A tomorrow?');
});

module.exports = router;
