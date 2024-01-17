const express = require('express');
const router = express.Router();
const api = require('../../api/index.js');

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

router.get('/oauth2callback', (req, res) => {
  console.log("oauth2callback", res);
  // res.send(res);
});

router.get('/calendar', async (req, res) => {
  try {
    const authClient = await api.authorize();
    const events = await api.listEvents(authClient);
    console.log("events", events);
    if(events && events.length) {
      res.send(events);
    } else {
      res.send("No events currently listed in this calendar.");
    }
  } catch (error) {
    console.error('Error during calendar API call:', error);
    res.status(500).send('Error retrieving calendar data');
  }
});


module.exports = router;
