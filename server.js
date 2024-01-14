require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());


const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
 res.send('Hello World!');
});

app.listen(port, () => {
 console.log(`Server running on port ${port}`);
});


const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
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