const process = require("process");
const { withTransaction, checkArguments, dateTimeFormat } = require("../../utils/utils");
const { RequestArgumentException, UserNotFoundException } = require("../../exception/CustomException");
const { UserRole } = require("../../utils/const");

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
				views: boardDetail.views,
				likeCnt: boardDetail.likeCnt,
				commentCnt: boardDetail.commentCnt,
			}
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

	async modifyBoard(boardInfo, claims) {
		return await withTransaction(async transaction => {
			const { boardId, boardTitle, boardContent, boardImg } = boardInfo;

			// 1. 요청값 검증
			if (!checkArguments(boardId, boardTitle, boardContent, boardImg, claims)) {
				throw new RequestArgumentException();
			}

			// 2. 사용자 검증
			const { userId, role } = claims;
			const board = await this.boardModel.findById(transaction, { boardId })
			if (!board) {
				throw new RequestArgumentException();
			}

			if (role !== UserRole.ADMIN && board.writerId !== userId) {
				throw new RequestArgumentException();
			}

			// 3. 수정 요청
			await this.boardModel.updateBoard(transaction, { boardId, boardTitle, boardContent, boardImg: `${process.env.SERVER_URL}/uploads/${boardImg.filename}` });
		})
	}

	async deleteBoard(boardId, claims) {
		return await withTransaction(async transaction => {
			// 1. 요청값 검증
			if (!checkArguments(boardId, claims)) {
				throw new RequestArgumentException();
			}

			const { role, userId } = claims;

			// 2. 작성자 검증
			const board = await this.boardModel.findById(transaction, { boardId });
			if (!board) {
				throw new RequestArgumentException("잘못된 게시글 번호입니다.");
			}

			if (role !== UserRole.ADMIN && board.writerId !== userId) {
				throw new RequestArgumentException("작성한 게시글만 삭제할 수 있습니다.")
			}

			// 3. 게시글 삭제
			await this.boardModel.deleteById(transaction, { boardId })
		})
	}

	async countBoardView(boardId) {
		return await withTransaction(async transaction => {
			// 1. 요청값 검증
			if (!checkArguments(boardId)) {
				throw new RequestArgumentException();
			}

			await this.boardModel.countBoardView(transaction, { boardId });
		})
	}
}

module.exports = BoardService;
