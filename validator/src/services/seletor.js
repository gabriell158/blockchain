const axios = require("axios");

const api = axios.create({
  baseURL: process.env.API_SELETOR,
});

module.exports = api;
