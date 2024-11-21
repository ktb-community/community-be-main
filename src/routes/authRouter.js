const express = require("express");
const authenticateJWT = require("../middlewares/jwt");

const multer = require("../middlewares/multer");
const authController = require("../controllers/authController");
const router = express.Router();

router.post("/signup", multer.single("profileImg"), authController.signup);
router.post("/login", authController.login);
router.post("/logout", authenticateJWT, authController.logout);

module.exports = router;
