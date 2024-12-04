const fs = require('fs');
const BOARD_COMMENT_JSON = `./src/v1/json/boardComments.json`;
const boardCommentsJson = JSON.parse(fs.readFileSync(BOARD_COMMENT_JSON, "utf8"));
const BOARD_COMMENTS = boardCommentsJson.data;

module.exports = {
	findById: (commentId) => {
		return BOARD_COMMENTS.find(boardComment => boardComment.id === commentId) || null;
	},

	findByBoardId: (boardId) => {
		return BOARD_COMMENTS.filter(boardComment => boardComment.boardId === boardId);
	},

	countByBoardId: (boardId) => {
		return BOARD_COMMENTS.reduce((acc, boardComment) => boardComment.boardId === boardId ? acc + 1 : acc, 0);
	}
}
