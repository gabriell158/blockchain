// Imports
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL).catch((err) => {
  console.error("Falha ao conectar com o banco de dados");
});

const Validator = mongoose.model(
  "validator",
  new mongoose.Schema({ name: String, ip: String, stake: Number })
);

module.exports = { Validator };
