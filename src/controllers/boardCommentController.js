const User = require("../models/userModel");
const BoardComment = require("../models/boardCommentModel");
const RequestValidator = require("../utils/requestValidator");
const StringUtil = require("../utils/stringUtil");
const withTransaction = require("../middlewares/transaction");
const { sendJSONResponse } = require("../utils/utils");
const { ResStatus } = require("../utils/const");

class BoardCommentController {
	static async getBoardComments(req, res) {
		return await withTransaction(async conn => {
			const boardId = parseInt(req.params.boardId, 10) || null;
			const limit = parseInt(req.query.limit) || 10;
			const offset = parseInt(req.query.offset) || 0;

			if (!RequestValidator.checkArguments(boardId, limit, offset)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청값입니다.");
			}

			const boardComments = (await BoardComment.findBoardComments(conn, { id: boardId, limit, offset })).map(boardComment => ({
				commentId: boardComment.commentId,
				content: boardComment.content,
				createdAt: StringUtil.dateTimeFormat(new Date(boardComment.createdAt)),
				writerId: boardComment.writerId,
				writerNickname: boardComment.nickname,
				writerProfileImg: boardComment.profileImg
			}))

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, boardComments, {
				hasMore: boardComments.length === limit,
				nextCursor: offset + 10
			});
		})
	}

	static async addBoardComment(req, res) {
		return await withTransaction(async conn => {
			const { id: userId } = req.decoded;
			const boardId = parseInt(req.params.boardId, 10) || null;
			const { content } = req.body;

			if (!RequestValidator.checkArguments(boardId, content, userId)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청값입니다.");
			}

			if (!RequestValidator.checkBoardComment(content)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청값입니다.");
			}

			const writer = await User.findById(conn, { id: userId });

			if (!writer) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
			}

			// createdAt, modifiedAt 자동 생성
			const insertBoardComment = { comment: content, writerId: userId, boardId };
			const insertId = await BoardComment.save(conn, { boardComment: insertBoardComment });
			const boardComment = await BoardComment.findBoardComment(conn, { id: insertId })

			if (!boardComment) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
			}

			return sendJSONResponse(res, 201, ResStatus.SUCCESS, '댓글이 정상적으로 등록되었습니다.', {
				commentId: boardComment.id,
				createdAt: StringUtil.dateTimeFormat(new Date(boardComment.createdAt)),
				content: boardComment.content,
				writerId: boardComment.writerId,
				writerNickname: boardComment.nickname,
				writerProfileImg: boardComment.profileImg || null,
			});
		})
	}

	static async modifyBoardComment(req, res) {
		return await withTransaction(async conn => {
			const { id: userId } = req.decoded;
			const boardId = parseInt(req.params.boardId, 10) || null;
			const commentId = parseInt(req.body.commentId, 10) || null;
			const comment = req.body.comment;

			if (!RequestValidator.checkArguments(boardId, commentId, userId, comment)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청값입니다.");
			}

			if (!RequestValidator.checkBoardComment(comment)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청값입니다.");
			}

			const boardComment = await BoardComment.findById(conn, { id: commentId });

			if (!boardComment || boardComment.writerId !== userId || boardComment.boardId !== boardId) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
			}

			// modifiedAt은 자동으로 수정됨
			await BoardComment.updateBoardComment(conn, { id: commentId, comment });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
		})
	}

	static async deleteBoardComment(req, res) {
		return await withTransaction(async conn => {
			const { id: userId } = req.decoded;
			const boardId = parseInt(req.params.boardId, 10) || null;
			const commentId = parseInt(req.body.commentId, 10) || null;

			if (!RequestValidator.checkArguments(boardId, userId, commentId)) {
				return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청값입니다.");
			}

			const boardComment = await BoardComment.findById(conn, { id: commentId });

			if (!boardComment || userId !== boardComment.writerId || boardId !== boardComment.boardId) {
				return sendJSONResponse(res, 400, ResStatus.ERROR, "예상치 못한 에러가 발생했습니다.");
			}

			await BoardComment.deleteById(conn, { id: commentId });

			return sendJSONResponse(res, 200, ResStatus.SUCCESS, null);
		})
	}
}

module.exports = BoardCommentController;