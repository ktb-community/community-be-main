const express = require("express");
const logger = require("../../config/logger")
const { sendJSONResponse } = require("../../utils/utils");
const { ResStatus } = require("../../utils/const");
const { RequestArgumentException, InvalidCredentialsException } = require("../../exception/CustomException");
const authenticateJWT = require("../../middlewares/jwt");

class UserRouter {
	constructor(userService) {
		this.router = express.Router();
		this.userService = userService;
		this.#initializeRoutes();
	}

	#initializeRoutes() {
		this.router.patch("/modify/nickname/:userId", authenticateJWT, this.modifyUserNickname.bind(this))
		this.router.patch("/modify/password/:userId", authenticateJWT, this.modifyUserPassword.bind(this))
		this.router.delete("/delete/:userId", authenticateJWT, this.deleteUser.bind(this))
	}

	async modifyUserNickname(req, res) {
		const userId = req.params.userId;
		const { currentNickname, nextNickname } = req.body;

		try {
			await this.userService.modifyNickname(userId, currentNickname, nextNickname);
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, "닉네임을 성공적으로 수정하였습니다.")
		} catch (err) {
			if (err instanceof RequestArgumentException) {
				logger.error(err);
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}
		}
	}

	async modifyUserPassword(req, res) {
		const userId = req.params.userId;
		const { currentPassword, nextPassword } = req.body;
		const claims = req.user;

		try {
			await this.userService.modifyPassword(userId, claims, currentPassword, nextPassword);
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, "비밀번호를 성공적으로 수정하였습니다.")
		} catch (err) {
			if (err instanceof RequestArgumentException || err instanceof InvalidCredentialsException) {
				logger.error(err);
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}
		}
	}

	async deleteUser(req, res) {

	}
}

module.exports = UserRouter;