'use strict';

const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

const kurentoData = {};
const kurentoUrl = 'http://138.197.196.39:7676/repo/item';
let kurentoResp;

const requestOptions = {
  url: kurentoUrl,
  method: 'POST',
  json: kurentoData
};

request(requestOptions, function(err, resp, body) {
  if (err) { console.error(err, 'bad Kurento POST'); }
  kurentoResp = body;
});

// Comment out DB depending on testing or live

// var dbName = 'mongodb://localhost/test';
// var dbName = 'mongodb://.........';

// mongoose.connect(dbName);

app.use(bodyParser.json());

app.use(express.static(__dirname + '/../public'));

app.get('/api/index', function(req, res) {
  res.status(200).json(kurentoResp);
});

app.get('/', function(req, res) {
  res.send('index');
});

app.listen(8000, function() {
  console.log('Listening on port 8000');
});

module.exports = app;