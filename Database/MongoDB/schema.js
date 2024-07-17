const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  id: { type: String, required: true, unique: true },
  data: { type: String, required: true }
});

const threadSchema = new Schema({
  id: { type: String, required: true, unique: true },
  data: { type: String, required: true }
});

const globalDataSchema = new Schema({
  id: { type: String, required: true, unique: true },
  data: { type: String, required: true }
});

const User = model('User', userSchema);
const Thread = model('Thread', threadSchema);
const Global = model('GlobalData', globalDataSchema);

module.exports = { User, Thread, Global };