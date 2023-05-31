const mongoose = require("mongoose");

const TokenScehma = new mongoose.Schema(
  {
    tokenname: {
      type: String,
      required: true,
    },
    platform: String,
    user_id: {
      type: mongoose.Types.ObjectId,
    },
    access_token: {
      type: String,
      required: true,
    },
    // Default is 300
    access_token_expire_in: {
      type: Number,
    },
    refresh_token: {
      type: String,
      required: true,
    },
    // Default is 2678400
    refresh_token_expire_in: {
      type: Number,
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    id_token : {
      type : String
    },
    api_domain :{
      type : String
    }
  },
  { timestamps: true, versionKey: false }
);
// TokenScehma.index({ tokenname: 1, user_id: 1, platform: 1 }, { unique: true });
module.exports = Tokens = mongoose.model("Tokens", TokenScehma);
