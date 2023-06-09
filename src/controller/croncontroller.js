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
const strings = require("../configuration/variables")
const util = require("../utils/util")
const { tokens, userregister, TramsProfile, logs, hubsagedynamicoptions } = require("../models");
const { token } = require("chargebee/lib/resources/api_endpoints");
const { CLIENT_RENEG_LIMIT } = require("tls");

const Logs = require("../models/logs")


async function asyncforEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

class CronController {
  constructor(user) {
    this.user = user;
  }


  // code for refresh hubspot token
  async refreshHubSpotToken(requser) {
    try {
      //  console.log("Refreshing HubSpot Token for user", requser);
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
            // console.log(">>>>>>>>cvzxcvzcvzcvzcvzcvzxcv result", result)
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
              //   console.log("token good")
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



  // code for download fetech tram profile data only profile no data 
  async downloadTramsProfiles(requser) {
    try {
      let { lastcontactFetch } = requser;
      let tokendata = await tokens.findOne({ tokenname: "TramsSessionId" }).lean();
      let data = JSON.stringify({
        "SessionID": tokendata.access_token,
        "params": {
          "modifyDateFrom": lastcontactFetch.toISOString(),
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
        url: "http://tlt-dev01:8085/profilequery.runquery",
        headers: {
          'Content-Type': process.env.APPLICATION_JSON
        },
        data: data
      };

      await axios.request(config).then(async (response) => {
        let allProfiles = response.data.result.dataset.data.profileQuery;
        console.log("trams profile length", allProfiles.length);


        allProfiles.forEach(async (element) => {
          await TramsProfile.findOneAndUpdate({ profileNo: element.profileNo },
            { profileNo: element.profileNo, pending: true },
            { new: true, upsert: true },
            function (error, data) {
              if (error) {
                console.log("Error Occured in Cron Controller", error)
                logme({
                  user: requser,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Error",
                  type: `Error Trams profile downloaded/feteced in mongodb failed at ${lastcontactFetch.toISOString()}`,
                  message: `ErrorTrams profile downloaded/feteced in mongod failed`,
                  source: new Error(error ? JSON.stringify(error) : error
                  ).stack.toString(),
                });
              } else {
                logme({
                  user: requser,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Success",
                  type: `Trams profile downloaded in mongodb success at ${lastcontactFetch.toISOString()} `,
                  message: `Trams profile downloaded/feteced in mongod success`,
                  source: "",
                });
              }
            }).lean();
        })

        // update last contact fetch field in mongo for user
        await userregister.findOneAndUpdate({ email: requser.email },
          { lastcontactFetch: new Date().toISOString() },
          { new: true, upsert: true }, function (error, data) {
            if (error) {
              console.log("Error Occured in Updating user last contact fetch field in mongo", error);
              logme({
                user: requser,
                from: "Trams",
                to: "HubSpot",
                status: "Error",
                type: `Error while updating user DB last contact feted  field at ${lastcontactFetch.toISOString()}`,
                message: `Error user last contact fetch field is not updating error`,
                source: new Error(error ? JSON.stringify(error) : error
                ).stack.toString(),
              });
            } else {
              logme({
                user: requser,
                from: "Trams",
                to: "MongoDB",
                status: "Success",
                type: `user DB last contact fetch field is  updated successfully at ${lastcontactFetch.toISOString()}`,
                message: `user last contact fetch field is update successfully`,
                source: "",
              });
            }
          }).lean();
      })
    }
    catch (error) {
      console.log(error)
      logme({
        user: requser,
        from: "Trams",
        to: "MongoDB",
        status: "Error",
        type: `Error in Downloading Trams Profile`,
        message:`Error in Downloading/Feteching Trams Profile in DB at ${Date.now().toString()}`,
        source: new Error(error ? JSON.stringify(error) : error).stack.toString(),
      })
      return { success: false, error };
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

  ////Contact syncing flow Trams to HS
  async TramstoHScontact(user) {
    console.log("start contact syncing flow trams to hs")
    let hoautk = await tokens.findOne({
      tokenname: "hoautk",
      user_id: user._id,
      platform: process.env.PLATFORM,
    }).lean();
    user["hoautk"] = hoautk.access_token;
    // find tram session id 
    let tramsSessionData = await tokens.findOne({ tokenname: "TramsSessionId" });
    let tramSessionID = tramsSessionData.access_token
    try {
      let allContactData = await TramsProfile.find({ "pending": true }).limit(1).lean()
      let contactMapping = await hubsagedynamicoptions.findOne({ type: "contactSyncing" }).lean();
      // let commMapping = await hubsagedynamicoptions.findOne({type:"commSyncing"}).lean();
      let cardMapping = await hubsagedynamicoptions.findOne({ type: "cardSyncing" }).lean();
      let addressMapping = await hubsagedynamicoptions.findOne({ type: "addressSyncing" }).lean();
      // let addressInstanceMapping = await hubsagedynamicoptions.findOne({type:"addressInstanceSyncing"}).lean();
      // let passengerMapping = await hubsagedynamicoptions.findOne({type:"passengerSyncing"}).lean();
      // let passengerCommMapping = await hubsagedynamicoptions.findOne({type:"passengerCommSyncing"}).lean();

      if ((!contactMapping || !contactMapping.hubSageFields) && (!addressMapping || !addressMapping.hubSageFields) &&
        (!cardMapping || !cardMapping.hubSageFields))
        return {
          success: false,
          error: "Mapping fields are not defined",
        };

      await asyncforEach(allContactData, async (cp, key) => {
        let tram_profile_data = JSON.stringify({
          "SessionID": tramSessionID,
          "recNo": cp.profileNo,
          "noMetaData": true
        });

        let tramProfleConfig = {
          method: 'get',
          maxBodyLength: Infinity,
          url: `${process.env.LOAD_TRAMS_PROFILE_DATA_API_URL}`,
          headers: {
            'Content-Type': 'application/json'
          },
          data: tram_profile_data
        };


        await axios.request(tramProfleConfig).then(async (response) => {
          let tramsProfileData = response.data.result.dataset.data.profile;
          let ContactBodyHS = {};
          let CardBodyHS = {};
          let AddressBodyHS = {};
          let hscontactid;
          // contact mapping 
          contactMapping.hubSageFields.map((vr) => {
            ContactBodyHS[vr.hub] = tramsProfileData[0][vr.sage]
            // if (tramsProfileData[0][vr.sage] && vr.preference &&
            //   (vr.preference == "1" || vr.preference == "1")) {
            //   ContactBodyHS[vr.hub] = tramsProfileData[0][vr.sage]
            // }
          });

          // card mapping
          let cardBodyHSArray = [];

          if (tramsProfileData[0].card) {
            if (tramsProfileData[0].card.length > 1) {
              tramsProfileData[0].card.map((data, index) => {
                cardMapping.hubSageFields.map((vr) => {
                  CardBodyHS[vr.hub] = data[vr.sage]
                });
              })
              cardBodyHSArray.push(CardBodyHS)
            } else {
              cardMapping.hubSageFields.map((vr) => {
                CardBodyHS[vr.hub] = tramsProfileData[0].card[0][vr.sage]
              });
              cardBodyHSArray.push(CardBodyHS)
            }
          } else {
            console.log("Card property not found")
          }

          // address body mapping
          let addressBodyHSArray = [];
          if (tramsProfileData[0].address) {
            if (tramsProfileData[0].address.length > 1) {
              tramsProfileData[0].address.map((data, index) => {
                addressMapping.hubSageFields.map((vr) => {
                  AddressBodyHS[vr.hub] = data[vr.sage]
                });
              })
              addressBodyHSArray.push(AddressBodyHS)
            } else {
              addressMapping.hubSageFields.map((vr) => {
                AddressBodyHS[vr.hub] = tramsProfileData[0].address[0][vr.sage]
              });
              addressBodyHSArray.push(AddressBodyHS)
            }
          } else {
            console.log("Address property not found")
          }
          ContactBodyHS.referred_by = "Business Development";
          let filter_contact_body = {
            filterGroups: [
              {
                filters: [
                  {
                    value: cp.profileNo,
                    propertyName: "profile_number",
                    operator: "EQ",
                  },
                ],
              },
            ],
            properties: ["profile_number"]
          };





          // address custom object data 
          let SearchContact = await axios.post(`
            https://api.hubapi.com/crm/v3/objects/contacts/search`,
            filter_contact_body, {
            headers: {
              Authorization: `Bearer ${hoautk.access_token}`,
            },
          });

          //  console.log("SearchContact",SearchContact.status,SearchContact.data)
          //  return
          if (SearchContact.data && SearchContact.data.results.length > 0) {
            hscontactid = SearchContact.data.results[0].properties.hs_object_id;
          }

          if (hscontactid) {
            let updatecontact = await axios.patch(`${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts/${hscontactid}`,
              { properties: ContactBodyHS },
              {
                headers: {
                  Authorization: `Bearer ${hoautk.access_token}`,
                },
              });

            if (updatecontact.status == 200) {
              logme({
                user: user,
                from: "Trams",
                to: "HubSpot",
                status: "Success",
                type: "Contact Updated Success",
                message: `Contact id:${hscontactid}  Updated in HubSpot successfully`,
                source: "",
              });

              // when contact update also update the status
              await TramsProfile.findOneAndUpdate({ profileNo: ContactBodyHS.profile_number },
                {
                  updatedAt: Date.now(), pending: false
                },
                { new: false, upsert: true }, (err, data) => {
                  if (err) {
                    console.log("Error While Updating Status", error)
                    logme({
                      user: user,
                      from: "Trams",
                      to: "HubSpot",
                      status: "Error",
                      type: "Error While Updating Contact Status",
                      message: `Error While Updating contact status`,
                      source: new Error(err ? JSON.stringify(err) : err).stack.toString(),
                    });
                  } else {
                    logme({
                      user: user,
                      from: "Trams",
                      to: "HubSpot",
                      status: "Success",
                      type: "Contact Updated Success",
                      message: `Contact Updated in HubSpot successfully`,
                      source: "",
                    });
                    console.log("Contact Pending Status Updated", data)
                  }
                }).lean();
            } else {
              logme({
                user,
                from: "Trams",
                to: "HubSpot",
                status: "Error",
                type: "Error in Contact Update",
                message: `Error in Contact update flow`,
                source: ""
              });
            }

          } else {
            // create new contact
            let createnewcontact = await axios.post(
              `${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts`,
              { properties: ContactBodyHS },
              {
                headers:{
                  Authorization: "Bearer " + user.hoautk,
                },
              });
            console.log("createnewcontact", createnewcontact.data)
            //save log for  contact created
            logme({
              user: user,
              from: "Trams",
              to: "HubSpot",
              status: "Success",
              type: "Contact Created Success",
              message: `Contact id:${hscontactid} Created in HubSpot Successfully`,
              source: "",
            });
            hscontactid = createnewcontact.data.properties.hs_object_id




            // insert card
            cardBodyHSArray.map(async (data, index) => {
              let created_card_element_id
              let createCardElement = await axios.post(
                `${process.env.HUBSPOT_API_URL}/crm/v3/objects/cards`,
                { properties: data },
                {
                  headers: { Authorization: "Bearer " + user.hoautk, },
                });
              created_card_element_id = createCardElement.data.id;
              if(created_card_element_id){
                logme({
                  user: user,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Success",
                  type: "Card Created Success",
                  message: `Card Created in HubSpot Successfully`,
                  source: "",
                });
              }
              let association_data = await axios.put(
                `${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts/${hscontactid}/associations/cards/${created_card_element_id}/card_to_contact`,
                {},
                {
                  headers: {
                    Authorization: "Bearer " + user.hoautk,
                  },
              })
              console.log(" Card Association created successfully", association_data.data)
            })




            // address loop for inserting address data 
            addressBodyHSArray && addressBodyHSArray.map(async (data, index) => {
              let created_address_element_id
              data.address_name === undefined ? data.address_name = "Blank" :
                data.address_name === "undefined" ? data.address_name = "Blank" : "Blank"
              let createAddressElement = await axios.post(
                `${process.env.HUBSPOT_API_URL}/crm/v3/objects/addresses`,
                { properties: data },
                {
                  headers: {
                    Authorization: "Bearer " + user.hoautk,
                  },
                });
              created_address_element_id = createAddressElement.data.id
              if(created_address_element_id){
                logme({
                  user: user,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Success",
                  type: "Address Created Success",
                  message: `Address Created in HubSpot Successfully`,
                  source: "",
                });
              }

              let association_data = await axios.put(
                `${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts/${hscontactid}/associations/addresses/${created_address_element_id}/address_to_contact`,
                {},
                {
                  headers: {
                    Authorization: "Bearer " + user.hoautk,
                  },
                })
              console.log("Address Association created successfully", association_data.data)

            })
            if (createnewcontact.status == 201) {
              logme({
                user,
                from: "Trams",
                to: "HubSpot",
                status: "Success",
                type: "Contact crate flow",
                message: `Contact id:${createnewcontact.data.properties.hs_object_id} Contact create in HubSpot successfully`,
                source: "",
              });
              // update trams profile pending to false
              await TramsProfile.findOneAndUpdate({ profileNo: ContactBodyHS.profile_number },
                {
                  updatedAt: Date.now(),
                  pending: true
                },
                { new: false, upsert: true }, (error, data) => {
                  if (error) {
                    logme({
                      user: user,
                      from: "Trams",
                      to: "HubSpot",
                      status: "Error",
                      type: "Error While Updating Status",
                      message: `Error While Updating User Pending Status`,
                      source:"",
                    });
                    console.log("error in updating status", error)
                  } else {
                    logme({
                      user: user,
                      from: "Trams",
                      to: "HubSpot",
                      status: "Success",
                      type: "User Pending Status Updated Successfully",
                      message: `User Pending Status Updated Successfully`,
                      source: "",
                    });
                    
                  }
                }
              );

            }
            else {
              logme({
                user,
                from: "Trams",
                to: "HubSpot",
                status: "Error",
                type: "Contact flow integration ",
                message: `Error in contact create  Flow  `,
                source:""
              });
            }
          }
        })
      })
    } catch (error) {
      console.log("error", error)
      logme({
        user,
        from: "Trams",
        to: "HubSpot",
        status: "Error",
        type: "Error in contact syncing flow",
        message: `Error in contact syncing flow`,
        source: new Error(
          error.response ? JSON.stringify(error.response.data) : error
        ).stack.toString()

      });
    }
  }
}



module.exports = CronController;


