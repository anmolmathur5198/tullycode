const mongoose = require("mongoose");

const zohoaccountschema = new mongoose.Schema({}, { strict: false, timestamps: true, versionKey: false });

module.exports = zoho_accounts = mongoose.model("zoho_accounts", zohoaccountschema);
