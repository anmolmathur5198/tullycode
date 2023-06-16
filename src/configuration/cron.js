var CronJob = require("cron").CronJob;
const croncontroller = require("../controller/croncontroller");
const { userregister} = require("../models");
const axios = require("axios");
const Tokens = require("../models/tokens")
 
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
  new CronJob("*/7 * * * *", async () => {
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

 
  // cron for download trams profile
  new CronJob( "29 16 12 * *", async function () 
  {
    let users = await userregister.find().lean();
    if (users.length > 0) {
      for (const user of users) {
        let cron = new croncontroller(user);
        cron.downloadTramsProfiles(user).then((result) => {
          console.log(`Profile Run Query  Saving in DB Tram`)
        });
      }
    }
  }).start();


  // code for syncing tram to hs (contact)
  // new CronJob("*/20 * * * * *", async function () {
  //   let cron = new croncontroller();
  //   let users = await userregister.find().lean();
  //   if (users.length > 0){
  //     for (const user of users) {
  //       cron.tramstoHScontact(user).then((results) => {
  //         console.log("Result After Running Cron for Trams Card Integration Flow");
  //       }).catch((error) => {
  //         console.log("Error Occured", error)
  //       })
  //     }
  //   }
  // }).start()

  // // code for syncing tram to hs (card)
  // new CronJob("*/20 * * * * *", async function () {
  //   let cron = new croncontroller();
  //   let users = await userregister.find().lean();
  //   if (users.length > 0) {
  //     for (const user of users) {
  //       cron.createCard(user).then((results) => {
  //         console.log("Result After Running Cron for Trams Card Integration Flow");
  //       }).catch((error) => {
  //         console.log("Error Occured", error)
  //       })
  //     }
  //   }
  // }).start()

  // // code for syncing tram to hs (address)
  // new CronJob("*/30 * * * * *", async function () {
  //   let cron = new croncontroller();
  //   let users = await userregister.find().lean();
  //   if (users.length > 0) {
  //     for (const user of users) {
  //       cron.createAddress(user).then((results) => {
  //         console.log("Result After Running Cron for Trams Card Integration Flow");
  //       }).catch((error) => {
  //         console.log("Error Occured", error)
  //       })
  //     }
  //   }
  // }).start()


  // ---------------------------------------// HS to Trams Flow 

    new CronJob("*/20 * * * * *", async function () {
    let cron = new croncontroller();
    let users = await userregister.find({}).lean();

    if (users && users.length > 0) {
      for (const user of users) {
        cron.downloadHSContactNSyncToTrams(user).then((results) => {
          console.log("Result After Running Cron for Trams Card Integration Flow");
        }).catch((error) => {
          console.log("Error Occured", error);
        })
      }
    }
  }).start()
};




