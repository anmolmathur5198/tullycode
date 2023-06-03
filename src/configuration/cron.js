var CronJob = require("cron").CronJob;
const { default: axios } = require("axios");
const croncontroller = require("../controller/croncontroller");
const { userregister } = require("../models");
const later = require("later");
const moment = require("moment");
const Tokens = require("../models/tokens");
exports.runCron = () => {
  var job = new CronJob(
    "*/6 * * * *",
    async function () {


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

          cron.refreshZohoToken(user).then((result) => {
            if (result.success) {
              console.log(
                ` Zoho Tokens Refreshed by Cron for  ${user.email}`
              );
            } else {
              console.log(` Zoho Token not Refreshed for  ${user.email}`);
            }
          });

        }
      }

    },
    null,
    true
  );
  job.start();


  new CronJob(
    "* * * * *",
    async function () {
      let users = await userregister.find().lean();

      if (users.length > 0) {
        for (const user of users) {
          let cron = new croncontroller(user);
          // cron.downloadzohoAccountsData(user).then((result) => {
          //   console.log(`Success - Download Accounts to sync for  ${user.email}`);
          //   cron.downloadzohoContactsData(user).then((result) => {
          //     console.log(`Success - Download Contacts to sync for  ${user.email}`)
          //   });
          // });
        }
      }
    },
    null,
    true
  ).start();


  new CronJob(
    "*/1 * * * *",
    async function () {
      let users = await userregister.find().lean();

      if (users.length > 0) {
        for (const user of users) {
          let cron = new croncontroller(user);
          // cron.downloadzohoProductsData(user).then((result) => {
          //   console.log(`Success - Download products to sync for  ${user.email}`);

          // });
        }
      }
    },
    null,
    true
  ).start();

  new CronJob(
    "*/5 * * * *",
    async function () {
      let users = await userregister.find().lean();

      if (users.length > 0) {
        for (const user of users) {
          let cron = new croncontroller(user);

          // cron.syncZohoAccounts(user).then(async (result) => {
          //   console.log(`Success - Syncing Accounts to sync for  ${user.email}`);
          //   await userregister.updateOne({ _id: user._id }, { cronSyncingBusyStatusCompany: false });



          // });

          // cron.syncZohoContacts(user).then(async (result) => {
          //   console.log(`Success - Syncing Contacts   ${user.email}`);
          //   await userregister.updateOne({ _id: user._id }, { cronSyncingBusyStatus: false });

          // });



        }
      }
    },
    null,
    true
  ).start();


  new CronJob(
    "*/59 * * * *",
    async function () {
      let users = await userregister.find().lean();

      if (users.length > 0) {
        for (const user of users) {
          let cron = new croncontroller(user);



          // cron.syncZohoProducts(user).then(async (result) => {
          //   console.log(`Success - product sync to sync for  ${user.email}`);

          //   await userregister.updateOne({ _id: user._id }, { cronSyncingBusyStatusProduct: false });



          // });

        }
      }
    },
    null,
    true
  ).start();

  //  This cron is used for refresh the sessionId  which returns by the trams server of login API we have to store this sessionId into MongoDB for future reference. (Nischay Jain)
  new CronJob("* */5 * * *", async () => {
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
      const user_id = "647895e3c475dfb6a1049628"
      const response = await Tokens.findOneAndUpdate({ tokenname: "TramsSessionId" }, { $set: { tokenname: "TramsSessionId", platform: "tully", user_id, access_token: SessionID } }, { upsert: true });
      console.log("Token Updated in MongoDB, Token's Table:- ", response);
    }
    catch (error) {
      console.log("catch block executed", error);
    }

  }).start();

};
