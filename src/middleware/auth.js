var CryptoJS = require("crypto-js");
var request = require("request");
const { tokens, userregister } = require("../models");
const axios = require("axios");
const qs = require("qs");
const { isTokenExpired, encryptData, decryptData } = require("../utils/util");
const croncontroller = require("../controller/croncontroller");


exports.refreshTokens = async (req, res, next) => {
  req.dsuser = {};
  req.session.flash = {};
  const hubToken = await this.refreshHubSpotToken(req, res);
  if (hubToken.success) {
    console.log("HubSpot Token Working");
    next();
  } else {
    // console.log(uttil(hubToken));
    return res.redirect("/api/auth/hubspot");
  }


};
exports.refreshHubSpotToken = refreshHubSpotToken = async (req) => {
  try {
    global.user = decryptData(req.query.hvrif);
    let getUser
    if (global.user && global.user.email) {
      getUser = await userregister.findOne({ email: user.email }).lean();
      req.dsuser = getUser;
      // console.log({ getUser });
      if (!getUser) {
        return {
          success: false,
          error: "Authentication Failed",
        };
      }
    } else {
      return {
        success: false,
        error: "Authentication Failed",
      };
    }
    let hoautk = await tokens
      .findOne({
        tokenname: "hoautk",
        user_id: global.user._id,
        platform: process.env.PLATFORM,
      })
      .lean();
    // console.log({ hhh: hoautk });
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
        if (result.data && result.data.access_token) {
          tokens.findOneAndUpdate(
            {
              tokenname: "hoautk",
              user_id: global.user._id,
              platform: process.env.PLATFORM,
            },
            {
              tokenname: "hoautk",
              user_id: global.user._id,
              platform: process.env.PLATFORM,
              access_token: result.data.access_token,
              refresh_token: result.data.refresh_token,
              access_token_expire_in: result.data.expires_in,
              refresh_token_expire_in: result.data.expires_in,
            },
            { new: true, upsert: true },
            (err, data) => {
              if (err) throw { success: false, error: err };
              req.dsuser["hoautk"] = result.data.access_token;
            }
          );
          return { success: true, data: result.data };
        }
      } else {
        return { success: false, error: "HubSpot Token Not Verified" };
      }
    } else {
      req.dsuser["hoautk"] = hoautk.access_token;
      return {
        success: true,
        data: "HubSpot token not expired token working",
      };
    }
  } catch (error) {
    return { success: false, error };
  }
};

exports.verifyUserbyhvrif = verifyUserbyhvrif = async (req, res, next) => {
  try {
    req.dsuser = {};
    if (!req.query.hvrif) return res.status(203).send({ success: false, error: "Hvrif token not found" });
    let user = decryptData(req.query.hvrif);
    if (user instanceof Error) {
      return next(pushError("Token is Malfunctioned"));
    }
    if (user && user.email) {
      let getUser = await userregister.findOne({ email: user.email });
      if (!getUser)
        return {
          success: false,
          error: "Authentication Failed",
        };
      else {
        req.dsuser = getUser;
        next();
      }
    } else {
      return {
        success: false,
        error: "Authentication Failed",
      };
    }
  } catch (error) {
    console.error(error);
    return res.status(203).send({ success: false, error: "User not verfied" });
  }
};

