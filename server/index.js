'use strict';

// debug ====================================================================
var debug = require('debug');
debug.enable('server:*');
var log = debug('server:log');
var info = debug('server:info');
var error = debug('server:error');

// set up ===================================================================
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const database = require('./config/db.js');
const Promise = require('bluebird');
const mediaRepo = require('./media-repo/media-repo');

// configuration ============================================================
const port = process.env.PORT || 8000;
const app = express();

const user = require('../database/controllers/user.js');
const record = require('../database/controllers/record.js');

// connect to mongoDB database, check config folder to change url
mongoose.connect(database.url);

//parse application/json
app.use(bodyParser.json());

// serve static files
app.use(express.static(__dirname + '/../public'));


// TODO: Move routes to separate file
// routes ===================================================================

// login existing user
app.post('/api/auth', (req, res) => {
  user.findOne(req.body.username, function(err, data) {
    if (err) { throw err; }
    if (data.length > 0) {
      if (req.body.password === data[0].password) {
        console.log('successful login!');
        res.redirect('/');
      } else {
        console.log('bad password!');
        res.redirect('/');
      }
    } else {
      console.log('username does not exist!');
      res.redirect('/');
    }
  });
});

// create new user
app.post('/api/newuser', (req, res) => {
  user.findOne(req.body.username, function(err, data) {
    if (err) { throw err; }
    if (data.length > 0) {
      console.log('username already exists!');
      res.redirect('/');
    }
    user.addUser({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email
    });
    console.log('created new user:', req.body.username);
    res.redirect('/');
  });
});

// create new recording item with metadata, get back recording endpoint url
app.post('/api/recording', (req, res) => {
  mediaRepo.createItem(req.body).then(data => res.status(200).json(data)).catch(err => res.status(500).json(err));
});

// get recording url and metadata from id
app.get('/api/recording/:id', (req, res) => {
  mediaRepo.getItem(req.params.id).then(data => res.status(200).json(data)).catch(err => res.status(500).json(err));
});

// delete recording from id
app.delete('/api/recording/:id', (req, res) => {
  mediaRepo.deleteItem(req.params.id).then(data => res.status(200)).catch(err => res.status(500).json(err));
});

// update recording metadata from id
app.put('/api/recording/:id', (req, res) => {
  mediaRepo.updateItem(req.params.id, req.body).then(data => res.status(200)).catch(err => res.status(500).json(err));
});

// get list of recordings (returns list of recording IDs)
app.get('/api/recordings', (req, res) => {
  mediaRepo.findItems(req.body).then(data => res.status(200).json(data)).catch(err => res.status(500).json(err));
});

// server index.js
app.get('/', (req, res) => res.send('index'));


// listen (start app with node / nodemon index.js) ==========================
app.listen(port, err => {
  if (err) {
    error('Error while trying to start the server (port already in use maybe?)');
    return err;
  }
  info(`server listening on port ${port}`);
});

module.exports = app;
