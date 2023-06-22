const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.SECRET;

function generateToken(userId) {
  const payload = { userId };
  const token = jwt.sign(payload, secret, { expiresIn: "1h" });
  return token;
}

module.exports = generateToken;
