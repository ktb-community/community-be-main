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

		return sendJSONResponse(res, 200, ResStatus.SUCCESS, null, boardComments.reverse());
	},

	addBoardComment: (req, res) => {

	},

	modifyBoardComment: (req, res) => {

	},

	deleteBoardComment: (req, res) => {

	}
}