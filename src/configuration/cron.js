var CronJob = require("cron").CronJob;
const croncontroller = require("../controller/croncontroller");

const { userregister, TramsProfile } = require("../models");
const later = require("later");
const axios = require("axios");
const moment = require("moment");
const Tokens = require("../models/tokens");
const CronController = require("../controller/croncontroller");


exports.runCron = () => {

  var job = new CronJob(
    "*/3600000 * * * *",

    async function () {
      console.log("working in one minus")
      let users = await userregister.find().lean();
      console.log("these are the users", users)

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


  //nischay cron function for refresh the tram session id 
  new CronJob("* */5 * * *", async () => {
    // try {
    //   const body = {
    //     "username": process.env.USER_NAME,
    //     "password": process.env.PASSWORD,
    //     "alias": process.env.ALIAS,
    //     "appType": process.env.APP_TYPE,
    //     "accessKey": process.env.ACCESS_KEY
    //   }
    //   const { data } = await axios.get("http://tlt-dev01:8085/login", { params: body }, { 'headers': { "Content-Type": "application/json" } })
    //   const SessionID = data.result.SessionID;
    //   const user_id = "647895d5cd993b211c19615d"
    //   const response = await Tokens.findOneAndUpdate({ tokenname: "TramsSessionId" }, { $set: { tokenname: "TramsSessionId", platform: "tully", user_id, access_token: SessionID } }, { upsert: true });
    //   console.log("Token Updated in MongoDB, Token's Table:- ", response);
    // }
    // catch (error) {
    //   console.log("catch block executed", error);
    // }

  }).start();


  // yogesh nischay code for fetchign the 
  new CronJob("*/60 * * * * *",
    async function () {
      let cron = new croncontroller();
      cron.addTramsProfile().then((results) => {
        // console.log(results)
      }).catch((error) => {
        // console.log("found error", error)
      })
    }).start()




  // downloadContactDataNSync this cron function is mainly used for download the contact from hubspot and sync the data into trams profile

  // new CronJob("*/20 * * * * *", async () => {
  //   let cron = new CronController();
  //   cron.downloadCompanyDataNSync().then(res => {
  //     console.log("Cron run successfully", res);
  //   }).catch(err => {
  //     console.log("Something wrong! ", err);
  //   })
  // }
  // ).start();




};
