const mongoose = require('mongoose')

const Schema = mongoose.Schema;
const exerciseSchema = new Schema({
  description: {type: String, required: true},
  duration: Number,
  date: Date,
  userId: {type: Schema.Types.ObjectId, ref: 'User'}
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;