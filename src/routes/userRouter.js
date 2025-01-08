const express = require('express');
const userController = require('../controllers/userController');
const upload = require("../middlewares/multer")
const router = express.Router();

module.exports = router;

router.get('/:userId', userController.getUser);
router.delete(`/:userId`, userController.deleteUser)
router.patch(`/:userId/image`, upload.single("profileImg"), userController.editUserProfileImage)
router.patch(`/:userId/nickname`, userController.editUserNickname)
router.patch(`/:userId/password`, userController.editUserPassword)