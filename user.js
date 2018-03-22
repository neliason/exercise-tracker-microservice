const mongoose = require('mongoose')

const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: {type: String, required: true, unique: true},
  log: [{type: Schema.Types.ObjectId, ref: 'Exercise', default: []}]
});
const User = mongoose.model('User', userSchema);

module.exports = User;