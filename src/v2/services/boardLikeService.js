const withTransaction = require("../../middlewares/transaction")

class BoardLikeService {
	/**
	 * @param {BoardLike} boardLikeModel
	 */
	constructor(boardLikeModel) {
		this.boardLikeModel = boardLikeModel;
	}
}

module.exports = BoardLikeService;