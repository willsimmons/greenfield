var mongoose = require('mongoose');
var db = require('./database');


var saveUser = function(user) {
  var User = mongoose.model('User', db.userSchema)

  item.save(function (err, item){
    if (err) return console.error(err);

    console.log('item saved', item)
  })
}

var findAll = function(schema) {
  schema.find({}, function(err, data){
    if (err) return console.error(err);

    console.log('all entries in %s:', schema, data);
  });
}

var findOne = function(schema, item) {
  schema.findOne()
}