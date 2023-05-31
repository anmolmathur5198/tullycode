require("dotenv").config();
var cookieSession = require("cookie-session");
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const colors = require("colors");
const bodyParser = require("body-parser");
const errorHandler = require("./middleware/errorHandler");
const axios = require('axios')

var db = require("./configuration/db");
try {
  app.use(cors({ credentials: true })); //method solve cors origin issues
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(express.json({ extended: false }));
  app.use(express.static(path.join(__dirname, "../public")));
  app.set("trust proxy", 1); // trust first proxy
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");
  const router = require("./router/route");
  const apiRoutes = require("./router/api/APIRoutes");
  app.use(
    cookieSession({
      name: "session",
      keys: ["key1"],
      overwrite: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })
  );

  app.use("/api", apiRoutes);
  app.use(router);
  app.use(errorHandler);
  db();
  
  require("./configuration/cron").runCron();
  axios.interceptors.request.use(function (config) {
    // Do something before request is sent
  //  console.log("I'm intercepting axios call")
    return config;
  }, function (error) {
    // Do something with request error
    return Promise.reject(error);
  });

//   const fs = require("fs");
// const util = require("util");

// let dir = path.resolve(__dirname, `./logs/${new Date().getTime()}`);
// if (!fs.existsSync(dir)) {
//   fs.mkdir(dir, { recursive: true }, (err) => { });
// }

// var log_file = fs.createWriteStream(dir + "/node.access.log", { flags: "a" }),
//   error = fs.createWriteStream(dir + "/node.error.log", { flags: "a" }),
//   warn = fs.createWriteStream(dir + "/node.warn.log", { flags: "a" });

// // var log_stdout = process.stdout;

// console.log = function (d) {
//   log_file.write(util.format(d) + "\n");
//   process.stdout.write(util.format(d) + "\n");
// };

// console.error = function (d) {
//   error.write(util.format(d) + "\n");
//   process.stderr.write(util.format(d) + "\n");
// };

// console.warn = function (d) {
//   warn.write(util.format(d) + "\n");
//   process.stdin.write(util.format(d) + "\n");
// };

  /* Global Variables */
  global.utttil = (obj) => require("util").inspect(obj, true, null, true);
  global.logme = (obj) => require("./utils/logsStore").logStore(obj);
  app.listen(process.env.PORT, () => {
    console.log(`server listen at ${process.env.PORT} port`.yellow.bold);
  });
} catch (error) {
  console.log(error);
}
