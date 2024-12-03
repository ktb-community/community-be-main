const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require("../../middlewares/multer");

/* 로그인 요청 */
router.post('/login', authController.authLogin);
router.post('/signup', upload.single("profileImg"), authController.authSignup);

module.exports = router;