const { logs } = require("../models");
exports.logStore = async (logData) => {
  const { user, message, status, type, source, from, to } = logData;
  console.log("Message  ", message);
  if (user && user.email) {
    if (user) {
      console.log("Message  ", message);
      await new logs({
        email: user.email,
        hub_domain: user.hub_domain,
        hub_id: user.hub_id,
        app_id: user.app_id,
        user_id: user.user_id,
        status,
        type,
        from,
        to,
        source: source,
        message: message,
      }).save();
    }
  }
};
