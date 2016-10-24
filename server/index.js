var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var app = express();


// Comment out DB depending on testing or live

// var dbName = 'mongodb://localhost/test';
// var dbName = 'mongodb://.........';

// mongoose.connect(dbName);

app.use(bodyParser.json());

app.use(express.static(__dirname + '/../public/client'));

app.listen(8000, function() {
  console.log('Listening on port 8000');
});