const express = require("express");
const User = require("./../../models/user");
const bcrypt = require("bcryptjs");
const authenticateToken = require("../../middleware/auth");
const generateToken = require("../../Utils/token");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const gravatar = require("gravatar");
require("dotenv").config();

const router = express.Router();
const Joi = require("joi");

const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_LOGIN = process.env.EMAIL_LOGIN;

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: EMAIL_LOGIN,
    pass: EMAIL_PASSWORD,
  },
});

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

  const verificationToken = uuidv4();

  const avatarURL = gravatar.url(req.body.email, { s: "250", d: "identicon" });

  const newUser = new User({
    email: req.body.email,
    password: hashedPassword,
    avatarURL: avatarURL,
    verificationToken: verificationToken,
  });

  try {
    const savedUser = await newUser.save();

    const mailOptions = {
      from: "sebastian.szczypiorowski@interia.pl",
      to: savedUser.email,
      subject: "Weryfikacja e-maila",
      text: `Aby zweryfikować swój e-mail, kliknij na ten odnośnik: /users/verify/${verificationToken}`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending verification email:", error);
        return res.status(500).json({ error: "Registration failed" });
      }
      console.log("Verification email sent:", info.response);
      res.status(201).json({
        user: {
          email: savedUser.email,
          subscription: savedUser.subscription,
        },
      });
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

router.get("/verify/:verificationToken", async (req, res) => {
  const { verificationToken } = req.params;
  console.log(verificationToken);

  try {
    const user = await User.findOne({ verificationToken });
    console.log(user);
    if (!user) {
      res.status(404).json({ message: "User has already been verified" });
    }

    user.verificationToken = "null";
    user.verify = true;

    await user.save();

    return res.status(200).json({ message: "Verification succesfull!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/verify", async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
  }
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    console.log(user);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.verify) {
      return res
        .status(400)
        .json({ message: "Verification has already been passed" });
    }

    const verificationToken = uuidv4();
    user.verificationToken = verificationToken;
    await user.save();

    const mailOptions = {
      from: "sebastian.szczypiorowski@interia.pl",
      to: email,
      subject: "Weryfikacja e-maila",
      text: `Aby zweryfikować swój e-mail, kliknij na ten odnośnik: /users/verify/${verificationToken}`,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
