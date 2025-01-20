const express = require("express");
const authController = require("../controllers/authController");
const upload = require("../middlewares/multer");
const jwtAuthenticate = require("../middlewares/jwtAuthenticate");

const router = express.Router();

/* 로그인 요청 */
router.post("/login", authController.authLogin);
router.post("/logout", authController.authLogout);
router.post("/signup", upload.single("profileImg"), authController.authSignup);
router.post("/refresh", jwtAuthenticate, authController.refresh);

module.exports = router;