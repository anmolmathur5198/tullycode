const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
    },
    lastname: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
    },
    reset_password_token: {
      type: String,
      default: "",
    },
    token_used: {
      type: String,
      default: "",
    },
    mobile_no: {
      type: String,
    },
    invoice_object_name: {
      type: String,
    },
    hub_domain: String,
    hub_id: String,
    app_id: String,
    user_id: String,
    token_type: String,
    chargebee_key : String,
    chargebee_key_encoded: String,
    hubdealtosage: {
      type: Boolean,
      default: false,
    },
    lastEmailSyncTime: {
      type: Number,
    },
    autoSyncing: {
      type: Boolean,
      default: true,
    },
    AllSyncingStatus: {
      type: Boolean,
      default: false,
    },
   
    EmailSyncingStatus: {
      type: Boolean,
      default: false,
    },
    infoobjectId: { type: String },
    dynamicsresourceurl: { type: String },
    settings: {},
    lastemailsent : { type: Date , default: Date.now()},
    lastcontactFetch:{type:Date,default:Date.now()},

    lastaccountFetch:{type:Date,default:Date.now()},
    lastProductFetch:{type:Date,default:Date.now()},
    cronSyncingBusyStatus:{type:Boolean,default:false},
    cronSyncingBusyStatusCompany:{type:Boolean,default:false},
    cronSyncingBusyStatusProduct:{type:Boolean,default:false}
  },
  { timestamps: true, versionKey: false }
);

module.exports = User = mongoose.model("User", UserSchema);
