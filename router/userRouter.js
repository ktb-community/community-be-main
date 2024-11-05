const express = require("express");
const userController = require("../controller/userController");

const userRouter = express.Router();

userRouter.get("/:userId", userController.getUser);

module.exports = userRouter;
