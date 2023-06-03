var axios = require("axios");
var request = require("request");
var moment = require("moment");
var { tokens, userregister } = require("../../models");
var { encryptData, decryptData } = require("../../middleware/auth");
const ErrorResponse = require("../../utils/ErrorRespnse");

exports.hubspotauthcallback = async (req, res, next) => {
  try {
    if (req.query.code) {
      // Handle the received code
      var options = {
        method: "POST",
        url: "https://api.hubapi.com/oauth/v1/token",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        form: {
          grant_type: "authorization_code",
          client_id: process.env.HUBSPOT_CLIENT_ID,
          client_secret: process.env.HUBSPOT_CLIENT_SECRET,
          redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
          code: req.query.code,
        },
      };
      request(options, async function (error, response) {
        if (error) throw new Error(error);
        // console.log(response.body);
        let data = JSON.parse(response.body);
        let account_details = await axios.get(`https://api.hubapi.com/oauth/v1/access-tokens/${data.access_token}`);

        account_details = JSON.parse(JSON.stringify(account_details.data));
        account_details = {
          email: account_details.user,
          hub_domain: account_details.hub_domain,
          hub_id: account_details.hub_id,
          app_id: account_details.app_id,
          user_id: account_details.user_id,
          token_type: account_details.token_type,
        };

        let updateOrCreateUser = await userregister.findOneAndUpdate(
          { email: account_details.email },
          {
            email: account_details.email,
            hub_domain: account_details.hub_domain,
            hub_id: account_details.hub_id,
            app_id: account_details.app_id,
            user_id: account_details.user_id,
            token_type: account_details.token_type,
          },
          { new: true, upsert: true }
        );

        if (updateOrCreateUser) {
          tokens.findOneAndUpdate(
            {
              tokenname: "hoautk",
              user_id: updateOrCreateUser._id,
              platform: process.env.PLATFORM,
            },
            {
              tokenname: "hoautk",
              platform: process.env.PLATFORM,
              user_id: updateOrCreateUser._id,
              access_token: encryptData({ data: data.access_token }),
              refresh_token: encryptData({ data: data.refresh_token }),
              access_token_expire_in: data.expires_in,
              refresh_token_expire_in: data.expires_in,
            },
            { new: true, upsert: true },
            (err, data) => {
              if (err) throw err;
              // console.log({ token: data });
            }
          );
        }

        let token = encryptData(updateOrCreateUser);
        res.cookie("hvrif", token);
        res.redirect("/dashboard" + `?hvrif=${encodeURIComponent(token)}&plat=${encodeURIComponent(process.env.PLATFORM)}`);
      });
    }
  } catch (error) {
    next(new ErrorResponse("Hubspot callback issue", "500", "Hubspot Authetication"));
    return res.send({ success: false, error });
  }
};

exports.refreshHubSpotToken = async (req, res, next) => {
  try {
   // console.log("Crmcontroller Refreshing HubSpot Token");
    let hoautk = await tokens.findOne({ tokenname: "hoautk", user_id: global.user._id, platform: process.env.PLATFORM }).lean();
    let isExpired = isTokenExpired(hoautk);
    console.log({ isExpired });
    if (isExpired) {
      if (hoautk) {
        var data = qs.stringify({
          client_id: process.env.HUBSPOT_CLIENT_ID,
          client_secret: process.env.HUBSPOT_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: decryptData(hoautk.refresh_token).data,
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
              access_token: encryptData({ data: result.data.access_token }),
              refresh_token: encryptData({ data: result.data.refresh_token }),
              access_token_expire_in: result.data.expires_in,
              refresh_token_expire_in: result.data.expires_in,
            },
            { new: true, upsert: true },
            (err, data) => {
              if (err) throw err;
              // console.log({ token: data });
            }
          );
          console.log({ refreshToken: result.data });
          console.log("HubSpot Token Refreshed");
          // res.cookie("hoautk", encryptData({ data: result.data.access_token }));
          // res.cookie(
          //   "hoaurtk",
          //   encryptData({ data: result.data.refresh_token })
          // );
          res.cookie("hvrif", token);
          next();
          // return res.redirect(
          //   "/hco" +
          //     `?hvrif=${encodeURIComponent(
          //       req.query.hvrif
          //     )}&plat=${encodeURIComponent(process.env.PLATFORM)}`
          // );
        }
      } else {
        next(new ErrorResponse("HubSpot Token Not Verified", "500", "Hubspot Authetication"));
      }
    } else {
      console.log("Token Not Expired Yet");

      next();
    }
  } catch (error) {
    /*  tokens.findOneAndRemove({ tokenname: "hoautk", user_id: global.user._id },
              (err, res) => {}
          );*/
    return res.redirect("/api/auth/hubspot");
    // return { success: false, error };
  }
};

exports.getHubSpotAccountDetails = async (req, res, next) => {
  try {
    let user = req.dsuser;
    let get_owner_account_data = await axios.get(`${process.env.HUBSPOT_API_URL}/crm/v3/owners/?email=${user.email}`, {
      headers: {
        Authorization: `Bearer ${user.hoautk}`,
      },
    });
    // Getting Owner Account User Details
    if (get_owner_account_data.status == 200) get_owner_account_data = JSON.parse(JSON.stringify(get_owner_account_data.data.results[0]));
    delete user.password;
    return res.send({
      success: true,
      data: { ...get_owner_account_data, ...user },
    });
  } catch (error) {
    console.log(error);
    //next(new Error("Account not found"));
    next(new ErrorResponse("Account not found", "500", "Hubspot Authetication"));
    return res.send({ success: false, error: "Account not found" });
  }
};
