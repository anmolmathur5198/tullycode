const mongoose = require("mongoose");

const zoho_productssScehma = new mongoose.Schema({}, { strict: false, timestamps: true, versionKey: false });

module.exports = zoho_products = mongoose.model("zoho_products", zoho_productssScehma);
