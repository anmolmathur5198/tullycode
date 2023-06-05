const mongoose = require("mongoose");

const TramsProfileSchema = new mongoose.Schema(
  {
    profileNo: {
      type: Number,
      required: true,
    }
  },
  { timestamps: true, versionKey: false }
);
// TokenScehma.index({ tokenname: 1, user_id: 1, platform: 1 }, { unique: true });
module.exports = TramsProfile = mongoose.model("tramsProfile", TramsProfileSchema);
