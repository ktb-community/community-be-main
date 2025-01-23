const BoardLike = require("../models/boardLikeModel");
const withTransaction = require("../middlewares/transaction");
const RequestValidator = require("../utils/requestValidator");
const { sendJSONResponse } = require("../utils/utils");
const { ResStatus } = require("../utils/const");

class BoardLikeController {
	static async toggleBoardLike(req, res) {
		return await withTransaction(async conn => {
			const boardId = parseInt(req.params.boardId, 10) || null;
			const { id: userId } = req.decoded;

			if (!RequestValidator.checkArguments(boardId, userId)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const boardLike = await BoardLike.findByBoardIdAndUserId(conn, { boardId, userId });
			if (boardLike) await BoardLike.deleteByBoardIdAndUserId(conn, { boardId, userId });
			else await BoardLike.save(conn, { boardId, userId });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, !boardLike);
		})
	}

	static async checkBoardLike(req, res) {
		return await withTransaction(async conn => {
			const boardId = parseInt(req.params.boardId, 10) || null;
			const userId = parseInt(req.params.userId, 10) || null;

			if (!RequestValidator.checkArguments(boardId, userId)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const boardLike = await BoardLike.findByBoardIdAndUserId(conn, { boardId, userId });
			const boardCnt = await BoardLike.countCurrentBoardLike(conn, { boardId });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, { like: !!boardLike, count: boardCnt.count });
		})
	}
}

module.exports = BoardLikeController