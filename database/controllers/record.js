const RecordModel = require('../models/record.js');

function addRecord(data, cb) {
  RecordModel.create({
    author: data.author,
    filePath: data.filePath,
    desc: data.desc,
    recLength: data.recLength
  }, cb);

function findOne(id, cb) {
  RecordModel.find({_id: id}, cb);
};

exports.addRecord = addRecord;
exports.findOne = findOne;