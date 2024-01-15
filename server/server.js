require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const pool = require('../db/db.js');

const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();

app.use(authRoutes);
app.use(bodyParser.json());


const port = process.env.PORT || 3000;

app.listen(port, () => {
 console.log(`Server running on port ${port}`);
});

app.get('/', (req, res) => {
res.send('Hello World!');
});

  
const query = (text, params, callback) => {
    return pool.query(text, params, callback);
};

app.get('/testdb', async (req, res) => {
    try {
        const { rows } = await query('SELECT NOW()');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error while connecting to database');
    }
});
  

  






module.exports = { query };