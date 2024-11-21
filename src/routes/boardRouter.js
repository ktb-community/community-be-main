const express = require("express");

class BoardRouter {
	constructor(boardService) {
		this.router = express.Router();
		this.boardService = boardService;
		this.#initializeRoutes();
	}

	#initializeRoutes() {}
}

module.exports = BoardRouter;
