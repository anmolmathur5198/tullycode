const qs = require("qs");
var mongoose = require("mongoose");
const converter = require("json-2-csv");
const fs = require("fs");
path = require("path");
const axios = require("axios");
const { encryptData, decryptData, isTokenExpired } = require("../utils/util");
var rate = 2000;
const util = require("../utils/util")
const { tokens, userregister, TramsProfile, HSContactRecord, logs, hubsagedynamicoptions } = require("../models");

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

        if (allProfiles.length > 0) {
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
                    message: `Trams profile download successfully`,
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
        }
        else {
          logme({
            user: requser,
            from: "Trams",
            to: "MongoDB",
            status: "Error",
            type: `Error trams profile downloading flow `,
            message: `Error in trams profile data not found this date ${lastcontactFetch.toISOString()}`,
            source: new Error(error ? JSON.stringify(error) : error).stack.toString(),
          })
        }

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
        message: `Error in Downloading/Feteching Trams Profile in DB at ${Date.now().toString()}`,
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
  // async TramstoHScontact(user) {
  //   console.log("start contact syncing flow trams to hs")
  //   let hoautk = await tokens.findOne({
  //     tokenname: "hoautk",
  //     user_id: user._id,
  //     platform: process.env.PLATFORM,
  //   }).lean();
  //   user["hoautk"] = hoautk.access_token;
  //   // find tram session id 
  //   let tramsSessionData = await tokens.findOne({ tokenname: "TramsSessionId" });
  //   let tramSessionID = tramsSessionData.access_token
  //   try {
  //     let allContactData = await TramsProfile.find({ "pending": true }).limit(1).lean()
  //     let contactMapping = await hubsagedynamicoptions.findOne({ type: "contactSyncing" }).lean();
  //     // let commMapping = await hubsagedynamicoptions.findOne({type:"commSyncing"}).lean();
  //     let cardMapping = await hubsagedynamicoptions.findOne({ type: "cardSyncing" }).lean();
  //     let addressMapping = await hubsagedynamicoptions.findOne({ type: "addressSyncing" }).lean();
  //     // let addressInstanceMapping = await hubsagedynamicoptions.findOne({type:"addressInstanceSyncing"}).lean();
  //     // let passengerMapping = await hubsagedynamicoptions.findOne({type:"passengerSyncing"}).lean();
  //     // let passengerCommMapping = await hubsagedynamicoptions.findOne({type:"passengerCommSyncing"}).lean();

  //     if ((!contactMapping || !contactMapping.hubSageFields) && (!addressMapping || !addressMapping.hubSageFields) &&
  //       (!cardMapping || !cardMapping.hubSageFields))
  //       return {
  //         success: false,
  //         error: "Mapping fields are not defined",
  //       };

  //     await asyncforEach(allContactData, async (cp, key) => {
  //       let tram_profile_data = JSON.stringify({
  //         "SessionID": tramSessionID,
  //         "recNo": cp.profileNo,
  //         "noMetaData": true
  //       });

  //       let tramProfleConfig = {
  //         method: 'get',
  //         maxBodyLength: Infinity,
  //         url: `${process.env.LOAD_TRAMS_PROFILE_DATA_API_URL}`,
  //         headers: {
  //           'Content-Type': 'application/json'
  //         },
  //         data: tram_profile_data
  //       };


  //       await axios.request(tramProfleConfig).then(async (response) => {
  //         let tramsProfileData = response.data.result.dataset.data.profile;
  //         let ContactBodyHS = {};
  //         let CardBodyHS = {};
  //         let AddressBodyHS = {};
  //         let hscontactid;
  //         // contact mapping 
  //         contactMapping.hubSageFields.map((vr) => {
  //           ContactBodyHS[vr.hub] = tramsProfileData[0][vr.sage]
  //           // if (tramsProfileData[0][vr.sage] && vr.preference &&
  //           //   (vr.preference == "1" || vr.preference == "1")) {
  //           //   ContactBodyHS[vr.hub] = tramsProfileData[0][vr.sage]
  //           // }
  //         });

  //         // card mapping
  //         let cardBodyHSArray = [];

  //         if (tramsProfileData[0].card) {
  //           if (tramsProfileData[0].card.length > 1) {
  //             tramsProfileData[0].card.map((data, index) => {
  //               cardMapping.hubSageFields.map((vr) => {
  //                 CardBodyHS[vr.hub] = data[vr.sage]
  //               });
  //             })
  //             cardBodyHSArray.push(CardBodyHS)
  //           } else {
  //             cardMapping.hubSageFields.map((vr) => {
  //               CardBodyHS[vr.hub] = tramsProfileData[0].card[0][vr.sage]
  //             });
  //             cardBodyHSArray.push(CardBodyHS)
  //           }
  //         } else {
  //           console.log("Card property not found")
  //         }

  //         // address body mapping
  //         let addressBodyHSArray = [];
  //         if (tramsProfileData[0].address) {
  //           if (tramsProfileData[0].address.length > 1) {
  //             tramsProfileData[0].address.map((data, index) => {
  //               addressMapping.hubSageFields.map((vr) => {
  //                 AddressBodyHS[vr.hub] = data[vr.sage]
  //               });
  //             })
  //             addressBodyHSArray.push(AddressBodyHS)
  //           } else {
  //             addressMapping.hubSageFields.map((vr) => {
  //               AddressBodyHS[vr.hub] = tramsProfileData[0].address[0][vr.sage]
  //             });
  //             addressBodyHSArray.push(AddressBodyHS)
  //           }
  //         } else {
  //           console.log("Address property not found")
  //         }
  //         ContactBodyHS.referred_by = "Business Development";
  //         let filter_contact_body = {
  //           filterGroups: [
  //             {
  //               filters: [
  //                 {
  //                   value: cp.profileNo,
  //                   propertyName: "profile_number",
  //                   operator: "EQ",
  //                 },
  //               ],
  //             },
  //           ],
  //           properties: ["profile_number"]
  //         };





  //         // address custom object data 
  //         let SearchContact = await axios.post(`
  //           https://api.hubapi.com/crm/v3/objects/contacts/search`,
  //           filter_contact_body, {
  //           headers: {
  //             Authorization: `Bearer ${hoautk.access_token}`,
  //           },
  //         });

  //         //  console.log("SearchContact",SearchContact.status,SearchContact.data)
  //         //  return
  //         if (SearchContact.data && SearchContact.data.results.length > 0) {
  //           hscontactid = SearchContact.data.results[0].properties.hs_object_id;
  //         }

  //         if (hscontactid) {
  //           let updatecontact = await axios.patch(`${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts/${hscontactid}`,
  //             { properties: ContactBodyHS },
  //             {
  //               headers: {
  //                 Authorization: `Bearer ${hoautk.access_token}`,
  //               },
  //             });

  //           if (updatecontact.status == 200) {
  //             logme({
  //               user: user,
  //               from: "Trams",
  //               to: "HubSpot",
  //               status: "Success",
  //               type: "Contact Updated Success",
  //               message: `Contact id:${hscontactid}  Updated in HubSpot successfully`,
  //               source: "",
  //             });

  //             // when contact update also update the status
  //             await TramsProfile.findOneAndUpdate({ profileNo: ContactBodyHS.profile_number },
  //               {
  //                 updatedAt: Date.now(), pending: false
  //               },
  //               { new: false, upsert: true }, (err, data) => {
  //                 if (err) {
  //                   console.log("Error While Updating Status", error)
  //                   logme({
  //                     user: user,
  //                     from: "Trams",
  //                     to: "HubSpot",
  //                     status: "Error",
  //                     type: "Error While Updating Contact Status",
  //                     message: `Error While Updating contact status`,
  //                     source: new Error(err ? JSON.stringify(err) : err).stack.toString(),
  //                   });
  //                 } else {
  //                   logme({
  //                     user: user,
  //                     from: "Trams",
  //                     to: "HubSpot",
  //                     status: "Success",
  //                     type: "Contact Updated Success",
  //                     message: `Contact Updated in HubSpot successfully`,
  //                     source: "",
  //                   });
  //                   console.log("Contact Pending Status Updated", data)
  //                 }
  //               }).lean();
  //           } else {
  //             logme({
  //               user,
  //               from: "Trams",
  //               to: "HubSpot",
  //               status: "Error",
  //               type: "Error in Contact Update",
  //               message: `Error in Contact update flow`,
  //               source: ""
  //             });
  //           }

  //         } else {
  //           // create new contact
  //           let createnewcontact = await axios.post(
  //             `${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts`,
  //             { properties: ContactBodyHS },
  //             {
  //               headers:{
  //                 Authorization: "Bearer " + user.hoautk,
  //               },
  //             });
  //           console.log("createnewcontact", createnewcontact.data)
  //           //save log for  contact created
  //           logme({
  //             user: user,
  //             from: "Trams",
  //             to: "HubSpot",
  //             status: "Success",
  //             type: "Contact Created Success",
  //             message: `Contact id:${hscontactid} Created in HubSpot Successfully`,
  //             source: "",
  //           });
  //           hscontactid = createnewcontact.data.properties.hs_object_id




  //           // insert card
  //           cardBodyHSArray.map(async (data, index) => {
  //             let created_card_element_id
  //             let createCardElement = await axios.post(
  //               `${process.env.HUBSPOT_API_URL}/crm/v3/objects/cards`,
  //               { properties: data },
  //               {
  //                 headers: { Authorization: "Bearer " + user.hoautk, },
  //               });
  //             created_card_element_id = createCardElement.data.id;
  //             if(created_card_element_id){
  //               logme({
  //                 user: user,
  //                 from: "Trams",
  //                 to: "HubSpot",
  //                 status: "Success",
  //                 type: "Card Created Success",
  //                 message: `Card Created in HubSpot Successfully`,
  //                 source: "",
  //               });
  //             }
  //             let association_data = await axios.put(
  //               `${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts/${hscontactid}/associations/cards/${created_card_element_id}/card_to_contact`,
  //               {},
  //               {
  //                 headers: {
  //                   Authorization: "Bearer " + user.hoautk,
  //                 },
  //             })
  //             console.log(" Card Association created successfully", association_data.data)
  //           })




  //           // address loop for inserting address data 
  //           addressBodyHSArray && addressBodyHSArray.map(async (data, index) => {
  //             let created_address_element_id
  //             data.address_name === undefined ? data.address_name = "Blank" :
  //               data.address_name === "undefined" ? data.address_name = "Blank" : "Blank"
  //             let createAddressElement = await axios.post(
  //               `${process.env.HUBSPOT_API_URL}/crm/v3/objects/addresses`,
  //               { properties: data },
  //               {
  //                 headers: {
  //                   Authorization: "Bearer " + user.hoautk,
  //                 },
  //               });
  //             created_address_element_id = createAddressElement.data.id
  //             if(created_address_element_id){
  //               logme({
  //                 user: user,
  //                 from: "Trams",
  //                 to: "HubSpot",
  //                 status: "Success",
  //                 type: "Address Created Success",
  //                 message: `Address Created in HubSpot Successfully`,
  //                 source: "",
  //               });
  //             }

  //             let association_data = await axios.put(
  //               `${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts/${hscontactid}/associations/addresses/${created_address_element_id}/address_to_contact`,
  //               {},
  //               {
  //                 headers: {
  //                   Authorization: "Bearer " + user.hoautk,
  //                 },
  //               })
  //             console.log("Address Association created successfully", association_data.data)

  //           })
  //           if (createnewcontact.status == 201) {
  //             logme({
  //               user,
  //               from: "Trams",
  //               to: "HubSpot",
  //               status: "Success",
  //               type: "Contact crate flow",
  //               message: `Contact id:${createnewcontact.data.properties.hs_object_id} Contact create in HubSpot successfully`,
  //               source: "",
  //             });
  //            
  //                 }
  //               }
  //             );

  //           }
  //           else {
  //             logme({
  //               user,
  //               from: "Trams",
  //               to: "HubSpot",
  //               status: "Error",
  //               type: "Contact flow integration ",
  //               message: `Error in contact create  Flow  `,
  //               source:""
  //             });
  //           }
  //         }
  //       })
  //     })
  //   } catch (error) {
  //     console.log("error", error)
  //     logme({
  //       user,
  //       from: "Trams",
  //       to: "HubSpot",
  //       status: "Error",
  //       type: "Error in contact syncing flow",
  //       message: `Error in contact syncing flow`,
  //       source: new Error(
  //         error.response ? JSON.stringify(error.response.data) : error
  //       ).stack.toString()

  //     });
  //   }
  // }


  // async TramstoHScontact(user) {
  //   let token = await tokens.findOne({ user_id: user._id, tokenname: "hoautk", }).lean();
  //   user["hoautk"] = token.access_token;
  //   try {
  //     let tramsSessionData = await tokens.findOne({ tokenname: "TramsSessionId" });
  //     let tramSessionID = tramsSessionData.access_token;
  //     let contactCreated = await this.createContact(user);
  //     console.log(">>>", contactCreated)
  //     return

  //     // let allContactData = await TramsProfile.find({ "pending": true }).limit(1).lean()
  //     // let contactMapping = await hubsagedynamicoptions.findOne({ user_id: user._id, type: "contactSyncing" }).lean();
  //     // if (!contactMapping || !contactMapping.hubSageFields)
  //     //   return {
  //     //     success: false,
  //     //     error: "Mapping fields are not defined",
  //     //   };
  //     // await asyncforEach(allContactData, async (cp, key) => {
  //     //   let hscontactid;
  //     //   let TramprofileBody = JSON.stringify({
  //     //     "SessionID": tramSessionID,
  //     //     "recNo": cp.profileNo,
  //     //     "noMetaData": true
  //     //   });
  //     //   let GetProfile = await axios.post(
  //     //     `http://tlt-dev01:8085/Profile/Load`,
  //     //     TramprofileBody,
  //     //     {
  //     //       headers: {
  //     //         'Content-Type': 'application/json'
  //     //       },
  //     //     }
  //     //   );
  //     //   // console.log("GetProfile",GetProfile.data.result)
  //     //   let Profiledata = GetProfile.data.result.dataset.data.profile[0];

  //     //   let ContactBodyHS = {};
  //     //   contactMapping.hubSageFields.map((vr) => {
  //     //     if (
  //     //       Profiledata[vr.sage] &&
  //     //       vr.preference &&
  //     //       (vr.preference == "1" || vr.preference == "3")
  //     //     ) {
  //     //       ContactBodyHS[vr.hub] = Profiledata[vr.sage];
  //     //     }
  //     //   });
  //     //   let filter_contact_body = {
  //     //     filterGroups: [
  //     //       {
  //     //         filters: [
  //     //           {
  //     //             value: cp.profileNo,
  //     //             propertyName: "profile_number",
  //     //             operator: "EQ",
  //     //           },
  //     //         ],
  //     //       },
  //     //     ],
  //     //     properties: ["profile_number"]
  //     //   };
  //     //   let SearchContact = await axios.post(
  //     //     `https://api.hubapi.com/crm/v3/objects/contacts/search`,
  //     //     filter_contact_body,
  //     //     {
  //     //       headers: {
  //     //         Authorization: "Bearer " + user.hoautk,
  //     //       },
  //     //     }
  //     //   );

  //     //   if (SearchContact.data && SearchContact.data.results.length > 0) {
  //     //     hscontactid = SearchContact.data.results[0].properties.hs_object_id;
  //     //   }
  //     //   if (hscontactid) {
  //     //     let updatecontact = await axios.patch(
  //     //       `${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts/${hscontactid}`,
  //     //       { properties: ContactBodyHS },
  //     //       {
  //     //         headers: {
  //     //           Authorization: "Bearer " + user.hoautk,
  //     //         },
  //     //       }
  //     //     );
  //     //     if (updatecontact.status == 200){
  //     //       logme({
  //     //         user,
  //     //         from: "Trams",
  //     //         to: "HubSpot",
  //     //         status: "Success",
  //     //         type: "Contact update flow  ",
  //     //         message: `Contact id:${hscontactid} Contact update in HubSpot successfully`,
  //     //         source: "",
  //     //       });
  //     //       // update trams profile pending to false
  //     //       await TramsProfile.findOneAndUpdate({profileNo: ContactBodyHS.profile_number },
  //     //         {
  //     //           updatedAt: Date.now(),
  //     //           pending: false
  //     //         },
  //     //         { new: false, upsert: true }, (error, data) => {
  //     //           if (error) {
  //     //             logme({
  //     //               user: user,
  //     //               from: "Trams",
  //     //               to: "HubSpot",
  //     //               status: "Error",
  //     //               type: "Error While Updating Existing Trams Profile Status",
  //     //               message: `Error While Updating Tram sPending Status`,
  //     //               source: new Error(error.response ? JSON.stringify(error.response.data) : error).stack.toString()
  //     //             });
  //     //           }
  //     //           else {
  //     //             logme({
  //     //               user: user,
  //     //               from: "Trams",
  //     //               to: "HubSpot",
  //     //               status: "Success",
  //     //               type: "Existing User Pending Status Updated Successfully",
  //     //               message: `Existing User Pending Status Updated Successfully`,
  //     //               source: "",
  //     //             });
  //     //           }
  //     //         })

  //     //     } else {
  //     //       logme({
  //     //         user,
  //     //         from: "Trams",
  //     //         to: "HubSpot",
  //     //         status: "Error",
  //     //         type: "Error in Contact update flow",
  //     //         message: `Contact id: ${hscontactid} Error in Contact update flow`,
  //     //         source: "",
  //     //         // source: new Error(
  //     //         //   error.response ? JSON.stringify(error.response.data) : error
  //     //         // ).stack.toString(),
  //     //       });
  //     //     }
  //     //   } else {
  //     //     let createnewcontact = await axios.post(`${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts`,
  //     //       { properties: ContactBodyHS },
  //     //       {
  //     //         headers: {
  //     //           Authorization: "Bearer " + user.hoautk,
  //     //         },
  //     //       }
  //     //     );
  //     //     hscontactid = createnewcontact.data.properties.hs_object_id;
  //     //     if(createnewcontact.status == 201){
  //     //       logme({
  //     //         user,
  //     //         from: "Trams",
  //     //         to: "HubSpot",
  //     //         status: "Success",
  //     //         type: "Contact Create Flow",
  //     //         message: `Contact id:${hscontactid} Contact Created in HubSpot Successfully`,
  //     //         source: "",
  //     //       });
  //     //       // update trams profile pending to false
  //     //       await TramsProfile.findOneAndUpdate({ profileNo: ContactBodyHS.profile_number },
  //     //         {
  //     //           updatedAt: Date.now(),
  //     //           pending: false
  //     //         },
  //     //         { new: false, upsert: true }, (error, data) => {
  //     //           if (error) {
  //     //             logme({
  //     //               user: user,
  //     //               from: "Trams",
  //     //               to: "HubSpot",
  //     //               status: "Error",
  //     //               type: "Error While Updating  Trams Profile Status",
  //     //               message: `Error While Updating User Pending Status`,
  //     //               source: new Error(error.response ? JSON.stringify(error.response.data) : error).stack.toString()
  //     //             });
  //     //           }
  //     //           else {
  //     //             logme({
  //     //               user: user,
  //     //               from: "Trams",
  //     //               to: "HubSpot",
  //     //               status: "Success",
  //     //               type: "User Pending Status Updated Successfully",
  //     //               message: `User Pending Status Updated Successfully`,
  //     //               source: "",
  //     //             });
  //     //           }
  //     //         });
  //     //     }else{
  //     //       logme({
  //     //         user,
  //     //         from: "Trams",
  //     //         to: "HubSpot",
  //     //         status: "Error",
  //     //         type: "Contact Flow Integration",
  //     //         message: `Error in contact create Flow`,
  //     //         source: ""
  //     //       });
  //     //     }
  //     // }


  //     // })
  //   } catch (error) {
  //     // var mailOptions = {
  //     //   from: "mailto:testna11@24livehost.com",
  //     //   to: "mailto:deepakkumar.yadav@dotsquares.com",
  //     //   // bcc: "mailto:dharmendra.joshi@dotsquares.com",
  //     //   subject: `Error in contact sync Trams to Hubspot contact flow`,
  //     //   text: `Error Status:${error.response.status}
  //     //     Error Status Type:${error.response.statusText}
  //     //     Error Status URL: ${error.response.config.url}`,
  //     // };
  //     // console.log("mailOptions", mailOptions)
  //     // transporter.sendMail(mailOptions, function (error, info) {
  //     //   if (error) {
  //     //     console.log(error);
  //     //   } else {
  //     //     console.log('Email sent: ' + info.response);
  //     //   }
  //     // });
  //     console.log("error", error)
  //     logme({
  //       user,
  //       from: "Myenrgi",
  //       to: "HubSpot",
  //       status: "Error",
  //       type: "Error in contact syncing flow",
  //       message: `Error in contact syncing flow`,
  //       source: (error.response ? JSON.stringify(error.response.data) : error).stack.toString(),
  //     });
  //   }
  // }

  //Tram Profle Contact to HS Flow
  async tramstoHScontact(user) {
    let token = await tokens.findOne({ user_id: user._id, tokenname: "hoautk", }).lean();
    user["hoautk"] = token.access_token;
    try {
      let hscontactid;
      let tramsSessionData = await tokens.findOne({ tokenname: "TramsSessionId" });
      let tramSessionID = tramsSessionData.access_token
      let allContactData = await TramsProfile.find({ "pending": true }).limit(1).lean()
      let contactMapping = await hubsagedynamicoptions.findOne({ user_id: user._id, type: "contactSyncing" }).lean();
      if (!contactMapping || !contactMapping.hubSageFields)
        return {
          success: false,
          error: "Mapping fields are not defined",
        };
      await asyncforEach(allContactData, async (cp, key) => {
        let TramprofileBody = JSON.stringify({
          "SessionID": tramSessionID,
          "recNo": cp.profileNo,
          "noMetaData": true
        });
        let GetProfile = await axios.post(
          `http://tlt-dev01:8085/Profile/Load`,
          TramprofileBody,
          {
            headers: {
              'Content-Type': 'application/json'
            },
          }
        );
        let Profiledata = GetProfile.data.result.dataset.data.profile[0];
        let ContactBodyHS = {};
        contactMapping.hubSageFields.map((vr) => {
          if (
            Profiledata[vr.sage] &&
            vr.preference &&
            (vr.preference == "1" || vr.preference == "3")
          ) {
            ContactBodyHS[vr.hub] = Profiledata[vr.sage];
          }
        });

        console.log("this is contact body", ContactBodyHS)

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
        let SearchContact = await axios.post(
          `https://api.hubapi.com/crm/v3/objects/contacts/search`,
          filter_contact_body,
          {
            headers: {
              Authorization: "Bearer " + user.hoautk,
            },
          }
        );

        console.log("this is contact data", SearchContact.data)

        if (SearchContact.data && SearchContact.data.results.length > 0) {
          hscontactid = SearchContact.data.results[0].properties.hs_object_id;
        }
        console.log(hscontactid)

        if (hscontactid) {
          let updatecontact = await axios.patch(`${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts/${hscontactid}`,
            { properties: ContactBodyHS },
            {
              headers: {
                Authorization: "Bearer " + user.hoautk,
              },
            }
          );

          if (updatecontact.status == 200) {
            let getassociatecard = await axios.get(
              `https://api.hubapi.com/crm/v3/objects/contacts/${hscontactid}/associations/2-15234393?limit=500`,
              {
                headers: {
                  Authorization: "Bearer " + user.hoautk,
                },
              }
            );

            // console.log("hellolineitem", getassociatecard.status);
            if (getassociatecard.data && getassociatecard.data.results.length > 0) {
              await Promise.all(
                getassociatecard.data.results.map(async (mp) => {

                  let getlineitemsintodeals = await axios.delete(
                    `https://api.hubapi.com/crm/v3/objects/2-15234393/${mp.id}`,
                    {
                      headers: {
                        Authorization: "Bearer " + user.hoautk,
                      },
                    }
                  );
                  console.log("getlineitemsintodeals", getlineitemsintodeals.status)





                })
              ).catch((error) => {
              });
            }
            let getassociateaddress = await axios.get(
              `https://api.hubapi.com/crm/v3/objects/contacts/${hscontactid}/associations/2-15234392?limit=500`,
              {
                headers: {
                  Authorization: "Bearer " + user.hoautk,
                },
              }
            );

            // console.log("hellolineitem", getassociateaddress.status);
            if (getassociateaddress.data && getassociateaddress.data.results.length > 0) {
              await Promise.all(
                getassociateaddress.data.results.map(async (mp) => {

                  let deleteaddress = await axios.delete(
                    `https://api.hubapi.com/crm/v3/objects/2-15234392/${mp.id}`,
                    {
                      headers: {
                        Authorization: "Bearer " + user.hoautk,
                      },
                    }
                  );
                  console.log("deleteaddress", deleteaddress.status)





                })
              ).catch((error) => {
              });
            }
            logme({
              user,
              from: "Trams",
              to: "HubSpot",
              status: "Success",
              type: "Contact update flow  ",
              message: `Contact id:${hscontactid} Contact update in HubSpot successfully`,
              source: "",
            });
            //  update trams profile pending to false
            await TramsProfile.findOneAndUpdate({ profileNo: ContactBodyHS.profile_number },
              {
                updatedAt: Date.now(),
                pending: false,
                contactSyncingStatus: true
              },
              { new: false, upsert: true }, (error, data) => {
                if (error) {
                  logme({
                    user: user,
                    from: "Trams",
                    to: "HubSpot",
                    status: "Error",
                    type: "Error While Updating Existing Trams Profile Status",
                    message: `Error While Updating Tram sPending Status`,
                    source: new Error(error.response ? JSON.stringify(error.response.data) : error).stack.toString()
                  });
                }
                else {
                  logme({
                    user: user,
                    from: "Trams",
                    to: "HubSpot",
                    status: "Success",
                    type: "Existing User Pending Status Updated Successfully",
                    message: `Existing User Pending Status Updated Successfully`,
                    source: "",
                  });
                }

              })

          } else {
            logme({
              user,
              from: "Trams",
              to: "HubSpot",
              status: "Error",
              type: "Error in Contact update flow",
              message: `Contact id: ${hscontactid} Error in Contact update flow`,
              source: "",
            });
          }

        } else {
          let createnewcontact = await axios.post(`${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts`,
            { properties: ContactBodyHS },
            {
              headers: {
                Authorization: "Bearer " + user.hoautk,
              },
            }
          );
          hscontactid = createnewcontact.data.properties.hs_object_id;
          console.log("new contact created id", hscontactid)

          if (createnewcontact.status == 201) {
            logme({
              user,
              from: "Trams",
              to: "HubSpot",
              status: "Success",
              type: "Contact Create Flow",
              message: `Contact id:${hscontactid} Contact Created in HubSpot Successfully`,
              source: "",
            });
            await TramsProfile.findOneAndUpdate({ profileNo: ContactBodyHS.profile_number },
              {
                updatedAt: Date.now(),
                pending: false,
                contactSyncingStatus: true
              },
              { new: false, upsert: true }, (error, data) => {
                if (error) {
                  logme({
                    user: user,
                    from: "Trams",
                    to: "HubSpot",
                    status: "Error",
                    type: "Error While Updating Existing Trams Profile Status",
                    message: `Error While Updating Tram sPending Status`,
                    source: new Error(error.response ? JSON.stringify(error.response.data) : error).stack.toString()
                  });
                }
                else {
                  logme({
                    user: user,
                    from: "Trams",
                    to: "HubSpot",
                    status: "Success",
                    type: "Existing User Pending Status Updated Successfully",
                    message: `Existing User Pending Status Updated Successfully`,
                    source: "",
                  });
                }

              })
          } else {
            logme({
              user,
              from: "Trams",
              to: "HubSpot",
              status: "Error",
              type: "Contact Flow Integration",
              message: `Error in contact create Flow`,
              source: ""
            });
          }
        }

      })
    } catch (error) {
      // var mailOptions = {
      //   from: "mailto:testna11@24livehost.com",
      //   to: "mailto:deepakkumar.yadav@dotsquares.com",
      //   // bcc: "mailto:dharmendra.joshi@dotsquares.com",
      //   subject: `Error in contact sync Trams to Hubspot contact flow`,
      //   text: `Error Status:${error.response.status}
      //     Error Status Type:${error.response.statusText}
      //     Error Status URL: ${error.response.config.url}`,
      // };
      // console.log("mailOptions", mailOptions)
      // transporter.sendMail(mailOptions, function (error, info) {
      //   if (error) {
      //     console.log(error);
      //   } else {
      //     console.log('Email sent: ' + info.response);
      //   }
      // });
      console.log("error", error)
      logme({
        user,
        from: "Myenrgi",
        to: "HubSpot",
        status: "Error",
        type: "Error in contact syncing flow",
        message: `Error in contact syncing flow`,
        source: (error.response ? JSON.stringify(error.response.data) : error),
      });
    }
  }
  // Tram Profle Card to HS Flow
  async tramstoHSCard(user) {
    let token = await tokens.findOne({ user_id: user._id, tokenname: "hoautk", }).lean();
    user["hoautk"] = token.access_token;
    try {
      let hscontactid
      let hscardid;
      let tramsSessionData = await tokens.findOne({ tokenname: "TramsSessionId" });
      let tramSessionID = tramsSessionData.access_token
      let allContactData = await TramsProfile.find({ "contactSyncingStatus": true }).limit(1).lean();
      let cardMapping = await hubsagedynamicoptions.findOne({ user_id: user._id, type: "cardSyncing" }).lean();
      if (!cardMapping || !cardMapping.hubSageFields)
        return {
          success: false,
          error: "Mapping fields are not defined",
        };
      await asyncforEach(allContactData, async (cp, key) => {
        let TramprofileBody = JSON.stringify({
          "SessionID": tramSessionID,
          "recNo": cp.profileNo,
          "noMetaData": true
        });
        let GetProfile = await axios.post(
          `http://tlt-dev01:8085/Profile/Load`,
          TramprofileBody,
          {
            headers: {
              'Content-Type': 'application/json'
            },
          }
        );

        if (GetProfile.data.result.dataset.data.profile[0].card) {


          let Carddata = GetProfile.data.result.dataset.data.profile[0].card;
          await asyncforEach(Carddata, async (Profiledata) => {
            let CardBodyHS = {};
            cardMapping.hubSageFields.map((vr) => {
              if (Profiledata[vr.sage] && vr.preference &&
                (vr.preference == "1" || vr.preference == "3")
              ) {
                CardBodyHS[vr.hub] = Profiledata[vr.sage];
              }
            });


            // search filter for card 
            let filter_card_body = {
              filterGroups: [
                {
                  filters: [
                    {
                      value: Profiledata.nameOnAcct,
                      propertyName: "name_on_the_card",
                      operator: "EQ",
                    },
                    {
                      value: Profiledata.CCNumber,
                      propertyName: "card_number",
                      operator: "EQ",
                    },
                  ],
                },
              ],
              properties: ["card_number", "name_on_the_card"]
            };

            let SearchCard = await axios.post(
              `https://api.hubapi.com/crm/v3/objects/2-15234393/search`,
              filter_card_body,
              {
                headers: {
                  Authorization: "Bearer " + user.hoautk,
                },
              }
            );

            if (SearchCard.data && SearchCard.data.results.length > 0) {
              hscardid = SearchCard.data.results[0].properties.hs_object_id;
            }
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
            let SearchContact = await axios.post(
              `https://api.hubapi.com/crm/v3/objects/contacts/search`,
              filter_contact_body,
              {
                headers: {
                  Authorization: "Bearer " + user.hoautk,
                },
              }
            );


            if (SearchContact.data && SearchContact.data.results.length > 0) {
              hscontactid = SearchContact.data.results[0].properties.hs_object_id;
            }

            if (hscardid) {
              let updatecard = await axios.patch(`${process.env.HUBSPOT_API_URL}/crm/v3/objects/2-15234393/${hscardid}`,
                { properties: CardBodyHS },
                {
                  headers: {
                    Authorization: "Bearer " + user.hoautk,
                  },
                }
              );
              if (updatecard.status == 200) {
                logme({
                  user,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Success",
                  type: "Card update flow  ",
                  message: `Card id:${hscardid} Card update in HubSpot successfully`,
                  source: "",
                });
                // update trams profile pending to false
                await TramsProfile.findOneAndUpdate({ profileNo: cp.profileNo },
                  {
                    updatedAt: Date.now(),
                    contactSyncingStatus: false,
                    cardsyncingstatus: true
                  },
                  { new: false, upsert: true }, (error, data) => {
                    if (error) {
                      logme({
                        user: user,
                        from: "Trams",
                        to: "HubSpot",
                        status: "Error",
                        type: "Error While Updating Existing Trams Profile Status",
                        message: `Error While Updating Tram sPending Status`,
                        source: new Error(error.response ? JSON.stringify(error.response.data) : error).stack.toString()
                      });
                    }
                    else {
                      logme({
                        user: user,
                        from: "Trams",
                        to: "HubSpot",
                        status: "Success",
                        type: "Existing User Pending Status Updated Successfully",
                        message: `Existing User Pending Status Updated Successfully`,
                        source: "",
                      });
                    }

                  })

              } else {
                logme({
                  user,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Error",
                  type: "Error in Card update flow",
                  message: `Card id: ${hscontactid} Error in Card update flow`,
                  source: "",
                });
              }
            } else {
              let createnewcard = await axios.post(`${process.env.HUBSPOT_API_URL}/crm/v3/objects/2-15234393`,
                { properties: CardBodyHS },
                {
                  headers: {
                    Authorization: "Bearer " + user.hoautk,
                  },
                }
              );
              hscardid = createnewcard.data.properties.hs_object_id;
              console.log("new hs card id", hscardid)

              if (createnewcard.status == 201) {
                logme({
                  user,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Success",
                  type: "Card Create Flow",
                  message: `Card id:${hscardid} Card Created in HubSpot Successfully`,
                  source: "",
                });
                await TramsProfile.findOneAndUpdate({ profileNo: CardBodyHS.profile_number },
                  {
                    updatedAt: Date.now(),
                    contactSyncingStatus: false,
                    cardsyncingstatus: true
                  },
                  { new: false, upsert: true }, (error, data) => {
                    if (error) {
                      logme({
                        user: user,
                        from: "Trams",
                        to: "HubSpot",
                        status: "Error",
                        type: "Error While Updating Existing Trams Profile Status",
                        message: `Error While Updating Tram sPending Status`,
                        source: new Error(error.response ? JSON.stringify(error.response.data) : error).stack.toString()
                      });
                    }
                    else {
                      logme({
                        user: user,
                        from: "Trams",
                        to: "HubSpot",
                        status: "Success",
                        type: "Existing User Pending Status Updated Successfully",
                        message: `Existing User Pending Status Updated Successfully`,
                        source: "",
                      });
                    }

                  })
              } else {
                logme({
                  user,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Error",
                  type: "Card Flow Integration",
                  message: `Error in card create Flow`,
                  source: ""
                });
              }
            }
            if (hscardid && hscontactid) {
              let association_data = await axios.put(
                `${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts/${hscontactid}/associations/2-15234393/${hscardid}/card_to_contact`,
                {},
                {
                  headers: {
                    Authorization: "Bearer " + user.hoautk,
                  },
                })

              if (association_data.status == 200) {
                logme({
                  user,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Success",
                  type: "Card to contact association flow",
                  message: `Card to contact associate successfully`,
                  source: ""
                });
              } else {
                logme({
                  user,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Error",
                  type: "Card to contact association flow",
                  message: `Card to contact associate failed`,
                  source: ""
                });
              }
            }
          })
        }
        else {
          logme({
            user,
            from: "Trams",
            to: "HubSpot",
            status: "Error",
            type: "Error in card syncing flow crad not found",
            message: `profileNo:${cp.profileNo} error in card syncing flow crad not found`,
            source: (error.response ? JSON.stringify(error.response.data) : error),
          });
        }
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
        source: (error.response ? JSON.stringify(error.response.data) : error),
      });
    }
  }
  //Tram Profle Address to HS Flow
  async tramstoHSAddress(user) {
    let token = await tokens.findOne({ user_id: user._id, tokenname: "hoautk", }).lean();
    user["hoautk"] = token.access_token;
    try {

      let hscontactid;
      let hscardid;
      let hsadddressid;
      let tramsSessionData = await tokens.findOne({ tokenname: "TramsSessionId" });
      let tramSessionID = tramsSessionData.access_token
      let allContactData = await TramsProfile.find({ "cardsyncingstatus": true }).limit(1).lean()
      let addressMapping = await hubsagedynamicoptions.findOne({ user_id: user._id, type: "addressSyncing" }).lean();
      if (!addressMapping || !addressMapping.hubSageFields)
        return {
          success: false,
          error: "Mapping fields are not defined",
        };
      await asyncforEach(allContactData, async (cp, key) => {

        let TramprofileBody = JSON.stringify({
          "SessionID": tramSessionID,
          "recNo": cp.profileNo,
          "noMetaData": true
        });
        let GetProfile = await axios.post(
          `http://tlt-dev01:8085/Profile/Load`,
          TramprofileBody,
          {
            headers: {
              'Content-Type': 'application/json'
            },
          }
        );
        // console.log("GetProfile",GetProfile.data.result)
        if (GetProfile.data.result.dataset.data.profile[0].address) {
          let addressdata = GetProfile.data.result.dataset.data.profile[0].address;

          await asyncforEach(addressdata, async (Profiledata, key) => {
            let AddressBodyHS = {};
            addressMapping.hubSageFields.map((vr) => {
              if (Profiledata[vr.sage] && vr.preference && (vr.preference == "1" || vr.preference == "3")) {
                AddressBodyHS[vr.hub] = Profiledata[vr.sage];
              }
            });
            //search address in hubspot
            let filter_address_body = {
              filterGroups: [
                {
                  filters: [
                    {
                      value: Profiledata.addressNo,
                      propertyName: "apartment_number",
                      operator: "EQ",
                    },
                  ],
                },
              ],
              properties: ["apartment_number"]
            };
            let SearchAddress = await axios.post(
              `https://api.hubapi.com/crm/v3/objects/2-15234392/search`,
              filter_address_body,
              {
                headers: {
                  Authorization: "Bearer " + user.hoautk,
                },
              }
            );

            if (SearchAddress.data && SearchAddress.data.results.length > 0) {
              hsadddressid = SearchAddress.data.results[0].properties.hs_object_id;
            }
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
            let SearchContact = await axios.post(
              `https://api.hubapi.com/crm/v3/objects/contacts/search`,
              filter_contact_body,
              {
                headers: {
                  Authorization: "Bearer " + user.hoautk,
                },
              }
            );


            if (SearchContact.data && SearchContact.data.results.length > 0) {
              hscontactid = SearchContact.data.results[0].properties.hs_object_id;
            }
            if (hsadddressid) {
              let updateAddress = await axios.patch(
                `${process.env.HUBSPOT_API_URL}/crm/v3/objects/2-15234392/${hsadddressid}`,
                { properties: AddressBodyHS },
                {
                  headers: {
                    Authorization: "Bearer " + user.hoautk,
                  },
                }
              );
              if (updateAddress.status == 200) {
                logme({
                  user,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Success",
                  type: "Address update flow  ",
                  message: `Address id:${hsadddressid} Address update in HubSpot successfully`,
                  source: "",
                });
                // update trams profile pending to false
                await TramsProfile.findOneAndUpdate({ profileNo: cp.profile_number },
                  {
                    updatedAt: Date.now(),
                    cardsyncingstatus: false
                  },
                  { new: false, upsert: true }, (error, data) => {
                    if (error) {
                      logme({
                        user: user,
                        from: "Trams",
                        to: "HubSpot",
                        status: "Error",
                        type: "Error While Updating Existing Trams Profile Status",
                        message: `Error While Updating Tram sPending Status`,
                        source: new Error(error.response ? JSON.stringify(error.response.data) : error).stack.toString()
                      });
                    }
                    else {
                      logme({
                        user: user,
                        from: "Trams",
                        to: "HubSpot",
                        status: "Success",
                        type: "Existing User Pending Status Updated Successfully",
                        message: `Existing User Pending Status Updated Successfully`,
                        source: "",
                      });
                    }

                  })
              } else {
                logme({
                  user,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Error",
                  type: "Error in Address update flow",
                  message: `Card id: ${hsadddressid} Error in Address update flow`,
                  source: "",
                });
              }

            } else {
              let createNewAddress = await axios.post(`${process.env.HUBSPOT_API_URL}/crm/v3/objects/2-15234392`,
                { properties: AddressBodyHS },
                {
                  headers: {
                    Authorization: "Bearer " + user.hoautk,
                  },
                }
              );
              hsadddressid = createNewAddress.data.properties.hs_object_id;
              if (createNewAddress.status == 201) {
                logme({
                  user,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Success",
                  type: "Address Create Flow",
                  message: `Address id:${hsadddressid} Address Created in HubSpot Successfully`,
                  source: "",
                });
                // update trams profile pending to false
                await TramsProfile.findOneAndUpdate({ profileNo: cp.profile_number },
                  {
                    updatedAt: Date.now(),
                    cardsyncingstatus: false
                  },
                  { new: false, upsert: true }, (error, data) => {
                    if (error) {
                      logme({
                        user: user,
                        from: "Trams",
                        to: "HubSpot",
                        status: "Error",
                        type: "Error While Updating Existing Trams Profile Status",
                        message: `Error While Updating Tram sPending Status`,
                        source: new Error(error.response ? JSON.stringify(error.response.data) : error).stack.toString()
                      });
                    }
                    else {
                      logme({
                        user: user,
                        from: "Trams",
                        to: "HubSpot",
                        status: "Success",
                        type: "Existing User Pending Status Updated Successfully",
                        message: `Existing User Pending Status Updated Successfully`,
                        source: "",
                      });
                    }

                  })
              } else {
                logme({
                  user,
                  from: "Trams",
                  to: "HubSpot",
                  status: "Error",
                  type: "Address Flow Integration",
                  message: `Error in Address Create Flow`,
                  source: ""
                });
              }
              if (hsadddressid && hscontactid) {
                let association_data = await axios.put(
                  `${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts/${hscontactid}/associations/2-15234392/${hsadddressid}/address_to_contact`,
                  {},
                  {
                    headers: {
                      Authorization: "Bearer " + user.hoautk,
                    },
                  })
                if (association_data.status == 200) {
                  logme({
                    user,
                    from: "Trams",
                    to: "HubSpot",
                    status: "Success",
                    type: "Address to contact association flow",
                    message: `Address to contact associate successfully`,
                    source: ""
                  });
                }
              }
            }
          })

        }
        else {
          logme({
            user,
            from: "Trams",
            to: "HubSpot",
            status: "Error",
            type: "Error in address syncing flow address not found",
            message: `profileNo:${cp.profileNo} error in address syncing flow address not found`,
            source: (error.response ? JSON.stringify(error.response.data) : error),
          });
        }

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
        source: (error.response ? JSON.stringify(error.response.data) : error),
      });
    }
  }




  /**
   * @param {*} user 
   * @description function for HS to Trams Syncing Flow 
   * @returns HS to Trams Syncing Flow 
   */


  async downloadHSContactNSyncToTrams(user) {
    try {
      let token = await tokens.findOne({ user_id: user._id, tokenname: "hoautk", }).lean();
      user["hoautk"] = token.access_token;
      let tramsSessionData = await tokens.findOne({ tokenname: "TramsSessionId" });
      let tramSessionID = tramsSessionData.access_token;
      let mappingTypes = ['contactSyncing', 'cardSyncing', 'addressSyncing'];
      let syncingMappingData = await hubsagedynamicoptions.find({
        'type': {
          $in: mappingTypes
        }
      });
      let cardMapping = JSON.parse(JSON.stringify(syncingMappingData[1]))
      let addressMapping = JSON.parse(JSON.stringify(syncingMappingData[2]))
      let Contactmapping = JSON.parse(JSON.stringify(syncingMappingData[0]))
      if ((!Contactmapping || !Contactmapping.hubSageFields) &&
        (!cardMapping || !cardMapping.hubSageFields) &&
        (!addressMapping || !addressMapping.hubSageFields)) {
        return {
          error: true,
          message: "Mapping Fields are Not Defined"
        };
      }


      // contact filter option body
      let filtercontact = {
        filterGroups: [
          {
            filters: [
              {
                value: user.lastcontactFetch.toISOString(),
                propertyName: "lastmodifieddate",
                operator: "GTE",
              },
            ],
          },
        ],
        properties: ["lastmodifieddate", "firstname", "email"],
        limit: "100",
      };

      // search contact
      let searchContactinHS = await axios.post(process.env.HUBSPOT_API_URL + "/crm/v3/objects/contacts/search",
        filtercontact,
        {
          headers: {
            Authorization: "Bearer " + user.hoautk,
          },
        }
      );

      if (searchContactinHS && searchContactinHS.data && searchContactinHS.data.results.length > 0) {
        await asyncforEach(searchContactinHS.data.results, async (cal) => {
          let hscontactid;
          hscontactid = cal.id;
          let allprops = "";
          let allCardProperties = "";
          let allAddressProperties = "";
          let allcontactdata = [];
          let allCardData = [];
          let allAddressData = []
          await asyncforEach(Contactmapping.hubSageFields, async (mp) => {
            allprops = allprops + mp.hub + ",";
          });
          await asyncforEach(cardMapping.hubSageFields, async (mp) => {
            allCardProperties = allCardProperties + mp.hub + ",";
          });
          await asyncforEach(addressMapping.hubSageFields, async (mp) => {
            allAddressProperties = allAddressProperties + mp.hub + ",";
          });
          let getcontactdata = await axios.get(
            `https://api.hubapi.com/crm/v3/objects/contacts/${hscontactid}?properties=${allprops}`,
            {
              headers: {
                Authorization: "Bearer " + user.hoautk,
              },
            });
          if (getcontactdata.status == 200 && getcontactdata.data && getcontactdata.data.properties) {
            allcontactdata = getcontactdata.data.properties;
          }

          if (allcontactdata) {
            // find associated card details
            let find_associated_card_data = await axios.get(
              `${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts/${allcontactdata.hs_object_id}/associations/2-15234393`,
              {
                headers: {
                  Authorization: "Bearer " + user.hoautk,
                },
              });

            if (find_associated_card_data.status == 200 && find_associated_card_data.data && find_associated_card_data.data.results.length > 0) {
              // find card details through associated card id
              await asyncforEach(find_associated_card_data.data.results, async (card_data) => {
                let card_details = await axios.get(`https://api.hubapi.com/crm/v3/objects/2-15234393/${card_data.id}?properties=${allCardProperties}`,
                  {
                    headers: {
                      Authorization: "Bearer " + user.hoautk,
                    },
                  });
                if (card_details.status == 200 && card_details.data && card_details.data.properties) {
                  allCardData.push(card_details.data.properties);
                } else {
                  // card association get api error log me 
                }
              })
            } else {
              // error in association find card api hence thowing error  
            }


            // find address association
            let find_associated_address_data = await axios.get(
              `${process.env.HUBSPOT_API_URL}/crm/v3/objects/contacts/${allcontactdata.hs_object_id}/associations/2-15234392`,
              {
                headers: {
                  Authorization: "Bearer " + user.hoautk,
                },
              });

            if (find_associated_address_data.status == 200 && find_associated_address_data.data.results && find_associated_address_data.data.results.length > 0) {
              await asyncforEach(find_associated_address_data.data.results, async (address_data) => {
                let address_details = await axios.get(
                  `https://api.hubapi.com/crm/v3/objects/2-15234392/${address_data.id}?properties=${allAddressProperties}`,
                  {
                    headers: {
                      Authorization: "Bearer " + user.hoautk,
                    },
                  })

                if (address_details.status == 200 && address_details.data && address_details.data.properties) {
                  allAddressData.push(address_details.data.properties)
                } else {
                  // address details api giving error logme
                }
              })


            } else {
              // find association api error no association found log me 
            }

            // console.log(allcontactdata, allAddressData, allCardData)


            let insert_result = await HSContactRecord.findOneAndUpdate(
              { "contact_detail_array.hs_object_id": allcontactdata.hs_object_id },
              {
                $set:
                {
                  contact_detail_array: allcontactdata,
                  card_detail_array: allCardData,
                  address_detail_array: allAddressData,
                },
              }, { upsert: true }
            );


            // get data from db 
            let profile_data_result = await HSContactRecord.findOne({ "contact_detail_array.hs_object_id": allcontactdata.hs_object_id }).limit(1)
            console.log("profile_data_resultsssssssssssssssssss", profile_data_result)

            // trams body for insert
            if (profile_data_result.contact_detail_array.profile_number = "90") {

              if (profile_data_result.contact_detail_array.profile_number) {
                // create flow and update hr profule number property
                let tram_update_profile_data = JSON.stringify({
                  "SessionID": tramSessionID,
                  "DeltaDataSet": {
                    "": [
                      {
                        "UPDATE": {
                          "profileNo": {
                            "OLDVALUE": "90"
                          },
                          "firstName": {
                            "OLDVALUE": "Haskielsssss",
                            "NEWVALUE": "Haskiel"
                          },
                          "middleInit": {
                            "OLDVALUE": null
                          },
                          "lastName": {
                            "OLDVALUE": "Bartmansss",
                            "NEWVALUE": "Bartman"
                          },
                          "profileType_LinkCode": {
                            "OLDVALUE": "I"
                          },
                          "interfaceID": {
                            "OLDVALUE": "90"
                          },
                          "name": {
                            "OLDVALUE": "Bartman/Haskiel"
                          },
                          "title": {
                            "OLDVALUE": null
                          },
                          "businessType": {
                            "OLDVALUE": null
                          },
                          "courtesyTitle": {
                            "OLDVALUE": "Mr."
                          },
                          "modifyBy": {
                            "OLDVALUE": "MARIBETH"
                          },
                          "modifyDateTime": {
                            "OLDVALUE": "2022-11-28T22:58:09.497Z"
                          },
                          "creationDate": {
                            "OLDVALUE": "1995-01-01T00:00:00.000Z"
                          },
                          "airlineNo": {
                            "OLDVALUE": null
                          },
                          "GL_LinkNo": {
                            "OLDVALUE": null
                          },
                          "preferredVendor": {
                            "OLDVALUE": "N"
                          },
                          "notes": {
                            "OLDVALUE": null
                          },
                          "additionalNotes": {
                            "OLDVALUE": null
                          },
                          "other": {
                            "OLDVALUE": null
                          },
                          "stmtRemarks": {
                            "OLDVALUE": null
                          },
                          "isActive": {
                            "OLDVALUE": "Y"
                          },
                          "payeeName": {
                            "OLDVALUE": null
                          },
                          "rate1": {
                            "OLDVALUE": null
                          },
                          "outsideRate": {
                            "OLDVALUE": null
                          },
                          "unappliedBalance": {
                            "OLDVALUE": 0
                          },
                          "travelPref": {
                            "OLDVALUE": null
                          },
                          "salutation": {
                            "OLDVALUE": null
                          },
                          "primaryAgent_LinkNo": {
                            "OLDVALUE": null
                          },
                          "vendorId": {
                            "OLDVALUE": null
                          },
                          "referredBy": {
                            "OLDVALUE": null
                          },
                          "serviceProviderOnly": {
                            "OLDVALUE": null
                          },
                          "branch_LinkNo": {
                            "OLDVALUE": null
                          },
                          "createBy": {
                            "OLDVALUE": null
                          },
                          "webId": {
                            "OLDVALUE": null
                          },
                          "webPassword": {
                            "OLDVALUE": null
                          },
                          "misc1": {
                            "OLDVALUE": null
                          },
                          "misc2": {
                            "OLDVALUE": null
                          },
                          "GL2_LinkNo": {
                            "OLDVALUE": null
                          },
                          "GL2Rate": {
                            "OLDVALUE": null
                          },
                          "creditLimit": {
                            "OLDVALUE": null
                          },
                          "GLBranch_LinkNo": {
                            "OLDVALUE": null
                          },
                          "checkRemarks": {
                            "OLDVALUE": null
                          },
                          "altInterfaceID": {
                            "OLDVALUE": null
                          },
                          "bankAccountNo": {
                            "OLDVALUE": null
                          },
                          "bankRoutingNo": {
                            "OLDVALUE": null
                          },
                          "CBNotesBlobType_LinkNo": {
                            "OLDVALUE": "2"
                          },
                          "CBPLookupItem_LinkNo": {
                            "OLDVALUE": null
                          },
                          "additionalName": {
                            "OLDVALUE": null
                          },
                          "profileID": {
                            "OLDVALUE": null
                          },
                          "miscEcoValue": {
                            "OLDVALUE": null
                          },
                          "privLabel_LinkNo1": {
                            "OLDVALUE": null
                          },
                          "seg_LinkNo1": {
                            "OLDVALUE": null
                          },
                          "privLabel_LinkNo2": {
                            "OLDVALUE": null
                          },
                          "seg_LinkNo2": {
                            "OLDVALUE": null
                          },
                          "PCC": {
                            "OLDVALUE": null
                          },
                          "SPUniqueID": {
                            "OLDVALUE": null
                          },
                          "syncModDateTime": {
                            "OLDVALUE": null
                          }
                        }
                      }
                    ]
                  }
                });

                let update_tram_config_data = {
                  method: 'post',
                  maxBodyLength: Infinity,
                  url: 'http://tlt-dev01:8085/profile/applyupdates',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  data: tram_update_profile_data
                };

                let trams_profile_updated = await axios.request(update_tram_config_data);
                console.log(trams_profile_updated.data)
                console.log("Trams Profile Updated Successfully")

              }
              else {
                let trams_insert_post_body = {
                  "SessionID": tramSessionID,
                  "DELTADATASET": {
                    "Profile": [
                      {
                        "INSERT": {
                          "profileType_LinkCode": "I",
                          "name": profile_data_result.contact_detail_array.lastname + ("/") + profile_data_result.contact_detail_array.firstname,
                          "title": "",
                          "businessType": "",
                          "firstName": profile_data_result.contact_detail_array.firstname,
                          "lastName": profile_data_result.contact_detail_array.lastname,
                          "middleInit": "",
                          "courtesyTitle": profile_data_result.contact_detail_array.courtesy_title,
                          "modifyBy": profile_data_result.contact_detail_array.middlename === null ?
                            profile_data_result.contact_detail_array.middlename = "" : profile_data_result.contact_detail_array.middlename = profile_data_result.contact_detail_array.middlename,
                          "isActive": "",
                          "salutation": profile_data_result.contact_detail_array.salutation === null ?
                            profile_data_result.contact_detail_array.salutation = "" : profile_data_result.contact_detail_array.salutation = profile_data_result.contact_detail_array.salutation,
                          "Address": [
                            {
                              "INSERT": {
                                "Address1": profile_data_result.address_detail_array[0].address_name,
                                "Address2": profile_data_result.address_detail_array[0].apartment_number,
                                "City": profile_data_result.address_detail_array[0].city,
                                "State": profile_data_result.address_detail_array[0].state,
                                "Zip": profile_data_result.address_detail_array[0].postal_code,
                                "PermitMarket": "",
                                "IsValid": "",
                                "AddressInstance": [
                                  {
                                    "INSERT": {
                                      "AddrType_LinkNo": 1
                                    }
                                  }
                                ]
                              }
                            }
                          ],

                        }
                      }
                    ]
                  }
                };
                let trams_insert_data = JSON.stringify(trams_insert_post_body);
                let config = {
                  method: 'post',
                  maxBodyLength: Infinity,
                  url: 'http://tlt-dev01:8085/profile/applyupdates',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  data: trams_insert_data
                };

                // let inserted_tram_profile_data = await axios.request(config)
                // console.log(inserted_tram_profile_data)
                // return
              }
            }
          } else {
            cosole.log("profile data not found log me ")
          }
        });
      } else {
        console.log("Search Contact not found error log me ")
      }
    }
    catch (error) {
      console.log("something went wrong", error);
    }

  }
}

module.exports = CronController;





