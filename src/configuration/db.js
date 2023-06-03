const mongoose = require("mongoose");
//mongoose.set('debug', true);

console.log(process.env.DATABASE_URL)

const connectDb = async() => {
mongoose.connect(process.env.DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    });
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error:"));

    db.once("open", function() {
        console.log(`MongoDB  Connected Successfully`.cyan.bold);
    });
};

module.exports = connectDb;