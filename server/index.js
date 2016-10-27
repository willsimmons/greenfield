'use strict';

// debug ====================================================================
var debug = require('debug');
debug.enable('server:*');
var log = debug('server:log');
var info = debug('server:info');
var error = debug('server:error');

// set up ===================================================================
const express = require('express');
const expressSession = require('express-session');
const passport = require('passport');
const flash = require('flash');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const db = require('./config/db.js');
const password = require('./config/secret.js');
const Promise = require('bluebird');
let LocalStrategy = require('passport-local').Strategy;
const mediaRepo = require('./media-repo/media-repo');
const port = process.env.PORT || 8000;

const app = express();

// configuration ============================================================

// db controllers
const User = require('../database/controllers/user.js');
const Record = require('../database/controllers/record.js');

// connect to mongoDB database, check config folder to change url
mongoose.connect(db.url);

// parse application/json
app.use(bodyParser.json());
// session management
app.use(expressSession({
  secret: password.phrase,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// passport login schema
passport.use(new LocalStrategy({
  passReqToCallback: true
}, 
function(req, username, password, done) {
  User.findOne(username, function(err, user) {
    if (err) { return done(err); }
    if (user.length === 0) {
      return done(null, false, { message: 'Username does not exist!' });
    }
    if (password !== user[0].password) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user[0]);
  });
}
));

// passport sessionizer
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});


// TODO: Move routes to separate file
// routes ===================================================================

// serve static files
app.use(express.static(__dirname + '/../public'));

// login existing user
app.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/yes',
    failureRedirect: '/no',
    failureFlash: true
  })(req, res, next);
});

// create new user
app.post('/register', (req, res) => {
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
