const express = require("express");
const userController = require("../controllers/userController");

const userRouter = express.Router();

userRouter.get("/:userId", userController.getUser);

module.exports = userRouter;
