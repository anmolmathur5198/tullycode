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
const {
  tokens,
  userregister,
  logs, hubsagedynamicoptions

} = require("../models");


async function asyncforEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

class TullyTramsController {
  constructor(user) {
    this.user = user;
  }


  async ProfileMappingdashboard(req, res, next) {
    try {
      let user = req.dsuser;
      var contact_property_options = [];
      var optionsofhubsage = await hubsagedynamicoptions.findOne({
        user_id: user._id,
        type: "contactSyncing",
      })

      var profileMappingfields = strings.profileMappingfields ? util.convertToRequestedArray(strings.profileMappingfields) : [];
      var sageFields = profileMappingfields;
      var hubSageFields = [
        { hub: "Cards Custom Object", sage: "Cards" },
        { hub: "Comm Custom Object", sage: "Comm" },
        { hub: "Address Custom Object", sage: "Address" },
        { hub: "Passenger Custom Object", sage: "Passenger" },
        { hub: "Profile Marketing Custom object", sage: "profileMarketing" },
        { hub: "profMoreField Custom Object", sage: "profMoreField" }
      ];

      var hubSagelookupFields = [
        { hub: "Country List", sage: "Address1 Country" },

      ];

      var hubAssociationField = []

      let hoautk = await tokens.findOne({
        tokenname: "hoautk",
        user_id: user._id,
        platform: process.env.PLATFORM,
      }).lean();

      let isExpiredhoautk = util.isTokenExpired(hoautk);

      let update_tokens = {};
      if (hoautk && !isExpiredhoautk) {
        var options = {
          method: "GET",
          url: "https://api.hubapi.com/properties/v1/contacts/properties",
          headers: {
            Authorization: `Bearer ${hoautk.access_token}`,
          },
        };
        const result = await axios(options);
        if (result.data && result.data.length > 0) {
          result.data.forEach((mp) => {
            contact_property_options.push(mp.name);
            if (mp.formField) {
            }
            // contact_property_options.push(mp.name);
          });
        }
        update_tokens = {
          optionsofhubsage,
          autoSyncing: user.autoSyncing,
        };
      }
      res.render("contacts", {
        // webhook: "/api/v1/clients/hubspot_companies",
        webhook: "/api/contacts/" + user._id + "/" + user.hub_id + "?plat=tully",
        store: update_tokens,
        options: contact_property_options.sort((a, b) => a.localeCompare(b)),
        sageFields: sageFields.sort((a, b) => a.localeCompare(b)),
        hubSageFields,
        hubSagelookupFields,
        hubAssociationField
      });
    } catch (error) {
      console.log(error)
      res.render("contacts", {
        store: {},
        options: {},
        sageFields: {},
        hubSageFields: [],
      });
    }
  }

  // tram comm custom object mapping dashboard

