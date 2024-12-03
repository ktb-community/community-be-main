const fs = require("fs");

const BOARD_JSON = `./src/v1/json/boards.json`;
const boardJson = JSON.parse(fs.readFileSync(BOARD_JSON, "utf8"));
const BOARDS = boardJson.data;

module.exports = {
	findBoards: (limit, offset) => {
		const boardList = [];

		for (let i = BOARDS.length - (offset * limit) - 1; i >= (offset * limit); i--) {
			const board = BOARDS[i];

			boardList.push({
				id: board.id,
				title: board.title,
				content: board.content,
				createdAt: board.createdAt,
				writerId: board.writerId,
				likeCnt: board.likeCnt,
				viewCnt: board.viewCnt
			});
		}

		return boardList;
	},

	findById: (boardId) => {
		const board = BOARDS.find(board => board.id === boardId);

		if (board) {
			return {
				id: board.id,
				title: board.title,
				content: board.content,
				createdAt: board.createdAt,
				boardImg: board.boardImg,
				writerId: board.writerId,
				viewCnt: board.viewCnt,
				likeCnt: board.likeCnt,
			};
		}

		return null;
	},

	save: (board) => {
		const index = BOARDS.findIndex(b => b.id === board.id);
		if (index !== -1) BOARDS[index] = board;
		const json = { data: BOARDS };
		fs.writeFileSync(BOARD_JSON, JSON.stringify(json, null, 2), "utf8");
	}
};