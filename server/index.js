'use strict';

const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Promise = require('bluebird');

const app = express();

const kurentoData = {};
const kurentoUrl = 'http://138.197.196.39:7676/repo/item';
let kurentoResp;

let reqPostOptions = {
  url: kurentoUrl,
  method: 'POST',
  json: kurentoData
};

let reqFindOptions = {
  url: kurentoUrl + '/find',
  method: 'POST',
  json: kurentoData
};

// Set up as helper function
// When user hits endpoint, pass in appropriate data

const callKurento = function(opt) {
  return new Promise(function(resolve, reject) {
    request(opt, function(err, resp, body) {
      if (err) { 
        console.log('Bad Kurento request');
        reject(err); 
      }
      resolve(body);
    });
  });
};

request(reqPostOptions, function(err, resp, body) {
  if (err) { console.error(err, 'bad Kurento request'); }
  kurentoResp = body;
});

// Comment out DB depending on testing or live

// var dbName = 'mongodb://localhost/test';
// var dbName = 'mongodb://.........';

// mongoose.connect(dbName);

app.use(bodyParser.json());

app.use(express.static(__dirname + '/../public'));

app.get('/api/users/:username/track/:track/create', function(req, res) {
  reqPostOptions.json = req.params;
  callKurento(reqPostOptions)
    .then(function(data) {
      res.status(200).json(data);
    });
});

app.get('/api/users/:username/track/:track', function(req, res) {
  reqFindOptions.json = req.params;

  callKurento(reqFindOptions)
    .then(function(data) {
      res.status(200).json(data);
    });
});

app.get('/', function(req, res) {
  res.send('index');
});

app.listen(8000, function() {
  console.log('Listening on port 8000');
});

module.exports = app;
