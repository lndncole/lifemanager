require('dotenv').config();

//routes
const routes = require('./routes/routes');

//db
const dbRoute = require('./db');

//dependencies
const cors = require('cors');
const path = require('path');

//server
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


//options and connections
app.use(express.static(path.join(__dirname, '../dist')));

const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ? 'https://www.lifeMNGR.co' : 'http://localhost:8081',
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(routes);
app.use(dbRoute);
app.use(bodyParser.json());

//catch all for routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

const port = process.env.PORT || 8080;

//Add this in for Heroku specifically because Heroku listens on port 8000
if (port == null || port == "") {
    port = 8000;
}

app.listen(port, () => {
 console.log(`Server running on port ${port}`);
});