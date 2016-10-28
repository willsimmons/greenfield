'use strict';

const debug = require('debug');
debug.enable('server:*');
const log = debug('server:log');
const info = debug('server:info');
const error = debug('server:error');

const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const https = require('https');
const mediaRepo = require('./media-repo/media-repo');
const broadcasting = require('./broadcasting/broadcasting');

const port = process.env.PORT || 8443;
const app = express();

// setup database - FIXME when we need it and probably do this in another file
// var dbName = 'mongodb://localhost/test';
// mongoose.connect(dbName);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// serve static files
app.use(express.static(__dirname + '/../public'));

// create new recording item with metadata, get back recording endpoint url
app.post('/api/recording', (req, res) =>
  mediaRepo.createItem(req.body).then(data => res.status(200).json(data)).catch(err => res.status(500).json(err))
);

// get recording url and metadata from id
app.get('/api/recording/:id', (req, res) =>
  mediaRepo.getItem(req.params.id).then(data => res.status(200).json(data)).catch(err => res.status(500).json(err))
);

// delete recording from id
app.delete('/api/recording/:id', (req, res) =>
  mediaRepo.deleteItem(req.params.id).then(data => res.status(200)).catch(err => res.status(500).json(err))
);

// update recording metadata from id
app.put('/api/recording/:id', (req, res) =>
  mediaRepo.updateItem(req.params.id, req.body).then(data => res.status(200)).catch(err => res.status(500).json(err))
);

// get list of recordings (returns list of recording IDs)
app.post('/api/recordings', (req, res) =>
  mediaRepo.findItems(req.body).then(data => res.status(200).json(data)).catch(err => res.status(500).json(err))
);

// handle every other route with index.html
app.get('*', (req, res) =>
  res.sendFile(path.resolve(__dirname, '../public', 'index.html'))
);

// key/certificate for https server
const options = {
  key: fs.readFileSync(__dirname + '/keys/server.key'),
  cert: fs.readFileSync(__dirname + '/keys/server.crt')
};

// secure server setup
const server = https.createServer(options, app).listen(port, err => {
  if (err) {
    error('Error while trying to start the server (port already in use maybe?)');
    return err;
  }
  info(`secure server listening on port ${port}`);
  broadcasting.startWss(server);
});

module.exports = app;
