//server/routes/db.js
//dependencies
const pool = require('../../db/db');
const express = require('express');
const router = express.Router();

//Database basic query
const query = (text, params, callback) => {
    return pool.query(text, params, callback);
};

router.get('/testdb', async (req, res) => {
    try {
        const { rows } = await query('SELECT NOW()');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error while connecting to database');
    }
});

module.exports = router;