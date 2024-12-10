const fs = require('fs');
const path = require('path');
const process = require('process');
const logger = require('../../config/logger')
const User = require('../models/userModel');
const { sendJSONResponse, dateTimeFormat } = require("../../utils/utils");
const { ResStatus } = require("../../utils/const");

module.exports = {
	editUserInfo: async (req, res) => {
		const userId = parseInt(req.params.userId, 10) || null;
		const { nickname, fileChange } = req.body;
		const file = req.file;

		if (!userId || !nickname || !fileChange) {
			return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
		}

		const user = User.findById(userId);

		if (!user) {
			return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
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
			modifiedAt: dateTimeFormat(new Date(Date.now()))
		}

		User.modify(editUser);

		return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, {
			id: editUser.id,
			email: editUser.email,
			nickname: editUser.nickname,
			profile: editUser.profileImg,
			lastLoginDate: editUser.lastLoginDate
		});
	},

	editUserPassword: (req, res) => {

	},

	deleteUser: (req, res) => {

	}
}