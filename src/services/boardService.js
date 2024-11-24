const { withTransaction, checkArguments, dateTimeFormat, changeNumberExpression } = require("../utils/utils");
const { RequestArgumentException, UserNotFoundException } = require("../exception/CustomException");
const process = require("process");

class BoardService {
	/**
	 * @param {Board} boardModel
	 * @param {User} userModel
	 */
	constructor(boardModel, userModel) {
		this.boardModel = boardModel;
		this.userModel = userModel;
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

	async addBoard(boardTitle, boardContent, boardImg, claims) {
		return await withTransaction(async transaction => {
			// 1. 요청값 검증
			if (!checkArguments(boardTitle, boardContent, boardImg, claims)) {
				throw new RequestArgumentException();
			}

			// 2. 작성자 찾아오기
			const { email } = claims;
			const user = await this.userModel.findByEmail(transaction, { email });
			if (!user) {
				throw new UserNotFoundException();
			}

			// 3. 게시글 추가
			const board = {
				title: boardTitle,
				content: boardContent,
				boardImg: `${process.env.SERVER_URL}/uploads/${boardImg.filename}`,
				writerId: user.id
			}

			await this.boardModel.addBoard(transaction, board)
		})
	}

	async addBoardView(boardId) {
		return await withTransaction(async transaction => {
			// 1. 요청값 검증
			if (!checkArguments(boardId)) {
				throw new RequestArgumentException();
			}

			await this.boardModel.addBoardView(transaction, { boardId });
		})
	}
}

module.exports = BoardService;
