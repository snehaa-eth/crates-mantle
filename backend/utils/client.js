const Dinari = require("@dinari/api-sdk").default;
require("dotenv").config();
const apiKeyID = process.env.DINARI_API_KEY_ID || "your_api_key_id";
const apiSecretKey = process.env.DINARI_API_SECRET_KEY || "your_secret_key";

const client = new Dinari({
    apiKeyID,
    apiSecretKey,
    environment: "sandbox",
});

module.exports = client;