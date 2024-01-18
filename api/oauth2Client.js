
const { google } = require('googleapis');
const CREDENTIALS = process.env.NODE_ENV == 'production' ? process.env.GOOGLE_CREDENTIALS : process.env.GOOGLE_CREDENTIALS;

const parsedKeys = JSON.parse(CREDENTIALS);

keys = parsedKeys['web'];

const oauth2Client = new google.auth.OAuth2(
    keys.client_id,
    keys.client_secret,
    keys.redirect_uris[0]
);

google.options({auth: oauth2Client});


module.exports = oauth2Client;