const express = require("express");
const logger = require("../../config/logger");
const { sendJSONResponse } = require("../../utils/utils");
const { ResStatus } = require("../../utils/const");
const { RequestArgumentException, UserNotFoundException } = require("../../exception/CustomException");
const authenticateJWT = require("../../middlewares/jwt");
const upload = require("../../middlewares/multer");

class BoardRouter {
	constructor(boardService, boardLikeService, boardCommentService) {
		this.router = express.Router();
		this.boardService = boardService;
		this.boardLikeService = boardLikeService;
		this.boardCommentService = boardCommentService;
		this.#initializeRoutes();
	}

	#initializeRoutes() {
		this.router.get("/", this.#getLatestBoardList.bind(this));
		this.router.post("/", authenticateJWT, upload.single("boardImg"), this.#addBoard.bind(this))
		this.router.get("/:boardId", authenticateJWT, this.#getBoardDetail.bind(this));
		this.router.put("/:boardId", authenticateJWT, upload.single("boardImg"), this.#modifyBoardDetail.bind(this));
		this.router.delete("/:boardId", authenticateJWT, this.#deleteBoardDetail.bind(this));
		this.router.post("/:boardId/views", authenticateJWT, this.#countBoardView.bind(this))
		this.router.get("/:boardId/comments", authenticateJWT, this.#getBoardComments.bind(this));
		this.router.post("/:boardId/comments", authenticateJWT, this.#addBoardComment.bind(this));
		this.router.put("/:boardId/comments", authenticateJWT, this.#modifyBoardComments.bind(this));
		this.router.delete("/:boardId/comments", authenticateJWT, this.#deleteBoardComments.bind(this));
	}

	async #getLatestBoardList(req, res, next) {
		const { limit, offset } = req.query;

		try {
			const boardList = await this.boardService.getLatestBoardList(limit, offset);
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, "게시글 목록 요청에 성공했습니다.", boardList, { hasMore: boardList.length === limit });
		} catch (err) {
			if (err instanceof RequestArgumentException) {
				logger.error(err.stack);
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}
			next();
		}
	}

	async #getBoardDetail(req, res, next) {
		const boardId = req.params.boardId;

		try {
			const boardDetail = await this.boardService.getBoardDetail(boardId);
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, `${boardId}번 게시글 상세정보 요청에 성공했습니다.`, boardDetail);
		} catch (err) {
			if (err instanceof RequestArgumentException) {
				logger.error(err.stack);
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}
			next();
		}
	}

	async #getBoardComments(req, res, next) {
		const boardId = req.params.boardId;
		const { offset, limit } = req.query;

		try {
			const boardComments = await this.boardCommentService.getBoardComments(boardId, offset, limit);
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, `${boardId}번 게시글의 댓글 ${boardComments.length}개를 성공적으로 가져왔습니다.`, boardComments)
		} catch (err) {
			if (err instanceof RequestArgumentException) {
				logger.error(err.stack);
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}
			next();
		}
	}

	async #addBoard(req, res, next) {
		const { boardTitle, boardContent } = req.body;
		const boardImg = req.file;
		const user = req.user;

		try {
			await this.boardService.addBoard(boardTitle, boardContent, boardImg, user);
			return sendJSONResponse(res, 201, ResStatus.SUCCESS, "게시글이 성공적으로 등록되었습니다.", 1);
		} catch (err) {
			if (err instanceof RequestArgumentException || err instanceof UserNotFoundException) {
				logger.error(err.stack);
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}
			next();
		}
	}

	async #countBoardView(req, res, next) {
		const boardId = req.params.boardId;

		try {
			await this.boardService.countBoardView(boardId)
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, "게시글이 성공적으로 조회되었습니다.");
		} catch (err) {
			if (err instanceof RequestArgumentException) {
				logger.error(err.stack);
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}
			next();
		}
	}

	async #modifyBoardDetail(req, res, next) {
		const boardId = req.params.boardId;
		const { boardTitle, boardContent } = req.body;
		const boardImg = req.file;
		const user = req.user;
		const board = { boardId, boardTitle, boardContent, boardImg };

		try {
			await this.boardService.modifyBoard(board, user);
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, "게시글이 성공적으로 수정되었습니다.");
		} catch (err) {
			if (err instanceof RequestArgumentException) {
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}
			next();
		}
	}

	async #deleteBoardDetail(req, res, next) {
		const boardId = req.params.boardId;
		const user = req.user;

		try {
			await this.boardService.deleteBoard(boardId, user);
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, "게시글이 성공적으로 삭제되었습니다.");
		} catch (err) {
			if (err instanceof RequestArgumentException) {
				logger.error(err.stack);
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}
			next();
		}
	}

	async #addBoardComment(req, res, next) {
		const boardId = req.params.boardId;
		const { writerId, boardComment } = req.body;

		try {
			await this.boardCommentService.addBoardComment(boardId, writerId, boardComment);
			return sendJSONResponse(res, 201, ResStatus.SUCCESS, "댓글이 성공적으로 추가되었습니다.");
		} catch (err) {
			if (err instanceof RequestArgumentException) {
				logger.error(err.stack);
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}
			next();
		}
	}

	async #modifyBoardComments(req, res) {

	}

	async #deleteBoardComments(req, res, next) {
		const boardId = parseInt(req.params.boardId, 10) || null;
		const commentId = parseInt(req.query.commentId, 10) || null;
		const writerId = parseInt(req.query.writerId, 10) || null;
		const user = req.user;

		try {
			await this.boardCommentService.deleteBoardComment(boardId, commentId, writerId, user);
			return sendJSONResponse(res, 200, ResStatus.SUCCESS, "댓글이 성공적으로 제거되었습니다.");
		} catch (err) {
			if (err instanceof RequestArgumentException) {
				logger.error(err.stack);
				return sendJSONResponse(res, err.statusCode, ResStatus.FAIL, err.message);
			}
			next();
		}
	}
}

module.exports = BoardRouter;
