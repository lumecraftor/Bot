// models/Key.js
const mongoose = require('mongoose');
const KeySchema = new mongoose.Schema({
    key: { type: String, required: true },
    isUsed: { type: Boolean, default: false },
});
module.exports = mongoose.model('Key', KeySchema);
