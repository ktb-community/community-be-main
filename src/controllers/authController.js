const bcrypt = require("bcrypt");
const fs = require("fs");
const User = require("../models/userModel");
const withTranslation = require("../middlewares/transaction");
const StorageClient = require("../clients/storageClient");
const RequestValidator = require("../utils/requestValidator");
const StringUtil = require("../utils/stringUtil");
const JwtUtil = require("../utils/jwt");
const { sendJSONResponse } = require("../utils/utils");
const { ResStatus, TokenExpire } = require("../utils/const");

class AuthController {
	static async authSignup(req, res) {
		return await withTranslation(async conn => {
			const { email, password, nickname } = req.body;
			const file = req.file;

			if (!RequestValidator.checkArguments(email, password, nickname, file)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			if (!RequestValidator.checkPassword(password) || !RequestValidator.checkEmail(email) || !RequestValidator.checkNickname(nickname)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			if (await User.findByEmail(conn, { email })) {
				return sendJSONResponse(res, 400, ResStatus.EMAIL_DUPLICATED, "이미 사용중인 이메일입니다.");
			}

			if (await User.findByNickname(conn, { nickname })) {
				return sendJSONResponse(res, 400, ResStatus.NICKNAME_DUPLICATED, "이미 사용중인 닉네임입니다.");
			}

			try {
				const data = await StorageClient.upload(file.path, file.originalname);

				/* id, createdAt, modifiedAt, role 자동생성 */
				const user = {
					email,
					password: await bcrypt.hash(password, 10),
					nickname,
					profileImg: data.key,
					lastLoginDate: null,
				};

				await User.save(conn, { user });

				return sendJSONResponse(res, 201, ResStatus.SUCCESS, "회원가입이 성공적으로 완료되었습니다.");
			} catch (err) {
				console.error(err);
				return sendJSONResponse(res, 400, ResStatus.FAIL, null);
			} finally {
				// 임시 저장 파일 삭제
				fs.rm(file.path, (err) => {
					if (err) console.error(err);
					console.log(`${file.path} 제거`);
				});
			}
		});
	}

	static async authLogin(req, res) {
		return await withTranslation(async conn => {
			const { email: reqEmail, password } = req.body;

			if (!RequestValidator.checkArguments(reqEmail, password)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const user = await User.findByEmail(conn, { email: reqEmail });

			if (!user) {
				return sendJSONResponse(res, 400, ResStatus.EMAIL_NOT_FOUND, "가입되지 않은 계정입니다.");
			}

			if (!await bcrypt.compare(password, user.password)) {
				return sendJSONResponse(res, 400, ResStatus.PASSWORD_NOT_MATCH, "비밀번호가 일치하지 않습니다.");
			}

			const { id, email, nickname, profileImg, role } = user;

			// 토큰 발급
			const payload = { id, email, nickname, role };
			const accessToken = JwtUtil.createToken(payload, { expiresIn: TokenExpire.ACCESS_TOKEN });
			const refreshToken = JwtUtil.createToken(payload, { expiresIn: TokenExpire.REFRESH_TOKEN });

			// 로그인 정보 업데이트 (refreshToken, lastLoginDate)
			const lastLoginDate = new Date();
			await User.updateLoginInfo(conn, { id, lastLoginDate, refreshToken });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, "로그인이 성공적으로 완료되었습니다.", {
				id,
				email,
				nickname,
				profileImg,
				lastLoginDate: StringUtil.dateTimeFormat(new Date(Date.now())),
				accessToken,
				refreshToken,
			});
		});
	}

	static async authLogout(req, res) {
		return await withTranslation(async conn => {
			const { userId } = req.body;

			if (!RequestValidator.checkArguments(userId)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const user = await User.findById(conn, { id: userId });

			if (!user) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			await User.setNullRefreshToken(conn, { id: userId });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, "로그아웃이 성공적으로 완료되었습니다.");
		});
	}

	static async refresh(req, res) {
		return await withTranslation(async conn => {
			const { id: userId } = req.decoded;

			if (!RequestValidator.checkArguments(userId)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const { id, email, nickname, role } = await User.findById(conn, { id: userId });

			// 토큰 발급
			const payload = { id, email, nickname, role };
			const accessToken = JwtUtil.createToken(payload, { expiresIn: TokenExpire.ACCESS_TOKEN });
			const refreshToken = JwtUtil.createToken(payload, { expiresIn: TokenExpire.REFRESH_TOKEN });

			await User.updateRefreshToken(conn, { id, refreshToken });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, {
				accessToken,
				refreshToken,
			});
		});
	}
}

module.exports = AuthController;