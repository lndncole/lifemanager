require('dotenv').config();

const routes = require('./routes/routes.js');
const pool = require('../db/db.js');
const cors = require('cors');
const path = require('path');

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

app.use(express.static(path.join(__dirname, '../dist')));

const corsOptions = {
    origin: 'http://localhost:8081',  // Frontend origin
    optionsSuccessStatus: 200
  };

app.use(cors(corsOptions));
app.use(express.json());
app.use(routes);
app.use(bodyParser.json());

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


//Database basic query
const query = (text, params, callback) => {
    return pool.query(text, params, callback);
};

app.get('/testdb', async (req, res) => {
    console.log("sup");
    try {
        const { rows } = await query('SELECT NOW()');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error while connecting to database');
    }
});