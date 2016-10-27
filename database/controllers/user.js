const UserModel = require('../models/user.js');

const addUser = function(userdata, cb) {
  UserModel.create({
    username: userdata.username, 
    password: userdata.password,
    email: userdata.email
  }, cb);
};

const findOne = function(username, cb) {
  UserModel.find({username: username}, cb);
};

exports.addUser = addUser;
exports.findOne = findOne;