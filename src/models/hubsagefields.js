const mongoose = require("mongoose");

const HubSageSchema = new mongoose.Schema(
  {},
  { strict: false, timestamps: true, versionKey: false }
);

module.exports = HubSageField = mongoose.model("HubSageField", HubSageSchema);
