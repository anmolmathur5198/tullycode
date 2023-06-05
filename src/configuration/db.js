const mongoose = require("mongoose");
//mongoose.set('debug', true);

<<<<<<< HEAD
const connectDb = async() => {

    mongoose.connect(process.env.DATABASE_URL, {
=======
console.log(process.env.DATABASE_URL)

const connectDb = async() => {
mongoose.connect(process.env.DATABASE_URL, {
>>>>>>> e1913ad32566aeb1b70775355419c791734e9e76
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    });
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error:"));
<<<<<<< HEAD
    db.once("open", function() {
        console.log(`MongoDB Connected`.cyan.bold);
=======

    db.once("open", function() {
        console.log(`MongoDB  Connected Successfully`.cyan.bold);
>>>>>>> e1913ad32566aeb1b70775355419c791734e9e76
    });
};

module.exports = connectDb;