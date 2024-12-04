const fs = require('fs');
const logger = require("../../config/logger");
const { saveJsonFile } = require("../utils/loop");
const { dateTimeFormat } = require("../../utils/utils");
const BOARD_LIKE_JSON = `./src/v1/json/boardLikes.json`;
const boardLikesJson = JSON.parse(fs.readFileSync(BOARD_LIKE_JSON, "utf8"));
const BOARD_LIKES = boardLikesJson.data;
let fetched = false;

setInterval(() => {
	if (!fetched) return;
	logger.info("BOARD 테이블 갱신");
	saveJsonFile(BOARD_LIKE_JSON, { data: BOARD_LIKES });
	fetched = false;
}, 60 * 1000 * 5);

module.exports = {
	countByBoardId: (boardId) => {
		return BOARD_LIKES.reduce((acc, boardLike) => boardLike.boardId === boardId ? acc + 1 : acc, 0)
	},

	findByBoardId: (boardId) => {
		return BOARD_LIKES.filter(boardLike => boardLike.boardId === boardId);
	},

	existsByBoardIdAndUserId: (boardId, userId) => {
		return BOARD_LIKES.find(boardLike => boardLike.boardId === boardId && boardLike.userId === userId) !== undefined;
	},

	deleteByBoardIdAndUserId: (boardId, userId) => {
		const index = BOARD_LIKES.findIndex(boardLike => !(boardLike.boardId === boardId && boardLike.likerId === userId));
		if (index !== -1) {
			BOARD_LIKES.splice(index, 1);
			fetched = true;
		}
	},

	save: (boardId, userId) => {
		BOARD_LIKES.push({ boardId, userId, createdAt: dateTimeFormat(new Date(Date.now()))})
		fetched = true;
	}
}
