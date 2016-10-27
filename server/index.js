'use strict';

var debug = require('debug');
debug.enable('server:*');
var log = debug('server:log');
var info = debug('server:info');
var error = debug('server:error');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const mediaRepo = require('./media-repo/media-repo');

const port = process.env.PORT || 8000;
const app = express();

// setup database - FIXME when we need it and probably do this in another file
// var dbName = 'mongodb://localhost/test';
// mongoose.connect(dbName);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// serve static files
app.use(express.static(__dirname + '/../public'));

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

app.listen(port, err => {
  if (err) {
    error('Error while trying to start the server (port already in use maybe?)');
    return err;
  }
  info(`server listening on port ${port}`);
});

module.exports = app;
