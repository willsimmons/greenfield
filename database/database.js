var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('database connected');
});

var userSchema = mongoose.Schema({
  username: String,
  password: String,
  following: Array,
  followers: Array,
  recordings: Array,
  comments: Array,
});

var User = mongoose.model('User', userSchema);


var recordSchema = mongoose.Schema({
  filePath: String,
  listens: Number,
  likes: Number,
  comments: Array,
  descrip: String,
  length: Number
});

var Record = mongoose.model('Record', recordSchema);

//==================USER HELPERS==================

//==================RECORD HELPERS================


//==================GENERIC HELPERS===============
var saveItem = function(model, info) {
  //model should be capitalized like User or Record
  //info should be an object like {name: 'john'}

  var item = new model(info);

  item.save(function (err, item){
    if (err) return console.error(err);

    console.log('item saved', item);
  });
}

var removeItem = function(model, id) {
  //model should be capitalized like User or Record
  //id should be unique number

  model.find({_id: id}).remove().exec();
}

var findAll = function(model) {
  //model should be capitalized like User or Record

  model.find({}, function(err, data){
    if (err) return console.error(err);

    console.log('all entries in %s:', model, data);
  });
}

var findOne = function(model, info, fields) {
  //info should be an object like {name: 'john'}
  //fields should be a spaced string like 'username password'

  model.findOne(info, fields, function(err, result) {
    if (err) return console.error(err);
    console.log('matched entry: ', result);
  })
}


//==================EXAMPLES =====================
// saveItem(User, {
//   username: 'username',
//   password: 'password',
//   following: ['following'],
//   followers: ['followers'],
//   recordings: ['recordings'],
//   comments: ['comments'],
// })

//   findAll(User)

// findOne(User, {username: 'username'}, 'username password')
