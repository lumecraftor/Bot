// models/User.js
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    discordID: { type: String, required: true },
    key: { type: String, required: true },
    usageCount: { type: Number, default: 0 },
});
module.exports = mongoose.model('User', UserSchema);
