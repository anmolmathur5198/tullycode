const express = require("express");
const usercontroller = require("../controller/UserController");
const authcontroller = require("../controller/AuthenticationController");
const TullyTramsController = new (require("../controller/TullyTramsController"))();
const auth = require("../middleware/auth");
const router = express.Router();
//route operations
router.get("/user-enroll", (req, res) => res.render("UserEnroll"));
router.get("/", (req, res) => res.redirect("/login"));
router.get("/register", (req, res) => res.render("register"));
router.get("/login", (req, res) => res.render("login"));
router.get("/account_details", auth.refreshTokens, authcontroller.getHubSpotAccountDetails);
router.get("/forgot-password", (req, res) => res.render("forgot-password"));
router.post("/register", usercontroller.registerUserController);
router.post("/login", usercontroller.loginUserController);
router.post("/api/user/change-password", auth.verifyUserbyhvrif, usercontroller.changePassword);
router.post("/api/user/forgot-password", usercontroller.forgotPassword);
router.post("/api/user/reset-password", usercontroller.resetpassword);
router.get("/reset-password/:token", usercontroller.checkresetpassword);
router.post("/api/user/email-settings", auth.verifyUserbyhvrif, usercontroller.EmailSettings);
router.post("/api/user/manage-services", auth.verifyUserbyhvrif, usercontroller.manageServices);
router.post("/logsdata", usercontroller.logsdata);
router.get("/logs", auth.refreshTokens, usercontroller.getLogs);
router.get("/populateData", auth.refreshTokens, usercontroller.serversidelogs);
router.get("/appdashboard", auth.refreshTokens, usercontroller.appdashboard);



// custome object mapping dashboard showing code
router.get("/contact", auth.refreshTokens, TullyTramsController.ProfileMappingdashboard);
router.get("/custom_obj_comm",auth.refreshTokens, TullyTramsController.commCustomObjectMappingDashboard)
router.get("/custom_obj_address",auth.refreshTokens, TullyTramsController.addressCustomObjectMappingDashboard)
router.get("/custom_obj_card",auth.refreshTokens, TullyTramsController.cardCustomObjectMappingDashboard)



// for saving respective mapping dashboard
router.post("/saveProfileMapping", auth.verifyUserbyhvrif, TullyTramsController.saveProfileMapping);
router.post("/saveCommMappingFields", auth.verifyUserbyhvrif, TullyTramsController.saveCommMappingFields);
router.post("/saveAddressMappingFields", auth.verifyUserbyhvrif, TullyTramsController.saveAddressMappingFields);
router.post("/saveCardMappingFields", auth.verifyUserbyhvrif, TullyTramsController.saveCardMappingFields);


router.get("/SyncTramProfileToHubspot",TullyTramsController.SyncTramProfileToHubspot);
router.post("/getDatafromWebhook_Hubspot", TullyTramsController.getContactFromHubSpotThroughWebhook)
router.get("*", (req, res) => {
  return res.status(404).send({ success: false, error: "NO Route Found" });
});

module.exports = router;
