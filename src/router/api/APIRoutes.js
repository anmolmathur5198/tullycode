const express = require("express");
const authcontroller = require("../../controller/AuthenticationController");
const auth = require("../../middleware/auth");
const router = express.Router();

router.get("/auth/hubspot", authcontroller.hubspotAuthenticationApp);
router.get("/account_details", auth.refreshTokens, authcontroller.getHubSpotAccountDetails);
router.get("/auth/hubspot/callback", authcontroller.hubspotauthcallback);

router.get("*", (req, res) => {
<<<<<<< HEAD
  return res.status(404).send({ success: false, error: "NO Route Found" });
});
=======
  return res.status(404).send({ success: false, error: "NOo Route Found" });
});

>>>>>>> e1913ad32566aeb1b70775355419c791734e9e76
module.exports = router;
