const fs = require("fs");
const path = require("path");
const process = require("process");
const logger = require("../../config/logger");
const Board = require("../models/boardModel");
const BoardComment = require("../models/boardCommentModel");
const BoardLike = require("../models/boardLikeModel");
const User = require("../models/userModel");
const { sendJSONResponse, dateTimeFormat } = require("../../utils/utils");
const { ResStatus } = require("../../utils/const");

module.exports = {
	getBoardList: (req, res) => {
		const limit = req.query.limit || 10;
		const offset = req.query.offset || 0;
		const boards = Board.findBoards(limit, offset);

		if (boards === null) {
			return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
		}

		const boardList = boards.map(board => {
			const commentCnt = BoardComment.countByBoardId(board.id);
			const likeCnt = BoardLike.countByBoardId(board.id);
			const writer = User.findById(board.writerId);

			return {
				boardId: board.id,
				title: board.title,
				content: board.content.replaceAll("\n", "<br/>"),
				createdAt: board.createdAt,
				viewCnt: board.viewCnt,
				likeCnt: likeCnt,
				commentCnt: commentCnt,
				writerNickname: writer.nickname,
				writerProfileImg: writer.profileImg || null,
			};
		});

		return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, boardList);
	},

	getBoardDetail: (req, res) => {
		const boardId = parseInt(req.params.boardId) || null;
		const board = Board.findById(boardId);

		if (boardId === null || board === null) {
			return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
		}

		const writer = User.findById(board.writerId);
		const likeCnt = BoardLike.countByBoardId(board.id);
		const commentCnt = BoardComment.countByBoardId(board.id);

		const boardDetail = {
			boardId: board.id,
			title: board.title,
			content: board.content,
			createdAt: board.createdAt,
			boardImg: board.boardImg,
			writerId: writer.id,
			writerNickname: writer.nickname,
			writerProfileImg: writer.profileImg || null,
			viewCnt: board.viewCnt,
			likeCnt: likeCnt,
			commentCnt: commentCnt,
		};

		return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, boardDetail);
	},

	countBoardView: (req, res) => {
		const boardId = parseInt(req.params.boardId) || null;
		const board = Board.findById(boardId);

		if (boardId === null || board === null) {
			return sendJSONResponse(res, 503, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
		}

		board.viewCnt += 1;
		Board.modify(board);

		return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
	},

	addBoard: (req, res) => {
		const userId = parseInt(req.body.userId, 10) || null;
		const { title, content } = req.body;
		const boardImg = req.file;

		if (!userId) {
			return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
		}

		const board = {
			title,
			content,
			createdAt: dateTimeFormat(new Date(Date.now())),
			modifiedAt: dateTimeFormat(new Date(Date.now())),
			boardImg: boardImg.path,
			viewCnt: 0,
			writerId: userId
		};

		Board.save(board);
		return sendJSONResponse(res, 201, ResStatus.SUCCESS, null);
	},

	modifyBoard: (req, res) => {
		const boardId = parseInt(req.params.boardId, 10) || null;
		const userId = parseInt(req.body.userId, 10) || null;
		const { title, content } = req.body;
		const boardImg = req.file;

		if (!boardId || !userId || !boardImg) {
			return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
		}

		if (title.length === 0 || content.length === 0 || title.length > 26) {
			return sendJSONResponse(res, 400, ResStatus.ERROR, "제목 또는 본문의 길이가 적절하지 않습니다.");
		}

		const board = Board.findById(boardId);

		if (board.writerId !== userId) {
			return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
		}

		// 기존 이미지 삭제
		const imgPath = path.join(process.cwd(), board.boardImg);
		fs.unlink(imgPath, () => logger.info(`${imgPath} 제거`));

		// board 수정
		const newBoard = {
			...board,
			title,
			content,
			modifiedAt: dateTimeFormat(new Date(Date.now())),
			boardImg: boardImg.path
		}

		Board.modify(newBoard);
		return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
	},

	deleteBoard: (req, res) => {
		const boardId = parseInt(req.params.boardId, 10) || null;
		const userId = parseInt(req.body.userId, 10) || null;

		if (!boardId || !userId) {
			return sendJSONResponse(res, 400, ResStatus.ERROR, "유효하지 않은 요청입니다.");
		}

		const board = Board.findById(boardId);

		if (board.writerId !== userId) {
			return sendJSONResponse(res, 400, ResStatus.ERROR, "유효하지 않은 요청입니다.");
		}

		// Board 이미지 삭제
		const imgPath = path.join(process.cwd(), board.boardImg);
		fs.unlink(imgPath, () => logger.info(`${imgPath} 제거`));

		const likeCnt = BoardLike.deleteAllByBoardId(boardId);
		const commentCnt = BoardComment.deleteAllByBoardId(boardId);
		Board.deleteById(boardId);
		logger.info(`좋아요 ${likeCnt}, 댓글 ${commentCnt}가 함께 삭제되었습니다.`);

		return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
	}
};