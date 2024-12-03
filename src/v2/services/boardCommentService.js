const { withTransaction, checkArguments, escapeXSS, dateTimeFormat } = require("../../utils/utils");
const { RequestArgumentException } = require("../../exception/CustomException");
const { UserRole } = require("../../utils/const");

class BoardCommentService {
	/**
	 * @param {BoardComment} boardCommentModel
	 */
	constructor(boardCommentModel) {
		this.boardCommentModel = boardCommentModel;
	}

	async getBoardComments(boardId, offset, limit) {
		return await withTransaction(async transaction => {
			// 1. 요청값 검증
			if (!checkArguments(boardId, offset, limit)) {
				throw new RequestArgumentException();
			}

			const boardComments = await this.boardCommentModel.getBoardComments(transaction, { boardId, limit, offset });
			return boardComments.map(comment => ({ ...comment, createdAt: dateTimeFormat(new Date(comment.createdAt))}))
		})
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

	async deleteBoardComment(boardId, commentId, writerId, claims) {
		return await withTransaction(async transaction => {
			// 1. 요청값 검증
			if (!checkArguments(boardId, commentId, writerId, claims)) {
				throw new RequestArgumentException();
			}

			// 2. 작성자 확인
			const { role, userId: deleterId } = claims;

			if (role === UserRole.ADMIN) {
				await this.boardCommentModel.deleteById(transaction, { commentId })
				return;
			}

			const boardComment = await this.boardCommentModel.findById(transaction, { commentId });
			const canNotDelete = !boardComment || !(boardComment.boardId === boardId && boardComment.writerId === deleterId);

			if (deleterId !== writerId) {
				throw new RequestArgumentException();
			}
			if (canNotDelete) {
				throw new RequestArgumentException();
			}

			await this.boardCommentModel.deleteById(transaction, { commentId })
		})
	}
}

module.exports = BoardCommentService;