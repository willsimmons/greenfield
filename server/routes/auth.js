const path = require('path');
const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../../database/controllers/user.js');

var debug = require('debug');
//debug.enable('auth:*');
var log = debug('auth:log');
var info = debug('auth:info');
var error = debug('auth:error');

module.exports = function(app) {

  // passport configuration =========================================================================

  // serialize user id into session and vice versa
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });
  passport.deserializeUser(function(id, done) {
    User.findId(id, function (err, user) {
      done(err, user);
    });
  });

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

  // authentication ==============================================================================

  // login existing user
  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (user) {
        req.logIn(user, (err) => {
          if (err) { error('Login fail despite passing auth', err); }
          // res.redirect not working here, set up success property on login page to redirect
          return res.json({user: req.user.username, url: '/recorder'});
        });
      }
      if (info) {
        log('more information:', info);
      }
    })(req, res, next);
  });

  // register new user
  app.post('/api/register', (req, res) => {
    User.findOne(req.body.username, (err, data) => {
      if (err) { error('Not able to search DB', err); }
      if (data.length > 0) {
        log('username already exists!');
        return res.end('/register');
      } else {
        User.addUser({
          username: req.body.username,
          password: req.body.password,
          email: req.body.email
        }, (err, data) => {
          if (err) { error('Error creating user', err); }
          log('created new user:', req.body.username);
          req.logIn(data, function(err) {
            if (err) { error('Error logging in', err); }
            log('logged in as', req.body.username);
            return res.end('/home');
          });
        });
      }
    });
  });

  // auth helpers ==============================================================================

  app.get('/verify', (req, res) => {
    var status = req.isAuthenticated();
    return res.send(status);
  });

  app.get('/logout', (req, res) => {
    req.logout();
    return res.send('/');
  });

};