  async commCustomObjectMappingDashboard(req, res, next) {
    try {

      let user = req.dsuser;
      var contact_property_options = [];
      var comm_property_options = [];
      var optionsofhubsage = await hubsagedynamicoptions.findOne({
        user_id: user._id,
        type: "commSyncing",
      })
      var profileMappingfields = strings.custom_object_comm_fields ? util.convertToRequestedArray(strings.custom_object_comm_fields) : [];
      var sageFields = profileMappingfields;
      console.log("sage fields", sageFields);

      var hubSageFields = [
        { hub: "Comm Custom Object", sage: "Comm" },
      ];
      var hubSagelookupFields = [
        { hub: "Country List", sage: "Address1 Country" },
      ];

      var hubAssociationField = []

      let hoautk = await tokens.findOne({
        tokenname: "hoautk",
        user_id: user._id,
        platform: process.env.PLATFORM,
      }).lean();

      let isExpiredhoautk = util.isTokenExpired(hoautk);

      let update_tokens = {};
      if (hoautk && !isExpiredhoautk) {
        var options = {
          method: "GET",
          url: "https://api.hubapi.com/crm/v3/properties/Comm",
          headers: {
            Authorization: `Bearer ${hoautk.access_token}`,
          },
        };

        const result = await axios(options);

        if (result && result.data && result.data.results.length > 0) {
          result.data.results.forEach((mp) => {
            contact_property_options.push(mp.name);
            if (mp.formField) {
            }
            // contact_property_options.push(mp.name);
          });
        }
        update_tokens = {
          optionsofhubsage,
          autoSyncing: user.autoSyncing,
        };
      }

      res.render("custom_obj_comm", {
        // webhook: "/api/v1/clients/hubspot_companies",
        // webhook: "/api/address/" + user._id + "/" + user.hub_id + "?plat=tully",
        webhook: "",
        store: update_tokens,
        options: contact_property_options.sort((a, b) => a.localeCompare(b)),
        sageFields: sageFields.sort((a, b) => a.localeCompare(b)),
        hubSageFields,
        hubSagelookupFields,
        hubAssociationField
      });
    } catch (error) {
      console.log(error)
      res.render("custom_obj_comm", {
        store: {},
        options: {},
        sageFields: {},
        hubSageFields: [],
      });
    }
  }
  // address custom object mapping dashboard
  async addressCustomObjectMappingDashboard(req, res, next) {
    try {

      let user = req.dsuser;
      var contact_property_options = [];
      var optionsofhubsage = await hubsagedynamicoptions.findOne({
        user_id: user._id,
        type: "addressSyncing",
      })
      var profileMappingfields = strings.custom_object_address ? util.convertToRequestedArray(strings.custom_object_address) : []; var sageFields = profileMappingfields;
      console.log("sage fields", sageFields);
      var hubSageFields = [
        { hub: "Address Custom Object", sage: "Address" },
      ];
      var hubSagelookupFields = [
        { hub: "Country List", sage: "Address1 Country" },
      ];
      var hubAssociationField = []
      let hoautk = await tokens.findOne({
        tokenname: "hoautk",
        user_id: user._id,
        platform: process.env.PLATFORM,
      }).lean();

      let isExpiredhoautk = util.isTokenExpired(hoautk);

      let update_tokens = {};
      if (hoautk && !isExpiredhoautk) {
        var options = {
          method: "GET",
          url: "https://api.hubapi.com/crm/v3/properties/2-15234392",
          headers: {
            Authorization: `Bearer ${hoautk.access_token}`,
          },
        };

        const result = await axios(options);

        if (result && result.data && result.data.results.length > 0) {
          result.data.results.forEach((mp) => {
            contact_property_options.push(mp.name);
            if (mp.formField) {
            }
            // contact_property_options.push(mp.name);
          });
        }
        update_tokens = {
          optionsofhubsage,
          autoSyncing: user.autoSyncing,
        };
      }

      res.render("custom_obj_address", {
        // webhook: "/api/v1/clients/hubspot_companies",
        // webhook: "/api/address/" + user._id + "/" + user.hub_id + "?plat=tully",
        webhook: "",
        store: update_tokens,
        options: contact_property_options.sort((a, b) => a.localeCompare(b)),
        sageFields: sageFields.sort((a, b) => a.localeCompare(b)),
        hubSageFields,
        hubSagelookupFields,
        hubAssociationField
      });
    } catch (error) {
      console.log(error)
      res.render("custom_obj_address", {
        store: {},
        options: {},
        sageFields: {},
        hubSageFields: [],
      });
    }
  }
  // address custom object mapping dashboard
  async cardCustomObjectMappingDashboard(req, res, next) {
    try {

      let user = req.dsuser;
      var contact_property_options = [];
      var optionsofhubsage = await hubsagedynamicoptions.findOne({
        user_id: user._id,
        type: "cardSyncing",
      })
      var profileMappingfields = strings.custom_object_card ? util.convertToRequestedArray(strings.custom_object_card) : []; var sageFields = profileMappingfields;
      console.log("sage fields", sageFields);
      var hubSageFields = [
        { hub: "Card Custom Object", sage: "Card" },
      ];
      var hubSagelookupFields = [
        { hub: "Country List", sage: "Address1 Country" },
      ];
      var hubAssociationField = []
      let hoautk = await tokens.findOne({
        tokenname: "hoautk",
        user_id: user._id,
        platform: process.env.PLATFORM,
      }).lean();

      let isExpiredhoautk = util.isTokenExpired(hoautk);

      let update_tokens = {};
      if (hoautk && !isExpiredhoautk) {
        var options = {
          method: "GET",
          url: "https://api.hubapi.com/crm/v3/properties/2-15234393",
          headers: {
            Authorization: `Bearer ${hoautk.access_token}`,
          },
        };

        const result = await axios(options);
        if (result && result.data && result.data.results.length > 0) {
          result.data.results.forEach((mp) => {
            contact_property_options.push(mp.name);
            if (mp.formField) {
            }
            // contact_property_options.push(mp.name);
          });
        }
        update_tokens = {
          optionsofhubsage,
          autoSyncing: user.autoSyncing,
        };
      }


      
      res.render("custom_obj_card", {
        // webhook: "/api/v1/clients/hubspot_companies",
        // webhook: "/api/address/" + user._id + "/" + user.hub_id + "?plat=tully",
        webhook: "",
        store: update_tokens,
        options: contact_property_options.sort((a, b) => a.localeCompare(b)),
        sageFields: sageFields.sort((a, b) => a.localeCompare(b)),
        hubSageFields,
        hubSagelookupFields,
        hubAssociationField
      });
    } catch (error) {
      console.log(error)
      res.render("custom_obj_card", {
        store: {},
        options: {},
        sageFields: {},
        hubSageFields: [],
      });
    }
  }


