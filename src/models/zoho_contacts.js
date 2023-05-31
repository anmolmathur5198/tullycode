const mongoose = require("mongoose");

const zoho_contactschema = new mongoose.Schema({}, { strict: false, timestamps: true, versionKey: false });

module.exports = zoho_contacts = mongoose.model("zoho_contacts", zoho_contactschema);
