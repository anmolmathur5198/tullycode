const mongoose = require("mongoose");

const HSContacts = new mongoose.Schema({

    phone_type: {

    },
    phone_is_primary: {

    },
    phone_is_valid: {

    },
    Email: {},
    email_is_primary_cloned: {},
    profile_type: {},
    client_type: {},
    product_preference: {},
    citizenship: {},
    passport_issue_date: {},
    passport_expiry_date: {},
    passport_issuing_city: {},
    passport_issuing_country: {},
    primary_agent: {},
    referred_by: {},
    referred_value: {},
    hs_content_membership_status: {},
    hs_created_by_user_id: {},
    first_deal_created_date: {},
    lastmodifieddate: {}
}, { timestamps: true, versionKey: false });

module.exports = Hscontacts = mongoose.model("HSContacts", HSContacts);