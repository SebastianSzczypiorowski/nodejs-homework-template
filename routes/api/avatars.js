const express = require("express");
const multer = require("multer");
const jimp = require("jimp");
const path = require("path");
const fs = require("fs").promises;
const User = require("../../models/user");
const authenticateToken = require("../../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "./tmp",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

router.patch(
  "/",
  authenticateToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const image = await jimp.read(req.file.path);
      await image.resize(250, 250).writeAsync(req.file.path);

      const fileName = path.basename(req.file.path);
      const newPath = path.join(__dirname, "/public/avatars", fileName);
      console.log(newPath);
      await fs.rename(req.file.path, newPath);

      const avatarURL = `/avatars/${fileName}`;

      const userId = req.user._id;

      const updatedUser = await User.findOneAndUpdate(
        { _id: userId },
        { avatarURL }
      );

      res.status(200).json({ updatedUser });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Wystąpił błąd podczas aktualizacji awatara" });
    }
  }
);

module.exports = router;