  // save contact mapping  dashboard data
  async saveProfileMapping(req, res) {
    try {
      let data = req.body;
      let user = req.dsuser;

      let huboptions = await hubsagedynamicoptions.findOneAndUpdate(
        {
          user_id: user._id,
          type: "contactSyncing",
          platform: process.env.PLATFORM,
        },
        { user_id: user._id, type: "contactSyncing", ...data },
        { upsert: true, new: true }
      );
      if (huboptions) return res.send({ success: true, data: "Successfully saved options" });
      else return res.send({ success: false, error: "Options not saved" });
    } catch (error) {
      console.error(error);
    }
  }
  // save comm mapping dashboard data
  async saveCommMappingFields(req, res) {
    try {
      let data = req.body;
      let user = req.dsuser;

      let huboptions = await hubsagedynamicoptions.findOneAndUpdate(
        {
          user_id: user._id,
          type: "commSyncing",
          platform: process.env.PLATFORM,
        },
        { user_id: user._id, type: "commSyncing", ...data },
        { upsert: true, new: true }
      );
      if (huboptions) return res.send({ success: true, data: "Successfully saved options" });
      else return res.send({ success: false, error: "Options not saved" });
    } catch (error) {
      console.error(error);
    }
  }
  // save address mapping dsahboard data 
  async saveAddressMappingFields(req, res) {
    try {
      let data = req.body;
      let user = req.dsuser;

      let huboptions = await hubsagedynamicoptions.findOneAndUpdate(
        {
          user_id: user._id,
          type: "addressSyncing",
          platform: process.env.PLATFORM,
        },
        { user_id: user._id, type: "addressSyncing", ...data },
        { upsert: true, new: true }
      );
      if (huboptions) return res.send({ success: true, data: "Successfully saved options" });
      else return res.send({ success: false, error: "Options not saved" });
    } catch (error) {
      console.error(error);
    }
  }

  // save address mapping dsahboard data 
  async saveCardMappingFields(req, res) {
    try {
      let data = req.body;
      let user = req.dsuser;
      let huboptions = await hubsagedynamicoptions.findOneAndUpdate(
        {
          user_id: user._id,
          type: "cardSyncing",
          platform: process.env.PLATFORM,
        },
        { user_id: user._id, type: "cardSyncing", ...data },
        { upsert: true, new: true }
      );
      if (huboptions) return res.send({ success: true, data: "Successfully saved options" });
      else return res.send({ success: false, error: "Options not saved" });
    } catch (error) {
      console.error(error);
    }
  }


