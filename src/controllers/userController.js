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
			const file = req.file;

			if (!RequestValidator.checkArguments(userId, nickname)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const user = await User.findById(conn, { id: userId });

			if (!user) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, `id(${userId})에 해당하는 유저가 없습니다.`);
			}

			try {
				const changed = fileChange === "true";
				const editUser = { ...user, nickname };

				// 파일 변경이 있다면 스토리지 서버에 새 파일을 업로드
				if (changed) {
					const { key } = await StorageClient.upload(file.path, file.originalname);
					editUser.profileImg = key;
				} else {
					editUser.profileImg = user.profileImg;
				}

				await User.updateUser(conn, { user: editUser });

				return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, {
					id: editUser.id,
					email: editUser.email,
					nickname: editUser.nickname,
					profile: editUser.profileImg,
					lastLoginDate: StringUtil.dateTimeFormat(new Date(editUser.lastLoginDate)),
				});
			} catch (err) {
				console.error(err);
				return sendJSONResponse(res, 400, ResStatus.FAIL, null);
			} finally {
				fs.rm(file.path, (err) => {
					if (err) console.error(err);
					console.log(`${file.path} 제거`);
				});
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
				return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
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
				return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
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