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


  async getHubSpotRefreshToken() {
    let { access_token } = await tokens.findOne({ "tokenname": "hoautk" }).lean();
    return access_token;
  }


  async ProfileMappingdashboard(req, res, next) {
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
        { hub: "Name", sage: "Name" },
        { hub: "Domain", sage: "WebsiteUrl" },
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

  async getContactFromHubSpotThroughWebhook(req, res, next) {
    try {
      let { objectId } = req.body[0]
      console.log(req.body);
      console.log("objectID", objectId);
      let access_token = await this.getHubSpotRefreshToken();
      console.log("access_token", access_token);
      let { data } = await axios.get(`https://api.hubapi.com/crm/v3/objects/contacts/${objectId}`, { 'headers': { 'Authorization': `Bearer COqS29qIMRIUkAUSUAAA-SIAAED8BwEA4AcAAAQYmYv8EiCEz5YYKNzPXzIUk_zQkqFVAQ4djPrDWkTZHUbLqME6PQAERMEAAAAAPPgHAGCAgAAAhgAAQAAGBAgAICCc_w8-AOAxAAAAAATA__8fABDwCwAAgP__AwAAgAAA4AFCFNJ-bEYGe2whlBpkuytn3LVE4NlrSgNuYTFSAFoA` } });
      console.log("hello", data);
    }
    catch (err) {
      console.log("error", err)
    }

  }









}

module.exports = TullyTramsController;