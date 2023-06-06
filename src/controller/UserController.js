const {
  userregister,
  dynamicproducts,
  tokens: UserToken,
  logs,
  hubsagedynamicoptions,
  mercury_companies,
  mercury_contacts,
} = require("../models");
const bcrypt = require("bcryptjs");
const tokens = require("../utils/util");
const nodemailer = require('nodemailer');
const ErrorResponse = require("../utils/ErrorRespnse");
var axios = require('axios');
const moment = require("moment");
const later = require("later");
const cronMercury = require("../configuration/cron");
const CronTime = require("cron").CronTime;

async function asyncforEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

exports.registerUserController = async (req, res, next) => {
  let data = req.body;
  let user = await userregister.findOne({ email: data.email });
  async function create_hubspot_user(updated_data) {
    try {
      let hubspot_create_user_body = {
        properties: {
          email: updated_data.email,
          firstname: updated_data.firstname,
          lastname: updated_data.lastname,
          phone: updated_data.mobile_no || "",
          hs_lead_status: "NEW",
          platform: process.env.PLATFORM,
        },
      };
      // await axios.post("https://api.hubapi.com/crm/v3/objects/contacts?hapikey=83d50456-ff8a-4c07-a8fb-ebb76f8c567b", hubspot_create_user_body);
    } catch (error) {
      console.log(error);
    }
  }
  if (user) {
    if (user.password) {
      const Message = "Email already register";
      res.render('register', { error: Message });
      console.log("invalid email")
      console.log("email alredy register")

      // return res.send({ success: false, error: "User Already Registered" });
    } else {
      if (data.password) {
        data["password"] = bcrypt.hashSync(data.password, 10);
      }
      let newUser = await userregister.findOneAndUpdate(
        { email: data.email },
        data,
        {
          upsert: true,
          new: true,
        }
      );
      newUser = JSON.parse(JSON.stringify(newUser));
      newUser["token"] = tokens.encryptData(newUser);
      await create_hubspot_user(newUser);
      logme({
        user,
        from: "Trams",
        status: "Success",
        type: "User register successfully",
        message: `User register successfully`,

      });
      res.redirect("/api/auth/hubspot")
      return
      return res.send({
        success: true,
        data: "User successfully registered",
        redirectTo: "/api/auth/hubspot",
      });
    }
  } else {
    if (data.password) {
      data["password"] = bcrypt.hashSync(data.password, 10);
    }
    let register = await new userregister(data).save();
    if (register) {
      let user = JSON.parse(JSON.stringify(register));
      user["token"] = tokens.encryptData(register);
      await create_hubspot_user(user);
      res.redirect("/api/auth/hubspot")
      return
      return res.send({
        success: true,
        data: "User successfully registered",
        redirectTo: "/api/auth/hubspot",
      });
    } else {
      console.log("user not register")
      // return res.send({ success: false, error: "User Not Registered" });
    }
  }
};

