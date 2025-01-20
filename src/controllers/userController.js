const fs = require("fs");
const User = require("../models/userModel");
const StorageClient = require("../clients/storageClient");
const withTransaction = require("../middlewares/transaction");
const RequestValidator = require("../utils/requestValidator");
const StringUtil = require("../utils/stringUtil");
const { sendJSONResponse } = require("../utils/utils");
const { ResStatus } = require("../utils/const");

class UserController {
	static async getUser(req, res) {
		return await withTransaction(async conn => {
			const userId = parseInt(req.params.userId, 10) || null;

			if (!RequestValidator.checkArguments(userId)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const user = await User.findById(conn, { id: userId });

			if (!user) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, `id(${userId})에 해당하는 유저가 없습니다.`);
			}

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, {
				id: user.id,
				email: user.email,
				nickname: user.nickname,
				profile: user.profileImg,
				lastLoginDate: StringUtil.dateTimeFormat(new Date(user.lastLoginDate)),
			});
		})
	}

	static async editUserProfileImage(req, res) {
		return await withTransaction(async conn => {
			const userId = parseInt(req.params.userId, 10) || null;
			const file = req.file;

			if (!RequestValidator.checkArguments(userId, file)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const user = await User.findById(conn, { id: userId });

			if (!user) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, `id(${userId})에 해당하는 유저가 없습니다.`);
			}

			try {
				// 업로드 후 임시 파일 삭제
				const { key } = await StorageClient.upload(file.path, file.originalname);
				const newUser = { ...user, profileImg: key };
				await User.updateUser(conn, { user: newUser });

				return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
			} catch (err) {
				console.error(err.message);
				return sendJSONResponse(res, 400, ResStatus.FAIL, "처리 중 오류가 발생했습니다.");
			} finally {
				fs.rm(file.path, (err) => {
					if (err) console.error(err);
					console.log(`${file.path} 제거`);
				});
			}
		});
	}

	static async editUserNickname(req, res) {
		return await withTransaction(async conn => {
			const userId = parseInt(req.params.userId, 10) || null;
			const { nickname } = req.body;

			if (!RequestValidator.checkArguments(userId, nickname)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			if (!RequestValidator.checkNickname(nickname)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 닉네임입니다.");
			}

			const user = await User.findById(conn, { id: userId });

			if (!user) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, `id(${userId})에 해당하는 유저가 없습니다.`);
			}

			if (await User.findByNickname(conn, { nickname })) {
				return sendJSONResponse(res, 400, ResStatus.NICKNAME_DUPLICATED, `이미 사용중인 닉네임입니다.`);
			}

			const newUser = { ...user, nickname };
			await User.updateUser(conn, { user: newUser });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
		});
	}
}

module.exports = UserController;