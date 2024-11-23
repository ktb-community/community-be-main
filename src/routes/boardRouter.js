const express = require("express");
const logger = require("../config/logger")
const { sendJSONResponse } = require("../utils/utils");
const { ResStatus } = require("../utils/const");
const { RequestArgumentException } = require("../exception/CustomException");

class BoardRouter {
	constructor(boardService) {
		this.router = express.Router();
		this.boardService = boardService;
		this.#initializeRoutes();
	}

	#initializeRoutes() {
		this.router.get("/", this.#getLatestBoardList.bind(this))
		this.router.get("/:boardId", this.#getBoardDetail.bind(this))
		this.router.get("/comments/:boardId", this.#getBoardComments.bind(this))
	}

	async #getLatestBoardList(req, res) {
		const { limit, offset } = req.query;

		try {
			const boardList = await this.boardService.getLatestBoardList(limit, offset);
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, "게시글 목록 요청에 성공했습니다.", boardList, { hasMore: boardList.length === limit });
		} catch (err) {
			if (err instanceof RequestArgumentException) {
				logger.error(err.message)
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}

			throw err;
		}
	}

	async #getBoardDetail(req, res) {
		const boardId = req.params.boardId;

		try {
			const boardDetail = await this.boardService.getBoardDetail(boardId);
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, `${boardId}번 게시글 상세정보 요청에 성공했습니다.`, boardDetail);
		} catch (err) {
			if (err instanceof RequestArgumentException) {
				logger.error(err.message)
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}

			throw err;
		}
	}

	async #getBoardComments(req, res) {
		const boardId = req.params.boardId;
		const { offset, limit } = req.query;

		try {
			const boardComments = await this.boardService.getBoardComments(boardId, offset, limit);
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, `${boardId}번 게시글의 댓글 ${boardComments.length}개를 성공적으로 가져왔습니다.`, boardComments)
		} catch (err) {
			if (err instanceof RequestArgumentException) {
				logger.error(err.message)
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}

			throw err;
		}
	}
}

module.exports = BoardRouter;
