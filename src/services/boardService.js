const Board = require("../models/board")
const { withTransaction, checkArguments, dateTimeFormat, changeNumberExpression } = require("../utils/utils");
const { RequestArgumentException } = require("../exception/CustomException");

class BoardService {
	constructor() {
		this.boardModel = new Board();
	}

	async getLatestBoardList(limit, offset) {
		return await withTransaction(async transaction => {
			// 1. 요청값 검증
			if (!checkArguments(limit, offset)) {
				throw new RequestArgumentException();
			}

			const boardList = await this.boardModel.getLatestBoardList(transaction, { limit, offset })
			return boardList.map(board => ({ ...board, createdAt: dateTimeFormat(new Date(board.createdAt))}))
		});
	}

	async getBoardDetail(boardId) {
		return await withTransaction(async transaction => {
			// 1. 요청값 검증
			if (!checkArguments(boardId)) {
				throw new RequestArgumentException();
			}

			// 2. 응답 개수 확인
			const result = await this.boardModel.getBoard(transaction, { boardId });
			if (result.length !== 1) {
				throw new RequestArgumentException(`${boardId} 게시글을 찾을 수 없습니다.`);
			}

			const boardDetail = result[0];

			return {
				...boardDetail,
				createdAt: dateTimeFormat(new Date(boardDetail.createdAt)),
				views: changeNumberExpression(boardDetail.views),
				likeCnt: changeNumberExpression(boardDetail.likeCnt),
				commentCnt: changeNumberExpression(boardDetail.commentCnt),
			}
		})
	}

	async getBoardComments(boardId, offset, limit) {
		return await withTransaction(async transaction => {
			// 1. 요청값 검증
			if (!checkArguments(boardId, offset, limit)) {
				throw new RequestArgumentException();
			}

			const boardComments = await this.boardModel.getBoardComments(transaction, { boardId, limit, offset });
			return boardComments.map(comment => ({ ...comment, createdAt: dateTimeFormat(new Date(comment.createdAt))}))
		})
	}
}

module.exports = BoardService;
