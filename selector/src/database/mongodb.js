// Imports
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL);

const Validator = mongoose.model(
  "validator",
  new mongoose.Schema({ name: String, ip: String, stake: Number })
);

module.exports = { Validator };
