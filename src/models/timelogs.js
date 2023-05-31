const mongoose = require("mongoose");

const SyncingTimeLogSchema = new mongoose.Schema(
  {},
  { strict: false, timestamps: true, versionKey: false }
);

module.exports = SyncingTimeLog = mongoose.model(
  "SyncingTimeLog",
  SyncingTimeLogSchema
);
