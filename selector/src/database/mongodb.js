// Imports
const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://gabriell158:przysiada@cluster0.qp2yw.mongodb.net/selector?retryWrites=true&w=majority"
);

const Validator = mongoose.model(
  "validator",
  new mongoose.Schema({ name: String, ip: String, stake: Number })
);

module.exports = { Validator };
