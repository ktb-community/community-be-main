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

	deleteById: (commentId) => {
		const index = BOARD_COMMENTS.findIndex(boardComment => boardComment.id === commentId);
		if (index !== -1) {
			BOARD_COMMENTS.splice(index, 1);
			fetched = true;
		}
	},

	deleteAllByBoardId: (boardId) => {
		let cnt = 0;

		for (let i = BOARD_COMMENTS.length - 1; i >= 0; i--) {
			if (BOARD_COMMENTS[i].boardId === boardId) {
				cnt++;
				BOARD_COMMENTS.splice(i, 1);
			}
		}

		if (cnt > 0) fetched = true;
		return cnt;
	},

	deleteAllByUserId: (userId) => {
		let cnt = 0;

		for (let i = BOARD_COMMENTS.length - 1; i >= 0; i--) {
			if (BOARD_COMMENTS[i].writerId === userId) {
				BOARD_COMMENTS.splice(i, 1);
				cnt++;
			}
		}

		if (cnt > 0) fetched = true;
		return cnt;
	},

	modifyById: (commentId, content) => {
		const index = BOARD_COMMENTS.findIndex(boardComment => boardComment.id === commentId);
		if (index !== -1) {
			BOARD_COMMENTS[index].content = content;
			BOARD_COMMENTS[index].modifiedAt = dateTimeFormat(new Date(Date.now()));
			fetched = true;
		}
	},

	save: (content, boardId, userId) => {
		const id = BOARD_COMMENTS.length + 1;
		const createdAt = dateTimeFormat(new Date(Date.now()));
		const modifiedAt = createdAt;
		const boardComment = { id, createdAt, modifiedAt, content, boardId, writerId: userId };
		BOARD_COMMENTS.push(boardComment);
		fetched = true;
		return boardComment;
	}
}
