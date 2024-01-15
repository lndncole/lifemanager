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

router.get('/chick', (req, res) => {
  res.send('Chick Fil A breakfast tomorrow?');
});

router.get('/ana', (req, res) => {
  res.send("I love Ana more than any girl in the entire universe. She is so sweet and beautiful and I'm lucky to have her in my life");
});

module.exports = router;
