const mongoose = require('mongoose');

const recordSchema = mongoose.Schema({
  author: String,
  filePath: String,
  listens: Number,
  likes: Number,
  comments: Array,
  desc: String,
  recLength: Number,
  created: {
    type: Date,
    default: Date.now
  }
});

const RecordModel = mongoose.model('Record', recordSchema);

module.exports = RecordModel;