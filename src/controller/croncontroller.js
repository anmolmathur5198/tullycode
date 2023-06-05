const qs = require("qs");
var mongoose = require("mongoose");
const converter = require("json-2-csv");
const fs = require("fs");
path = require("path");
const axios = require("axios");
const moment = require("moment");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nodemailer = require("nodemailer");
const { encryptData, decryptData, isTokenExpired } = require("../utils/util");
var rate = 2000;
var throttle = require("promise-ratelimit")(rate);
const {
  tokens,
  userregister,
  logs,

} = require("../models");


async function asyncforEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

class CronController {
  constructor(user) {
    this.user = user;
  }
  async refreshHubSpotToken(requser) {
    try {
      console.log("Refreshing HubSpot Token for user", requser);
      let user = requser;
      if (user && user.email) {
        let getUser = await userregister.findOne({ email: user.email });
        if (!getUser) {
          return { success: false, error: "Authentication Failed", };
        }
      } else {
        return {
          success: false,
          error: "Authentication Failed",
        };
      }

      let hoautk = await tokens.findOne({
        tokenname: "hoautk",
        user_id: user._id,
        platform: process.env.PLATFORM,
      });
      if (hoautk) {
        let isExpired = isTokenExpired(hoautk);
        if (isExpired) {
          if (hoautk) {
            var data = qs.stringify({
              client_id: process.env.HUBSPOT_CLIENT_ID,
              client_secret: process.env.HUBSPOT_CLIENT_SECRET,
              grant_type: "refresh_token",
              refresh_token: hoautk.refresh_token,
            });
            var config = {
              method: "post",
              url: "https://api.hubapi.com/oauth/v1/token",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              data: data,
            };

            const result = await axios(config);
            console.log(">>>>>>>>cvzxcvzcvzcvzcvzcvzxcv result", result)
            if (result.data && result.data.access_token) {
              tokens.findOneAndUpdate(
                {
                  tokenname: "hoautk",
                  user_id: user._id,
                  platform: process.env.PLATFORM,
                },
                {
                  tokenname: "hoautk",
                  user_id: user._id,
                  platform: process.env.PLATFORM,
                  access_token: result.data.access_token,
                  refresh_token: result.data.refresh_token,

                  access_token_expire_in: result.data.expires_in,
                  refresh_token_expire_in: result.data.expires_in,
                },
                { new: true, upsert: true },
                (err, data) => {
                  if (err) throw { success: false, error: err };
                  // console.log({ token: data });
                  // console.log({ htoken: result.data });
                  // console.log("HubSpot Token Refreshed");
                }
              );
              console.log("token good")
              return { success: true, data: result.data };
            }
          } else {
            return { success: false, error: "HubSpot Token Not Verified" };
          }
        } else {
          return { success: true, data: "Not Expired Token Working" };
        }
      } else {
        return {
          success: false,
          error: "Hoautk not defined",
        };
      }
    } catch (error) {
      return { success: false, error };
    }
  }

  async addTramsProfile(requser) {
    try {
      let { access_token } = await Tokens.findOne({ tokenname: "TramsSessionId" });
      let data = JSON.stringify({
        "SessionID": access_token,
        "params": {
          "modifyDateFrom": "2022-06-03T09:27:40.009Z",
          "SortBy": [
            "profileNo"
          ],
          "includeCols": [
            "profileNo"
          ]
        },
        "noMetaData": true
      });

      let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://tlt-dev01:8085/profilequery.runquery',
        headers: {
          'Content-Type': 'application/json'
        },
        data: data
      };

      axios.request(config).then((response) => {
        // let allProfiles = response.data.result.dataset.data.profileQuery;
        // console.log("Trams Profile Data Count>>", allProfiles);
        let allProfiles = [
          {
            "profileNo": 90
          },
          {
            "profileNo": 111
          },
          {
            "profileNo": 178
          },
          {
            "profileNo": 182
          },
          {
            "profileNo": 247
          }]

        allProfiles.forEach(element => {
          TramsProfile.findOneAndUpdate({ profileNo: element.profileNo }, { profileNo: element.profileNo },
            { new: true, upsert: true }, function (error, data) {
              error ? console.log("Error Occured in Cron Controller", error) : console.log(`Loop is running`, data);
            })
        });
      });

    } catch (error) {
      return { success: false, error };
    }
  }
}



module.exports = CronController;


