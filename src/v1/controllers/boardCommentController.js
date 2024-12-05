const { sendJSONResponse } = require("../../utils/utils");
const { ResStatus } = require("../../utils/const");
const BoardComment = require("../models/boardCommentModel");
const User = require("../models/userModel");

module.exports = {
	getBoardComments: (req, res) => {
		const boardId = parseInt(req.params.boardId, 10) || null;

		if (!boardId) {
			return sendJSONResponse(res, 400, ResStatus.FAIL, "유효하지 않은 요청값입니다.");
		}

		const boardComments = BoardComment.findAllByBoardId(boardId).map(boardComment => {
			const user = User.findById(boardComment.writerId);

			return {
				commentId: boardComment.id,
				content: boardComment.content,
				createdAt: boardComment.createdAt,
				writerId: user.id,
				writerNickname: user.nickname,
				writerProfileImg: user.profileImg
			}
		})

		return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, boardComments);
	},

	addBoardComment: (req, res) => {
		const boardId = req.params.boardId;
		const { content, userId } = req.body;
		const writer = User.findById(userId);
		const comment = BoardComment.save(content, boardId, userId);

		const boardComment = {
			commentId: comment.id,
			createdAt: comment.createdAt,
			content: comment.content,
			writerId: comment.writerId,
			writerNickname: writer.nickname,
			writerProfileImg: writer.profileImg || null,
		}

		return sendJSONResponse(res, 200, ResStatus.SUCCESS, '댓글이 정상적으로 등록되었습니다.', boardComment);
	},

	modifyBoardComment: (req, res) => {

	},

	deleteBoardComment: (req, res) => {

	}
}