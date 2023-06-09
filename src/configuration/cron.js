var CronJob = require("cron").CronJob;
const croncontroller = require("../controller/croncontroller");

const { userregister, TramsProfile } = require("../models");
const later = require("later");
const axios = require("axios");
const moment = require("moment");
const Tokens = require("../models/tokens")
// 00 12 * * *
// */5 * * * * // hs refresh token time 
exports.runCron = () => {

  // cron code for refresh hubspot Token
  new CronJob("*/5 * * * *", async function () {
    let users = await userregister.find().lean();
    if (users.length > 0) {
      for (const user of users) {
        let cron = new croncontroller(user);
        cron.refreshHubSpotToken(user).then((result) => {
          if (result.success) {
            console.log(
              ` HubSpot Tokens Refreshed by Cron for  ${user.email}`
            );
          } else {
            console.log(` HubSpot Token not Refreshed for  ${user.email}`);
          }
        });
      }
    }
  }).start();

  // cron code for refresh trams session access token 
  new CronJob("*/10 * * * * ", async () => {
    try {
      const body = {
        "username": process.env.USER_NAME,
        "password": process.env.PASSWORD,
        "alias": process.env.ALIAS,
        "appType": process.env.APP_TYPE,
        "accessKey": process.env.ACCESS_KEY
      }
      const { data } = await axios.get("http://tlt-dev01:8085/login", { params: body }, { 'headers': { "Content-Type": "application/json" } })
      const SessionID = data.result.SessionID;
      const user_id = "648180ab643b4c166853eaa2"
      const response = await Tokens.findOneAndUpdate({ tokenname: "TramsSessionId" }, { $set: { tokenname: "TramsSessionId", platform: "tully", user_id, access_token: SessionID } }, { upsert: true });
      console.log("Token Updated in MongoDB, Token's Table:- ", response);
    }
    catch (error) {
      console.log("catch block executed", error);
    }
  }).start();


  // nischay code for hubspot to trams
  // new CronJob("*/1 * * * *",  async function () {
  //   let users = await userregister.find().lean();
  //   if (users.length > 0) {
  //     for (const user of users) {
  //       let cron = new croncontroller(user);
  //       cron.downloadContactDataNSync(user).then((result) => {
  //         console.log(`Success - Download Accounts to sync for  ${user.email}`);
  //       //   cron.downloadzohoContactsData(user).then((result) => {
  //       //     console.log(`Success - Download Contacts to sync for  ${user.email}`)
  //       //   });
  //       });
  //     }
  //   }
  // }).start();

  // cron code that will download tech profile query into our mongodb from trams
  // new CronJob("*/15 * * * * *", async function () {
  //   let users = await userregister.find().lean();
  //   if (users.length > 0) {
  //     for (const user of users) {
  //       let cron = new croncontroller(user);
  //       cron.downloadTramsProfiles(user).then((result) => {
  //         console.log(`Profile Run Query  Saving in DB Tram`)
  //       });
  //     }
  //   }
  // }).start();

  // // // cron code that sync trams profile data into hubspot
  // new CronJob("*/15 * * * * * ", async function () {
  //   let cron = new croncontroller();
  //   let users = await userregister.find().lean();
  //   if (users.length > 0) {
  //     for (const user of users) {
  //       cron.TramstoHScontact(user).then((results) => {
  //         console.log("Result After Running Cron for Trams Profile Data add")
  //       }).catch((error) => {
  //         console.log("Error Occured", error)
  //       })
  //     }
  //   }
  // }).start()

};




