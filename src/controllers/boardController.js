const fs = require("fs");
const StorageClient = require("../clients/storageClient");
const RequestValidator = require("../utils/requestValidator");
const StringUtil = require("../utils/stringUtil");
const Board = require("../models/boardModel");
const withTransaction = require("../middlewares/transaction");
const { sendJSONResponse } = require("../utils/utils");
const { ResStatus } = require("../utils/const");

class BoardController {
	static async getBoardList(req, res) {
		return await withTransaction(async conn => {
			const limit = req.query.limit || 10;
			const offset = req.query.offset || 0;
			const boards = (await Board.findBoards(conn, { limit, offset })).map(board => ({
				boardId: board.id,
				title: board.title,
				createdAt: StringUtil.dateTimeFormat(new Date(board.createdAt)),
				viewCnt: board.views,
				likeCnt: board.likes,
				commentCnt: board.comments,
				writerNickname: board.nickname,
				writerProfileImg: board.profileImg,
			}));

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, boards, {
				hasMore: boards.length === parseInt(limit),
				nextCursor: parseInt(offset) + 10
			});
		});
	}

	static async getBoardDetail(req, res) {
		return await withTransaction(async conn => {
			const boardId = parseInt(req.params.boardId) || null;

			if (!RequestValidator.checkArguments(boardId)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const boardDetail = await Board.findBoardDetail(conn, { id: boardId });

			if (boardDetail === null) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, {
				boardId: boardDetail.boardId,
				title: boardDetail.title,
				content: boardDetail.content,
				createdAt: StringUtil.dateTimeFormat(new Date(boardDetail.createdAt)),
				boardImg: boardDetail.boardImg,
				writerId: boardDetail.writerId,
				writerNickname: boardDetail.nickname,
				writerProfileImg: boardDetail.profileImg || null,
				viewCnt: boardDetail.views,
				likeCnt: boardDetail.likes,
				commentCnt: boardDetail.comments,
			});
		});
	}

	static async countBoardView(req, res) {
		return await withTransaction(async conn => {
			const boardId = parseInt(req.params.boardId) || null;

			if (!RequestValidator.checkArguments(boardId)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			const board = await Board.findById(conn, { id: boardId });

			if (board === null) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
			}

			await Board.updateViewCount(conn, { id: boardId });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
		});
	}

	static async addBoard(req, res) {
		return await withTransaction(async conn => {
			const userId = parseInt(req.body.userId, 10) || null;
			const { title, content } = req.body;
			const file = req.file;

			if (!RequestValidator.checkArguments(title, content, file, userId)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			if (!RequestValidator.checkBoardTitle(title)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "게시글 제목 길이가 적절하지 않습니다.");
			}

			try {
				const data = await StorageClient.upload(file.path, file.originalname)

				/* createdAt, modifiedAt, views은 기본값 사용 */
				const board = {
					title,
					content,
					boardImg: data.key,
					writerId: userId,
				};

				await Board.save(conn, { board });

				return sendJSONResponse(res, 201, ResStatus.SUCCESS, null);
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

	static async modifyBoard(req, res) {
		return await withTransaction(async conn => {
			const boardId = parseInt(req.params.boardId, 10) || null;
			const userId = parseInt(req.body.userId, 10) || null;
			const { title, content } = req.body;
			const file = req.file;

			if (!RequestValidator.checkArguments(boardId, userId, title, content, file)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청입니다.");
			}

			if (!RequestValidator.checkBoardTitle(title) || !RequestValidator.checkBoardContent(content)) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, "제목 또는 본문의 길이가 적절하지 않습니다.");
			}

			const board = await Board.findById(conn, { id: boardId });

			if (!board || board.writerId !== userId) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
			}

			try {
				const data = await StorageClient.upload(file.path, file.originalname);

				// board 수정
				const modifiedBoard = {
					...board,
					title,
					content: content,
					boardImg: data.key,
				};

				await Board.updateBoard(conn, { board: modifiedBoard });

				return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
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

	static async deleteBoard(req, res) {
		return await withTransaction(async conn => {
			const boardId = parseInt(req.params.boardId, 10) || null;
			const userId = parseInt(req.body.userId, 10) || null;

			if (!RequestValidator.checkArguments(boardId, userId)) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, "유효하지 않은 요청입니다.");
			}

			const board = await Board.findById(conn, { id: boardId });

			if (!board || board.writerId !== userId) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
			}

			// 삭제시 COMMENT, LIKE 캐스케이딩 삭제
			await Board.deleteById(conn, { id: boardId });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
		});
	}
}

module.exports = BoardController;