exports.loginUserController = async (req, res) => {
  let data = req.body;
  try {
    if (data.email) {
      let user = await userregister.findOne({ email: data.email });
      user = JSON.parse(JSON.stringify(user));
      if (user) {
        if (!user.password) {
        }
        let checkpassword = bcrypt.compareSync(data.password, user.password);
        // console.log(user);
        if (checkpassword) {
          let hoautk = await UserToken.findOne({
            tokenname: "hoautk",
            user_id: user._id,
            platform: process.env.PLATFORM,
          });

          //  console.log({ hoautk, ds365 });
          if (!hoautk) {
            return res.redirect("/api/auth/hubspot");
          } else {
            console.log({ tokenexpireation: "Token expired" });
            if (tokens.isTokenExpired(hoautk)) {
              return res.send({
                success: false,
                error: "Token Expired",
                redirectTo: "/api/auth/hubspot",
              });
            } else {
              res.cookie(
                "hvrif",
                encodeURIComponent(tokens.encryptData(user))
              );
              logme({
                user,
                from: "Admin",
                status: "Success",
                type: "User login successfully",
                message: `User login successfully`,

              });
              res.redirect("/appdashboard" + `?hvrif=${encodeURIComponent(tokens.encryptData(user))}&plat=${encodeURIComponent(process.env.PLATFORM)}`)

              return
            }
          }

        } else {
          const Message = "Please enter valid password";

          let transporter = nodemailer.createTransport({
            host: `mail.24livehost.com`,
            pool: true,
            port: 587,
            tls: { rejectUnauthorized: false },
            auth: {
              user: 'testna11@24livehost.com',
              pass: 'LQovkuOS7v'
            }
          });
          var mailOptions = {
            from: "testna11@24livehost.com",
            to: "deepakkumar.yadav@dotsquares.com",
            bcc: "dharmendra.joshi@dotsquares.com",
            subject: `Error in ZOHO login Dashboard`,
            text: `${Message}`,
          };
          console.log("mailOptions", mailOptions)
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
          res.render('login', { errors: Message });
          console.log("invalid email")
        }

      } else {
        const Message = "Please enter valid email";
        res.render('login', { error: Message });
        let transporter = nodemailer.createTransport({
          host: `mail.24livehost.com`,
          pool: true,
          port: 587,
          tls: { rejectUnauthorized: false },
          auth: {
            user: 'testna11@24livehost.com',
            pass: 'LQovkuOS7v'
          }
        });
        var mailOptions = {
          from: "testna11@24livehost.com",
          to: "deepakkumar.yadav@dotsquares.com",
          bcc: "dharmendra.joshi@dotsquares.com",
          subject: `Error in Trams login Dashboard`,
          text: `${Message}`,
        };
        console.log("mailOptions", mailOptions)
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
        console.log("invalid email")



      }
    } else {
      console.log("please enter email and passwor")
      // return res.send({
      //   success: false,
      //   error: "Please enter valid Email or password",
      // });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.changePassword = async (req, res) => {
  try {
    let user = req.dsuser;
    //console.log(user);
    let data = req.body;
    let getUser = await userregister.findOne({ _id: user._id }).lean();
    if (!data.password || !data.confirm_password || !data.old_password)
      return res
        .status(203)
        .send({ success: false, error: "All fields are required" });
    let checkpassword = bcrypt.compareSync(data.old_password, getUser.password);
    // console.log(user);
    if (checkpassword) {
      if (data.password !== data.confirm_password)
        return res.status(203).send({
          success: false,
          error: "Password doesn't matched with confirm password",
        });

      if (data.password) {
        data["password"] = bcrypt.hashSync(data.password, 10);
        let update = await userregister.findOneAndUpdate(
          { _id: user._id },
          { $set: { password: data.password } },
          { new: true }
        );
        if (update) {
          return res
            .clearCookie("hvrif")
            .send({ success: true, data: "Password successfully Updated" });
        } else
          return res
            .status(204)
            .send({ success: false, error: "Password failed to update" });
      }
    } else {
      return res
        .status(203)
        .send({ success: false, error: "Old password doesn't matched" });
    }
  } catch (error) {
    return res.status(500).send({
      success: false,
      error: "Failed to change password",
    });
  }
};

exports.resetpassword = async (req, res) => {
  try {
    //let user = req.dsuser;
    let user = tokens.decryptData(decodeURIComponent(req.cookies.hvrif));
    //console.log(user)
    let data = req.body;
    let getUser = await userregister.findOne({ _id: user._id }).lean();
    if (!data.password || !data.confirm_password) {
      //res.clearCookie("hvrif");
      return res
        .clearCookie("hvrif")
        .status(203)
        .send({ success: false, error: "All fields are required" });
    }
    // console.log(user);

    if (data.password !== data.confirm_password) {
      //res.clearCookie("hvrif");
      return res.status(203).send({
        success: false,
        error: "Password doesn't matched with confirm password",
      });
    }
    if (data.password) {
      data["password"] = bcrypt.hashSync(data.password, 10);
      let update = await userregister.findOneAndUpdate(
        { _id: user._id },
        { $set: { password: data.password } },
        { new: true }
      );
      if (update) {
        //res.clearCookie("hvrif");
        return res
          .clearCookie("hvrif")
          .send({ success: true, data: "Password successfully Updated" });
      } else
        return res
          .status(204)
          .send({ success: false, error: "Password failed to update" });
    }
  } catch (error) {
    return res.status(403).send({
      success: false,
      error: "Email faild to send",
    });
  }
};

exports.checkresetpassword = async (req, res) => {
  let token = req.params.token;
  let getUser = await userregister
    .findOne({ reset_password_token: token })
    .lean();
  if (getUser) {
    if (getUser.token_used == "no") {
      userregister
        .findOneAndUpdate(
          { reset_password_token: token },
          { $set: { token_used: "yes" } }
        )
        .then(async (getData) => {
          res
            .cookie("hvrif", encodeURIComponent(tokens.encryptData(getUser)))
            .render("reset-password");
        });
    } else {
      res.clearCookie("hvrif").redirect("/");
    }
  } else {
    res.clearCookie("hvrif").redirect("/");
  }
  //console.log(token)
};

exports.forgotPassword = async (req, res) => {
  try {
    let data = req.body;
    //    console.log(data.email);
    let reset_token = tokens.generateRandomString();

    await userregister
      .findOneAndUpdate(
        { email: data.email },
        { $set: { reset_password_token: reset_token, token_used: "no" } }
      )
      .then(async (getData) => {
        if (getData) {
          let message = tokens.sendforgotpasswordmail(getData, reset_token);

          return res.send({
            success: true,
            data: "Verfification mail successfully send to Registered email Id",
          });
        } else {
          return res
            .status(203)
            .send({ success: false, error: "Email doesn't exists" });
        }
      })
      .catch((err) => {
        return res
          .status(203)
          .send({ success: false, error: "Email doesn't exists" });
      });
  } catch (error) {
    return res.status(403).send({
      success: false,
      error: "Email faild to send",
    });
  }
};

exports.appdashboard = async (req, res) => {
  try {
    let user = req.dsuser;
    console.log("--", user)
    let duser = await userregister.findOne({ _id: user._id }).lean();

    let users = await userregister.find().lean();

    let store = {
      hub_id: user.hub_id,
      dynamics_resourceURL: user.dynamicsresourceurl
      ,
      fullurl: user.dynamicsresourceurl,
      total_users: users.length,
      apps: 2,
      users,
      duser,
    };
    // console.log(getlogs);
    //console.log(store);
    return res.render("appdashboard", { store });
  } catch (error) {
    console.error(error);
  }
};


exports.logsdata = async (req, res) => {
  console.log("hi", req.body.typeVal)
  let str = req.body.typeVal;
  let startdate = str.substring(0, str.lastIndexOf('-')).trim();
  const strs = req.body.typeVal;
  const maxdate = strs.substring(strs.indexOf('-') + 2);
  let duser = await logs.find({ createdAt: { $gte: new Date(startdate), $lt: new Date(maxdate) } }).lean();
  //console.log("duser",duser)
  console.log(startdate);
  console.log(maxdate);
  return res.send(duser)


}

exports.getLogs = async (req, res, next) => {
  let logdata = await logs.find({}).lean();
  // console.log("logArray",logArray)
  let user = req.dsuser;
  let mcontact = 0
  let mcompany = 0
  res.render("logs", { moment: moment, count: mcontact + mcompany, logdata });
};

exports.EmailSettings = async (req, res) => {
  try {
    let user = req.dsuser;
    let data = req.body;
    let getUser = await userregister.findOne({ _id: user._id }).lean();
    //console.log("changeResourceURL--->", data);
    if (!data)
      return res
        .status(403)
        .send({ success: false, error: "Email Settings Data is required" });

    // console.log("*",sched);

    let update = await userregister.findOneAndUpdate(
      { _id: user._id },
      { $set: { settings: data } },
      { new: true }
    );
    if (update) {
      job.stop();
      job.setTime(new CronTime(data.crontime));
      job.start();
      return res.send({
        success: true,
        data: "Email Settings Data successfully Updated",
      });
    } else
      return res.status(403).send({
        success: false,
        error: "Email Settings Data failed to update",
      });
  } catch (error) {
    return res.status(500).send({
      success: false,
      error: "Failed to change Resource URL",
    });
  }
};

exports.manageServices = async (req, res) => {
  console.log("ff")

  try {
    let user = req.dsuser;

    let data = req.body;
    let getUser = await userregister.findOne({ _id: user._id }).lean();

    if (!data)
      return res.status(403).send({ success: false, error: "No body found" });
    let update = await userregister.findOneAndUpdate(
      { _id: user._id },
      { $set: { AllSyncingStatus: data.syncingStatus } },
      { new: true }
    );

    if (update) {
      logme({
        user,
        from: "Trams",
        to: "HubSpot",
        status: "Success",
        type: "Company Syncing Services",
        message: `Company Syncing Services successfully updated`,
        source: "",
      });
      return res.send({
        success: true,
        data: "Syncing Services successfully Updated",
        syncing: update.AllSyncingStatus,
      });
    } else
      logme({
        user,
        from: "Trams",
        to: "HubSpot",
        status: "Error",
        type: "Login",
        message: `Company Syncing Services failed to update`,
        source: new Error(
          error.response ? JSON.stringify(error.response.data) : error
        ).stack.toString(),
      });
    return res.status(403).send({
      success: false,
      error: "Syncing Services failed to update",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      error: "Failed to change Resource URL",
    });
  }
};

exports.serversidelogs = async (req, res) => {
  try {
    let user = req.dsuser;
    let users = await userregister.find().lean();
    var recordsFiltered;
    var recordsTotal;
    var searchStr;
    var Logdata = [];


    let requestedJsonSearch = {};
    let columns = [];

    if (req.query.columns && req.query.columns.length > 0) {
      req.query.columns.map((mp) => {

        if (mp.name == "srno") return;
        if (mp.name == "Date") {
          // console.log("in logs function", mp.search.value)

          if (mp.search.value !== "") {
            // console.log("sd", mp.search.value);
            let ddts = mp.search.value;
            if (ddts) ddts = ddts.split('-');

            let minDate = ddts[0] ? ddts[0].trim() : null;
            let maxDate = ddts[1] ? ddts[1].trim() : null;
            if (minDate == maxDate) {
              requestedJsonSearch["createdAt"] = {
                $gte: new Date(moment(minDate, 'MM/DD/YYYY')),
                $lt: new Date(
                  moment(minDate, 'MM/DD/YYYY').add(1, "day").format("YYYY-MM-DD")
                ),
              };
            } else {
              requestedJsonSearch["createdAt"] = {
                $gte: new Date(moment(minDate, 'MM/DD/YYYY')),
                $lte: new Date(moment(maxDate, 'MM/DD/YYYY')),
              };
            }
          }
          return;
        }
        if (mp.search.value !== "") {
          let vvl = mp.search.value;
          requestedJsonSearch[mp.name] = {
            $regex: mp.search.value,
            $options: "i",
          };
        }
      });
    }

    logs.countDocuments({}, async function (err, c) {
      recordsTotal = c;
      await logs.countDocuments(requestedJsonSearch, async function (err, c) {
        recordsFiltered = c;
        // console.log(requestedJsonSearch);
        // console.log(req.query.length);
        let log = await logs
          .find(
            requestedJsonSearch,
            "_id createdAt type status message from to source"
          )
          .skip(Number(req.query.start))
          .limit(Number(req.query.length))
          .sort({ createdAt: -1 })
          .lean();
        //  console.log(log.count)
        log.map((mp, i) => {
          Logdata.push({
            sno: Number(req.query.start) + i + 1,
            ago:
              moment(mp.createdAt)
                .utcOffset("+05:30")
                .format("DD, MMM HH:mm:ss A") +
              ", " +
              moment(mp.createdAt).utcOffset("+05:30").fromNow(),
            type: mp.type,
            status: mp.status,
            message: mp.message,
            from: mp.from,
            to: mp.to,
            createdAt: moment(mp.createdAt)
              .utcOffset("+05:30")
              .format("YYYY-MM-DD HH:mm:ss A"),

            source: `${mp.source
              ? mp.source.replace(/\`|\/|\\|[&\/\\#,+()$~%.'":*?<>{}]/g, " ")
              : ""
              }`,
          });
        });

        // console.log(Logdata);

        var data = JSON.stringify({
          draw: req.body.draw,
          recordsFiltered: recordsFiltered,
          recordsTotal: recordsTotal,
          data: Logdata,
        });
        return res.send(data);
      });
    });
  } catch (error) {
    console.error(error.response);
  }
};





