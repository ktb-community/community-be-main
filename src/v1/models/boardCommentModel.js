const fs = require('fs');
const logger = require("../../config/logger");
const { saveJsonFile } = require("../utils/loop");
const { dateTimeFormat } = require("../../utils/utils");
const BOARD_COMMENT_JSON = `./src/v1/json/boardComments.json`;
const boardCommentsJson = JSON.parse(fs.readFileSync(BOARD_COMMENT_JSON, "utf8"));
const BOARD_COMMENTS = boardCommentsJson.data;
let fetched = false;

setInterval(() => {
	if (!fetched) return;
	logger.info("BOARD_LIKE 테이블 갱신");
	saveJsonFile(BOARD_COMMENT_JSON, { data: BOARD_COMMENTS });
	fetched = false;
}, 60 * 1000 * 5);

module.exports = {
	findById: (commentId) => {
		return BOARD_COMMENTS.find(boardComment => boardComment.id === commentId) || null;
	},

	findAllByBoardId: (boardId) => {
		return BOARD_COMMENTS.filter(boardComment => boardComment.boardId === boardId);
	},

	countByBoardId: (boardId) => {
		return BOARD_COMMENTS.reduce((acc, boardComment) => boardComment.boardId === boardId ? acc + 1 : acc, 0);
	},

	save: (content, boardId, userId) => {
		const id = BOARD_COMMENTS.length + 1;
		const createdAt = dateTimeFormat(new Date(Date.now()));
		const boardComment = { id, createdAt, content, boardId, writerId: userId };
		BOARD_COMMENTS.push(boardComment);
		fetched = true;
		return boardComment;
	}
}
