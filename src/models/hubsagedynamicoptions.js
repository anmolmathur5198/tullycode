const mongoose = require("mongoose");

const HubsagedynamicoptionsSchema = new mongoose.Schema(
  { user_id: { type: mongoose.Types.ObjectId } },
  { strict: false, timestamps: true, versionKey: false }
);

module.exports = Hubsagedynamicoption = mongoose.model(
  "Hubsagedynamicoption",
  HubsagedynamicoptionsSchema
);
