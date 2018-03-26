const mongoose = require('mongoose')

const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: {type: String, required: [true, 'Must give a username'], unique: true},
  log: [{type: Schema.Types.ObjectId, default: [], ref: 'Exercise'}]
});
const User = mongoose.model('User', userSchema);

module.exports = User;