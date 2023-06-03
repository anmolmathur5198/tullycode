var CryptoJS = require("crypto-js");
var moment = require("moment");
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "turner.hoeger@ethereal.email",
    pass: "vUsWfDWwMqc8zhBcmt",
  },
});
exports.encryptData = (data) => {
  try {
    var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), process.env.CRYPTO_SECRET).toString();
    return ciphertext;
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.decryptData = (data) => {
  try {
    var bytes = CryptoJS.AES.decrypt(data, process.env.CRYPTO_SECRET);
    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  } catch (error) {
    console.log(error);
    return error;
  }
};
exports.sendforgotpasswordmail = async (user = "", token = "") => {
  console.log(user, " ", token);

  let info = await transporter.sendMail({
    from: "sharadkumar.bhatara@dotsquares.com", // sender address
    to: `${user.email}`, // list of receivers
    subject: "Forgot password email", // Subject line

    html: `hello ${user.firstname}<br/>
        Please visit below link for <br> <a href="http://localhost:3005/reset-password/${token}">http://localhost:3005/reset-password/${token}</a>`, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};
exports.generateRandomString = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
exports.isTokenExpired = (tokenStore) => {
  return Date.now() >= new Date(tokenStore.updatedAt).getTime() + tokenStore.access_token_expire_in * 1000;
};

exports.replaceKeyinObject = (data, fromkey, tokey) => {
  data[tokey] = data[fromkey];
  delete data[fromkey];
};

let chanegeToPascalCase = (string) =>
  string.replace(/\w+/g, function (w) {
    return w[0].toUpperCase() + w.slice(1).toLowerCase();
  });
exports.convertToRequestedArray = (test_body) => {
  let deal_body = [];
  //   console.log({ test_body });
  Object.entries(test_body).map(([key, val], i) => {
    if (val && typeof val == "object") {
      // console.log({a:val instanceof Array, b:Array.isArray(val),c:typeof val,d:key})
      if (!Array.isArray(val)) {
        Object.entries(val).map(([vl, vall]) => {
          if (vall && typeof vall == "object") {
            // console.log({ key, vl, vall, type: typeof vall });
            Object.entries(vall).map(([skkey, skvalue]) => {
              if (typeof skvalue !== "object") {
                deal_body.push(key + ":" + vl + ":" + skkey);
              }
            });
          } else {
            deal_body.push(key + ":" + vl);
          }
          // console.log({ vl, vall });
        });
      }
      // invoice_body.splice(i, 1);
      delete test_body[i];
    } else {
      if(!key.includes("_value")){
          deal_body.push(key);
      }
      delete test_body[i];
    }
  });
  return deal_body;
};