  async contactdashboard(req, res, next) {
    try {
      let user = req.dsuser;
      var contact_property_options = [];
      var optionsofhubsage = await hubsagedynamicoptions.findOne({
        user_id: user._id,
        type: "contactSyncing",
      });
      var profileMappingfields = strings.profileMappingfields
        ? util.convertToRequestedArray(strings.profileMappingfields)
        : [];
      var sageFields = profileMappingfields;

      var hubSageFields = [
        { hub: "Firstname", sage: "FirstName" },
        { hub: "Lastname", sage: "LastName" },
        { hub: "Email", sage: "EmailAddress" },
      ];
      var hubSagelookupFields = [
        { hub: "Home Address Country", sage: "Recruit Address2 country" },
        { hub: "Work Address Country", sage: "Recruit Address1 country" },
        {
          hub: "Work address State ",
          sage: "Recruit address1 stateorprovince",
        },

      ];
      var hubAssociationField = [
        { hub: "Company", sage: "Parentcustomerid Value" },
        { hub: "HubSpot Owner Id", sage: "OwnerId" },
      ];
      console.log("typeof hubAssociationField", typeof hubAssociationField)
      let hoautk = await UserToken.findOne({
        tokenname: "hoautk",
        user_id: user._id,
        platform: process.env.PLATFORM,
      }).lean();
      let isExpiredhoautk = util.isTokenExpired(hoautk);
      let update_tokens = {};
      if (hoautk && !isExpiredhoautk) {
        var options = {
          method: "GET",
          url: "https://api.hubapi.com/properties/v1/contacts/properties",
          headers: {
            Authorization: `Bearer ${util.decryptData(hoautk.access_token).data
              }`,
          },
        };
        const result = await axios(options);
        if (result.data && result.data.length > 0) {
          result.data.forEach((mp) => {
            contact_property_options.push(mp.name);
            if (mp.formField) {
            }
          });
        }
        update_tokens = {
          hubspotOauthToken: isExpiredhoautk
            ? "Your Token Is Expired Please Authorize Again"
            : "HubSpot token is Authorized",
          quickbookOauthAccessToken: isExpireddstok
            ? "Your Token is Expired Please Authorize Again"
            : "Dynamics token is Authorized",

          optionsofhubsage,
          autoSyncing: user.autoSyncing,
        };
      }

      res.render("contacts", {
        webhook:
          "/api/contact/" +
          user._id +
          "/" +
          user.hub_id +
          "?plat=tully",
        store: update_tokens,
        options: contact_property_options.sort((a, b) => a.localeCompare(b)),
        sageFields: sageFields.sort((a, b) => a.localeCompare(b)),
        hubSageFields,
        hubSagelookupFields,
        hubAssociationField,
      });
    } catch (error) {
      console.error(error);
      res.render("contacts", {
        store: {},
        options: {},
        sageFields: {},
        hubSageFields: [],
        hubSagelookupFields: [],
        hubAssociationField: [],
      });
    }
  }

  // sync trams profile into hubspot
  async SyncTramProfileToHubspot(req, res) {
    try {
      // let { access_token } = await Tokens.findOne({ tokenname: "TramsSessionId" });      
      let tramsMapping = await hubsagedynamicoptions.findOne({ type: "contactSyncing" }).lean();

      let access_token = "{08BE5B3E-A299-4E7C-81E9-5529C7B37FD6}"
      let rec_no = 295


      // get profile for trams
      const axios = require('axios');
      let data = JSON.stringify({
        "SessionID": access_token,
        "recNo": rec_no,
        "noMetaData": true
      });

      let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://tlt-dev01:8085/Profile/Load',
        headers: {
          'Content-Type': 'application/json'
        },
        data: data
      };

      axios.request(config).then((response) => {
        let tramsProfileData = response.data.result.dataset.data.profile;
        // find hubsage mapping dynamically
        if (!tramsMapping || !tramsMapping.hubSageFields)
          return {
            success: false,
            error: "Mapping fields are not defined",
          };
        let ContactBodyHS = {};
        tramsMapping.hubSageFields.map((vr) => {


          if (tramsProfileData[0][vr.sage] && vr.preference && (vr.preference == "1" || vr.preference == "1")) {
            ContactBodyHS[vr.hub] = tramsProfileData[0][vr.sage]
          }
        });


        //save the data into hubspot create contact
        // let data = JSON.stringify({
        //   "properties": {
        //     "company": "",
        //     "email": "",
        //     "firstname": ContactBodyHS.firstname,
        //     "lastname": ContactBodyHS.lastname,
        //     "phone": "",
        //     "website": ""
        //   }
        // });

        // 91139b15-3410-40c6-a3ec-af12e54310e0
        console.log("ContactBodyHS", ContactBodyHS)
        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://api.hubapi.com/crm/v3/objects/contacts',
          headers: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${hoautk.access_token}`
          },
          data: ContactBodyHS
        };
        axios.request(config).then((response) => {
          console.log("Contact Saved Successfully")
        }).catch((error) => {
          console.log(error);
        });

        // success repoonse
        res.send({
          code: 200,
          error: false,
          message: "Contact Created Successfully"
        })
        console.log(error);
      });

    } catch (error) {
      console.log("error", error)
    }
  }

  async getHubSpotRefreshToken() {
    let { access_token } = await tokens.findOne({ "tokenname": "hoautk" })
    return access_token;
  }

  async getContactFromHubSpotThroughWebhook(req, res, next) {
    try {
      let { objectId } = req.body[0]
      console.log(req.body);
      console.log("objectID", objectId);
      let access_token = await this.getHubSpotRefreshToken();
      console.log("access_token", access_token);
      let { data } = await axios.get(`https://api.hubapi.com/crm/v3/objects/contacts/${objectId}`, { 'headers': { 'Authorization': `Bearer ${access_token}` } });
      console.log("hello", data);
    }
    catch (err) {
      console.log("error", err)
    }

  }



}

module.exports = TullyTramsController;