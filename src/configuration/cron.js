var CronJob = require("cron").CronJob;
const croncontroller = require("../controller/croncontroller");

const { userregister } = require("../models");
const later = require("later");
const moment = require("moment");

exports.runCron = () => {
  var job = new CronJob(
    "*/1 * * * *",
    
 async function () {
  console.log("working in one minus")
      let users = await userregister.find().lean();
      console.log("these are the users",users)

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


};
