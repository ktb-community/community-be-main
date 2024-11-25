const { withTransaction, checkArguments, escapeXSS } = require("../utils/utils");
const { RequestArgumentException } = require("../exception/CustomException");

class BoardCommentService {
	/**
	 * @param {BoardComment} boardCommentModel
	 */
	constructor(boardCommentModel) {
		this.boardCommentModel = boardCommentModel;
	}

	async addBoardComment(boardId, writerId, boardComment) {
		return await withTransaction(async transaction => {
			// 1. 요청값 검증
			if (!checkArguments(boardId, writerId, boardComment)) {
				throw new RequestArgumentException();
			}

			// 2. 입력 검증
			const sanitizedBoardComment = escapeXSS(boardComment)

			// 저장
			await this.boardCommentModel.addBoardComment(transaction, { boardId, writerId, boardComment: sanitizedBoardComment });
		})
	}
}

module.exports = BoardCommentService;