const express = require('express');
const userController = require('../controllers/userController');
const upload = require("../middlewares/multer")
const jwtAuthenticate = require("../middlewares/jwtAuthenticate");

const router = express.Router();


router.get('/:userId', jwtAuthenticate, userController.getUser);
router.patch(`/:userId/image`, jwtAuthenticate, upload.single("profileImg"), userController.editUserProfileImage)
router.patch(`/:userId/nickname`, jwtAuthenticate, userController.editUserNickname)

module.exports = router;
