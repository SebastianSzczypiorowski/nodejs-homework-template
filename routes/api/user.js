const express = require("express");
const User = require("./../../models/user");
const bcrypt = require("bcryptjs");
const authenticateToken = require("../../middleware/auth");
const generateToken = require("../../Utils/token");
const gravatar = require("gravatar");

const router = express.Router();
const Joi = require("joi");

router.post("/login", async (req, res) => {
  const { error } = validateRegistration(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }
    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const token = generateToken(user._id);

    user.token = token;
    await user.save();

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

const validateRegistration = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  return schema.validate(data);
};

router.post("/signup", async (req, res) => {
  const { error } = validateRegistration(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return res.status(409).json({ message: "Email in use" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  const avatarURL = gravatar.url(req.body.email, { s: "250", d: "identicon" });

  const newUser = new User({
    email: req.body.email,
    password: hashedPassword,
    avatarURL: avatarURL,
  });

  try {
    const savedUser = await newUser.save();
    res.status(201).json({
      user: {
        email: savedUser.email,
        subscription: savedUser.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

router.get("/logout", authenticateToken, async (req, res) => {
  try {
    req.user.token = null;
    await req.user.save();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
});

router.get("/current", authenticateToken, (req, res) => {
  res.status(200).json({
    email: req.user.email,
    subscription: req.user.subscription,
  });
});

module.exports = router;
