const path = require("path");
const fs = require("fs")
const logger = require("../config/logger");
const process = require("process");
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const RequestValidator = require("../utils/requestValidator");
const StringUtil = require("../utils/stringUtil");
const withTransaction = require("../middlewares/transaction");
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
				return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
			}

			const changed = fileChange === 'true';

			// 기존 이미지 삭제
			if (changed) {
				const imgPath = path.join(process.cwd(), user.profileImg);
				fs.unlink(imgPath, () => logger.info(`${imgPath} 제거`));
			}

			const editUser = {
				...user,
				nickname,
				profileImg: changed ? file.path.replace(/\\/g, '/') : user.profileImg,
			}

			await User.updateUser(conn, { user: editUser });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, {
				id: editUser.id,
				email: editUser.email,
				nickname: editUser.nickname,
				profile: editUser.profileImg,
				lastLoginDate: StringUtil.dateTimeFormat(new Date(editUser.lastLoginDate))
			});
		})
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
			}

			await User.updateUser(conn, { user: editUser });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
		})
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
		})
	}
}

module.exports = UserController;