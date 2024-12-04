const { sendJSONResponse } = require("../../utils/utils");
const { ResStatus } = require("../../utils/const");
const BoardLike = require("../models/boardLikeModel");

module.exports = {
	toggleBoardLike: (req, res) => {
		const boardId = parseInt(req.params.boardId, 10) || null;
		const userId = parseInt(req.params.userId, 10) || null;

		if (!boardId || !userId) {
			return sendJSONResponse(res, 400, ResStatus.ERROR, "유효하지 않은 요청입니다.");
		}

		const isLiked = BoardLike.existsByBoardIdAndUserId(boardId, userId);

		if (isLiked) {
			BoardLike.deleteByBoardIdAndUserId(boardId, userId);
		} else {
			BoardLike.save(boardId, userId);
		}

		return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, !isLiked);
	},

	checkBoardLike: (req, res) => {
		const boardId = parseInt(req.params.boardId, 10) || null;
		const userId = parseInt(req.params.userId, 10) || null;

		if (!boardId || !userId) {
			return sendJSONResponse(res, 400, ResStatus.ERROR, "유효하지 않은 요청입니다.");
		}

		const isLiked = BoardLike.existsByBoardIdAndUserId(boardId, userId);
		return sendJSONResponse(res, 200, ResStatus.ERROR, null, isLiked);
	},
}