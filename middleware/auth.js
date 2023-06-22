const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();
const secret = process.env.SECRET;

const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const tokenValue = token.split(" ")[1];
  try {
    const decodedToken = await jwt.verify(tokenValue, secret);
    const userId = decodedToken.userId;
    const user = await User.findOne({ _id: userId, token: tokenValue });
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = authenticateToken;
