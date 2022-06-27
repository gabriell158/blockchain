const axios = require("axios");

const api = axios.create({
  baseURL: "http://localhost:3000",
});

module.exports = api;
