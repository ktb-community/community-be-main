const bcrypt = require("bcrypt");
const fs = require("fs");
const User = require("../models/userModel");
const withTranslation = require("../middlewares/transaction");
const StorageClient = require("../clients/storageClient");
const RequestValidator = require("../utils/requestValidator");
const StringUtil = require("../utils/stringUtil");
const { sendJSONResponse } = require("../utils/utils");
const { ResStatus } = require("../utils/const");

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
			const { email, password } = req.body;

			if (!RequestValidator.checkArguments(email, password)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const user = await User.findByEmail(conn, { email });

			if (!user) {
				return sendJSONResponse(res, 400, ResStatus.EMAIL_NOT_FOUND, "가입되지 않은 계정입니다.");
			}

			if (!await bcrypt.compare(password, user.password)) {
				return sendJSONResponse(res, 400, ResStatus.PASSWORD_NOT_MATCH, "비밀번호가 일치하지 않습니다.");
			}

			// lastLoginDate 업데이트
			await User.updateLastLoginDate(conn, { id: user.id });

			/* 세션에 사용자 데이터 저장 */
			req.session.isAuthenticated = true;
			req.session.user = {
				id: user.id,
				nickname: user.nickname,
				profileImg: user.profileImg,
				role: user.role,
			};

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, "로그인이 성공적으로 완료되었습니다.", {
				id: user.id,
				email: user.email,
				nickname: user.nickname,
				profile: user.profileImg,
				lastLoginDate: StringUtil.dateTimeFormat(new Date(Date.now())),
			});
		});
	}

	static async authLogout(req, res) {
		req.session.destroy(err => {
			if (err) {
				return sendJSONResponse(res, 500, ResStatus.ERROR, "로그아웃 중 오류가 발생했습니다.");
			}
			res.clearCookie("connect.sid"); // 클라이언트 쿠키 제거
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, "로그아웃이 성공적으로 완료되었습니다.");
		});
	}
}

module.exports = AuthController;