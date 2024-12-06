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
			boardImg: boardImg.path,
			viewCnt: 0,
			writerId: userId
		};

		Board.save(board);
		return sendJSONResponse(res, 201, ResStatus.SUCCESS, null);
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
};