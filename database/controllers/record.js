const RecordModel = require('../models/record.js');

const addRecord = function(data, cb) {
  RecordModel.create({
    author: data.author,
    filePath: data.filePath,
    desc: data.desc,
    recLength: data.recLength
  }, cb);
};

const findOne = function(id, cb) {
  RecordModel.find({_id: id}, cb);
};

exports.addRecord = addRecord;
exports.findOne = findOne;