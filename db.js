const mongoose = require("mongoose");
require("dotenv").config();
const uriDb = process.env.DB_HOST;

const connectDB = async () => {
  try {
    await mongoose.connect(uriDb, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
