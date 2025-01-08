const fs = require("fs");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const StorageClient = require("../clients/storageClient");
const withTransaction = require("../middlewares/transaction");
const RequestValidator = require("../utils/requestValidator");
const StringUtil = require("../utils/stringUtil");
const { sendJSONResponse } = require("../utils/utils");
const { ResStatus } = require("../utils/const");

class UserController {
	static async editUserInfo(req, res) {
		return await withTransaction(async conn => {
			const userId = parseInt(req.params.userId, 10) || null;
			const { nickname, fileChange } = req.body;

			if (!RequestValidator.checkArguments(userId, nickname, fileChange)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const user = await User.findById(conn, { id: userId });

			if (!user) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, `id(${userId})에 해당하는 유저가 없습니다.`);
			}

			if (user.nickname === nickname) {
				return sendJSONResponse(res, 400, ResStatus.NICKNAME_DUPLICATED, "이미 사용중인 닉네임입니다.");
			}

			try {
				const changed = fileChange === "true";
				const editUser = { ...user, nickname };

				if (changed) {
					const file = req.file;
					const { key } = await StorageClient.upload(file.path, file.originalname);
					editUser.profileImg = key;

					// 업로드 후 임시 파일 삭제
					fs.rm(file.path, (err) => {
						if (err) console.error(err);
						console.log(`${file.path} 제거`);
					});
				} else {
					editUser.profileImg = user.profileImg;
				}

				// 사용자 정보 업데이트
				await User.updateUser(conn, { user: editUser });

				return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, {
					id: editUser.id,
					email: editUser.email,
					nickname: editUser.nickname,
					profile: editUser.profileImg,
					lastLoginDate: StringUtil.dateTimeFormat(new Date(editUser.lastLoginDate)),
				});
			} catch (err) {
				console.error(err.message);
				return sendJSONResponse(res, 400, ResStatus.FAIL, "처리 중 오류가 발생했습니다.");
			}
		});
	}

	static async editUserPassword(req, res) {
		return await withTransaction(async conn => {
			const userId = parseInt(req.params.userId, 10) || null;
			const { email, password } = req.body;

			if (!RequestValidator.checkArguments(userId, email, password)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const user = await User.findById(conn, { id: userId });

			if (!user || user.email !== email) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, "회원 정보가 일치하지 않습니다.");
			}

			if (await bcrypt.compare(password, user.password)) {
				return sendJSONResponse(res, 400, ResStatus.SAME_PASSWORD, "동일한 비밀번호로 변경할 수 없습니다.");
			}

			const editUser = {
				...user,
				password: await bcrypt.hash(password, 10),
			};

			await User.updateUser(conn, { user: editUser });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
		});
	}

	static async deleteUser(req, res) {
		return await withTransaction(async conn => {
			const userId = parseInt(req.params.userId, 10) || null;
			const { password } = req.body;

			if (!RequestValidator.checkArguments(userId, password)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const user = await User.findById(conn, { id: userId });

			if (!user) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, `id(${userId})에 해당하는 유저가 없습니다.`);
			}

			if (!await bcrypt.compare(password, user.password)) {
				return sendJSONResponse(res, 400, ResStatus.PASSWORD_NOT_MATCH, "비밀번호가 일치하지 않습니다.");
			}

			// 연관된 Board, BoardComment, BoardLike 함께 제거 (Cascading)
			await User.deleteById(conn, { id: userId });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
		});
	}
}

module.exports = UserController;