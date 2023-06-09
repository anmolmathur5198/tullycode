const express = require("express");
const authcontroller = require("../../controller/AuthenticationController");
const auth = require("../../middleware/auth");
const router = express.Router();

router.get("/auth/hubspot", authcontroller.hubspotAuthenticationApp);
router.get("/account_details", auth.refreshTokens, authcontroller.getHubSpotAccountDetails);
router.get("/auth/hubspot/callback", authcontroller.hubspotauthcallback);

router.get("*", (req, res) => {
  return res.status(404).send({ success: false, error: "Noo Route Found" });
});

module.exports = router;
