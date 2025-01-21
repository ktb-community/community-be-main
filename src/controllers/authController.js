const bcrypt = require("bcrypt");
const fs = require("fs");
const User = require("../models/userModel");
const withTranslation = require("../middlewares/transaction");
const StorageClient = require("../clients/storageClient");
const RequestValidator = require("../utils/requestValidator");
const StringUtil = require("../utils/stringUtil");
const JwtUtil = require("../utils/jwt");
const { sendJSONResponse, generateRandomString } = require("../utils/utils");
const { ResStatus, TokenExpire, UserRole } = require("../utils/const");
const FormData = require("form-data");

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

			// user.password가 없는 경우 -> 소셜 로그인 계정인 경우
			if (!user.password || !await bcrypt.compare(password, user.password)) {
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

	static async authSocialLogin(req, res) {
		return await withTranslation(async conn => {
			const { token, clientId, socialType } = req.body;

			if (!RequestValidator.checkArguments(token, clientId, socialType)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			try {
				const idTokenPayload = await JwtUtil.verifyGoogleIdToken(token, clientId);

				if (!(idTokenPayload.email && idTokenPayload.name && idTokenPayload.picture)) {
					return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
				}

				let { email, name: nickname, picture: url, email_verified: emailVerified } = idTokenPayload;

				// 기존에 가입된 이메일이면 바로 유저 정보를 가져와서 로그인 성공 처리
				const user = await User.findByEmail(conn, { email });
				const lastLoginDate = StringUtil.dateTimeFormat(new Date(Date.now()));

				if (user) {
					const { id, email, nickname, role, profileImg } = user;

					// 토큰 발급
					const payload = { id, email, nickname, role };
					const accessToken = JwtUtil.createToken(payload, { expiresIn: TokenExpire.ACCESS_TOKEN });
					const refreshToken = JwtUtil.createToken(payload, { expiresIn: TokenExpire.REFRESH_TOKEN });

					await User.updateLoginInfo(conn, { id, lastLoginDate, refreshToken });

					return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, {
						id,
						email,
						nickname,
						profileImg,
						lastLoginDate,
						accessToken,
						refreshToken
					});
				}

				// 기존에 가입되지 않은 소셜 로그인 시도이므로 회원가입 진행
				else {
					// 다른 유저가 이미 사용중인 닉네임이면 임시 닉네임 부여
					if (await User.findByNickname(conn, { nickname })) {
						nickname = generateRandomString(10);
					}

					// 프로필 이미지 내려받고 스토리지 서버에 업로드
					const save = await StorageClient.downloadFromWebURL(url);

					if (!save) {
						return sendJSONResponse(res, 400, ResStatus.ERROR, "프로필 이미지 불러오기에 실패하였습니다.");
					}

					const { filename, savePath } = save;

					const formData = new FormData();
					formData.append("file", fs.createReadStream(savePath), encodeURIComponent(filename.replace(/ /g, '_')));
					formData.append("nickname", nickname);
					formData.append("email", email);

					const { key } = await StorageClient.upload(formData);

					// 유저 정보 저장
					const userId = await User.saveSocialUser(conn, { user: {
						email,
						emailVerified,
						nickname,
						authType: socialType,
						profileImg: key,
						lastLoginDate
					}});

					// 토큰 발급
					const payload = { id: userId, email, nickname, role: UserRole.USER };
					const accessToken = JwtUtil.createToken(payload, { expiresIn: TokenExpire.ACCESS_TOKEN });
					const refreshToken = JwtUtil.createToken(payload, { expiresIn: TokenExpire.REFRESH_TOKEN });

					await User.updateRefreshToken(conn, { id: userId, refreshToken });

					// 임시 저장 파일 삭제
					fs.rm(savePath, (err) => {
						if (err) console.error(err);
						console.log(`${filename} 제거`);
					});

					return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, {
						id: userId,
						email,
						nickname,
						profileImg: key,
						lastLoginDate,
						accessToken,
						refreshToken
					});
				}
			} catch (e) {
				console.error(e);
				return sendJSONResponse(res, 400, ResStatus.ERROR, null);
			}
		})
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