exports.verifyUserandRefreshTokensforTriggeringDealsMiddleware = async (req, res, next) => {
  try {
    req.dsuser = {};
    console.log(req.params)
    console.log(req.query)

    if (!req.params.id) return res.send({ success: false, error: "Contact Id is not defined in the query" });
    // if (!req.query.plat) return res.send({ success: false, error: "User Platform is not defined in the query" });
    // if (!req.params.portalId) return res.send({ success: false, error: "HubSpot portalId is not defined in the query" });
    // if (!req.params.dealconnectionid) return res.send({ success: false, error: "HubSpot Deal connection id is not defined in the query" });
    let user = await userregister.findOne({ _id: req.params.id }).lean();
    if (!user) return res.send({ success: false, error: "User not found with the query parameter Id" });
    /** validate to run services  */

    console.log("Hey All validation check")
    if (!user.AllSyncingStatus)
      return res.send({
        success: false,
        error: "Services are currently off",
      });
    /** End services validation  */

    console.log("Hey All validation ssuccess")

    let hoautk = await tokens
      .findOne({
        tokenname: "hoautk",
        user_id: req.params.id,
        //  platform: req.query.plat,
      })
      .lean();

    if (!hoautk) return res.send({ success: false, error: "HubSpot Token not found" });
    req.dsuser = user;
    if (hoautk) {
      let isExpiredhoautk = isTokenExpired(hoautk);
      if (isExpiredhoautk) {
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
        try {
          const result = await axios(config);
          if (result.data && result.data.access_token) {
            await tokens.findOneAndUpdate(
              {
                tokenname: "hoautk",
                user_id: req.params.id,
                //  platform: req.query.plat,
              },
              {
                tokenname: "hoautk",
                user_id: req.params.id,
                platform: req.query.plat,
                access_token: result.data.access_token,
                refresh_token: result.data.refresh_token,
                access_token_expire_in: result.data.expires_in,
                refresh_token_expire_in: result.data.expires_in,
              },
              { new: true, upsert: true }
            );
            req.dsuser["hoautk"] = result.data.access_token;
          }
        } catch (error) {
          return res.send({ success: false, error: "HubSpot token failed to Update" });
        }
      } else {
        req.dsuser["hoautk"] = hoautk.access_token;
        next();
      }

    } else {
      return res.status(403).send({ success: false, error: "Tokens not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ success: false, error: "User not verfied" });
  }
};

let calls = {};
function createcallCounts(call) {
  calls[call["name"]] = {
    method: call["method"],
    count: calls[call["name"]] ? calls[call["name"]]["count"] + 1 : 1,
  };
  console.log(getCallCount(call));
  return getCallCount(call);
}
function getCallCount(call) {
  if (calls[call["name"]] && calls[call["name"]]["count"]) {
    return calls[call["name"]]["count"];
  } else return 0;
}
function removecallCounts(call) {
  delete calls[call["name"]];
  return getCallCount(call);
}

function rejectParallelCalls(contactDetail, req) {
  let cr = createcallCounts({
    name: req.path.replace(/\//g, "_") + contactDetail.Value,
    method: req.method,
  });
  // console.log(req.method, "Call COUnt "+ callCount);
  if (cr > 1) {
    console.log(
      "Rejecting " + req.path + " Request for Multiple API Call " + cr
    );
    setTimeout(() => {
      removecallCounts({
        name: req.path.replace(/\//g, "_") + contactDetail.Value,
        method: req.method,
      });
      // console.log("Now Hit Again")
    }, 10000);
    return { success: false }
  } else {
    return { success: true }
  }
}

var rate = 1000; // in milliseconds
var throttle = require("promise-ratelimit")(rate);
var i = 0;
exports.checksyncstatusfromDStoHS = async (req, res, next) => {
  try {
    // console.log({path:req.path})
    i++
    let user = await userregister
      .findOne({ email: process.env.MAIN_PLATFORM_ID })
      .lean();
    console.log("Syncing Status ", user.AllSyncingStatus, "M_HS Call Count " + i);

    if (!user.AllSyncingStatus)
      return res.send({
        success: false,
        error: "Services are currently off",
      });
    await throttle();
    if (user) {
      let cron = new croncontroller(user);
      console.log("hell")
      cron.refreshTokens(user).then((data) => {
        console.log('hell1', data)
        next();
      }).catch((err) => { console.log("RefreshTokenError", err) })
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ success: false, error: "User not verfied" });
  }
};

exports.damLimitContact = (req, res, next) => {
  let contactDetail = req.body.find((item) => item.Key == "contactid");
  if (!rejectParallelCalls(contactDetail, req)) {
    return res
      .status(204)
      .send({
        success: false,
        error: "API call rejected due to Rate Limiting for User",
      });
  }
  next();
}

exports.damLimitCompany = (req, res, next) => {
  let companyDataValid = req.body.find((item) => item.Key == "accountid");
  if (!rejectParallelCalls(companyDataValid, req)) {
    return res
      .status(204)
      .send({
        success: false,
        error: "API call rejected due to Rate Limiting for User",
      });
  }
  next();
}
