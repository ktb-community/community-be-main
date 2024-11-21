const express = require("express");
const fs = require("fs");
const authenticateJWT = require("../middlewares/jwt");
const upload = require("../middlewares/multer");
const logger = require("../config/logger");
const { ResStatus } = require("../utils/const");
const { sendJSONResponse } = require("../utils/utils");
const {
	EmailDuplicationException,
	RequestArgumentException,
	InvalidCredentialsException,
	UserNotFoundException,
} = require("../exception/CustomException");

class AuthRouter {
	constructor(authService) {
		this.router = express.Router();
		this.authService = authService;
		this.#initializeRoutes();
	}

	#initializeRoutes() {
		this.router.post("/signup", upload.single("profileImg"), this.#signup.bind(this));
		this.router.post("/login", this.#login.bind(this));
		this.router.post("/logout", authenticateJWT, this.#logout.bind(this));
	}

	async #signup(req, res) {
		const { email, password, nickname } = req.body;
		const profileImg = req.file;

		try {
			await this.authService.signup(email, password, nickname, profileImg);
			sendJSONResponse(res, 201, ResStatus.SUCCESS, "회원가입이 성공적으로 완료되었습니다.");
		} catch (err) {
			/* 커스텀 예외 처리 (500번 에러는 전역에서 처리) */
			if (err instanceof RequestArgumentException || err instanceof EmailDuplicationException) {
				logger.error(err.message);
				sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}

			/* 업로드된 파일 삭제 */
			if (fs.existsSync(profileImg.path)) {
				fs.rmSync(profileImg.path);
				logger.info(`[signup] 이미지 삭제: ${profileImg.path}`);
			}
		}
	}

	async #login(req, res) {
		const { email, password } = req.body;

		try {
			const data = await this.authService.login(email, password);
			sendJSONResponse(res, 200, ResStatus.SUCCESS, "로그인에 성공하였습니다.", data);
		} catch (err) {
			/* 커스텀 예외 처리 (500번 에러는 전역에서 처리) */
			if (err instanceof RequestArgumentException || err instanceof InvalidCredentialsException) {
				logger.error(err.message);
				sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}
		}
	}

	async #logout(req, res) {
		const { userId, refreshToken } = req.body;

		try {
			await this.authService.logout(userId, refreshToken);
			sendJSONResponse(res, 200, ResStatus.SUCCESS, "로그아웃이 성공적으로 완료되었습니다.");
		} catch (err) {
			/* 커스텀 예외 처리 (500번 에러는 전역에서 처리) */
			if (err instanceof RequestArgumentException || err instanceof UserNotFoundException) {
				logger.error(err.message);
				sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}
		}
	}
}

module.exports = AuthRouter;
