const UserModel = require('../models/user.js');

function addUser(userdata, cb) {
  UserModel.create({
    username: userdata.username, 
    password: userdata.password,
    email: userdata.email
  }, cb);
};

function findOne(userdata, cb) {
  UserModel.find({username: userdata.username}, cb);
};

exports.addUser = addUser;
exports.findOne = findOne;