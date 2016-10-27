const UserModel = require('../models/user.js');

const addUser = function(userdata, cb) {
  UserModel.create({
    username: userdata.username, 
    password: userdata.password,
    email: userdata.email
  }, cb);
};

const findOne = function(userdata, cb) {
  UserModel.find({username: userdata.username}, cb);
};

exports.addUser = addUser;
exports.findOne = findOne;