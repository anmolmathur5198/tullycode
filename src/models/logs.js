const mongoose = require("mongoose");

const LogsSchema = new mongoose.Schema({}, { strict: false, timestamps: true, versionKey: false });

module.exports = logs = mongoose.model("logs", LogsSchema);