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
  hubsagedynamicoptions,
  logs,
  HSContacts

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
      let { access_token } = await tokens.findOne({ tokenname: "TramsSessionId" });
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
              // error ? console.log("Error Occured in Cron Controller", error) : console.log(`Loop is running`, data);
            })
        });
      });

    } catch (error) {
      // return { success: false, error };
    }
  }


  async downloadContactDataNSync(user) {
    try {

      console.log("hello iam enter")
      //Remove these comments before run the whole steps AF!
      let options = { ordered: true };
      let docs = []
      let user = await userregister
        .findOne({ _id: this.user._id })
        .lean();
      console.log("***", user);
      let hoautk = await tokens.findOne({
        tokenname: "hoautk",
        user_id: user._id,
        platform: process.env.PLATFORM,
      }).lean();
      user["hoautk"] = util.decryptData(hoautk.access_token).data;
      // let lastcronrundatee = user.lastcronrundate;

      let filtercompany = {
        filterGroups: [
          {
            filters: [
              {
                value: "2023-06-06T05:34:01.212Z",
                propertyName: "lastmodifieddate",
                operator: "LTE",
              },

            ],
          },
        ],
        properties: ["lastmodifieddate", "firstname", "email"],
        limit: "100",
      };
      let searchContactinHS = await axios.post(
        process.env.HUBSPOT_API_URL + "/crm/v3/objects/contacts/search",
        filtercompany,
        {
          headers: {
            Authorization: `Bearer ${hoautk.access_token}`,
          },
        }
      );
      console.log("searchContactinHS.data", searchContactinHS.data)
      if (searchContactinHS.data &&
        searchContactinHS.data.results.length > 0
      ) {
        await asyncforEach(searchContactinHS.data.results, async (cal) => {
          console.log("cal", cal)
          let hscontactid;
          hscontactid = cal.id;
          let allprops = "";
          let companyid;
          let allcontactdata;

          let Contactmapping = await hubsagedynamicoptions.findOne({
            user_id: user._id,
            type: "contactSyncing",
          }).lean();
          if (!Contactmapping || !Contactmapping.hubSageFields)
            return {
              success: false,
              error: "Mapping fields are not defined",
            };
          await asyncforEach(Contactmapping.hubSageFields, async (mp) => {
            allprops = allprops + mp.hub + ",";
          });
          let getcontactdata = await axios.get(
            `https://api.hubapi.com/crm/v3/objects/contacts/${hscontactid}?properties=${allprops}`,
            {
              headers: {
                Authorization: `Bearer ${hoautk.access_token}`,
              },
            }
          );
          console.log("getcontactdata : ", getcontactdata.data);

          if (getcontactdata.status == 200 && getcontactdata.data && getcontactdata.data.properties
          ) {
            allcontactdata = getcontactdata.data.properties;
            let getcontactassociationwithcompany = await axios.get(
              `https://api.hubapi.com/crm/v3/objects/contacts/${hscontactid}/association/comapny`,
              {
                headers: {
                  Authorization: `Bearer ${hoautk.access_token}`,
                },
              }
            );
            if (getcontactassociationwithcompany.status == 200) {
              companyid = getcontactassociationwithcompany.data.id
            }
          }

          docs.push(allcontactdata)

        })
        var resultss = await zoho_accounts.insertMany(docs, options);
        userregister.findOneAndUpdate(
          {
            email: user.email,
          },
          {
            lastcronrundate: Date.now(),

          },
          { new: true, upsert: true },
          (err, data) => {
            if (err) throw err;
          }
        );

        //  console.log(" searchCompanyinHS.data", hscontactid)
        return


        await asyncforEach(searchContactinHS.data.results, async (cal) => {
          cal["contactid"] = cal.id;

        });

        console.log(docs);


        var resultss = await HSContacts.insertMany(docs, options);
        userregister.findOneAndUpdate(
          {
            email: user.email,
          },
          {
            lastcronrundate: Date.now(),

          },
          { new: true, upsert: true },
          (err, data) => {
            if (err) throw err;
          }
        );
      }



    }
    catch (error) {
      console.log("something went wrong", error);
    }


  }
  async downloadCompanyDataNSync(user) {
    try {
      console.log("Downloading contact data flow start")
      let options = {
        ordered: true
      };
      let docs = []
      let user = await userregister
        .findOne({
          _id: this.user._id
        })
        .lean();
      console.log("***", user);
      let hoautk = await tokens.findOne({
        tokenname: "hoautk",
        user_id: user._id,
        platform: process.env.PLATFORM,
      }).lean();
      user[
        "hoautk"
      ] = util.decryptData(hoautk.access_token).data;
      let lastcronrundatee = user.lastcompanycrondate;

      let filtercompany = {
        filterGroups: [
          {
            filters: [
              {
                value: lastcronrundatee,
                propertyName: "hs_lastmodifieddate",
                operator: "GTE",
              },
            ],
          },
        ],
        properties: [
          "hs_lastmodifieddate",
          "firstname",
          "email"
        ],
        limit: "100",
      };
      let searchCompanyinHS = await axios.post(
        process.env.HUBSPOT_API_URL + "/crm/v3/objects/companies/search",
        filtercompany,
        {
          headers: {
            Authorization: `Bearer ${hoautk.access_token
              }`,
          },
        }
      );
      console.log("searchCompanyinHS.data", searchCompanyinHS.data)
      if (searchCompanyinHS.data &&
        searchCompanyinHS.data.results.length > 0
      ) {
        await asyncforEach(searchCompanyinHS.data.results, async (cal) => {
          console.log("cal", cal)
          let hscompanyid;
          hscompanyid = cal.id;
          let allprops = "";
          let allcompanydata;

          let Companymapping = await hubsagedynamicoptions.findOne({
            user_id: user._id,
            type: "companySyncing",
          }).lean();
          if (!Companymapping || !Companymapping.hubSageFields)
            return {
              success: false,
              error: "Mapping fields are not defined",
            };
          await asyncforEach(Companymapping.hubSageFields, async (mp) => {
            allprops = allprops + mp.hub + ",";
          });
          let getcomapnydata = await axios.get(
            `https: //api.hubapi.com/crm/v3/objects/contacts/${hscompanyid}?properties=${allprops}`,
            {
              headers: {
                Authorization: `Bearer ${hoautk.access_token
                  }`,
              },
            }
          );
          console.log("getcomapnydata : ", getcomapnydata.data);

          if (getcomapnydata.status == 200 && getcomapnydata.data && getcomapnydata.data.properties
          ) {
            allcompanydata = getcomapnydata.data.properties;
          }

          docs.push(allcompanydata)
        })
        var resultss = await allhscompany.insertMany(docs, options);
        userregister.findOneAndUpdate(
          {
            email: user.email,
          },
          {
            lastcompanycrondate: Date.now(),
          },
          {
            new: true, upsert: true
          },
          (err, data) => {
            if (err) throw err;
          }
        );

      }
    }
    catch (error) {
      console.log("something went wrong", error);
    }
  }
  async contactsyncHStotrams() {
    let user = await userregister
      .findOne({ _id: this.user._id })
      .lean();
    console.log("***", user);
    let hoautk = await tokens.findOne({
      tokenname: "hoautk",
      user_id: user._id,
      platform: process.env.PLATFORM,
    }).lean();
    user["hoautk"] = util.decryptData(hoautk.access_token).data;
    let allcontactdata = await allhscompany.find({}).lean();
    let Contactmapping = await hubsagedynamicoptions.findOne({
      user_id: user._id,
      type: "companySyncing",
    }).lean();
    if (!Contactmapping || !Contactmapping.hubSageFields)
      return {
        success: false,
        error: "Mapping fields are not defined",
      };



    await asyncforEach(allcontactdata, async (contactdata) => {
      let companybody = {};
      Contactmapping.hubSageFields.map((vr) => {
        if (
          contactdata[vr.sage] &&
          vr.preference &&
          (vr.preference == "1" || vr.preference == "3")
        ) {
          companybody[vr.hub] = contactdata[vr.sage];
        }
      });

      if (companybody.tramsid) {
        //update part 
      }
      else {
        //create part
        //trams m ander contact create hoga uskki id hubspot m save krni h
      }

    })


  }






}



module.exports = CronController;


