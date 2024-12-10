const express = require('express');
const userController = require('../controllers/userController');
const upload = require("../../middlewares/multer")
const router = express.Router();

module.exports = router;

router.put(`/:userId`, upload.single("profileImg"), userController.editUserInfo)
router.patch(`/:userId`, userController.editUserPassword)
router.delete(`/:userId`, userController.deleteUser)