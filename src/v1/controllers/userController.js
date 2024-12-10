const fs = require('fs');
const path = require('path');
const process = require('process');
const logger = require('../../config/logger')
const User = require('../models/userModel');
const Board = require("../models/boardModel");
const BoardComment = require("../models/boardCommentModel")
const BoardLike = require("../models/boardLikeModel");
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
		const userId = parseInt(req.params.userId, 10) || null;
		const { email, password } = req.body;

		if (!userId || !email || !password) {
			return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
		}

		const user = User.findById(userId);

		if (!user.email === email) {
			return sendJSONResponse(res, 400, ResStatus.FAIL, "검증되지 않은 요청입니다.");
		}

		if (user.password === password) {
			return sendJSONResponse(res, 400, ResStatus.SAME_PASSWORD, "동일한 비밀번호로 변경할 수 없습니다.");
		}

		const newUser = {
			...user,
			password,
			modifiedAt: dateTimeFormat(new Date(Date.now())),
		}

		User.modify(newUser);
		return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
	},

	deleteUser: (req, res) => {
		const userId = parseInt(req.params.userId, 10) || null;
		const { password } = req.body;

		if (!userId || !password) {
			return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
		}

		const user = User.findById(userId);

		if (!user) {
			return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
		}

		if (user.password !== password) {
			return sendJSONResponse(res, 400, ResStatus.PASSWORD_NOT_MATCH, "비밀번호가 일치하지 않습니다.");
		}

		const likeCnt = BoardLike.deleteAllByUserId(userId);
		const commentCnt = BoardComment.deleteAllByUserId(userId);
		const boardCnt = Board.deleteAllByUserId(userId);
		User.deleteById(userId);
		logger.info(`게시글 ${boardCnt}, 댓글 ${commentCnt}, 좋아요 ${likeCnt} 건이 삭제되었습니다.`)

		return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
	}
}