const mongoose = require('mongoose')

const Schema = mongoose.Schema;
const exerciseSchema = new Schema({
  description: { type: String, required: [true, 'Must give a description'] },
  duration: { type: Number, min: 1, required: [true, 'Must give a duration'] },
  date: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: 'User' }
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;